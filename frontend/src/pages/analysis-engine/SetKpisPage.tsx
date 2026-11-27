import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Save,
} from 'lucide-react';
import {
  convergenceApi,
  type DataSourceRecord,
  type KpiRecord,
  type KpiTemplate,
} from '@/services/convergenceApi';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  on_track: { label: 'On Track', className: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  at_risk: { label: 'At Risk', className: 'bg-amber-100 text-amber-950 border-amber-300' },
  off_track: { label: 'Off Track', className: 'bg-red-100 text-red-900 border-red-300' },
  tracking: { label: 'Tracking', className: 'bg-slate-100 text-slate-800 border-slate-300' },
};

const SetKpisPage: React.FC = () => {
  const [kpis, setKpis] = useState<KpiRecord[]>([]);
  const [templates, setTemplates] = useState<KpiTemplate[]>([]);
  const [sources, setSources] = useState<DataSourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Custom KPI Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Revenue');
  const [unit, setUnit] = useState('USD');
  const [direction, setDirection] = useState<'higher_is_better' | 'lower_is_better'>(
    'higher_is_better'
  );
  const [targetValue, setTargetValue] = useState('100000');
  const [actualValue, setActualValue] = useState('0');
  const [description, setDescription] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [sourceColumn, setSourceColumn] = useState('');
  const [aggregation, setAggregation] = useState('manual');
  const [saving, setSaving] = useState(false);

  // Inline actual/target edits
  const [draftValues, setDraftValues] = useState<Record<string, { actual: string; target: string }>>(
    {}
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiList, tplList, srcList] = await Promise.all([
        convergenceApi.listKpis(),
        convergenceApi.listKpiTemplates(),
        convergenceApi.listSources(),
      ]);
      setKpis(kpiList);
      setTemplates(tplList);
      setSources(srcList.filter((s) => s.columns.length > 0));
      const drafts: Record<string, { actual: string; target: string }> = {};
      for (const k of kpiList) {
        drafts[k.id] = { actual: String(k.actualValue), target: String(k.targetValue) };
      }
      setDraftValues(drafts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load KPIs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedSource = sources.find((s) => s.id === sourceId) || null;

  const handleAddTemplate = async (tpl: KpiTemplate) => {
    setError(null);
    setNotice(null);
    try {
      await convergenceApi.createKpi({
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        unit: tpl.unit,
        direction: tpl.direction,
        targetValue: tpl.defaultTarget,
        actualValue: 0,
        aggregation: 'manual',
      });
      setNotice(`Added "${tpl.name}" to your tracked KPIs.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add KPI template.');
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const bound = Boolean(sourceId && sourceColumn && aggregation !== 'manual');
      await convergenceApi.createKpi({
        name: name.trim(),
        category,
        description: description.trim(),
        unit,
        direction,
        targetValue: Number(targetValue || 0),
        actualValue: bound ? 0 : Number(actualValue || 0),
        sourceId: bound ? sourceId : null,
        sourceColumn: bound ? sourceColumn : null,
        aggregation: bound ? aggregation : 'manual',
      });
      setNotice(`Created KPI "${name.trim()}".`);
      setName('');
      setDescription('');
      setSourceId('');
      setSourceColumn('');
      setAggregation('manual');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create KPI.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInline = async (kpi: KpiRecord) => {
    const draft = draftValues[kpi.id];
    if (!draft) return;
    setError(null);
    setNotice(null);
    try {
      await convergenceApi.updateKpi(kpi.id, {
        actualValue: kpi.aggregation === 'manual' ? Number(draft.actual) : undefined,
        targetValue: Number(draft.target),
      });
      setNotice(`Updated "${kpi.name}".`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update KPI.');
    }
  };

  const handleDelete = async (kpi: KpiRecord) => {
    setError(null);
    try {
      await convergenceApi.deleteKpi(kpi.id);
      setNotice(`Removed "${kpi.name}".`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete KPI.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Corporate KPI Engine</h1>
          <p className="text-lg text-slate-600 mt-1">
            Track executive metrics manually or bind them directly to uploaded CSV columns for
            automatic calculation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/integrations"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-base font-medium"
          >
            <Database className="w-4 h-4" />
            Data Sources
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
          >
            Build Executive Report
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
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

      {/* Tracked KPIs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Tracked KPIs ({kpis.length})</h2>
        {loading ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-base text-slate-600">
            Loading KPIs...
          </div>
        ) : kpis.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
            <Target className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-xl font-semibold text-slate-900">No KPIs tracked yet</h3>
            <p className="text-base text-slate-600">
              Add a corporate KPI template below or create a custom metric bound to an uploaded CSV.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {kpis.map((kpi) => {
              const badge = STATUS_STYLES[kpi.status] || STATUS_STYLES.tracking;
              const barPct = Math.max(0, Math.min(100, kpi.attainmentPct));
              const draft = draftValues[kpi.id] || {
                actual: String(kpi.actualValue),
                target: String(kpi.targetValue),
              };
              const isBound = Boolean(kpi.sourceId && kpi.aggregation !== 'manual');
              return (
                <div
                  key={kpi.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{kpi.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {kpi.category}
                        {isBound && kpi.sourceName
                          ? ` · Live from ${kpi.sourceName} (${kpi.aggregation}(${kpi.sourceColumn}))`
                          : ' · Manual entry'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(kpi)}
                      aria-label={`Delete ${kpi.name}`}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-3xl font-bold text-slate-900">
                        {kpi.formattedActual}
                      </span>
                      <span className="text-base text-slate-600 ml-2">
                        vs {kpi.formattedTarget} target
                      </span>
                    </div>
                    <span className="text-base font-semibold text-slate-800">
                      {kpi.attainmentPct}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        kpi.status === 'on_track'
                          ? 'bg-emerald-600'
                          : kpi.status === 'at_risk'
                            ? 'bg-amber-500'
                            : 'bg-red-600'
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Actual ({kpi.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={isBound}
                        value={draft.actual}
                        onChange={(e) =>
                          setDraftValues((prev) => ({
                            ...prev,
                            [kpi.id]: { ...draft, actual: e.target.value },
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Target ({kpi.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={draft.target}
                        onChange={(e) =>
                          setDraftValues((prev) => ({
                            ...prev,
                            [kpi.id]: { ...draft, target: e.target.value },
                          }))
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveInline(kpi)}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-base font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Custom KPI Builder */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create Custom or CSV-Bound KPI</h2>
          <p className="text-base text-slate-600 mt-1">
            Bind a metric to an uploaded dataset column to auto-recalculate whenever fresh data is
            uploaded.
          </p>
        </div>

        <form onSubmit={handleCreateCustom} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="kpi-name" className="block text-base font-medium text-slate-800 mb-1">
                KPI Name *
              </label>
              <input
                id="kpi-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Enterprise Pipeline Value"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="kpi-cat" className="block text-base font-medium text-slate-800 mb-1">
                Category
              </label>
              <select
                id="kpi-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
              >
                <option value="Revenue">Revenue</option>
                <option value="Margin">Margin</option>
                <option value="Cash & Finance">Cash &amp; Finance</option>
                <option value="Pipeline">Pipeline</option>
                <option value="Operations">Operations</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="kpi-unit" className="block text-base font-medium text-slate-800 mb-1">
                  Unit
                </label>
                <select
                  id="kpi-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="%">%</option>
                  <option value="Days">Days</option>
                  <option value="Count">Count</option>
                  <option value="Ratio">Ratio</option>
                </select>
              </div>
              <div>
                <label htmlFor="kpi-dir" className="block text-base font-medium text-slate-800 mb-1">
                  Goal
                </label>
                <select
                  id="kpi-dir"
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as 'higher_is_better' | 'lower_is_better')
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
                >
                  <option value="higher_is_better">Higher is better</option>
                  <option value="lower_is_better">Lower is better</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="kpi-src" className="block text-base font-medium text-slate-800 mb-1">
                Bind to CSV Dataset (optional)
              </label>
              <select
                id="kpi-src"
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  setSourceColumn('');
                  setAggregation(e.target.value ? 'sum' : 'manual');
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
              >
                <option value="">Manual entry</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            {selectedSource ? (
              <>
                <div>
                  <label htmlFor="kpi-col" className="block text-base font-medium text-slate-800 mb-1">
                    Column
                  </label>
                  <select
                    id="kpi-col"
                    value={sourceColumn}
                    onChange={(e) => setSourceColumn(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
                  >
                    <option value="">Choose column...</option>
                    {selectedSource.columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="kpi-agg" className="block text-base font-medium text-slate-800 mb-1">
                    Aggregation
                  </label>
                  <select
                    id="kpi-agg"
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-base text-slate-900 bg-white"
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                    <option value="count">Row Count</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label htmlFor="kpi-actual" className="block text-base font-medium text-slate-800 mb-1">
                  Current Actual Value
                </label>
                <input
                  id="kpi-actual"
                  type="number"
                  step="any"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>
            )}

            <div>
              <label htmlFor="kpi-target" className="block text-base font-medium text-slate-800 mb-1">
                Target Value *
              </label>
              <input
                id="kpi-target"
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {saving ? 'Saving KPI...' : 'Create KPI'}
            </button>
          </div>
        </form>
      </section>

      {/* Corporate KPI Templates */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Corporate Operational KPI Templates</h2>
          <p className="text-base text-slate-600 mt-1">
            Add proven executive metrics in one click, then adjust targets or link them to uploaded
            CSV exports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.key}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium mb-2">
                  {tpl.category} · {tpl.unit}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                <p className="text-base text-slate-600 mt-1.5">{tpl.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAddTemplate(tpl)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-base font-semibold"
              >
                <Plus className="w-4 h-4" />
                Track This KPI
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SetKpisPage;
