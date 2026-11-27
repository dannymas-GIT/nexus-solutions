import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Database, BarChart3, FileText, Send, ArrowRight } from 'lucide-react';

const GUIDES = [
  {
    title: '1. Ingesting CSV Data Sources',
    duration: '3 min walkthrough',
    description:
      'Upload QuickBooks, HubSpot, Salesforce, or spreadsheet CSV exports and inspect automatically profiled numeric columns.',
    path: '/integrations',
    cta: 'Open Data Sources',
    icon: Database,
  },
  {
    title: '2. Binding Live Corporate KPIs',
    duration: '4 min walkthrough',
    description:
      'Start from executive KPI templates (MRR, Gross Margin, DSO, Utilization) and link actuals directly to uploaded CSV columns.',
    path: '/analysis-engine/set-kpis',
    cta: 'Open KPI Engine',
    icon: BarChart3,
  },
  {
    title: '3. Building & Exporting Executive Reports',
    duration: '4 min walkthrough',
    description:
      'Combine live KPIs and narrative commentary into board-ready PDF, DOCX, and PPTX packs without manual copy-paste.',
    path: '/reports',
    cta: 'Open Report Studio',
    icon: FileText,
  },
  {
    title: '4. Sharing via Client Deliverable Portal',
    duration: '3 min walkthrough',
    description:
      'Publish executive packs to expiring magic-link review pages and track client approvals and change requests.',
    path: '/portal-manager',
    cta: 'Open Portal Console',
    icon: Send,
  },
];

const TutorialsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium">
            <Compass className="w-4 h-4" />
            Onboarding &amp; Playbooks
          </span>
          <h1 className="text-3xl font-bold">Guides &amp; Guided Tour</h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Follow the interactive 5-step Nexus walkthrough or jump directly into any stage of the
            data convergence workflow.
          </p>
        </div>

        <Link
          to="/tour"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-base font-semibold shrink-0"
        >
          <Compass className="w-5 h-5" />
          Watch Guided Tour
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GUIDES.map((guide) => (
          <div
            key={guide.title}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800">
                  <guide.icon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium">
                  {guide.duration}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{guide.title}</h2>
              <p className="text-base text-slate-600 leading-relaxed">{guide.description}</p>
            </div>
            <div>
              <Link
                to={guide.path}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-semibold"
              >
                {guide.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default TutorialsPage;
