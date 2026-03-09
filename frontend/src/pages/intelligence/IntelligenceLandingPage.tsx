/**
 * Nexus Intelligence - dedicated marketing landing for existing businesses
 * Unify siloed data, define KPIs, and derive intelligence from operational systems.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Database, BarChart3, Zap, TrendingUp } from 'lucide-react';
import NavBar from '../../components/navigation/NavBar';

const IntelligenceLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup?path=intelligence');
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative z-10 container mx-auto px-6 pb-16 pt-28">
          <div className={`max-w-4xl mx-auto transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-indigo-500/20">
                <Database className="h-8 w-8 text-indigo-400" />
              </div>
              <span className="text-indigo-400 font-semibold tracking-wide">Nexus Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Where data converges, insight emerges
            </h1>
            <p className="text-xl text-blue-100/90 mb-12 max-w-2xl leading-relaxed">
              Unify siloed data from CRMs, ERPs, spreadsheets, and accounting systems. Define KPIs, monitor dashboards,
              and derive intelligence from your operational systems.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg font-medium text-white shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 group"
            >
              Get started
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className={`mt-20 max-w-5xl mx-auto transition-all duration-700 delay-200 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-2xl font-bold mb-8 text-center">Your intelligence journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <Database className="h-8 w-8 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect sources</h3>
                <p className="text-blue-200/80 text-sm">Integrate CRMs, ERPs, spreadsheets, accounting, and analytics in one place.</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <BarChart3 className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Map data</h3>
                <p className="text-blue-200/80 text-sm">Map disparate sources to a canonical business data model.</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <TrendingUp className="h-8 w-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Define KPIs</h3>
                <p className="text-blue-200/80 text-sm">Set benchmarks and track performance metrics that matter.</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 md:col-span-2 lg:col-span-1">
                <Zap className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Insights & alerts</h3>
                <p className="text-blue-200/80 text-sm">Get anomaly detection, opportunities, and actionable recommendations.</p>
              </div>
            </div>
          </div>

          <div className={`mt-20 bg-blue-900/40 border border-blue-700/50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto transition-all duration-700 delay-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Break down information silos</h3>
            <p className="text-blue-100/90 leading-relaxed mb-4">
              Liberate your trapped data. Integrate disparate systems to unlock hidden trends, optimize resource allocation,
              and gain the holistic performance view needed to dominate your market.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-4 text-indigo-400 font-medium hover:text-indigo-300 flex items-center gap-2"
            >
              Connect your systems
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-12 text-center text-blue-300/80 text-sm">
            <button onClick={() => navigate('/')} className="hover:text-blue-200 underline">Back to Nexus</button>
          </p>
        </div>
      </div>
    </>
  );
};

export default IntelligenceLandingPage;
