/**
 * Nexus - corporate data convergence hub
 * Routes businesses to Request Audit, Corporate Services, Idea Studio, or Workspace;
 * solo founder agent services live at agent-ify.com
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Rocket, Database, BarChart3, Lightbulb, ArrowRight } from 'lucide-react';
import MarketingNavbar from '../components/navigation/MarketingNavbar';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
      <MarketingNavbar />

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_24px]" />
          <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute top-1/3 right-1/6 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 flex flex-col items-center">
          <div
            className={`text-center transition-all duration-500 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-wide text-white mb-4">
              nex<span className="text-blue-300">us</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-light italic">
              When Data Converges, Insight Emerges.
            </p>
            <p className="text-lg text-blue-100/90 max-w-3xl mx-auto mt-6 leading-relaxed">
              Nexus streamlines data workflows for established businesses — centralize scattered
              sources, automate executive reporting, and target the KPIs that drive growth.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/request-audit"
                className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-base font-semibold shadow-lg transition-colors"
              >
                Request Data Convergence Audit
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-base font-medium transition-colors"
              >
                Explore Corporate Services
              </Link>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mt-14 transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="group flex flex-col items-center text-center p-7 rounded-2xl bg-white/10 border border-white/20 hover:bg-blue-500/20 hover:border-blue-300/60 transition-colors"
            >
              <Lightbulb className="h-11 w-11 text-blue-300 mb-4" />
              <span className="font-semibold text-xl text-white mb-2">Idea Studio</span>
              <span className="text-blue-100/90 text-base mb-5 leading-relaxed">
                Validate product briefs, run M1/M2 reports, and stage apps on *.nexus-solutions.us.
              </span>
              <span className="mt-auto inline-flex items-center text-blue-200 font-semibold text-base min-h-[44px]">
                Learn More
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/request-audit')}
              className="group flex flex-col items-center text-center p-7 rounded-2xl bg-white/10 border border-white/20 hover:bg-amber-500/20 hover:border-amber-300/60 transition-colors"
            >
              <Rocket className="h-11 w-11 text-amber-300 mb-4" />
              <span className="font-semibold text-xl text-white mb-2">Strategic Planning</span>
              <span className="text-blue-100/90 text-base mb-5 leading-relaxed">
                Build structured plans and export executive DOCX, PPTX, and PDF deliverables.
              </span>
              <span className="mt-auto inline-flex items-center text-amber-200 font-semibold text-base min-h-[44px]">
                Request Audit
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="group flex flex-col items-center text-center p-7 rounded-2xl bg-white/10 border border-white/20 hover:bg-indigo-500/20 hover:border-indigo-300/60 transition-colors"
            >
              <Database className="h-11 w-11 text-indigo-300 mb-4" />
              <span className="font-semibold text-xl text-white mb-2">Analysis Engine</span>
              <span className="text-blue-100/90 text-base mb-5 leading-relaxed">
                Define operational KPIs, connect sources, and prepare recurring client reviews.
              </span>
              <span className="mt-auto inline-flex items-center text-indigo-200 font-semibold text-base min-h-[44px]">
                Sign In to Workspace
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>
          </div>

          <div className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/15 rounded-xl p-6 text-center">
              <Database className="w-8 h-8 text-blue-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1.5 text-white">Data Integration</h2>
              <p className="text-base text-blue-100/85">
                Bring CRM, finance, ops, and marketing feeds into one reporting workflow.
              </p>
            </div>
            <div className="bg-white/5 border border-white/15 rounded-xl p-6 text-center">
              <BarChart3 className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1.5 text-white">KPI Alignment</h2>
              <p className="text-base text-blue-100/85">
                Define clear metrics, track targets, and align leadership around measurable outcomes.
              </p>
            </div>
            <div className="bg-white/5 border border-white/15 rounded-xl p-6 text-center">
              <Rocket className="w-8 h-8 text-amber-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1.5 text-white">Client-Ready Delivery</h2>
              <p className="text-base text-blue-100/85">
                Package executive decks and share secure magic-link review portals with stakeholders.
              </p>
            </div>
          </div>

          <footer className="mt-12 text-base text-blue-200/90 text-center">
            For entrepreneurs and solo founders, visit{' '}
            <a
              href="https://agent-ify.com"
              className="text-indigo-200 hover:text-white underline font-medium"
            >
              agent-ify.com
            </a>{' '}
            for productized AI agent services.
            <span className="mx-2">·</span>
            <Link to="/services" className="text-blue-200 hover:text-white underline font-medium">
              Corporate services
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default SplashPage;
