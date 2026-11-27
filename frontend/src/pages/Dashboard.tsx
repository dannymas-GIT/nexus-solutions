import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Database,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  Lightbulb,
  RefreshCw,
  Rocket,
  Send,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  IDEA_STUDIO_STAGING_DOMAIN,
  IDEA_STUDIO_TENANT,
  ideaStudioApi,
} from '@/services/ideaStudioApi';
import { convergenceApi, type ConvergenceOverview } from '@/services/convergenceApi';
import type {
  FinOpsRollup,
  IdeaRecord,
  IdeaStudioConfig,
  SprintRecord,
  StagingDeployment,
} from '@/types/ideaStudio';

function formatStageLabel(stage?: string): string {
  const labels: Record<string, string> = {
    idea: 'Brief Submitted',
    new: 'Brief Submitted',
    research: 'M1 Market Research',
    feasibility: 'M2 Feasibility & Viability',
    scaffold: 'Graduated / App Profile',
    sprint: 'Active Sprints',
    production: 'Production Ready',
  };
  return (stage && labels[stage]) || stage || 'Brief Submitted';
}

function formatUsd(amount?: number): string {
  const val = Number(amount || 0);
  if (!Number.isFinite(val) || val <= 0) return '$0.00';
  if (val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

const Dashboard: React.FC = () => {
  const [config, setConfig] = useState<IdeaStudioConfig>({
    configured: true,
    tenant: IDEA_STUDIO_TENANT,
    stagingDomain: IDEA_STUDIO_STAGING_DOMAIN,
    hostedUiUrl: null,
    proxyMode: 'backend',
  });
  const [configChecked, setConfigChecked] = useState(false);
  const [overview, setOverview] = useState<ConvergenceOverview | null>(null);
  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [sprints, setSprints] = useState<SprintRecord[]>([]);
  const [staging, setStaging] = useState<StagingDeployment[]>([]);
  const [finops, setFinops] = useState<FinOpsRollup | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [convOverview, cfg] = await Promise.all([
        convergenceApi.getOverview().catch(() => null),
        ideaStudioApi.getConfig().catch(() => ({
          configured: false,
          tenant: IDEA_STUDIO_TENANT,
          stagingDomain: IDEA_STUDIO_STAGING_DOMAIN,
          hostedUiUrl: null,
          proxyMode: 'backend' as const,
        })),
      ]);
      setOverview(convOverview);
      setConfig(cfg);
      setConfigChecked(true);
      if (!cfg.configured) {
        setIdeas([]);
        setSprints([]);
        setStaging([]);
        setFinops(null);
        return;
      }

      const [ideasList, sprintsList, stagingList, finopsData] = await Promise.all([
        ideaStudioApi.listIdeas(),
        ideaStudioApi.listSprints(),
        ideaStudioApi.listStaging().catch(() => [] as StagingDeployment[]),
        ideaStudioApi.getTenantFinOps().catch(() => null),
      ]);
      setIdeas(ideasList);
      setSprints(sprintsList);
      setStaging(stagingList);
      setFinops(finopsData);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to load live Command Center metrics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const graduatedIdeas = ideas.filter(
    (i) => ['scaffold', 'sprint', 'production'].includes(i.stage || '') || Boolean(i.appSlug)
  );
  const inReviewCount = ideas.filter((i) =>
    ['research', 'feasibility'].includes(i.stage || '')
  ).length;
  const totalSprintTasks = sprints.reduce(
    (sum, sp) => sum + (Array.isArray(sp.tasks) ? sp.tasks.length : (sp.taskIds || []).length),
    0
  );
  const completedSprintTasks = sprints.reduce(
    (sum, sp) =>
      sum +
      (Array.isArray(sp.tasks)
        ? sp.tasks.filter((t) => String(t.status || '').toLowerCase() === 'completed').length
        : 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nexus Command Center</h1>
          <p className="text-slate-600 mt-1 text-lg">
            Converge operational data, monitor corporate KPIs, publish executive reports, and manage
            Idea Studio initiatives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            leftIcon={RefreshCw}
            onClick={loadDashboard}
            disabled={loading}
            className="min-h-[44px] border-slate-300 text-slate-800"
          >
            Refresh
          </Button>
          <Link
            to="/integrations"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-base font-medium hover:bg-slate-100"
          >
            <Database className="w-4 h-4" />
            <span>Upload CSV</span>
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-blue-700 text-white text-base font-semibold hover:bg-blue-800"
          >
            <FileText className="w-4 h-4" />
            <span>Report Studio</span>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-2 text-base"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Data Convergence Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          to="/integrations"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-800">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Data Sources</p>
              <p className="text-3xl font-bold text-slate-900">{overview?.sourceCount ?? 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            {(overview?.totalRowsIngested ?? 0).toLocaleString()} rows converged
          </p>
        </Link>

        <Link
          to="/analysis-engine/set-kpis"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Tracked KPIs</p>
              <p className="text-3xl font-bold text-slate-900">{overview?.kpiCount ?? 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            {overview?.kpisOnTrack ?? 0} on track · {overview?.kpisAtRisk ?? 0} at risk ·{' '}
            {overview?.kpisOffTrack ?? 0} off track
          </p>
        </Link>

        <Link
          to="/reports"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-800">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Executive Reports</p>
              <p className="text-3xl font-bold text-slate-900">{overview?.reportCount ?? 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">PDF, DOCX, and PPTX export ready</p>
        </Link>

        <Link
          to="/portal-manager"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
              <Send size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Portal Deliverables</p>
              <p className="text-3xl font-bold text-slate-900">
                {overview?.publishedPortalCount ?? 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">Shared via expiring client magic links</p>
        </Link>
      </section>

      {/* Live Corporate KPI Highlights */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live Corporate KPI Scorecard</h2>
            <p className="text-base text-slate-600">
              Metrics calculated from uploaded CSV datasets and workspace targets.
            </p>
          </div>
          <Link
            to="/analysis-engine/set-kpis"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-blue-700 hover:underline"
          >
            Manage KPIs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {overview && overview.kpis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overview.kpis.map((kpi) => (
              <div
                key={kpi.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
              >
                <p className="text-sm font-semibold text-slate-700 truncate">{kpi.name}</p>
                <p className="text-2xl font-bold text-slate-900">{kpi.formattedActual}</p>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Target: {kpi.formattedTarget}</span>
                  <span className="font-semibold text-slate-900">{kpi.attainmentPct}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-base text-slate-700">
              Start the convergence loop: upload a CSV export, track your first corporate KPIs, and
              export a board-ready report in minutes.
            </p>
            <Link
              to="/integrations"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-900 text-white text-base font-semibold shrink-0"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Idea Studio Pipeline & Staging */}
      {configChecked && !config.configured && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 flex items-start gap-3"
          role="status"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-base leading-relaxed">
            Idea Studio metrics populate automatically when{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded">IDEA_STUDIO_API_BASE_URL</code> is
            configured on the backend.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Idea Studio Pipeline</h2>
              <p className="text-sm text-slate-600">
                {ideas.length} briefs · {inReviewCount} in M1/M2 validation · {graduatedIdeas.length}{' '}
                graduated · FinOps {formatUsd(finops?.totalCostUsd)}
              </p>
            </div>
            <Link
              to="/idea-studio"
              className="text-base font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {ideas.length > 0 ? (
              <ul className="divide-y divide-slate-200">
                {ideas.slice(0, 6).map((idea) => (
                  <li
                    key={idea.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <Link
                        to={`/idea-studio/inbox?idea=${encodeURIComponent(idea.id)}`}
                        className="text-base font-semibold text-slate-900 hover:text-blue-700"
                      >
                        {idea.title}
                      </Link>
                      <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">
                        {idea.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                        {formatStageLabel(idea.stage)}
                      </span>
                      <Link
                        to={`/idea-studio/inbox?idea=${encodeURIComponent(idea.id)}`}
                        className="text-base font-medium text-blue-700 hover:underline"
                      >
                        Inspect
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-slate-700 text-base">
                  No Idea Studio briefs submitted yet for <strong>{config.tenant}</strong>.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/create-business-plan"
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-900 text-white text-base font-medium hover:bg-slate-800"
                  >
                    <Rocket className="w-4 h-4" />
                    Strategic Plan Wizard
                  </Link>
                  <Link
                    to="/idea-studio/submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 text-slate-800 text-base font-medium hover:bg-slate-50"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Submit Brief
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Staging &amp; Sprints</h2>
            <Link
              to="/idea-studio/workspace"
              className="text-base font-medium text-blue-700 hover:underline"
            >
              Workspace
            </Link>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2 font-medium">
                <Activity className="w-4 h-4 text-purple-700" />
                Sprint Tasks
              </span>
              <span className="font-semibold text-slate-900">
                {completedSprintTasks}/{totalSprintTasks}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2 font-medium">
                <DollarSign className="w-4 h-4 text-amber-700" />
                LLM Calls
              </span>
              <span className="font-semibold text-slate-900">{finops?.callCount || 0}</span>
            </div>

            {staging.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Live Staging Previews
                </h3>
                <ul className="space-y-2">
                  {staging.map((stg, idx) => (
                    <li
                      key={stg.hostname || idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 inline-flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-blue-700" />
                          {stg.appSlug || stg.hostname}
                        </span>
                        <span className="text-sm text-slate-600">
                          {stg.status || 'provisioned'}
                        </span>
                      </div>
                      {stg.previewUrl && (
                        <a
                          href={stg.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          {stg.previewUrl}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sprints.length === 0 && (
              <p className="text-base text-slate-600">
                No sprints scheduled yet. Graduate an approved brief in Idea Studio to launch Sprint
                1.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
