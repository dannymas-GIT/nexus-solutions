import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Link2, BarChart3, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Nexus Intelligence - Dashboard for existing businesses.
 * Shows connection status, data freshness, and KPI health.
 */
const IntelligenceDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-indigo-600 font-medium mb-2">
          <Database size={20} />
          <span>Nexus Intelligence</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Unify your data silos. Connect sources, define KPIs, and build intelligence from your operations.
        </p>
      </div>

      {/* Journey stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/integrations"
          className="flex flex-col p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600 w-fit mb-4">
            <Link2 size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Connect Sources</h3>
          <p className="text-sm text-gray-500 mb-4">CRM, ERP, spreadsheets, accounting, analytics</p>
          <span className="flex items-center text-indigo-600 text-sm font-medium mt-auto">
            Connect <ArrowRight size={14} className="ml-1" />
          </span>
        </Link>

        <div className="flex flex-col p-6 bg-white rounded-lg shadow border border-gray-100 opacity-75">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-500 w-fit mb-4">
            <Database size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Map Data</h3>
          <p className="text-sm text-gray-500 mb-4">Canonical model and source mapping</p>
          <span className="text-gray-400 text-sm">Coming soon</span>
        </div>

        <Link
          to="/analysis-engine/set-kpis"
          className="flex flex-col p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 w-fit mb-4">
            <BarChart3 size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Define KPIs</h3>
          <p className="text-sm text-gray-500 mb-4">Key performance indicators and benchmarks</p>
          <span className="flex items-center text-emerald-600 text-sm font-medium mt-auto">
            Set KPIs <ArrowRight size={14} className="ml-1" />
          </span>
        </Link>

        <div className="flex flex-col p-6 bg-white rounded-lg shadow border border-gray-100 opacity-75">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-500 w-fit mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Insights & Alerts</h3>
          <p className="text-sm text-gray-500 mb-4">Anomalies, trends, and recommendations</p>
          <span className="text-gray-400 text-sm">Coming soon</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/integrations"
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
          >
            Connect Data Sources
          </Link>
          <Link
            to="/analysis-engine/set-kpis"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Set KPIs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
