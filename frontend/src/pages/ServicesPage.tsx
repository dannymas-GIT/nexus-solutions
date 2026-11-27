import React from 'react';
import { Link } from 'react-router-dom';
import { Database, BarChart3, FileText, Link2, CheckCircle, ArrowRight } from 'lucide-react';
import MarketingNavbar from '../components/navigation/MarketingNavbar';

const OFFERINGS = [
  {
    icon: Link2,
    title: 'Data Integration',
    description:
      'Connect CRM, finance, marketing, and operations systems into a unified Nexus workflow.',
  },
  {
    icon: BarChart3,
    title: 'KPI Targeting',
    description:
      'Define the metrics that matter, align leadership teams, and track measurable outcomes.',
  },
  {
    icon: FileText,
    title: 'Reporting Automation',
    description:
      'Replace manual spreadsheet cycles with repeatable DOCX, PPTX, and PDF leadership packs.',
  },
  {
    icon: Database,
    title: 'Client Review Portals',
    description:
      'Deliver interactive packages via expiring magic links with built-in approval tracking.',
  },
];

const ServicesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
      <MarketingNavbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium mb-4">
          For Established Businesses & Consulting Teams
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Nexus Corporate Services</h1>
        <p className="text-xl text-blue-100/90 max-w-3xl mb-12 leading-relaxed">
          When data converges, insight emerges. Nexus helps established businesses streamline
          reporting workflows, centralize operational data, and target the KPIs that drive growth.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {OFFERINGS.map((item) => (
            <div key={item.title} className="bg-white/5 border border-white/15 rounded-xl p-6">
              <item.icon className="w-10 h-10 text-blue-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-white">{item.title}</h2>
              <p className="text-blue-100/85 text-base leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-950/60 border border-blue-700/70 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-5 text-white">Built for operators</h2>
          <ul className="space-y-3.5 text-lg text-blue-100">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <span>Analysis Engine for structured KPI definition and review workflows.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <span>Document & deck generation for executive-ready DOCX, PPTX, and PDF outputs.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Idea Studio for M1/M2 validation, gated graduation, sprints, and *.nexus-solutions.us
                staging.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Secure magic-link client portal with bundle download and approval audit trail.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Link
            to="/request-audit"
            className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-base font-semibold transition-colors"
          >
            Request Data Convergence Audit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/idea-studio"
            className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-xl text-base font-medium transition-colors"
          >
            Launch Idea Studio
          </Link>
          <p className="text-blue-200 text-base">
            Solo founders & authors: productized agent packages live at{' '}
            <a
              href="https://agent-ify.com/packages"
              className="text-indigo-200 hover:text-white underline font-medium"
            >
              agent-ify.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
