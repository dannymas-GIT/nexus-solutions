/**
 * Nexus Launch - dedicated marketing landing for founders
 * Turn ideas into research-backed, investor-ready business plans.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket, FileText, TrendingUp, Target, Globe } from 'lucide-react';
import NavBar from '../../components/navigation/NavBar';

const LaunchLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup?path=launch');
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen relative bg-gradient-to-br from-amber-950 via-indigo-900 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute top-1/4 right-1/6 w-96 h-96 bg-amber-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/3 left-1/6 w-96 h-96 bg-indigo-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative z-10 container mx-auto px-6 pb-16 pt-28">
          <div className={`max-w-4xl mx-auto transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Rocket className="h-8 w-8 text-amber-400" />
              </div>
              <span className="text-amber-400 font-semibold tracking-wide">Nexus Launch</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Turn your idea into an investor-ready business plan
            </h1>
            <p className="text-xl text-blue-100/90 mb-12 max-w-2xl leading-relaxed">
              We handle market research, feasibility analysis, and create your business plan—so you can focus on building.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-medium text-white shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2 group"
            >
              Get started
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className={`mt-20 max-w-5xl mx-auto transition-all duration-700 delay-200 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-2xl font-bold mb-8 text-center">Your founder journey</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <Target className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Idea intake</h3>
                <p className="text-blue-200/80 text-sm">Capture your idea, customer hypothesis, market scope, and launch goals.</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <TrendingUp className="h-8 w-8 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Market research</h3>
                <p className="text-blue-200/80 text-sm">Get market size, competitor landscape, and feasibility scoring.</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <FileText className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Business plan</h3>
                <p className="text-blue-200/80 text-sm">Receive an executive summary, financial model, and roadmap.</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 md:col-span-2 lg:col-span-1">
                <Globe className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Website presence</h3>
                <p className="text-blue-200/80 text-sm">Get structure and marketing copy suggestions for your online presence.</p>
              </div>
            </div>
          </div>

          <div className={`mt-20 bg-indigo-900/40 border border-indigo-700/50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto transition-all duration-700 delay-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="text-xl font-semibold text-amber-300 mb-4">For founders</h3>
            <p className="text-blue-100/90 leading-relaxed mb-4">
              Start smart. Connect sales, marketing, customer feedback, and financials from day one. Avoid data chaos,
              accelerate growth, and make the data-driven moves that impress investors and build momentum.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-4 text-amber-400 font-medium hover:text-amber-300 flex items-center gap-2"
            >
              Start your venture
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

export default LaunchLandingPage;
