import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const apiBase = (import.meta as any).env?.VITE_API_BASE || '';

type Deliverable = {
  id: string;
  title: string;
  description: string;
  kind: string;
  entrypoint: string;
  opportunityId: string;
};

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [usesRemaining, setUsesRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing token');
      setLoading(false);
      return;
    }
    const u = `${apiBase}/api/portal/session?token=${encodeURIComponent(token)}`;
    fetch(u)
      .then((r) => {
        if (!r.ok) throw new Error(`Session failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setDeliverable(data.deliverable);
        setUsesRemaining(data.usesRemaining ?? 0);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e.message || e));
        setLoading(false);
      });
  }, [token]);

  const submit = (action: string) => {
    if (!token) return;
    setDone(null);
    fetch(`${apiBase}/api/portal/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, message }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Action failed (${r.status})`);
        return r.json();
      })
      .then(() => {
        setDone(`Recorded: ${action}. Your developer will be notified shortly.`);
        if (action !== 'view') setUsesRemaining((u) => Math.max(0, u - 1));
      })
      .catch((e) => setError(String(e.message || e)));
  };

  if (loading) return <div className="p-8 text-center text-slate-600">Loading review…</div>;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  if (!deliverable)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p>Nothing to show.</p>
      </div>
    );

  const staticUrl = `${apiBase}/api/portal/static/${deliverable.id}/${deliverable.entrypoint}?token=${encodeURIComponent(token || '')}`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">{deliverable.title || 'Deliverable review'}</h1>
        {deliverable.description ? (
          <p className="text-slate-600 mb-6 whitespace-pre-wrap">{deliverable.description}</p>
        ) : null}

        {deliverable.kind === 'static' && (
          <div className="mb-6 border rounded-lg overflow-hidden bg-slate-100" style={{ minHeight: 360 }}>
            <iframe title="preview" src={staticUrl} className="w-full min-h-[360px] border-0" />
          </div>
        )}
        {deliverable.kind !== 'static' && (
          <p className="text-sm text-slate-500 mb-6">
            Kind: {deliverable.kind} — open files via the link your developer sent, or download from the bundle.
          </p>
        )}

        <p className="text-xs text-slate-400 mb-4">Actions remaining: {usesRemaining}</p>

        <textarea
          className="w-full border border-slate-300 rounded-lg p-3 text-sm mb-4"
          rows={4}
          placeholder="Optional message (e.g. change requests)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            onClick={() => submit('approve')}
          >
            Approve
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
            onClick={() => submit('request_changes')}
          >
            Request changes
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
            onClick={() => submit('reject')}
          >
            Reject
          </button>
        </div>

        {done && <p className="mt-6 text-emerald-700 text-sm">{done}</p>}
      </div>
    </div>
  );
}
