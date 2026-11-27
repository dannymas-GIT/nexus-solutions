import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  RefreshCw,
  Link2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  FileCheck2,
} from 'lucide-react';
import {
  convergenceApi,
  getSavedPortalKey,
  savePortalKey,
  type PortalDeliverableSummary,
} from '@/services/convergenceApi';

const DECISION_BADGE: Record<string, { label: string; className: string }> = {
  approve: { label: 'Approved', className: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  request_changes: {
    label: 'Changes Requested',
    className: 'bg-amber-100 text-amber-950 border-amber-300',
  },
  reject: { label: 'Rejected', className: 'bg-red-100 text-red-900 border-red-300' },
};

const PortalManagerPage: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => getSavedPortalKey());
  const [deliverables, setDeliverables] = useState<PortalDeliverableSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mintedUrls, setMintedUrls] = useState<Record<string, string>>({});

  const loadDeliverables = useCallback(async (keyToUse: string) => {
    const trimmed = keyToUse.trim();
    if (!trimmed) {
      setDeliverables([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      savePortalKey(trimmed);
      const items = await convergenceApi.listPortalDeliverables(trimmed);
      setDeliverables(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load portal deliverables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey.trim()) {
      loadDeliverables(apiKey);
    }
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    loadDeliverables(apiKey);
  };

  const handleReissue = async (d: PortalDeliverableSummary) => {
    setError(null);
    setNotice(null);
    try {
      const res = await convergenceApi.reissuePortalLink(d.id, apiKey.trim(), false);
      setMintedUrls((prev) => ({ ...prev, [d.id]: res.magicLinkUrl }));
      try {
        await navigator.clipboard.writeText(res.magicLinkUrl);
        setNotice(`Minted and copied a fresh magic link for "${d.title}".`);
      } catch {
        setNotice(`Minted a fresh magic link for "${d.title}".`);
      }
      await loadDeliverables(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mint magic link.');
    }
  };

  const handleRevoke = async (d: PortalDeliverableSummary) => {
    setError(null);
    setNotice(null);
    try {
      await convergenceApi.revokePortalDeliverable(d.id, apiKey.trim());
      setNotice(`Revoked deliverable "${d.title}" and purged its links.`);
      await loadDeliverables(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke deliverable.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Client Portal Console</h1>
          <p className="text-lg text-slate-600 mt-1">
            Monitor published client deliverables, review client approvals and feedback, reissue
            magic links, or revoke expired packages.
          </p>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
        >
          Publish From Report Studio
        </Link>
      </div>

      {/* Operator Key Bar */}
      <form
        onSubmit={handleConnect}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="portal-op-key" className="block text-base font-medium text-slate-800 mb-1">
            Operator Portal API Key
          </label>
          <div className="relative">
            <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="portal-op-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter PORTAL_API_KEY to manage live client deliverables"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !apiKey.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Load Deliverables
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-base flex items-center gap-2.5"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {!apiKey.trim() ? (
        <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900">Enter Operator Key to Inspect Portal</h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Client deliverable management is protected server-side. Enter your session{' '}
            <code>PORTAL_API_KEY</code> above to view active magic links and client sign-offs.
          </p>
        </div>
      ) : deliverables.length === 0 && !loading ? (
        <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">No active portal deliverables</h2>
          <p className="text-base text-slate-600">
            Publish an executive report from Report Studio or via Mission Control Proofs to see it
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliverables.map((d) => {
            const decision = d.latestAction ? DECISION_BADGE[d.latestAction] : null;
            const freshUrl = mintedUrls[d.id];
            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {d.title || 'Untitled Deliverable'}
                      </h2>
                      <span
                        className={`px-3 py-0.5 rounded-full border text-sm font-semibold ${
                          decision
                            ? decision.className
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        {decision ? decision.label : 'Awaiting Client Review'}
                      </span>
                    </div>
                    <p className="text-base text-slate-600">
                      Recipient: <strong>{d.clientEmail}</strong> · {d.linkCount} link(s) ·{' '}
                      {d.usesRemaining} review actions left
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleReissue(d)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                    >
                      <Link2 className="w-4 h-4" />
                      Mint New Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevoke(d)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-900 text-base font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Revoke
                    </button>
                  </div>
                </div>

                {freshUrl && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-mono text-emerald-950 break-all">{freshUrl}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(freshUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-lg bg-emerald-700 text-white text-sm font-semibold"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                )}

                {d.actions.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                      Client Activity ({d.actions.length})
                    </h3>
                    <ul className="space-y-2">
                      {d.actions.map((act) => (
                        <li
                          key={act.id}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-base text-slate-800"
                        >
                          <strong className="capitalize">{act.action.replace('_', ' ')}</strong>
                          {act.message ? `: ${act.message}` : ' (no note)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalManagerPage;
