import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Database,
  BarChart3,
  FileText,
  Send,
  Compass,
} from 'lucide-react';

export const TOUR_DISMISSED_KEY = 'nexus-tour-dismissed';

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  bullets: string[];
  actionLabel: string;
  actionPath: string;
  icon: React.ReactNode;
}

export const NEXUS_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nexus Solutions',
    subtitle: 'Your corporate data convergence command center',
    body: 'When operational data lives in scattered CRMs, spreadsheets, and finance exports, insight stays hidden. Nexus brings sources, KPIs, executive reporting, and client delivery into one workflow.',
    bullets: [
      'Unified data convergence hub for CRM, finance, and ops exports',
      'Live corporate KPI scorecards with automated CSV calculations',
      'Board-ready DOCX, PPTX, and PDF exports + Client Portal sign-off',
    ],
    actionLabel: 'Open Command Center',
    actionPath: '/dashboard',
    icon: <Compass className="w-7 h-7 text-blue-700" />,
  },
  {
    id: 'sources',
    title: '1. Ingest Your Data Sources',
    subtitle: 'Profile CSV exports automatically',
    body: 'Upload standard CSV exports from QuickBooks, HubSpot, Salesforce, Excel, or Google Sheets. Nexus parses currencies and percentages and summarizes numeric columns automatically.',
    bullets: [
      'Instant column profiling (sum, average, min, max, row count)',
      'Inspect sample rows right in the browser before mapping KPIs',
      'Document your source inventory for recurring executive packs',
    ],
    actionLabel: 'Go to Data Sources',
    actionPath: '/integrations',
    icon: <Database className="w-7 h-7 text-blue-700" />,
  },
  {
    id: 'kpis',
    title: '2. Track Corporate KPIs',
    subtitle: 'Bind metrics to live datasets or targets',
    body: 'Start from proven executive templates (MRR, Gross Margin, DSO, Pipeline Conversion, Utilization, NRR) or build custom KPIs bound directly to uploaded CSV columns.',
    bullets: [
      'Automatic attainment scoring (On Track, At Risk, Off Track)',
      'Supports both higher-is-better and lower-is-better metrics (like DSO)',
      'Auto-recalculates whenever updated CSV snapshots arrive',
    ],
    actionLabel: 'Open KPI Engine',
    actionPath: '/analysis-engine/set-kpis',
    icon: <BarChart3 className="w-7 h-7 text-emerald-700" />,
  },
  {
    id: 'reports',
    title: '3. Generate Executive Reports',
    subtitle: 'One-click PDF, DOCX, and PPTX deliverables',
    body: 'Assemble your live KPI scorecard, converged source list, and executive narrative into a saved report snapshot ready for board meetings and quarterly reviews.',
    bullets: [
      'Export formatted PDF, Word (DOCX), or PowerPoint (PPTX) in one click',
      'Pair with Idea Studio for M1/M2 validation and staging workflows',
      'Zero manual copy-pasting between spreadsheets and decks',
    ],
    actionLabel: 'Open Report Studio',
    actionPath: '/reports',
    icon: <FileText className="w-7 h-7 text-indigo-700" />,
  },
  {
    id: 'portal',
    title: '4. Publish to the Client Portal',
    subtitle: 'Expiring magic links with built-in approval history',
    body: 'Publish any Executive Report directly into an interactive Client Deliverable Portal. External stakeholders preview online, download the full ZIP bundle, and submit approvals or change requests.',
    bullets: [
      'No client account setup required — secure expiring JWT magic links',
      'Full review audit trail synced back to your Portal Console',
      'Re-open this guided tour anytime from the header or /tour',
    ],
    actionLabel: 'Open Client Portal Console',
    actionPath: '/portal-manager',
    icon: <Send className="w-7 h-7 text-amber-700" />,
  },
];

interface SaasTourOverlayProps {
  open: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const SaasTourOverlay: React.FC<SaasTourOverlayProps> = ({
  open,
  onClose,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!open && !embedded) return null;

  const step = NEXUS_TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === NEXUS_TOUR_STEPS.length - 1;

  const dismiss = (persistDismiss: boolean) => {
    if (persistDismiss || dontShowAgain) {
      try {
        window.localStorage.setItem(TOUR_DISMISSED_KEY, 'true');
      } catch {
        // ignore storage errors
      }
    }
    onClose();
  };

  const handleStepAction = () => {
    if (!embedded) {
      dismiss(dontShowAgain);
    }
    navigate(step.actionPath);
  };

  const content = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-full max-w-2xl">
      <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-semibold">
            Guided tour · Step {stepIndex + 1} of {NEXUS_TOUR_STEPS.length}
          </span>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={() => dismiss(dontShowAgain)}
            aria-label="Close guided tour"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Step progress strip */}
      <div className="flex gap-1.5 px-6 pt-5">
        {NEXUS_TOUR_STEPS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIndex(idx)}
            aria-label={`Go to step ${idx + 1}: ${s.title}`}
            className={`h-2 flex-1 rounded-full transition-colors ${
              idx <= stepIndex ? 'bg-blue-700' : 'bg-slate-200 hover:bg-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-100 shrink-0">{step.icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{step.title}</h2>
            <p className="text-base text-slate-600 mt-0.5">{step.subtitle}</p>
          </div>
        </div>

        <p className="text-lg text-slate-700 leading-relaxed">{step.body}</p>

        <ul className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
          {step.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-base text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
          {!embedded ? (
            <label className="inline-flex items-center gap-2 text-base text-slate-700 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-slate-400 text-blue-700"
              />
              <span>Don&apos;t show again</span>
            </label>
          ) : (
            <span className="text-sm text-slate-500">
              Select any step bar above to jump directly to a topic.
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handleStepAction}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-base font-semibold"
            >
              {step.actionLabel}
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={() => dismiss(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-semibold"
              >
                Finish Tour
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(NEXUS_TOUR_STEPS.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="flex justify-center py-4">{content}</div>;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nexus Guided Tour"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      {content}
    </div>
  );
};

export default SaasTourOverlay;
