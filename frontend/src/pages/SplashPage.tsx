/**
 * Nexus - corporate data convergence hub
 * Routes businesses to Launch or Intelligence; agent services live at agent-ify.com
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket, Database, BarChart3 } from 'lucide-react';
import Navbar from '../components/navigation/Navbar';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/6 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 pb-12 pt-32 flex flex-col items-center min-h-screen">
          <div className={`text-center transition-all duration-1000 delay-300 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-7xl md:text-8xl font-bold tracking-wide text-white mb-4">
              nex<span className="text-blue-300">us</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100/90 max-w-2xl mx-auto font-light italic">
              When Data Converges, Insight Emerges.
            </p>
            <p className="text-base md:text-lg text-blue-200/80 max-w-3xl mx-auto mt-6 leading-relaxed">
              Nexus streamlines data workflows for existing businesses — centralize scattered sources,
              automate reporting, and target the KPIs that drive growth.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex flex-col items-center p-8 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-amber-500/20 hover:border-amber-400/40 transition-all duration-300"
            >
              <Rocket className="h-12 w-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg mb-2">Business Planning</span>
              <span className="text-blue-200/80 text-sm mb-4 text-center">Structured plans, templates, and team collaboration</span>
              <span className="flex items-center text-amber-400 font-medium">
                Get started
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>
            <button
              onClick={() => navigate('/analysis-engine/set-kpis')}
              className="group flex flex-col items-center p-8 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300"
            >
              <Database className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg mb-2">Analysis Engine</span>
              <span className="text-blue-200/80 text-sm mb-4 text-center">Unify data sources, set KPIs, and surface insight</span>
              <span className="flex items-center text-indigo-400 font-medium">
                Set KPIs
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>
          </div>

          <div className={`max-w-4xl mx-auto mt-12 grid md:grid-cols-3 gap-6 transition-all duration-700 delay-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <Database className="w-8 h-8 text-blue-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Data Integration</h3>
              <p className="text-sm text-blue-200/70">Connect CRM, finance, ops, and marketing into one command center.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <BarChart3 className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">KPI Dashboards</h3>
              <p className="text-sm text-blue-200/70">Define metrics, track performance, and align teams on outcomes.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <Rocket className="w-8 h-8 text-amber-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Reporting Automation</h3>
              <p className="text-sm text-blue-200/70">Replace manual spreadsheets with scheduled, audit-ready reports.</p>
            </div>
          </div>

          <p className={`mt-10 text-sm text-blue-300/70 text-center transition-all duration-700 delay-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            For entrepreneurs and solo founders, see{' '}
            <a href="https://agent-ify.com" className="text-indigo-300 hover:text-indigo-200 underline">agent-ify.com</a>
            {' '}for productized AI agent services.
            <span className="mx-2">·</span>
            <button type="button" onClick={() => navigate('/services')} className="text-blue-300/80 hover:text-blue-200 underline">Corporate services</button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SplashPage;
