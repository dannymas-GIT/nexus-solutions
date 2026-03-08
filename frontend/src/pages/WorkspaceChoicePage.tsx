import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Database, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Workspace choice page - shown after user selects their path from the splash.
 * Routes users into Nexus Launch or Nexus Intelligence.
 */
const WorkspaceChoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { setWorkspace } = useWorkspace();

  const handleLaunch = () => {
    setWorkspace('launch');
    navigate('/launch');
  };

  const handleIntelligence = () => {
    setWorkspace('intelligence');
    navigate('/intelligence');
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="relative z-10 container mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Choose your path
        </h1>
        <p className="text-xl text-blue-200/90 mb-16 text-center max-w-2xl">
          Nexus offers two ways to transform your business. Select the one that fits you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Nexus Launch */}
          <button
            onClick={handleLaunch}
            className="group flex flex-col items-start p-8 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-left"
          >
            <div className="p-4 rounded-xl bg-amber-500/20 mb-6 group-hover:bg-amber-500/30 transition-colors">
              <Rocket className="h-12 w-12 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nexus Launch</h2>
            <p className="text-blue-200/90 mb-6 flex-1">
              Turn your idea into an investor-ready business plan. We handle market research,
              feasibility analysis, and create your business plan for you.
            </p>
            <span className="flex items-center text-amber-400 font-medium group-hover:translate-x-1 transition-transform">
              Start a new venture
              <ChevronRight className="ml-1 h-5 w-5" />
            </span>
          </button>

          {/* Nexus Intelligence */}
          <button
            onClick={handleIntelligence}
            className="group flex flex-col items-start p-8 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 text-left"
          >
            <div className="p-4 rounded-xl bg-indigo-500/20 mb-6 group-hover:bg-indigo-500/30 transition-colors">
              <Database className="h-12 w-12 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nexus Intelligence</h2>
            <p className="text-blue-200/90 mb-6 flex-1">
              Unify siloed data from your existing systems. Map sources, define KPIs,
              and build intelligence from your operational data.
            </p>
            <span className="flex items-center text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
              Optimize an existing business
              <ChevronRight className="ml-1 h-5 w-5" />
            </span>
          </button>
        </div>

        <p className="mt-12 text-blue-300/80 text-sm">
          You can switch workspaces anytime from the navigation.
        </p>
      </div>
    </div>
  );
};

export default WorkspaceChoicePage;
