import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';

/**
 * Nexus Launch - Idea intake entry point.
 * Will become the full staged intake (idea, customer/problem, product, geography, budget, goals).
 * For now routes to business plan wizard.
 */
const LaunchIntakePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
          <Target size={20} />
          <span>Idea Intake</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Capture your business idea</h1>
        <p className="text-gray-600 mt-2">
          Tell us about your venture. We&apos;ll use this to guide market research, feasibility analysis,
          and business plan generation.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <p className="text-gray-600 mb-6">
          The full idea intake will collect: founder and business idea, customer/problem hypothesis,
          product/service definition, geography and market scope, budget/funding constraints,
          and launch goals and timeline.
        </p>
        <Link
          to="/create-business-plan"
          className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
        >
          Continue to Business Plan
          <ArrowRight size={18} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default LaunchIntakePage;
