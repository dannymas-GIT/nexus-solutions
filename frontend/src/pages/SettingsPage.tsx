import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Shield, User, Send, Compass, CheckCircle2, Save } from 'lucide-react';
import { TOUR_DISMISSED_KEY } from '../components/SaasTourOverlay';

const PREFS_KEY = 'nexus_workspace_prefs';

interface WorkspacePrefs {
  defaultCurrency: string;
  defaultReportPeriod: string;
  compactTables: boolean;
}

function loadPrefs(): WorkspacePrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        defaultCurrency: parsed.defaultCurrency || 'USD',
        defaultReportPeriod: parsed.defaultReportPeriod || 'Quarterly',
        compactTables: Boolean(parsed.compactTables),
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    defaultCurrency: 'USD',
    defaultReportPeriod: 'Quarterly',
    compactTables: false,
  };
}

const SettingsPage: React.FC = () => {
  const [prefs, setPrefs] = useState<WorkspacePrefs>(() => loadPrefs());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setSavedNotice('Workspace preferences saved.');
    } catch {
      setSavedNotice('Preferences updated for this session.');
    }
  };

  const handleResetTour = () => {
    try {
      window.localStorage.removeItem(TOUR_DISMISSED_KEY);
    } catch {
      // ignore
    }
    setSavedNotice('Guided tour prompt re-enabled for your next visit.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-lg text-slate-600 mt-1">
          Configure reporting defaults and jump to administration or personal account controls.
        </p>
      </div>

      {savedNotice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-700" />
          <h2 className="text-2xl font-bold text-slate-900">Reporting &amp; Display Defaults</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-5 max-w-xl">
          <div>
            <label htmlFor="pref-currency" className="block text-base font-medium text-slate-800 mb-1">
              Default KPI Currency
            </label>
            <select
              id="pref-currency"
              value={prefs.defaultCurrency}
              onChange={(e) => setPrefs((p) => ({ ...p, defaultCurrency: e.target.value }))}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-base text-slate-900"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-period" className="block text-base font-medium text-slate-800 mb-1">
              Default Executive Report Cadence
            </label>
            <select
              id="pref-period"
              value={prefs.defaultReportPeriod}
              onChange={(e) => setPrefs((p) => ({ ...p, defaultReportPeriod: e.target.value }))}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-base text-slate-900"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
            >
              <Save className="w-5 h-5" />
              Save Preferences
            </button>
            <button
              type="button"
              onClick={handleResetTour}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
            >
              <Compass className="w-5 h-5" />
              Reset Guided Tour Prompt
            </button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-400 transition-colors space-y-2"
        >
          <Shield className="w-7 h-7 text-blue-700" />
          <h3 className="text-xl font-bold text-slate-900">Users &amp; Access</h3>
          <p className="text-base text-slate-600">
            Add users, manage protected role tiers, and inspect the admin audit log.
          </p>
        </Link>

        <Link
          to="/profile#password"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-400 transition-colors space-y-2"
        >
          <User className="w-7 h-7 text-emerald-700" />
          <h3 className="text-xl font-bold text-slate-900">Profile &amp; Password</h3>
          <p className="text-base text-slate-600">
            Update your personal display details or change your account password.
          </p>
        </Link>

        <Link
          to="/portal-manager"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-400 transition-colors space-y-2"
        >
          <Send className="w-7 h-7 text-indigo-700" />
          <h3 className="text-xl font-bold text-slate-900">Client Portal Console</h3>
          <p className="text-base text-slate-600">
            Review active client deliverables, reissue magic links, and revoke access.
          </p>
        </Link>
      </section>
    </div>
  );
};

export default SettingsPage;
