import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, FileText, TrendingUp, Target, ArrowRight } from 'lucide-react';

/**
 * Nexus Launch - Dashboard for founders building a new venture.
 * Shows progress toward idea validation and business plan generation.
 */
const LaunchDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
          <Rocket size={20} />
          <span>Nexus Launch</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Launch Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Your path from idea to investor-ready business plan. Track research, feasibility, and plan progress.
        </p>
      </div>

      {/* Journey stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/launch/intake"
          className="flex flex-col p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600 w-fit mb-4">
            <Target size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Idea Intake</h3>
          <p className="text-sm text-gray-500 mb-4">Capture your business idea and customer hypothesis</p>
          <span className="flex items-center text-blue-600 text-sm font-medium mt-auto">
            Get started <ArrowRight size={14} className="ml-1" />
          </span>
        </Link>

        <div className="flex flex-col p-6 bg-white rounded-lg shadow border border-gray-100 opacity-75">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-500 w-fit mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Market Research</h3>
          <p className="text-sm text-gray-500 mb-4">Automated market size, competitors, and trends</p>
          <span className="text-gray-400 text-sm">Coming soon</span>
        </div>

        <div className="flex flex-col p-6 bg-white rounded-lg shadow border border-gray-100 opacity-75">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-500 w-fit mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Feasibility</h3>
          <p className="text-sm text-gray-500 mb-4">Scoring and validation of your concept</p>
          <span className="text-gray-400 text-sm">Coming soon</span>
        </div>

        <Link
          to="/create-business-plan"
          className="flex flex-col p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="p-3 rounded-lg bg-amber-100 text-amber-600 w-fit mb-4">
            <FileText size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Business Plan</h3>
          <p className="text-sm text-gray-500 mb-4">Create and export your business plan</p>
          <span className="flex items-center text-amber-600 text-sm font-medium mt-auto">
            Create plan <ArrowRight size={14} className="ml-1" />
          </span>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/create-business-plan"
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Create Business Plan
          </Link>
          <Link
            to="/docs"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            View Documents
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LaunchDashboard;
