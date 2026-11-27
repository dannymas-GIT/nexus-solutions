import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  AlertTriangle,
  Clock,
  FileCheck2,
  XCircle,
} from 'lucide-react';

const apiBase = ((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '');

type Deliverable = {
  id: string;
  title: string;
  description: string;
  kind: string;
  entrypoint: string;
  opportunityId: string;
  createdAt?: string | null;
};

type PortalActionRecord = {
  id: string;
  action: string;
  message: string;
  createdAt?: string | null;
};

const ACTION_LABELS: Record<string, { label: string; badgeClass: string }> = {
  approve: {
    label: 'Approved',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  request_changes: {
    label: 'Changes Requested',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
  },
  reject: {
    label: 'Rejected',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
  },
  view: {
    label: 'Viewed',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [usesRemaining, setUsesRemaining] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [actions, setActions] = useState<PortalActionRecord[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const rejectDialogRef = useRef<HTMLDialogElement | null>(null);

  const loadSession = async () => {
    if (!token) {
      setError('This review link is missing a valid access token.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${apiBase}/api/portal/session?token=${encodeURIComponent(token)}`
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Review link unavailable (HTTP ${response.status})`);
      }
      const data = await response.json();
      setDeliverable(data.deliverable);
      setUsesRemaining(data.usesRemaining ?? 0);
      setExpiresAt(data.expiresAt ?? null);
      setActions(Array.isArray(data.actions) ? data.actions : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [token]);

  const submitAction = async (action: 'approve' | 'request_changes' | 'reject') => {
    if (!token || submitting) return;
    setSubmitting(true);
    setDone(null);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/portal/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, message }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Action failed (HTTP ${response.status})`);
      }
      const result = await response.json();
      setUsesRemaining(result.usesRemaining ?? Math.max(0, usesRemaining - 1));
      setMessage('');
      setDone(
        `Decision recorded (${ACTION_LABELS[action]?.label || action}). Your Nexus delivery team has been notified.`
      );
      await loadSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectConfirm = () => {
    rejectDialogRef.current?.showModal();
  };

  const confirmReject = async () => {
    rejectDialogRef.current?.close();
    await submitAction('reject');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-lg text-slate-700">Loading your deliverable review…</p>
      </div>
    );
  }

  if (error && !deliverable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Review Link Unavailable</h1>
          <p className="text-base text-slate-700">{error}</p>
          <p className="text-sm text-slate-500">
            Contact your Nexus delivery lead if you need a fresh review link.
          </p>
        </div>
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-lg text-slate-700">No deliverable found for this link.</p>
      </div>
    );
  }

  const encodedToken = encodeURIComponent(token || '');
  const staticUrl = `${apiBase}/api/portal/static/${deliverable.id}/${deliverable.entrypoint}?token=${encodedToken}`;
  const downloadUrl = `${apiBase}/api/portal/download/${deliverable.id}?token=${encodedToken}`;
  const actionsExhausted = usesRemaining <= 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Nexus Solutions" className="h-9 w-9" />
            <div>
              <p className="text-lg font-bold tracking-wide">
                nex<span className="text-blue-300">us</span>{' '}
                <span className="font-normal text-blue-200">Client Deliverable Portal</span>
              </p>
              <p className="text-sm text-slate-300">Secure review and sign-off workspace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
            {expiresAt && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                <Clock className="w-4 h-4 text-blue-300" />
                Link valid until {formatDate(expiresAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-sm font-medium">
                <FileCheck2 className="w-4 h-4" />
                <span>{deliverable.kind === 'static' ? 'Interactive Deliverable' : deliverable.kind}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {deliverable.title || 'Deliverable Review'}
              </h1>
              {deliverable.description && (
                <p className="text-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {deliverable.description}
                </p>
              )}
              {deliverable.createdAt && (
                <p className="text-sm text-slate-500">
                  Published {formatDate(deliverable.createdAt)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {deliverable.kind === 'static' && (
                <a
                  href={staticUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full Preview
                </a>
              )}
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-base font-medium"
              >
                <Download className="w-4 h-4" />
                Download Bundle (.zip)
              </a>
            </div>
          </div>

          {deliverable.kind === 'static' ? (
            /* Allowed iframe exception: isolated preview of client static HTML deliverable bundle; full-tab open & zip download provided above. */
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
              <iframe
                title="Deliverable preview"
                src={staticUrl}
                className="w-full min-h-[440px] border-0 bg-white"
              />
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-700">
              Use <strong>Download Bundle (.zip)</strong> above to inspect the full deliverable
              package locally.
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Submit Review Decision</h2>
            <p className="text-base text-slate-600 mt-1">
              {actionsExhausted
                ? 'This review link has reached its submission limit. Contact your delivery lead if you need to add further notes.'
                : `You can record up to ${usesRemaining} more review response${usesRemaining === 1 ? '' : 's'} with this link.`}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-base"
            >
              {error}
            </div>
          )}

          {done && (
            <div
              role="status"
              className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-base flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <span>{done}</span>
            </div>
          )}

          <div>
            <label htmlFor="portal-notes" className="block text-base font-medium text-slate-800 mb-2">
              Feedback or change requests (optional)
            </label>
            <textarea
              id="portal-notes"
              className="w-full border border-slate-300 rounded-xl p-3.5 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-100"
              rows={4}
              disabled={actionsExhausted || submitting}
              placeholder="Share approval notes, requested edits, or follow-up questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={actionsExhausted || submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-semibold disabled:opacity-50"
              onClick={() => submitAction('approve')}
            >
              <CheckCircle2 className="w-5 h-5" />
              Approve Deliverable
            </button>

            <button
              type="button"
              disabled={actionsExhausted || submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold disabled:opacity-50"
              onClick={() => submitAction('request_changes')}
            >
              Request Changes
            </button>

            <button
              type="button"
              disabled={actionsExhausted || submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 text-base font-semibold disabled:opacity-50"
              onClick={openRejectConfirm}
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>
        </section>

        {actions.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Review History</h2>
            <ul className="space-y-3">
              {actions.map((item) => {
                const style = ACTION_LABELS[item.action] || {
                  label: item.action,
                  badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
                };
                return (
                  <li
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${style.badgeClass}`}
                      >
                        {style.label}
                      </span>
                      {item.createdAt && (
                        <span className="text-sm text-slate-600">{formatDate(item.createdAt)}</span>
                      )}
                    </div>
                    {item.message && (
                      <p className="text-base text-slate-800 whitespace-pre-wrap">{item.message}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      <dialog
        ref={rejectDialogRef}
        className="rounded-2xl p-0 max-w-md w-[calc(100%-2rem)] shadow-2xl border border-slate-200 backdrop:bg-slate-900/60"
      >
        <div className="p-6 space-y-4 bg-white text-slate-900">
          <h3 className="text-xl font-bold">Confirm Deliverable Rejection</h3>
          <p className="text-base text-slate-700 leading-relaxed">
            Are you sure you want to mark this deliverable as rejected? If you only need revisions,
            choose <strong>Request Changes</strong> instead.
          </p>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => rejectDialogRef.current?.close()}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmReject}
              className="px-4 py-2.5 min-h-[44px] rounded-lg bg-red-700 hover:bg-red-800 text-white text-base font-semibold"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
