import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  Lightbulb,
  RefreshCw,
  Rocket,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  IDEA_STUDIO_STAGING_DOMAIN,
  IDEA_STUDIO_TENANT,
  ideaStudioApi,
} from '@/services/ideaStudioApi';
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
      const cfg = await ideaStudioApi.getConfig();
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
        err instanceof Error
          ? err.message
          : 'Unable to load live Idea Studio metrics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const graduatedIdeas = ideas.filter(
    (i) =>
      ['scaffold', 'sprint', 'production'].includes(i.stage || '') ||
      Boolean(i.appSlug)
  );
  const inReviewCount = ideas.filter((i) =>
    ['research', 'feasibility'].includes(i.stage || '')
  ).length;
  const totalSprintTasks = sprints.reduce(
    (sum, sp) =>
      sum + (Array.isArray(sp.tasks) ? sp.tasks.length : (sp.taskIds || []).length),
    0
  );
  const completedSprintTasks = sprints.reduce(
    (sum, sp) =>
      sum +
      (Array.isArray(sp.tasks)
        ? sp.tasks.filter(
            (t) => String(t.status || '').toLowerCase() === 'completed'
          ).length
        : 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Nexus Operations &amp; Idea Studio Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-base">
            Live overview of your business plans, Idea Studio validation gates,
            active sprints, and <code className="text-sm">*.{config.stagingDomain}</code>{' '}
            staging previews for <strong>{config.tenant}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            leftIcon={RefreshCw}
            onClick={loadDashboard}
            disabled={loading}
            className="min-h-[44px] border-gray-300 text-gray-800"
          >
            Refresh
          </Button>
          <Link
            to="/create-business-plan"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-brand-primary text-white font-medium hover:bg-blue-800 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>New Business Plan</span>
          </Link>
          <Link
            to="/idea-studio"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Open Idea Studio</span>
          </Link>
        </div>
      </div>

      {configChecked && !config.configured && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-start gap-3"
          role="status"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            Live Idea Studio metrics will populate automatically once{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded">
              IDEA_STUDIO_API_BASE_URL
            </code>{' '}
            is configured on the Nexus backend.
          </p>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-2 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-brand-primary mr-4">
              <Lightbulb size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Plans &amp; Briefs
              </p>
              <p className="text-2xl font-bold text-gray-900">{ideas.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {inReviewCount} currently in M1/M2 validation
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-700 mr-4">
              <Rocket size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Graduated Apps
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {graduatedIdeas.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {staging.length} staging deployment(s) on *.{config.stagingDomain}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-700 mr-4">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Sprints</p>
              <p className="text-2xl font-bold text-gray-900">
                {sprints.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {completedSprintTasks}/{totalSprintTasks} sprint tasks completed
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-700 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Idea Studio FinOps
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatUsd(finops?.totalCostUsd)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {finops?.callCount || 0} LLM calls ·{' '}
            {Number(finops?.totalTokens || 0).toLocaleString()} tokens
          </p>
        </div>
      </div>

      {/* Main content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Plans &amp; Idea Studio Pipeline
            </h2>
            <Link
              to="/my-plans"
              className="text-sm font-medium text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {ideas.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {ideas.slice(0, 6).map((idea) => (
                  <li
                    key={idea.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <Link
                        to={`/idea-studio/inbox?idea=${encodeURIComponent(idea.id)}`}
                        className="text-base font-semibold text-gray-900 hover:text-brand-primary"
                      >
                        {idea.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {idea.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-primary">
                        {formatStageLabel(idea.stage)}
                      </span>
                      <Link
                        to={`/idea-studio/inbox?idea=${encodeURIComponent(idea.id)}`}
                        className="text-sm font-medium text-brand-primary hover:underline"
                      >
                        Inspect
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 space-y-3">
                <p className="text-gray-600 text-base">
                  No plans or briefs submitted yet for{' '}
                  <strong>{config.tenant}</strong>.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/create-business-plan"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-blue-800"
                  >
                    Start Business Plan Wizard
                  </Link>
                  <Link
                    to="/idea-studio/submit"
                    className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    Quick Brief in Idea Studio
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Staging &amp; Sprints
            </h2>
            <Link
              to="/idea-studio/workspace"
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              Workspace
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {staging.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Live Staging Previews
                </h3>
                <ul className="space-y-2">
                  {staging.map((stg, idx) => (
                    <li
                      key={stg.hostname || idx}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 inline-flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-brand-primary" />
                          {stg.appSlug || stg.hostname}
                        </span>
                        <span className="text-xs text-gray-500">
                          {stg.status || 'provisioned'}
                        </span>
                      </div>
                      {stg.previewUrl && (
                        <a
                          href={stg.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-xs text-brand-primary hover:underline inline-flex items-center gap-1"
                        >
                          {stg.previewUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sprints.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Recent Sprints
                </h3>
                <ul className="divide-y divide-gray-200">
                  {sprints.slice(0, 4).map((sp) => (
                    <li key={sp.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          Sprint {sp.number ?? 1}: {sp.name}
                        </p>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {sp.status || 'planned'}
                        </span>
                      </div>
                      {sp.appSlug && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          App: {sp.appSlug}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No sprints scheduled yet. Graduate an approved brief in My App
                Workspace to launch Sprint 1.
              </p>
            )}

            <div className="pt-3 border-t border-gray-100">
              <Link
                to="/analysis-engine/set-kpis"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
              >
                <Target className="w-4 h-4" />
                <span>Configure KPI Targets in Analysis Engine</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
