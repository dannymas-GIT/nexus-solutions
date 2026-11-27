import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  convergenceApi,
  getSavedPortalKey,
  savePortalKey,
  type ExecutiveReportRecord,
  type KpiRecord,
} from '@/services/convergenceApi';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ExecutiveReportRecord[]>([]);
  const [kpis, setKpis] = useState<KpiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Publish to Portal modal state
  const publishDialogRef = useRef<HTMLDialogElement | null>(null);
  const [publishTarget, setPublishTarget] = useState<ExecutiveReportRecord | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('14');
  const [portalApiKey, setPortalApiKey] = useState(() => getSavedPortalKey());
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [repList, kpiList] = await Promise.all([
        convergenceApi.listReports(),
        convergenceApi.listKpis(),
      ]);
      setReports(repList);
      setKpis(kpiList);
      setSelectedKpiIds((prev) => (prev.length ? prev : kpiList.map((k) => k.id)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleExport = async (rep: ExecutiveReportRecord, format: 'pdf' | 'docx' | 'pptx') => {
    setError(null);
    try {
      await convergenceApi.downloadReport(rep.id, format, rep.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}.`);
    }
  };

  const toggleKpi = (id: string) => {
    setSelectedKpiIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const created = await convergenceApi.createReport({
        title: title.trim(),
        companyName: companyName.trim(),
        periodLabel: periodLabel.trim(),
        executiveSummary: executiveSummary.trim(),
        kpiIds: selectedKpiIds,
        sourceIds: [],
      });
      setNotice(`Saved executive report "${created.title}". Ready for PDF, DOCX, PPTX, or Portal publish.`);
      setTitle('');
      setExecutiveSummary('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report.');
    } finally {
      setCreating(false);
    }
  };

  const openPublishDialog = (report: ExecutiveReportRecord) => {
    setPublishTarget(report);
    setPublishedUrl(null);
    setError(null);
    publishDialogRef.current?.showModal();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTarget) return;
    setPublishing(true);
    setError(null);
    try {
      savePortalKey(portalApiKey);
      const result = await convergenceApi.publishReportToPortal(
        publishTarget.id,
        portalApiKey.trim(),
        {
          clientEmail: clientEmail.trim(),
          expiresInDays: Number(expiresInDays || 14),
          sendEmail: false,
        }
      );
      setPublishedUrl(result.portalUrl);
      setNotice(`Published "${publishTarget.title}" to the Client Deliverable Portal.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Copied magic review link to clipboard.');
    } catch {
      setNotice(`Review link: ${url}`);
    }
  };

  const handleDelete = async (report: ExecutiveReportRecord) => {
    try {
      await convergenceApi.deleteReport(report.id);
      setNotice(`Deleted "${report.title}".`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Executive Report Studio</h1>
          <p className="text-lg text-slate-600 mt-1">
            Package live KPIs and converged data sources into board-ready PDF, DOCX, and PPTX
            deliverables, or publish directly to the Client Portal.
          </p>
        </div>
        <Link
          to="/portal-manager"
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
        >
          Client Portal Console
        </Link>
      </div>

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

      {/* New Executive Report Form */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">Build New Executive Report</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="rep-title" className="block text-base font-medium text-slate-800 mb-1">
                Report Title *
              </label>
              <input
                id="rep-title"
                type="text"
                required
                minLength={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q4 Executive Convergence Review"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="rep-company" className="block text-base font-medium text-slate-800 mb-1">
                Company / Client Name
              </label>
              <input
                id="rep-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Operations Inc."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="rep-period" className="block text-base font-medium text-slate-800 mb-1">
                Reporting Period
              </label>
              <input
                id="rep-period"
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Q4 2026"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rep-summary" className="block text-base font-medium text-slate-800 mb-1">
              Executive Summary &amp; Recommendations
            </label>
            <textarea
              id="rep-summary"
              rows={4}
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Summarize headline performance, operational risks, and recommended actions for leadership..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900"
            />
          </div>

          {kpis.length > 0 && (
            <fieldset>
              <legend className="block text-base font-medium text-slate-800 mb-2">
                Included KPIs ({selectedKpiIds.length} selected)
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {kpis.map((k) => {
                  const checked = selectedKpiIds.includes(k.id);
                  return (
                    <label
                      key={k.id}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 min-h-[44px] rounded-lg border cursor-pointer text-sm font-medium ${
                        checked
                          ? 'bg-blue-50 border-blue-600 text-blue-950'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleKpi(k.id)}
                        className="h-4 w-4 rounded border-slate-400 text-blue-700"
                      />
                      <span className="truncate">
                        {k.name} ({k.formattedActual})
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {creating ? 'Saving Report...' : 'Save Executive Report'}
            </button>
          </div>
        </form>
      </section>

      {/* Saved Reports List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Saved Reports ({reports.length})</h2>
        {loading ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-base text-slate-600">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-xl font-semibold text-slate-900">No executive reports yet</h3>
            <p className="text-base text-slate-600">
              Create your first report above to export formatted PDF, DOCX, and PPTX packs or share
              via Client Portal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{rep.title}</h3>
                      {rep.portalDeliverableId && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-sm font-semibold">
                          Published to Portal
                        </span>
                      )}
                    </div>
                    <p className="text-base text-slate-600">
                      {[rep.companyName, rep.periodLabel].filter(Boolean).join(' · ') ||
                        'Workspace Report'}{' '}
                      — {rep.kpiCount} KPIs · {rep.sourceCount} data sources
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(rep)}
                    aria-label={`Delete ${rep.title}`}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {rep.executiveSummary && (
                  <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {rep.executiveSummary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleExport(rep, 'pdf')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(rep, 'docx')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(rep, 'pptx')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export PPTX
                  </button>
                  <button
                    type="button"
                    onClick={() => openPublishDialog(rep)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-base font-semibold"
                  >
                    <Send className="w-4 h-4" />
                    Publish to Client Portal
                  </button>

                  {rep.portalMagicLinkUrl && (
                    <button
                      type="button"
                      onClick={() => handleCopy(rep.portalMagicLinkUrl || '')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-base font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Magic Link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Native <dialog> for Publishing to Client Portal */}
      <dialog
        ref={publishDialogRef}
        className="rounded-2xl p-0 max-w-lg w-[calc(100%-2rem)] shadow-2xl border border-slate-200 backdrop:bg-slate-900/60"
      >
        <div className="p-6 sm:p-7 bg-white text-slate-900 space-y-4">
          <h3 className="text-2xl font-bold">Publish to Client Portal</h3>
          <p className="text-base text-slate-600">
            Creates an interactive HTML scorecard + CSV + PDF bundle for{' '}
            <strong>{publishTarget?.title}</strong> and mints an expiring magic review link.
          </p>

          {publishedUrl ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <p className="text-base font-semibold">Magic review link ready</p>
                <p className="text-sm break-all font-mono">{publishedUrl}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(publishedUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
                >
                  Open Portal
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => publishDialogRef.current?.close()}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-900 text-white text-base font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label htmlFor="pub-email" className="block text-base font-medium text-slate-800 mb-1">
                  Client / Reviewer Email *
                </label>
                <input
                  id="pub-email"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="executive@client.com"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="pub-days" className="block text-base font-medium text-slate-800 mb-1">
                  Link Expiration (days)
                </label>
                <input
                  id="pub-days"
                  type="number"
                  min={1}
                  max={90}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="pub-key" className="block text-base font-medium text-slate-800 mb-1">
                  Operator Portal API Key *
                </label>
                <input
                  id="pub-key"
                  type="password"
                  required
                  value={portalApiKey}
                  onChange={(e) => setPortalApiKey(e.target.value)}
                  placeholder="Matches server PORTAL_API_KEY"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Kept only in your browser session to authorize deliverable publishing.
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => publishDialogRef.current?.close()}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2.5 min-h-[44px] rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-base font-semibold disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish & Mint Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
};

export default ReportsPage;
