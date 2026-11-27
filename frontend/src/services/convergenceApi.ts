const apiBase = ((import.meta as unknown as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '');

export interface ColumnProfile {
  name: string;
  type: 'number' | 'text';
  nonEmptyCount: number;
  stats?: {
    sum: number;
    avg: number;
    min: number;
    max: number;
    count: number;
  };
}

export interface DataSourceRecord {
  id: string;
  name: string;
  sourceType: string;
  category: string;
  status: string;
  filename: string;
  rowCount: number;
  columns: ColumnProfile[];
  sampleRows: Record<string, string>[];
  config: Record<string, unknown>;
  lastSyncedAt?: string | null;
  createdAt?: string | null;
}

export interface KpiTemplate {
  key: string;
  name: string;
  category: string;
  unit: string;
  direction: 'higher_is_better' | 'lower_is_better';
  defaultTarget: number;
  description: string;
}

export interface KpiRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  direction: 'higher_is_better' | 'lower_is_better';
  targetValue: number;
  actualValue: number;
  formattedActual: string;
  formattedTarget: string;
  attainmentPct: number;
  status: 'on_track' | 'at_risk' | 'off_track' | 'tracking';
  sourceId?: string | null;
  sourceName?: string | null;
  sourceColumn?: string | null;
  aggregation: string;
  updatedAt?: string | null;
}

export interface ExecutiveReportRecord {
  id: string;
  title: string;
  companyName: string;
  periodLabel: string;
  executiveSummary: string;
  kpiCount: number;
  sourceCount: number;
  kpis: KpiRecord[];
  sources: { id: string; name: string; rowCount: number }[];
  portalDeliverableId?: string | null;
  portalMagicLinkUrl?: string | null;
  createdAt?: string | null;
}

export interface ConvergenceOverview {
  sourceCount: number;
  totalRowsIngested: number;
  kpiCount: number;
  kpisOnTrack: number;
  kpisAtRisk: number;
  kpisOffTrack: number;
  reportCount: number;
  publishedPortalCount: number;
  kpis: KpiRecord[];
}

export interface PortalDeliverableSummary {
  id: string;
  opportunityId: string;
  title: string;
  description: string;
  kind: string;
  clientEmail: string;
  status: string;
  latestAction?: string | null;
  latestMessage: string;
  actionCount: number;
  actions: { id: number; action: string; message: string; createdAt?: string | null }[];
  linkCount: number;
  usesRemaining: number;
  expiresAt?: string | null;
  createdAt?: string | null;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail) && data.detail[0]?.msg
          ? data.detail[0].msg
          : `Request failed (HTTP ${res.status})`;
    throw new Error(detail);
  }
  return data as T;
}

export const PORTAL_KEY_STORAGE = 'nexus_operator_portal_key';

export function getSavedPortalKey(): string {
  try {
    return window.sessionStorage.getItem(PORTAL_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function savePortalKey(key: string): void {
  try {
    if (key.trim()) {
      window.sessionStorage.setItem(PORTAL_KEY_STORAGE, key.trim());
    } else {
      window.sessionStorage.removeItem(PORTAL_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

export const convergenceApi = {
  async getOverview(): Promise<ConvergenceOverview> {
    const res = await fetch(`${apiBase}/api/v1/convergence/overview`);
    return parseJsonOrThrow<ConvergenceOverview>(res);
  },

  async listSources(): Promise<DataSourceRecord[]> {
    const res = await fetch(`${apiBase}/api/v1/convergence/sources`);
    const data = await parseJsonOrThrow<{ sources: DataSourceRecord[] }>(res);
    return data.sources || [];
  },

  async uploadCsv(file: File, name: string, category: string): Promise<DataSourceRecord> {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('category', category);
    const res = await fetch(`${apiBase}/api/v1/convergence/sources/upload-csv`, {
      method: 'POST',
      body: form,
    });
    const data = await parseJsonOrThrow<{ source: DataSourceRecord }>(res);
    return data.source;
  },

  async registerConnector(payload: {
    name: string;
    sourceType: string;
    category: string;
    notes: string;
  }): Promise<DataSourceRecord> {
    const res = await fetch(`${apiBase}/api/v1/convergence/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ source: DataSourceRecord }>(res);
    return data.source;
  },

  async deleteSource(sourceId: string): Promise<void> {
    const res = await fetch(`${apiBase}/api/v1/convergence/sources/${encodeURIComponent(sourceId)}`, {
      method: 'DELETE',
    });
    await parseJsonOrThrow<{ ok: boolean }>(res);
  },

  async listKpiTemplates(): Promise<KpiTemplate[]> {
    const res = await fetch(`${apiBase}/api/v1/convergence/kpi-templates`);
    const data = await parseJsonOrThrow<{ templates: KpiTemplate[] }>(res);
    return data.templates || [];
  },

  async listKpis(): Promise<KpiRecord[]> {
    const res = await fetch(`${apiBase}/api/v1/convergence/kpis`);
    const data = await parseJsonOrThrow<{ kpis: KpiRecord[] }>(res);
    return data.kpis || [];
  },

  async createKpi(payload: {
    name: string;
    category: string;
    description?: string;
    unit: string;
    direction: 'higher_is_better' | 'lower_is_better';
    targetValue: number;
    actualValue?: number;
    sourceId?: string | null;
    sourceColumn?: string | null;
    aggregation?: string;
  }): Promise<KpiRecord> {
    const res = await fetch(`${apiBase}/api/v1/convergence/kpis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ kpi: KpiRecord }>(res);
    return data.kpi;
  },

  async updateKpi(
    kpiId: string,
    payload: Partial<{
      name: string;
      targetValue: number;
      actualValue: number;
      sourceId: string | null;
      sourceColumn: string | null;
      aggregation: string;
    }>
  ): Promise<KpiRecord> {
    const res = await fetch(`${apiBase}/api/v1/convergence/kpis/${encodeURIComponent(kpiId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ kpi: KpiRecord }>(res);
    return data.kpi;
  },

  async deleteKpi(kpiId: string): Promise<void> {
    const res = await fetch(`${apiBase}/api/v1/convergence/kpis/${encodeURIComponent(kpiId)}`, {
      method: 'DELETE',
    });
    await parseJsonOrThrow<{ ok: boolean }>(res);
  },

  async listReports(): Promise<ExecutiveReportRecord[]> {
    const res = await fetch(`${apiBase}/api/v1/convergence/reports`);
    const data = await parseJsonOrThrow<{ reports: ExecutiveReportRecord[] }>(res);
    return data.reports || [];
  },

  async createReport(payload: {
    title: string;
    companyName: string;
    periodLabel: string;
    executiveSummary: string;
    kpiIds: string[];
    sourceIds: string[];
  }): Promise<ExecutiveReportRecord> {
    const res = await fetch(`${apiBase}/api/v1/convergence/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonOrThrow<{ report: ExecutiveReportRecord }>(res);
    return data.report;
  },

  reportExportUrl(reportId: string, format: 'pdf' | 'docx' | 'pptx'): string {
    return `${apiBase}/api/v1/convergence/reports/${encodeURIComponent(reportId)}/export?format=${format}`;
  },

  async publishReportToPortal(
    reportId: string,
    portalApiKey: string,
    payload: { clientEmail: string; expiresInDays: number; sendEmail: boolean }
  ): Promise<{ deliverableId: string; portalUrl: string; expiresAt: string; report: ExecutiveReportRecord }> {
    const res = await fetch(
      `${apiBase}/api/v1/convergence/reports/${encodeURIComponent(reportId)}/publish-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Api-Key': portalApiKey,
        },
        body: JSON.stringify(payload),
      }
    );
    return parseJsonOrThrow(res);
  },

  async deleteReport(reportId: string): Promise<void> {
    const res = await fetch(`${apiBase}/api/v1/convergence/reports/${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
    });
    await parseJsonOrThrow<{ ok: boolean }>(res);
  },

  async listPortalDeliverables(portalApiKey: string): Promise<PortalDeliverableSummary[]> {
    const res = await fetch(`${apiBase}/api/portal/deliverables`, {
      headers: { 'X-Portal-Api-Key': portalApiKey },
    });
    const data = await parseJsonOrThrow<{ deliverables: PortalDeliverableSummary[] }>(res);
    return data.deliverables || [];
  },

  async reissuePortalLink(
    deliverableId: string,
    portalApiKey: string,
    sendEmail = false
  ): Promise<{ magicLinkUrl: string; expiresAt: string }> {
    const res = await fetch(
      `${apiBase}/api/portal/deliverables/${encodeURIComponent(deliverableId)}/links`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Api-Key': portalApiKey,
        },
        body: JSON.stringify({ sendEmail }),
      }
    );
    return parseJsonOrThrow(res);
  },

  async revokePortalDeliverable(deliverableId: string, portalApiKey: string): Promise<void> {
    const res = await fetch(
      `${apiBase}/api/portal/deliverables/${encodeURIComponent(deliverableId)}`,
      {
        method: 'DELETE',
        headers: { 'X-Portal-Api-Key': portalApiKey },
      }
    );
    await parseJsonOrThrow<{ ok: boolean }>(res);
  },
};
