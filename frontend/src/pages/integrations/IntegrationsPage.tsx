import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Table2,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { convergenceApi, type DataSourceRecord } from '@/services/convergenceApi';

const STARTER_CONNECTORS = [
  {
    type: 'google_sheets',
    name: 'Google Sheets',
    category: 'Operations',
    description: 'Export operational trackers as CSV and upload snapshots directly into Nexus KPIs.',
  },
  {
    type: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'Financial',
    description: 'Converge P&L, accounts receivable (DSO), and revenue CSV exports.',
  },
  {
    type: 'hubspot',
    name: 'HubSpot CRM',
    category: 'CRM',
    description: 'Track deal pipeline, win rates, and closed-won revenue from CRM exports.',
  },
  {
    type: 'stripe',
    name: 'Stripe Billing',
    category: 'Financial',
    description: 'Ingest recurring subscription, MRR, and retention summaries.',
  },
];

const IntegrationsPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [datasetCategory, setDatasetCategory] = useState('Financial');
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const list = await convergenceApi.listSources();
      setSources(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data sources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Choose a CSV file first.');
      return;
    }
    setUploading(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await convergenceApi.uploadCsv(
        selectedFile,
        datasetName.trim() || selectedFile.name.replace(/\.csv$/i, ''),
        datasetCategory
      );
      setStatusMessage(
        `Ingested "${created.name}" (${created.rowCount} rows, ${created.columns.length} columns profiled). You can now bind KPIs to its numeric columns.`
      );
      setSelectedFile(null);
      setDatasetName('');
      setExpandedId(created.id);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterStarter = async (connector: (typeof STARTER_CONNECTORS)[number]) => {
    setError(null);
    setStatusMessage(null);
    try {
      await convergenceApi.registerConnector({
        name: connector.name,
        sourceType: connector.type,
        category: connector.category,
        notes: connector.description,
      });
      setStatusMessage(`Registered ${connector.name} in your workspace source inventory.`);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register connector.');
    }
  };

  const handleDelete = async (source: DataSourceRecord) => {
    setError(null);
    try {
      await convergenceApi.deleteSource(source.id);
      setStatusMessage(`Removed "${source.name}".`);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove source.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Sources &amp; CSV Ingestion</h1>
          <p className="text-lg text-slate-600 mt-1">
            Upload operational or financial CSV datasets to profile numeric columns and feed live
            corporate KPIs.
          </p>
        </div>
        <Link
          to="/analysis-engine/set-kpis"
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
        >
          Map Columns to KPIs
          <ArrowRight className="w-4 h-4" />
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

      {statusMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* CSV Upload Form */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload CSV Dataset</h2>
            <p className="text-base text-slate-600">
              Supports standard CSV exports from QuickBooks, HubSpot, Salesforce, Excel, or Google
              Sheets (up to 5 MB). Currency symbols ($) and percentages (%) are parsed automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-5">
          <div className="md:col-span-4">
            <label htmlFor="csv-file" className="block text-base font-medium text-slate-800 mb-1.5">
              CSV File *
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                if (f && !datasetName) {
                  setDatasetName(f.name.replace(/\.csv$/i, ''));
                }
              }}
              className="block w-full min-h-[44px] text-base text-slate-800 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:font-medium hover:file:bg-slate-800 border border-slate-300 rounded-lg p-1.5"
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="csv-name" className="block text-base font-medium text-slate-800 mb-1.5">
              Dataset Name
            </label>
            <input
              id="csv-name"
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Q4 Finance & MRR Export"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="csv-category"
              className="block text-base font-medium text-slate-800 mb-1.5"
            >
              Domain
            </label>
            <select
              id="csv-category"
              value={datasetCategory}
              onChange={(e) => setDatasetCategory(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
            >
              <option value="Financial">Financial</option>
              <option value="CRM">CRM</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold disabled:opacity-50"
            >
              {uploading ? 'Ingesting...' : 'Ingest CSV'}
            </button>
          </div>
        </form>
      </section>

      {/* Persisted Sources */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Workspace Data Sources ({sources.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-base text-slate-600">
            Loading persisted data sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
            <Database className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-xl font-semibold text-slate-900">No datasets ingested yet</h3>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Upload a CSV above to automatically profile columns and power your KPI scorecard and
              executive reports.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((src) => {
              const expanded = expandedId === src.id;
              const numericCols = src.columns.filter((c) => c.type === 'number');
              return (
                <div
                  key={src.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{src.name}</h3>
                        <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-900">
                          {src.status === 'synced' ? 'Synced' : 'Configured'}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                          {src.category} · {src.sourceType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-base text-slate-600">
                        {src.rowCount > 0
                          ? `${src.rowCount.toLocaleString()} rows · ${src.columns.length} columns (${numericCols.length} numeric)`
                          : 'Connector registered — upload a CSV export to populate metrics.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {src.sampleRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : src.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-base font-medium"
                        >
                          <Table2 className="w-4 h-4" />
                          {expanded ? 'Hide Preview' : 'Inspect Columns'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(src)}
                        aria-label={`Remove ${src.name}`}
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {src.columns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {src.columns.map((col) => (
                        <span
                          key={col.name}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-medium ${
                            col.type === 'number'
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{col.name}</span>
                          {col.stats && (
                            <span className="text-blue-700 font-normal">
                              (sum: {col.stats.sum.toLocaleString()}, avg:{' '}
                              {col.stats.avg.toLocaleString()})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {expanded && src.sampleRows.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            {src.columns.map((col) => (
                              <th
                                key={col.name}
                                className="px-4 py-2.5 text-left font-semibold text-slate-900"
                              >
                                {col.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {src.sampleRows.slice(0, 8).map((row, idx) => (
                            <tr key={idx}>
                              {src.columns.map((col) => (
                                <td key={col.name} className="px-4 py-2 text-slate-700">
                                  {row[col.name] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Starter Connector Inventory */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Starter System Connectors</h2>
          <p className="text-base text-slate-600 mt-1">
            Register the business systems your team exports from so your convergence inventory stays
            documented in executive reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STARTER_CONNECTORS.map((conn) => (
            <div
              key={conn.type}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{conn.name}</h3>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium">
                    {conn.category}
                  </span>
                </div>
                <p className="text-base text-slate-600 mt-2">{conn.description}</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRegisterStarter(conn)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add to Source Inventory
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default IntegrationsPage;
