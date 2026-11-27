import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Compass,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  Lightbulb,
  Play,
  Printer,
  RefreshCw,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  IDEA_STUDIO_STAGING_DOMAIN,
  IDEA_STUDIO_TENANT,
  ideaStudioApi,
} from '@/services/ideaStudioApi';
import {
  buildDocumentPayloadFromIdea,
  generateAndDownloadNexusDocument,
  type NexusDocumentFormat,
} from '@/services/nexusDocumentsApi';
import type {
  FinOpsRollup,
  GateStatusResponse,
  IdeaRecord,
  IdeaStudioConfig,
  IdeaStudioTab,
  InitiativeRecord,
  MilestoneReport,
  SprintRecord,
  StagingDeployment,
} from '@/types/ideaStudio';

interface StageGuideStep {
  step: number;
  title: string;
  tag: string;
  description: string;
}

const STAGE_GUIDE_STEPS: StageGuideStep[] = [
  {
    step: 1,
    title: '1. Brief Submitted',
    tag: 'new',
    description: 'Captures the problem, target audience, tags, and compliance notes.',
  },
  {
    step: 2,
    title: '2. M1 Market Research',
    tag: 'research',
    description:
      'Runs live search and LLM synthesis for demand, competitors, and saturation (logged to FinOps).',
  },
  {
    step: 3,
    title: '3. Gate 1 Review',
    tag: 'gate-1',
    description: 'Approve to advance to Feasibility, request revision, or archive.',
  },
  {
    step: 4,
    title: '4. M2 Feasibility & Viability',
    tag: 'feasibility',
    description:
      'Assesses technical fit, compliance/WCAG, guardrails, and unit economics (logged to FinOps).',
  },
  {
    step: 5,
    title: '5. Gate 2 Review',
    tag: 'scaffold',
    description: 'Sign off to unlock app graduation in My App Workspace.',
  },
  {
    step: 6,
    title: '6. Graduate App Profile',
    tag: 'M3',
    description:
      'Generates pipeline/apps/<slug>.yaml and assigns the <slug>.nexus-solutions.us staging domain.',
  },
  {
    step: 7,
    title: '7. Sprints 1–N & Staging',
    tag: 'production',
    description:
      'Runs autonomous build sprints, provisions staging preview URLs, and tracks deliverables through launch.',
  },
];

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

function normalizeTab(
  value?: string | null,
  fallback: IdeaStudioTab = 'submit'
): IdeaStudioTab {
  const cleaned = (value || '').trim().toLowerCase();
  if (cleaned === 'inbox' || cleaned === 'workspace' || cleaned === 'submit') {
    return cleaned;
  }
  return fallback;
}

interface IdeaStudioPageProps {
  defaultTab?: IdeaStudioTab;
}

const IdeaStudioPage: React.FC<IdeaStudioPageProps> = ({
  defaultTab = 'submit',
}) => {
  const { tab: routeTab } = useParams<{ tab?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = normalizeTab(routeTab || searchParams.get('tab'), defaultTab);
  const queryIdeaId = searchParams.get('idea');
  const [activeTab, setActiveTab] = useState<IdeaStudioTab>(initialTab);

  const [config, setConfig] = useState<IdeaStudioConfig>({
    configured: true,
    tenant: IDEA_STUDIO_TENANT,
    stagingDomain: IDEA_STUDIO_STAGING_DOMAIN,
    hostedUiUrl: null,
    proxyMode: 'backend',
  });
  const [configChecked, setConfigChecked] = useState(false);

  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<GateStatusResponse | null>(null);
  const [sprints, setSprints] = useState<SprintRecord[]>([]);
  const [initiatives, setInitiatives] = useState<InitiativeRecord[]>([]);
  const [stagingDeployments, setStagingDeployments] = useState<StagingDeployment[]>([]);
  const [finopsRollup, setFinopsRollup] = useState<FinOpsRollup | null>(null);

  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Submit Brief form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetEntities, setTargetEntities] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [promptNotes, setPromptNotes] = useState('');

  // Inbox reviewer notes & report printing state
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [printingReportKey, setPrintingReportKey] = useState<string | null>(null);

  // Stage Guide drawer
  const [stageGuideOpen, setStageGuideOpen] = useState(false);
  const guideToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const next = normalizeTab(routeTab || searchParams.get('tab'), defaultTab);
    setActiveTab(next);
  }, [defaultTab, routeTab, searchParams]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stageGuideOpen) {
        setStageGuideOpen(false);
        guideToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [stageGuideOpen]);

  const switchTab = (nextTab: IdeaStudioTab) => {
    setActiveTab(nextTab);
    setStatusMessage('');
    setErrorMessage('');
    navigate(`/idea-studio/${nextTab}`, { replace: true });
  };

  const loadGateStatus = useCallback(async (ideaId: string | null) => {
    if (!ideaId) {
      setGateStatus(null);
      return;
    }
    try {
      const status = await ideaStudioApi.getGateStatus(ideaId);
      setGateStatus(status);
    } catch (err) {
      setGateStatus(null);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to load milestone reports.'
      );
    }
  }, []);

  const loadWorkspaceData = useCallback(
    async (preferredIdeaId?: string | null) => {
      setLoading(true);
      setErrorMessage('');
      try {
        const cfg = await ideaStudioApi.getConfig();
        setConfig(cfg);
        setConfigChecked(true);

        if (!cfg.configured) {
          setIdeas([]);
          setSprints([]);
          setInitiatives([]);
          setStagingDeployments([]);
          setFinopsRollup(null);
          setGateStatus(null);
          return;
        }

        const [ideasList, sprintsList, initiativesList, stagingList, finopsData] =
          await Promise.all([
            ideaStudioApi.listIdeas(),
            ideaStudioApi.listSprints(),
            ideaStudioApi.listInitiatives(),
            ideaStudioApi.listStaging().catch(() => [] as StagingDeployment[]),
            ideaStudioApi.getTenantFinOps().catch(() => null),
          ]);

        setIdeas(ideasList);
        setSprints(sprintsList);
        setInitiatives(initiativesList);
        setStagingDeployments(stagingList);
        setFinopsRollup(finopsData);

        const nextSelected =
          preferredIdeaId !== undefined
            ? preferredIdeaId
            : selectedIdeaId && ideasList.some((i) => i.id === selectedIdeaId)
              ? selectedIdeaId
              : ideasList[0]?.id || null;

        setSelectedIdeaId(nextSelected);
        if (nextSelected) {
          await loadGateStatus(nextSelected);
        } else {
          setGateStatus(null);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to load Idea Studio workspace.'
        );
      } finally {
        setLoading(false);
      }
    },
    [loadGateStatus, selectedIdeaId]
  );

  useEffect(() => {
    loadWorkspaceData(queryIdeaId || undefined);
    // Load once on mount (honoring ?idea=<id> when coming from BusinessPlanWizard or Dashboard)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIdea = useMemo(
    () => ideas.find((i) => i.id === selectedIdeaId) || null,
    [ideas, selectedIdeaId]
  );

  const graduatedIdeas = useMemo(
    () =>
      ideas.filter(
        (i) =>
          ['scaffold', 'sprint', 'production'].includes(i.stage || '') ||
          Boolean(i.appSlug)
      ),
    [ideas]
  );

  const activeStageGuideStep = useMemo(() => {
    if (activeTab === 'submit') return 1;
    if (!selectedIdea) {
      if (activeTab === 'workspace') {
        if (sprints.length > 0) return 7;
        if (ideas.some((i) => i.appSlug)) return 6;
        return 5;
      }
      return 1;
    }
    const stage = gateStatus?.currentStage || selectedIdea.stage || 'idea';
    const reports = gateStatus?.reports || [];
    const hasM1 = reports.some((r) => String(r.milestone).toUpperCase() === 'M1');
    const hasM2 = reports.some((r) => String(r.milestone).toUpperCase() === 'M2');

    if (stage === 'idea' || stage === 'new') return 1;
    if (stage === 'research') return hasM1 ? 3 : 2;
    if (stage === 'feasibility') return hasM2 ? 5 : 4;
    if (stage === 'scaffold') {
      const hasSprint = sprints.some(
        (sp) =>
          sp.ideaId === selectedIdea.id ||
          (selectedIdea.appSlug && sp.appSlug === selectedIdea.appSlug)
      );
      if (hasSprint) return 7;
      return selectedIdea.appSlug ? 6 : 5;
    }
    if (stage === 'sprint' || stage === 'production') return 7;
    return 1;
  }, [activeTab, gateStatus, ideas, selectedIdea, sprints]);

  const handleSelectIdea = async (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    setStatusMessage('');
    setErrorMessage('');
    await loadGateStatus(ideaId);
  };

  const handleCreateIdea = async (autoResearch: boolean) => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      setErrorMessage('Please enter an idea title.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setBusyAction(autoResearch ? 'submit-research' : 'submit');
    setErrorMessage('');
    setStatusMessage('');
    try {
      const created = await ideaStudioApi.createIdea({
        title: trimmedTitle,
        description: trimmedDescription,
        targetEntities: targetEntities.trim(),
        tags,
        prompt: promptNotes.trim(),
      });

      if (autoResearch) {
        setStatusMessage(
          `Submitted "${created.title}". Running M1 Market Research...`
        );
        await ideaStudioApi.runMarketResearch(created.id, false);
        setStatusMessage(
          `Submitted "${created.title}" and generated the M1 Market Research report.`
        );
      } else {
        setStatusMessage(
          `Submitted "${created.title}" to your Idea Studio inbox.`
        );
      }

      setTitle('');
      setDescription('');
      setTargetEntities('');
      setTagsInput('');
      setPromptNotes('');

      setActiveTab('inbox');
      navigate('/idea-studio/inbox', { replace: true });
      await loadWorkspaceData(created.id);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit idea brief.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunM1 = async () => {
    if (!selectedIdeaId) return;
    setBusyAction('run-m1');
    setErrorMessage('');
    setStatusMessage('Running M1 Market Research...');
    try {
      await ideaStudioApi.runMarketResearch(selectedIdeaId, false);
      setStatusMessage('M1 Market Research report generated.');
      await loadWorkspaceData(selectedIdeaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to run M1 Market Research.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunM2 = async () => {
    if (!selectedIdeaId) return;
    setBusyAction('run-m2');
    setErrorMessage('');
    setStatusMessage('Running M2 Feasibility & Viability assessment...');
    try {
      await ideaStudioApi.runFeasibilityViability(selectedIdeaId, false);
      setStatusMessage('M2 Feasibility & Viability report generated.');
      await loadWorkspaceData(selectedIdeaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to run M2 Feasibility & Viability.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleGateDecision = async (
    fromStage: string,
    toStage: string,
    decision: 'approve' | 'request_revision' | 'kill'
  ) => {
    if (!selectedIdeaId) return;
    setBusyAction(`gate-${decision}`);
    setErrorMessage('');
    try {
      await ideaStudioApi.evaluateGate(selectedIdeaId, {
        fromStage,
        toStage,
        decision,
        notes: reviewerNotes.trim(),
      });
      setReviewerNotes('');
      setStatusMessage(`Recorded gate decision: ${decision.replace('_', ' ')}.`);
      await loadWorkspaceData(selectedIdeaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to record gate decision.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleGraduate = async (ideaId: string) => {
    setBusyAction(`graduate-${ideaId}`);
    setErrorMessage('');
    try {
      const res = await ideaStudioApi.graduateIdea(ideaId);
      setStatusMessage(
        `Graduated "${res.appSlug || ideaId}" and generated the app profile.`
      );
      await loadWorkspaceData(ideaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to graduate app profile.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleScaffold = async (ideaId: string) => {
    setBusyAction(`scaffold-${ideaId}`);
    setErrorMessage('');
    setStatusMessage('Scaffolding application repository structure...');
    try {
      const res = await ideaStudioApi.scaffoldIdea(ideaId);
      setStatusMessage(
        `Scaffold completed (${res.mode || 'applied'}) at ${res.scaffoldPath || 'target directory'}.`
      );
      await loadWorkspaceData(ideaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to run scaffold.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleStartSprintOne = async (idea: IdeaRecord) => {
    setBusyAction(`sprint1-${idea.id}`);
    setErrorMessage('');
    try {
      const matchingInit = initiatives.find((i) => i.ideaId === idea.id);
      await ideaStudioApi.startSprintOne({
        initiativeId: matchingInit?.id,
        ideaId: idea.id,
        appSlug: idea.appSlug,
        ideaTitle: idea.title,
      });
      setStatusMessage(`Started Sprint 1 for "${idea.appSlug || idea.title}".`);
      await loadWorkspaceData(idea.id);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to start Sprint 1.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleStartNextSprint = async (ideaId: string, expectedNum: number) => {
    setBusyAction(`next-sprint-${ideaId}`);
    setErrorMessage('');
    try {
      const res = await ideaStudioApi.startNextSprint(ideaId);
      const createdNum = res.sprint?.number || expectedNum;
      setStatusMessage(
        `Started Sprint ${createdNum} with initial milestone tasks.`
      );
      await loadWorkspaceData(ideaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to start next sprint.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleExecuteSprint = async (sprintId: string) => {
    setBusyAction(`exec-sprint-${sprintId}`);
    setErrorMessage('');
    setStatusMessage(
      'Running autonomous sprint build, CI checks, and PR loop...'
    );
    try {
      const res = await ideaStudioApi.executeSprint(sprintId, true);
      const count = Array.isArray(res.executedTasks)
        ? res.executedTasks.length
        : 0;
      setStatusMessage(
        `Autonomous sprint run finished (${res.mode || 'applied'}): ${count} task(s) executed, CI ${res.ciStatus || 'passed'}.`
      );
      await loadWorkspaceData(selectedIdeaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to execute autonomous sprint.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleProvisionStaging = async (ideaId: string) => {
    setBusyAction(`staging-${ideaId}`);
    setErrorMessage('');
    setStatusMessage(
      `Provisioning staging subdomain on *.${config.stagingDomain}, reverse proxy, and TLS...`
    );
    try {
      const res = await ideaStudioApi.provisionStaging(ideaId);
      const stg = res.staging || {};
      setStatusMessage(
        `Staging ${stg.status || 'provisioned'}: ${stg.previewUrl || stg.hostname || ideaId}`
      );
      await loadWorkspaceData(ideaId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to provision staging subdomain.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrintReport = (reportKey: string) => {
    setPrintingReportKey(reportKey);
    document.body.classList.add('idea-studio-printing');
    const cleanup = () => {
      document.body.classList.remove('idea-studio-printing');
      setPrintingReportKey(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 1000);
    }, 50);
  };

  const handleExportNexusDocument = async (
    idea: IdeaRecord,
    reports: MilestoneReport[],
    format: NexusDocumentFormat
  ) => {
    const actionKey = `export-${idea.id}-${format}`;
    setBusyAction(actionKey);
    setErrorMessage('');
    setStatusMessage(
      `Generating Nexus ${format.toUpperCase()} deliverable for "${idea.title}"...`
    );
    try {
      const payload = buildDocumentPayloadFromIdea(idea, reports);
      await generateAndDownloadNexusDocument(
        format,
        payload,
        idea.appSlug || idea.title
      );
      setStatusMessage(
        `Downloaded ${format.toUpperCase()} deliverable for "${idea.title}".`
      );
    } catch (err) {
      setStatusMessage('');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : `Failed to export ${format.toUpperCase()} document.`
      );
    } finally {
      setBusyAction(null);
    }
  };

  const renderReportCard = (report: MilestoneReport, index: number) => {
    const reportKey = `${report.milestone}-${report.id || index}`;
    const isPrintTarget = printingReportKey === reportKey;
    const data = report.reportData || {};
    const summaryLine =
      (typeof data.executive_summary === 'string' && data.executive_summary) ||
      (typeof data.summary === 'string' && data.summary) ||
      (data.market_saturation
        ? `Market saturation: ${data.market_saturation.score ?? 'N/A'}`
        : '');

    return (
      <article
        key={reportKey}
        className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${
          isPrintTarget ? 'idea-studio-print-target' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-brand-primary">
              {report.milestone}
            </span>
            <strong className="text-base text-gray-900">
              {report.skill || 'Milestone Report'}
            </strong>
          </div>
          {report.createdAt && (
            <span className="text-sm text-gray-500">{report.createdAt}</span>
          )}
        </div>

        {summaryLine && (
          <p className="text-base text-gray-700 mb-3 leading-relaxed">
            {summaryLine}
          </p>
        )}

        <details open={isPrintTarget} className="group">
          <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 text-base font-medium text-brand-primary hover:underline py-1">
            <FileText className="w-4 h-4" />
            <span>View full {report.milestone} report</span>
          </summary>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-end mb-3 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={Printer}
                onClick={() => handlePrintReport(reportKey)}
                className="min-h-[44px]"
              >
                Print / Save PDF
              </Button>
            </div>
            <div className="prose max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report.reportMarkdown || 'No markdown summary available.'}
              </ReactMarkdown>
            </div>
          </div>
        </details>
      </article>
    );
  };

  const renderGateControls = () => {
    if (!selectedIdea || !gateStatus) return null;
    const stage = gateStatus.currentStage;
    const isArchived = selectedIdea.status === 'archived';

    if (isArchived) {
      return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-base font-medium text-gray-600">
            Archived / Killed — no further stage transitions available.
          </p>
        </div>
      );
    }

    const hasM2 = (gateStatus.reports || []).some(
      (r) => String(r.milestone).toUpperCase() === 'M2'
    );

    return (
      <Card
        title="Approval Gate Controls"
        subtitle="Sequential gates ensure market and technical validation before build investment."
        variant="blue"
      >
        <div className="space-y-4">
          {stage !== 'scaffold' && stage !== 'sprint' && stage !== 'production' && (
            <div>
              <label
                htmlFor="idea-studio-gate-notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reviewer Notes (optional)
              </label>
              <input
                id="idea-studio-gate-notes"
                type="text"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Add approval rationale or requested revisions"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {(stage === 'idea' || stage === 'new') && (
              <Button
                type="button"
                leftIcon={Sparkles}
                isLoading={busyAction === 'run-m1'}
                disabled={Boolean(busyAction)}
                onClick={handleRunM1}
                className="min-h-[44px] text-base"
              >
                Run M1 Market Research
              </Button>
            )}

            {stage === 'research' && (
              <>
                <Button
                  type="button"
                  leftIcon={ShieldCheck}
                  isLoading={busyAction === 'gate-approve'}
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    handleGateDecision('research', 'feasibility', 'approve')
                  }
                  className="min-h-[44px] text-base"
                >
                  Approve Gate 1 → Feasibility
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={busyAction === 'gate-request_revision'}
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    handleGateDecision(
                      'research',
                      'feasibility',
                      'request_revision'
                    )
                  }
                  className="min-h-[44px] text-base border-gray-300 text-gray-700"
                >
                  Request Revision
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={busyAction === 'gate-kill'}
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    handleGateDecision('research', 'feasibility', 'kill')
                  }
                  className="min-h-[44px] text-base border-red-300 text-red-700 hover:bg-red-50"
                >
                  Kill / Archive
                </Button>
              </>
            )}

            {stage === 'feasibility' && (
              <>
                {!hasM2 && (
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={Compass}
                    isLoading={busyAction === 'run-m2'}
                    disabled={Boolean(busyAction)}
                    onClick={handleRunM2}
                    className="min-h-[44px] text-base"
                  >
                    Run M2 Feasibility &amp; Viability
                  </Button>
                )}
                <Button
                  type="button"
                  leftIcon={ShieldCheck}
                  isLoading={busyAction === 'gate-approve'}
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    handleGateDecision('feasibility', 'scaffold', 'approve')
                  }
                  className="min-h-[44px] text-base"
                >
                  Approve Gate 2 → Graduate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={busyAction === 'gate-request_revision'}
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    handleGateDecision(
                      'feasibility',
                      'scaffold',
                      'request_revision'
                    )
                  }
                  className="min-h-[44px] text-base border-gray-300 text-gray-700"
                >
                  Request Revision
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={busyAction === 'gate-kill'}
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    handleGateDecision('feasibility', 'scaffold', 'kill')
                  }
                  className="min-h-[44px] text-base border-red-300 text-red-700 hover:bg-red-50"
                >
                  Kill / Archive
                </Button>
              </>
            )}

            {(stage === 'scaffold' ||
              stage === 'sprint' ||
              stage === 'production') && (
              <div className="flex flex-wrap items-center justify-between gap-3 w-full rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-2 text-emerald-800 text-base font-medium">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>
                    Gate 2 approved — ready to graduate and launch in My App
                    Workspace.
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  rightIcon={ChevronRight}
                  onClick={() => switchTab('workspace')}
                  className="min-h-[44px]"
                >
                  Open My App Workspace
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-brand-primary text-white p-6 md:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-blue-200 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                <Lightbulb className="w-4 h-4 text-amber-300" />
                Tenant: {config.tenant}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                <Globe className="w-4 h-4 text-blue-200" />
                Staging: &lt;slug&gt;.{config.stagingDomain}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Idea Studio
            </h1>
            <p className="text-base md:text-lg text-blue-100/90 max-w-3xl leading-relaxed">
              Take product concepts from structured brief through Market Research
              (M1), Feasibility &amp; Viability (M2), approval gates, autonomous
              build sprints, and live staging on{' '}
              <code className="bg-white/15 px-1.5 py-0.5 rounded text-white text-sm">
                &lt;slug&gt;.{config.stagingDomain}
              </code>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadWorkspaceData(selectedIdeaId)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-base font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
            {config.hostedUiUrl && (
              <a
                href={config.hostedUiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-white text-brand-primary hover:bg-blue-50 text-base font-semibold transition-colors shadow-sm"
              >
                <span>Open Hosted View</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-5"
          role="tablist"
          aria-label="Idea Studio sections"
        >
          <button
            id="idea-studio-tab-submit"
            type="button"
            role="tab"
            aria-selected={activeTab === 'submit'}
            aria-controls="idea-studio-panel-submit"
            onClick={() => switchTab('submit')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              activeTab === 'submit'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            1. Submit Brief
          </button>
          <button
            id="idea-studio-tab-inbox"
            type="button"
            role="tab"
            aria-selected={activeTab === 'inbox'}
            aria-controls="idea-studio-panel-inbox"
            onClick={() => switchTab('inbox')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              activeTab === 'inbox'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            2. Milestone &amp; Approval Inbox ({ideas.length})
          </button>
          <button
            id="idea-studio-tab-workspace"
            type="button"
            role="tab"
            aria-selected={activeTab === 'workspace'}
            aria-controls="idea-studio-panel-workspace"
            onClick={() => switchTab('workspace')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              activeTab === 'workspace'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            3. My App Workspace ({sprints.length})
          </button>
        </div>
      </div>

      {/* Configuration Notice when backend env var is not yet set */}
      {configChecked && !config.configured && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900 flex items-start gap-3"
          role="status"
        >
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-base">
            <h2 className="font-semibold">
              Connect the Shared Idea Studio Backend
            </h2>
            <p className="leading-relaxed">
              The Nexus backend proxy at{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-sm">
                /api/idea-studio
              </code>{' '}
              is ready, but{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-sm">
                IDEA_STUDIO_API_BASE_URL
              </code>{' '}
              is not configured yet in this environment. Set it to the shared{' '}
              <code>TheHelm</code> <code>control-api</code> URL (or set{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-sm">
                VITE_IDEA_STUDIO_API_URL
              </code>{' '}
              for direct mode) to enable live briefs, M1/M2 reports, sprints,
              staging, and FinOps rollups for tenant{' '}
              <strong>{config.tenant}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div aria-live="polite" className="space-y-2">
        {statusMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 flex items-center gap-2 text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900 flex items-center gap-2 text-base"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* TAB 1: SUBMIT BRIEF */}
      {activeTab === 'submit' && (
        <section
          id="idea-studio-panel-submit"
          role="tabpanel"
          aria-labelledby="idea-studio-tab-submit"
        >
          <Card
            title="Submit a New Idea Brief"
            subtitle="Describe the problem, target audience, and constraints. Idea Studio runs Market Research (M1) and Feasibility & Viability (M2) before any build investment."
          >
            <form
              className="space-y-5 mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateIdea(false);
              }}
              noValidate
            >
              <div>
                <label
                  htmlFor="idea-studio-title"
                  className="block text-base font-medium text-gray-800 mb-1.5"
                >
                  Idea Title <span className="text-red-600">*</span>
                </label>
                <input
                  id="idea-studio-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Executive KPI Reporting & Data Convergence Portal"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="idea-studio-description"
                  className="block text-base font-medium text-gray-800 mb-1.5"
                >
                  Problem &amp; Solution Summary{' '}
                  <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="idea-studio-description"
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What problem does this solve, for whom, and what core workflow should it support?"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="idea-studio-entities"
                    className="block text-base font-medium text-gray-800 mb-1.5"
                  >
                    Target Entities / Audience
                  </label>
                  <input
                    id="idea-studio-entities"
                    type="text"
                    value={targetEntities}
                    onChange={(e) => setTargetEntities(e.target.value)}
                    placeholder="e.g., Mid-market operations leaders & business analysts"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-base"
                  />
                </div>
                <div>
                  <label
                    htmlFor="idea-studio-tags"
                    className="block text-base font-medium text-gray-800 mb-1.5"
                  >
                    Tags &amp; Constraints (comma-separated)
                  </label>
                  <input
                    id="idea-studio-tags"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g., b2b-saas, analytics, wcag-aa"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-base"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="idea-studio-prompt"
                  className="block text-base font-medium text-gray-800 mb-1.5"
                >
                  Timeline, Budget, or Compliance Notes (optional)
                </label>
                <textarea
                  id="idea-studio-prompt"
                  rows={3}
                  value={promptNotes}
                  onChange={(e) => setPromptNotes(e.target.value)}
                  placeholder="e.g., SOC 2 / WCAG 2.1 AA required; target MVP staging on <slug>.nexus-solutions.us in 3 sprints"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-base"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    leftIcon={Lightbulb}
                    isLoading={busyAction === 'submit'}
                    disabled={!config.configured || Boolean(busyAction)}
                    className="min-h-[44px] px-6 text-base"
                  >
                    Submit Brief
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={Sparkles}
                    isLoading={busyAction === 'submit-research'}
                    disabled={!config.configured || Boolean(busyAction)}
                    onClick={() => handleCreateIdea(true)}
                    className="min-h-[44px] px-6 text-base"
                  >
                    Submit &amp; Run M1 Research
                  </Button>
                </div>
                <Link
                  to="/create-business-plan"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  <span>Use Full 5-Step Business Plan Wizard</span>
                </Link>
              </div>
            </form>
          </Card>
        </section>
      )}

      {/* TAB 2: MILESTONE & APPROVAL INBOX */}
      {activeTab === 'inbox' && (
        <section
          id="idea-studio-panel-inbox"
          role="tabpanel"
          aria-labelledby="idea-studio-tab-inbox"
          className="space-y-6"
        >
          {ideas.length === 0 ? (
            <Card>
              <div className="text-center py-10 space-y-4">
                <Lightbulb className="w-12 h-12 text-brand-primary/60 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">
                  No briefs submitted yet for {config.tenant}
                </h2>
                <p className="text-base text-gray-600 max-w-lg mx-auto">
                  Start by submitting an idea brief to run M1 Market Research and
                  M2 Feasibility &amp; Viability reports.
                </p>
                <Button
                  type="button"
                  onClick={() => switchTab('submit')}
                  className="min-h-[44px] text-base"
                >
                  Submit Your First Brief
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Idea List Sidebar */}
              <aside
                className="lg:col-span-4 space-y-2"
                aria-label="Tenant ideas"
              >
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 px-1 mb-2">
                  Submitted Briefs ({ideas.length})
                </h2>
                {ideas.map((idea) => {
                  const isSelected = idea.id === selectedIdeaId;
                  return (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => handleSelectIdea(idea.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all min-h-[64px] ${
                        isSelected
                          ? 'bg-blue-50 border-brand-primary shadow-sm ring-1 ring-brand-primary/30'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-base text-gray-900">
                        {idea.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {formatStageLabel(idea.stage)}
                        </span>
                        <span>{idea.status || 'new'}</span>
                      </div>
                    </button>
                  );
                })}
              </aside>

              {/* Selected Idea Detail */}
              <div className="lg:col-span-8 space-y-6">
                {selectedIdea ? (
                  <>
                    <Card>
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h2 className="text-2xl font-bold text-gray-900">
                            {selectedIdea.title}
                          </h2>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-brand-primary">
                            {formatStageLabel(selectedIdea.stage)}
                          </span>
                        </div>
                        <p className="text-base text-gray-700 leading-relaxed">
                          {selectedIdea.description ||
                            'No description provided.'}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                          <span>
                            <strong>Target:</strong>{' '}
                            {selectedIdea.targetEntities || 'General'}
                          </span>
                          {selectedIdea.appSlug && (
                            <span>
                              <strong>App Slug:</strong>{' '}
                              <code>{selectedIdea.appSlug}</code>
                            </span>
                          )}
                          {Array.isArray(selectedIdea.tags) &&
                            selectedIdea.tags.length > 0 && (
                              <span>
                                <strong>Tags:</strong>{' '}
                                {selectedIdea.tags.join(', ')}
                              </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                          <span className="text-sm font-medium text-gray-600 mr-1">
                            Export Nexus Deliverable:
                          </span>
                          {(['pdf', 'docx', 'pptx'] as NexusDocumentFormat[]).map(
                            (fmt) => (
                              <Button
                                key={fmt}
                                type="button"
                                variant="outline"
                                size="sm"
                                leftIcon={Download}
                                isLoading={
                                  busyAction ===
                                  `export-${selectedIdea.id}-${fmt}`
                                }
                                disabled={Boolean(busyAction)}
                                onClick={() =>
                                  handleExportNexusDocument(
                                    selectedIdea,
                                    gateStatus?.reports || [],
                                    fmt
                                  )
                                }
                                className="min-h-[44px] border-gray-300 text-gray-800"
                              >
                                {fmt.toUpperCase()}
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </Card>

                    {renderGateControls()}

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Milestone Reports (M1 / M2)
                      </h3>
                      {(gateStatus?.reports || []).length > 0 ? (
                        <div className="space-y-4">
                          {(gateStatus?.reports || []).map((report, idx) =>
                            renderReportCard(report, idx)
                          )}
                        </div>
                      ) : (
                        <Card variant="filled">
                          <p className="text-base text-gray-600">
                            No milestone reports generated yet for this idea.
                            Run M1 Market Research above to get started.
                          </p>
                        </Card>
                      )}
                    </div>

                    <Card title="Decision History">
                      {(gateStatus?.decisions || []).length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {(gateStatus?.decisions || []).map((dec, idx) => (
                            <li
                              key={dec.id || idx}
                              className="py-3 text-base text-gray-700"
                            >
                              <strong className="text-gray-900">
                                {dec.gateKey ||
                                  `${dec.fromStage} → ${dec.toStage}`}
                              </strong>
                              :{' '}
                              <span className="font-medium capitalize">
                                {dec.decision.replace('_', ' ')}
                              </span>{' '}
                              by {dec.actor || 'reviewer'}
                              {dec.createdAt ? ` (${dec.createdAt})` : ''}
                              {dec.notes ? ` — ${dec.notes}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-base text-gray-600">
                          No gate decisions recorded yet.
                        </p>
                      )}
                    </Card>
                  </>
                ) : (
                  <Card>
                    <p className="text-base text-gray-600">
                      Select an idea on the left to inspect its reports and
                      approval gates.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: MY APP WORKSPACE */}
      {activeTab === 'workspace' && (
        <section
          id="idea-studio-panel-workspace"
          role="tabpanel"
          aria-labelledby="idea-studio-tab-workspace"
          className="space-y-8"
        >
          {/* Graduated App Profiles */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Graduated App Profiles
              </h2>
              <p className="text-base text-gray-600 mt-1">
                Apps built for <strong>{config.tenant}</strong> stage on{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">
                  &lt;slug&gt;.{config.stagingDomain}
                </code>
                .
              </p>
            </div>

            {graduatedIdeas.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {graduatedIdeas.map((idea) => {
                  const isGraduated = Boolean(idea.appSlug);
                  const profilePath =
                    idea.appProfilePath || idea.profilePath || '';
                  const scaffoldPath = idea.scaffoldPath || '';
                  const matchingSprints = sprints.filter(
                    (sp) =>
                      sp.ideaId === idea.id ||
                      (idea.appSlug && sp.appSlug === idea.appSlug)
                  );
                  const hasSprint = matchingSprints.length > 0;
                  const maxSprintNumber = matchingSprints.reduce(
                    (max, sp) => Math.max(max, Number(sp.number || 0)),
                    0
                  );
                  const allSprintsCompleted =
                    hasSprint &&
                    matchingSprints.every(
                      (sp) =>
                        String(sp.status || '').toLowerCase() === 'completed'
                    );

                  const stagingRec = stagingDeployments.find(
                    (d) =>
                      d.ideaId === idea.id ||
                      (idea.appSlug && d.appSlug === idea.appSlug)
                  );
                  const stagingUrl =
                    stagingRec?.previewUrl || idea.stagingPreviewUrl || '';
                  const stagingStatus =
                    stagingRec?.status ||
                    idea.stagingStatus ||
                    (isGraduated ? 'unprovisioned' : '');
                  const stagingDetail = stagingRec
                    ? `DNS: ${stagingRec.dns?.status || 'n/a'} · Proxy: ${stagingRec.proxy?.status || 'n/a'} · TLS: ${stagingRec.tls?.status || 'n/a'}`
                    : '';

                  const ideaFinops = finopsRollup?.byIdea?.find(
                    (entry) => entry.ideaId === idea.id
                  );
                  const ideaFinopsSummary = ideaFinops
                    ? `${formatUsd(ideaFinops.costUsd)} (${ideaFinops.callCount || 0} calls · ${Number(ideaFinops.totalTokens || 0).toLocaleString()} tokens)`
                    : '$0.00 (0 calls)';

                  return (
                    <Card key={idea.id} className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {idea.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            App Slug:{' '}
                            <strong className="font-mono text-gray-900">
                              {idea.appSlug || 'pending-graduation'}
                            </strong>
                          </p>
                        </div>
                        {stagingStatus && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Staging: {stagingStatus}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-sm text-gray-700">
                        <p>
                          <strong>Stage:</strong> {formatStageLabel(idea.stage)}{' '}
                          · <strong>Status:</strong> {idea.status || 'active'}
                        </p>
                        <p>
                          <strong>FinOps Cost:</strong> {ideaFinopsSummary}
                        </p>
                        {stagingUrl && (
                          <p>
                            <strong>Staging Preview:</strong>{' '}
                            <a
                              href={stagingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-primary hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              {stagingUrl}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </p>
                        )}
                        {stagingDetail && (
                          <p className="text-gray-500">{stagingDetail}</p>
                        )}
                        {profilePath && (
                          <p>
                            <strong>Profile:</strong>{' '}
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                              {profilePath}
                            </code>
                          </p>
                        )}
                        {scaffoldPath && (
                          <p>
                            <strong>
                              Scaffolded ({idea.scaffoldMode || 'applied'}):
                            </strong>{' '}
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                              {scaffoldPath}
                            </code>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-3 border-t border-gray-100">
                        {!isGraduated && idea.stage === 'scaffold' && (
                          <Button
                            type="button"
                            leftIcon={Rocket}
                            isLoading={busyAction === `graduate-${idea.id}`}
                            disabled={Boolean(busyAction)}
                            onClick={() => handleGraduate(idea.id)}
                            className="min-h-[44px]"
                          >
                            Graduate App Profile
                          </Button>
                        )}
                        {isGraduated && !hasSprint && (
                          <Button
                            type="button"
                            leftIcon={Play}
                            isLoading={busyAction === `sprint1-${idea.id}`}
                            disabled={Boolean(busyAction)}
                            onClick={() => handleStartSprintOne(idea)}
                            className="min-h-[44px]"
                          >
                            Start Sprint 1
                          </Button>
                        )}
                        {isGraduated && allSprintsCompleted && (
                          <Button
                            type="button"
                            leftIcon={Play}
                            isLoading={busyAction === `next-sprint-${idea.id}`}
                            disabled={Boolean(busyAction)}
                            onClick={() =>
                              handleStartNextSprint(
                                idea.id,
                                maxSprintNumber + 1
                              )
                            }
                            className="min-h-[44px]"
                          >
                            Start Sprint {maxSprintNumber + 1}
                          </Button>
                        )}
                        {isGraduated && !scaffoldPath && (
                          <Button
                            type="button"
                            variant="outline"
                            leftIcon={Layers}
                            isLoading={busyAction === `scaffold-${idea.id}`}
                            disabled={Boolean(busyAction)}
                            onClick={() => handleScaffold(idea.id)}
                            className="min-h-[44px] border-gray-300 text-gray-800"
                          >
                            Run Scaffold
                          </Button>
                        )}
                        {isGraduated && (
                          <Button
                            type="button"
                            variant="outline"
                            leftIcon={Server}
                            isLoading={busyAction === `staging-${idea.id}`}
                            disabled={Boolean(busyAction)}
                            onClick={() => handleProvisionStaging(idea.id)}
                            className="min-h-[44px] border-gray-300 text-gray-800"
                          >
                            {stagingRec
                              ? 'Re-provision Staging'
                              : 'Provision Staging'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          leftIcon={Download}
                          isLoading={busyAction === `export-${idea.id}-pdf`}
                          disabled={Boolean(busyAction)}
                          onClick={() =>
                            handleExportNexusDocument(idea, [], 'pdf')
                          }
                          className="min-h-[44px] border-gray-300 text-gray-800"
                        >
                          Export PDF
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card variant="filled">
                <p className="text-base text-gray-600">
                  No apps have graduated past Gate 2 yet. Approve Gate 2 in the
                  Milestone &amp; Approval Inbox to graduate an idea.
                </p>
              </Card>
            )}
          </div>

          {/* FinOps Cost Rollup */}
          <Card
            title={`FinOps Cost Rollup (${config.tenant})`}
            icon={<DollarSign className="w-6 h-6 text-brand-primary" />}
          >
            {finopsRollup && finopsRollup.callCount > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-6 text-base text-gray-800">
                  <span>
                    Total LLM Spend:{' '}
                    <strong className="text-gray-900">
                      {formatUsd(finopsRollup.totalCostUsd)}
                    </strong>
                  </span>
                  <span>
                    Calls:{' '}
                    <strong className="text-gray-900">
                      {finopsRollup.callCount}
                    </strong>
                  </span>
                  <span>
                    Tokens:{' '}
                    <strong className="text-gray-900">
                      {Number(finopsRollup.totalTokens || 0).toLocaleString()}
                    </strong>
                  </span>
                </div>
                {Array.isArray(finopsRollup.byMilestone) &&
                  finopsRollup.byMilestone.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {finopsRollup.byMilestone.map((entry) => (
                        <span
                          key={entry.milestone}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-brand-primary border border-blue-200"
                        >
                          {entry.milestone}: {formatUsd(entry.costUsd)} (
                          {entry.callCount} calls)
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-base text-gray-600">
                Total LLM Spend: <strong>$0.00</strong> (0 calls · 0 tokens).
                Costs populate automatically as M1, M2, and Sprint LLM calls run.
              </p>
            )}
          </Card>

          {/* Sprints 1-N Progress & Deliverables */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Sprints 1–N Progress &amp; Deliverables
            </h2>
            {sprints.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sprints.map((sp) => {
                  const sprintTasks = Array.isArray(sp.tasks) ? sp.tasks : [];
                  const taskCount =
                    sprintTasks.length || (sp.taskIds || []).length;
                  const completedCount = sprintTasks.filter(
                    (t) => String(t.status || '').toLowerCase() === 'completed'
                  ).length;
                  const hasIncomplete =
                    sprintTasks.length > 0 &&
                    completedCount < sprintTasks.length;
                  const isCompleted =
                    String(sp.status || '').toLowerCase() === 'completed';

                  return (
                    <Card key={sp.id} className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-brand-primary">
                          Sprint {sp.number ?? 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {sp.name}
                        </h3>
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          {sp.status || 'planned'}
                        </span>
                        {sp.ciStatus && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            CI: {sp.ciStatus}
                          </span>
                        )}
                      </div>

                      <p className="text-base text-gray-700">
                        {sp.goal || 'No sprint goal specified.'}
                      </p>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Tasks:{' '}
                          <strong className="text-gray-900">
                            {completedCount}/{taskCount} completed
                          </strong>
                          {sp.appSlug ? ` · App: ${sp.appSlug}` : ''}
                          {sp.branchName ? (
                            <>
                              {' · Branch: '}
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                                {sp.branchName}
                              </code>
                            </>
                          ) : null}
                        </p>
                        {sp.lastRunSummary && <p>{sp.lastRunSummary}</p>}
                      </div>

                      {sprintTasks.length > 0 && (
                        <ul className="space-y-2 border-t border-gray-100 pt-3">
                          {sprintTasks.map((task) => (
                            <li
                              key={task.id}
                              className="text-sm text-gray-800 flex flex-wrap items-center gap-x-2 gap-y-1"
                            >
                              <strong className="font-medium">
                                {task.title}
                              </strong>
                              <span className="text-gray-500">
                                ({task.status || 'planned'}
                                {task.ciStatus ? ` · CI: ${task.ciStatus}` : ''}
                                )
                              </span>
                              {task.prUrl && (
                                <a
                                  href={task.prUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-primary hover:underline inline-flex items-center gap-1"
                                >
                                  PR
                                  {task.prNumber ? ` #${task.prNumber}` : ''}
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                        {!isCompleted && (hasIncomplete || taskCount > 0) && (
                          <Button
                            type="button"
                            leftIcon={Play}
                            isLoading={busyAction === `exec-sprint-${sp.id}`}
                            disabled={Boolean(busyAction)}
                            onClick={() => handleExecuteSprint(sp.id)}
                            className="min-h-[44px]"
                          >
                            Run Autonomous Sprint
                          </Button>
                        )}
                        {isCompleted && sp.ideaId && (
                          <Button
                            type="button"
                            variant="outline"
                            leftIcon={Play}
                            isLoading={
                              busyAction === `next-sprint-${sp.ideaId}`
                            }
                            disabled={Boolean(busyAction)}
                            onClick={() =>
                              handleStartNextSprint(
                                sp.ideaId as string,
                                Number(sp.number || 1) + 1
                              )
                            }
                            className="min-h-[44px] border-gray-300 text-gray-800"
                          >
                            Start Sprint {Number(sp.number || 1) + 1}
                          </Button>
                        )}
                        {sp.prUrl && (
                          <a
                            href={sp.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-base font-medium text-brand-primary hover:underline min-h-[44px] px-2"
                          >
                            <span>View Sprint PR</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {sp.demoUrl && (
                          <a
                            href={sp.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-base font-medium text-emerald-700 hover:underline min-h-[44px] px-2"
                          >
                            <span>Open Staging Demo</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card variant="filled">
                <p className="text-base text-gray-600">
                  No sprints scheduled yet for {config.tenant}.
                </p>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Collapsible Stage Guide Floating Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 print:hidden">
        {stageGuideOpen && (
          <aside
            id="idea-studio-stage-guide-panel"
            role="region"
            aria-label="Idea Studio Stage Guide"
            className="w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-white border border-gray-200 shadow-2xl p-5"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
                  Workflow Reference
                </p>
                <h2 className="text-xl font-bold text-gray-900">Stage Guide</h2>
              </div>
              <button
                type="button"
                aria-label="Close Stage Guide"
                onClick={() => {
                  setStageGuideOpen(false);
                  guideToggleRef.current?.focus();
                }}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="mt-3 space-y-2.5">
              {STAGE_GUIDE_STEPS.map((item) => {
                const isActive = item.step === activeStageGuideStep;
                return (
                  <li
                    key={item.step}
                    aria-current={isActive ? 'step' : undefined}
                    className={`rounded-xl p-3 border ${
                      isActive
                        ? 'bg-blue-50 border-brand-primary/40'
                        : 'bg-gray-50/70 border-gray-100'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </strong>
                      {item.tag && (
                        <code className="text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                          {item.tag}
                        </code>
                      )}
                      {isActive && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-primary text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </aside>
        )}

        <button
          ref={guideToggleRef}
          type="button"
          aria-expanded={stageGuideOpen}
          aria-controls="idea-studio-stage-guide-panel"
          onClick={() => setStageGuideOpen((open) => !open)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full bg-brand-primary text-white font-semibold shadow-lg hover:bg-blue-800 transition-colors text-base"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Stage Guide</span>
        </button>
      </div>
    </div>
  );
};

export default IdeaStudioPage;
