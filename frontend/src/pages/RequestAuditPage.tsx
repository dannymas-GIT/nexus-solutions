import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Database, ShieldCheck, BarChart3 } from 'lucide-react';
import MarketingNavbar from '../components/navigation/MarketingNavbar';

const apiBase = ((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '');

const SOURCE_OPTIONS = [
  'CRM (Salesforce / HubSpot)',
  'Accounting (QuickBooks / Xero)',
  'Spreadsheets (Excel / Google Sheets)',
  'ERP & Operations',
  'Marketing & Web Analytics',
  'SQL / Data Warehouse',
];

const RequestAuditPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [website, setWebsite] = useState('');
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [painPoint, setPainPoint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string; message: string } | null>(null);

  const toggleSource = (source: string) => {
    setDataSources((prev) =>
      prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          role,
          website,
          dataSources,
          painPoint,
          sourcePage: '/request-audit',
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail =
          typeof body.detail === 'string'
            ? body.detail
            : Array.isArray(body.detail) && body.detail[0]?.msg
              ? body.detail[0].msg
              : `Unable to submit request (HTTP ${response.status})`;
        throw new Error(detail);
      }
      setConfirmation({
        id: body.id || 'submitted',
        message:
          body.message ||
          'Your Data Convergence Audit request has been received. We will follow up within one business day.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
      <MarketingNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          <div className="lg:col-span-2 space-y-6">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium">
              Corporate Discovery
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Request a Data Convergence Audit
            </h1>
            <p className="text-lg text-blue-100/90 leading-relaxed">
              Share where your operational data lives today. We map your reporting bottlenecks,
              define high-leverage KPIs, and outline an automated reporting blueprint.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <Database className="w-6 h-6 text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-white">Source Inventory & Gap Map</h2>
                  <p className="text-sm text-blue-200/80">
                    Identify siloed spreadsheets, CRM, finance, and ops feeds that should converge.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-6 h-6 text-indigo-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-white">KPI & Executive Report Spec</h2>
                  <p className="text-sm text-blue-200/80">
                    Define leadership metrics and client/board-ready DOCX, PPTX, and PDF outputs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-white">Direct Human Follow-Up</h2>
                  <p className="text-sm text-blue-200/80">
                    Reviewed directly by our engineering and delivery leads within one business day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white text-slate-900 rounded-2xl shadow-xl p-6 sm:p-8">
            {confirmation ? (
              <div className="py-6 space-y-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Audit Request Received</h2>
                <p className="text-lg text-slate-700 leading-relaxed">{confirmation.message}</p>
                <p className="text-sm text-slate-500">Reference ID: {confirmation.id}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-slate-900 text-white text-base font-medium hover:bg-slate-800"
                  >
                    Explore Corporate Services
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg border border-slate-300 text-slate-800 text-base font-medium hover:bg-slate-100"
                  >
                    Return to Overview
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-2xl font-bold text-slate-900">Tell us about your team</h2>

                {error && (
                  <div
                    role="alert"
                    className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-base"
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lead-name" className="block text-base font-medium text-slate-800 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="lead-name"
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jordan Taylor"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-email" className="block text-base font-medium text-slate-800 mb-1.5">
                      Work Email *
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@company.com"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lead-company" className="block text-base font-medium text-slate-800 mb-1.5">
                      Company *
                    </label>
                    <input
                      id="lead-company"
                      type="text"
                      required
                      minLength={2}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Operations Inc."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-role" className="block text-base font-medium text-slate-800 mb-1.5">
                      Your Role
                    </label>
                    <input
                      id="lead-role"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="COO, VP Operations, Principal"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lead-website" className="block text-base font-medium text-slate-800 mb-1.5">
                    Company Website (optional)
                  </label>
                  <input
                    id="lead-website"
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <fieldset>
                  <legend className="block text-base font-medium text-slate-800 mb-2">
                    Where does your data live today?
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SOURCE_OPTIONS.map((source) => {
                      const checked = dataSources.includes(source);
                      return (
                        <label
                          key={source}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 min-h-[44px] rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                            checked
                              ? 'bg-blue-50 border-blue-600 text-blue-900'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSource(source)}
                            className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-600"
                          />
                          <span>{source}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="lead-pain" className="block text-base font-medium text-slate-800 mb-1.5">
                    Biggest reporting or KPI challenge
                  </label>
                  <textarea
                    id="lead-pain"
                    rows={4}
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    placeholder="e.g., Leadership spends two days every month reconciling CRM pipeline and QuickBooks financials into board decks."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting Request...' : 'Request Data Convergence Audit'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAuditPage;
