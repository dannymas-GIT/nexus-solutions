import type { IdeaRecord, MilestoneReport } from '@/types/ideaStudio';

export type NexusDocumentFormat = 'pdf' | 'docx' | 'pptx';

export interface NexusDocumentPayload {
  business_name: string;
  tagline: string;
  business_description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  target_market: string;
  customer_segments: string[];
  market_size: string;
  market_growth: string;
  competitors: string[];
  products: Array<{ name: string; description: string; price: string }>;
  usp: string;
  revenue_streams: string[];
  year1_revenue: string;
  year3_revenue: string;
  breakeven_timeline: string;
  initial_investment: string;
  funding_strategy: string;
  risks: string[];
  milestones: Array<{ description: string; target_date: string }>;
}

export interface BusinessPlanDraftInput {
  businessInfo: {
    name: string;
    industry: string;
    description: string;
    mission?: string;
    vision?: string;
    legalStructure: string;
  };
  marketAnalysis: {
    targetMarket: string;
    marketSize: string;
    competitors?: string;
    trends?: string;
  };
  productsServices: {
    description: string;
    uniqueSellingPoints: string;
    pricing?: string;
    developmentStage?: string;
  };
  financialInfo: {
    startupCosts: string;
    expectedRevenue: string;
    breakEvenPoint?: string;
    fundingNeeds?: string;
  };
}

interface ViteEnv {
  VITE_API_BASE?: string;
}

const env = ((import.meta as unknown as { env?: ViteEnv }).env || {}) as ViteEnv;
const apiBase = (env.VITE_API_BASE || '').trim().replace(/\/+$/, '');

const TEMPLATE_BY_FORMAT: Record<NexusDocumentFormat, string> = {
  pdf: 'business_summary',
  docx: 'business_plan',
  pptx: 'business_plan',
};

function sanitizeFileSlug(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'nexus-plan'
  );
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function extractStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        return asString(obj.name || obj.title || obj.risk || obj.summary);
      }
      return '';
    })
    .filter(Boolean);
}

export function buildDocumentPayloadFromBusinessPlan(
  plan: BusinessPlanDraftInput
): NexusDocumentPayload {
  const name = plan.businessInfo.name.trim() || 'Untitled Business Plan';
  const competitors = (plan.marketAnalysis.competitors || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    business_name: name,
    tagline: plan.businessInfo.industry
      ? `${plan.businessInfo.industry} · ${plan.businessInfo.legalStructure}`
      : 'Powered by Nexus Solutions Idea Studio',
    business_description:
      plan.businessInfo.description.trim() ||
      plan.productsServices.description.trim() ||
      `Business plan for ${name}.`,
    contact_name: 'Nexus Solutions Operator',
    contact_email: 'team@nexus-solutions.us',
    contact_phone: 'N/A',
    target_market: plan.marketAnalysis.targetMarket.trim() || 'General market',
    customer_segments: plan.marketAnalysis.targetMarket.trim()
      ? [plan.marketAnalysis.targetMarket.trim()]
      : ['Primary Target Segment'],
    market_size: plan.marketAnalysis.marketSize.trim() || 'Pending M1 research',
    market_growth: plan.marketAnalysis.trends?.trim() || 'Pending M1 research',
    competitors: competitors.length > 0 ? competitors : ['Pending M1 research'],
    products: [
      {
        name,
        description:
          plan.productsServices.description.trim() ||
          plan.businessInfo.description.trim() ||
          'Core product offering',
        price: plan.productsServices.pricing?.trim() || 'TBD',
      },
    ],
    usp:
      plan.productsServices.uniqueSellingPoints.trim() ||
      'Validated via Nexus Idea Studio',
    revenue_streams: ['Core Subscription / Service Revenue'],
    year1_revenue:
      plan.financialInfo.expectedRevenue.trim() || 'Pending M2 forecast',
    year3_revenue: 'Projected in M2 Feasibility',
    breakeven_timeline:
      plan.financialInfo.breakEvenPoint?.trim() || 'Pending M2 forecast',
    initial_investment:
      plan.financialInfo.startupCosts.trim() || 'Pending M2 estimate',
    funding_strategy:
      plan.financialInfo.fundingNeeds?.trim() || 'Internal / staged milestones',
    risks: ['Market validation via M1/M2 gates'],
    milestones: [
      { description: 'M1 Market Research & Gate 1 Approval', target_date: 'Phase 1' },
      { description: 'M2 Feasibility & Gate 2 Approval', target_date: 'Phase 2' },
      { description: 'Sprint 1–3 MVP & Staging Launch', target_date: 'Phase 3' },
    ],
  };
}

export function buildDocumentPayloadFromIdea(
  idea: IdeaRecord,
  reports: MilestoneReport[] = []
): NexusDocumentPayload {
  const m1 = reports.find((r) => String(r.milestone).toUpperCase() === 'M1');
  const m2 = reports.find((r) => String(r.milestone).toUpperCase() === 'M2');
  const m1Data = (m1?.reportData || {}) as Record<string, unknown>;
  const m2Data = (m2?.reportData || {}) as Record<string, unknown>;
  const unitEcon = (m2Data.unit_economics || {}) as Record<string, unknown>;
  const saturation = (m1Data.market_saturation || {}) as Record<string, unknown>;

  const competitors = extractStringList(m1Data.competitors);
  const risks = extractStringList(m2Data.risk_register || m2Data.risks);
  const summary =
    asString(m1Data.executive_summary) ||
    asString(m2Data.executive_summary) ||
    asString(idea.description) ||
    `Idea Studio brief for ${idea.title}.`;

  const wedge =
    asString(m1Data.whitespace_wedge) ||
    asString(m1Data.recommended_wedge) ||
    'Differentiated workflow validated via Nexus Idea Studio';

  const stagingHost =
    idea.stagingPreviewUrl ||
    (idea.appSlug ? `https://${idea.appSlug}.nexus-solutions.us` : 'nexus-solutions.us');

  return {
    business_name: idea.title,
    tagline: idea.appSlug
      ? `App Profile: ${idea.appSlug} · ${stagingHost}`
      : 'Nexus Solutions — Idea Studio Deliverable',
    business_description: summary.slice(0, 500),
    contact_name: 'Nexus Solutions Idea Studio',
    contact_email: 'team@nexus-solutions.us',
    contact_phone: 'N/A',
    target_market: idea.targetEntities || 'Enterprise & mid-market operators',
    customer_segments: idea.targetEntities
      ? idea.targetEntities.split(/[,;&]+/).map((s) => s.trim()).filter(Boolean)
      : ['Primary Target Operators'],
    market_size:
      asString(m1Data.market_size) ||
      (saturation.score !== undefined
        ? `Saturation score: ${saturation.score}`
        : 'See M1 Market Research report'),
    market_growth:
      asString(m1Data.market_growth) || 'Validated in M1 Market Research',
    competitors:
      competitors.length > 0 ? competitors : ['See M1 competitor matrix'],
    products: [
      {
        name: idea.title,
        description: (idea.description || summary).slice(0, 300),
        price: asString(unitEcon.target_arpu || unitEcon.pricing, 'See M2 Unit Economics'),
      },
    ],
    usp: wedge,
    revenue_streams: ['SaaS Subscription'],
    year1_revenue: asString(
      unitEcon.year1_revenue || unitEcon.projected_arr,
      'See M2 Feasibility & Viability'
    ),
    year3_revenue: asString(
      unitEcon.year3_revenue,
      'See M2 Feasibility & Viability'
    ),
    breakeven_timeline: asString(
      unitEcon.breakeven_timeline || unitEcon.payback_period,
      'See M2 Unit Economics'
    ),
    initial_investment: asString(
      unitEcon.initial_investment || unitEcon.build_cost,
      'Low-cost staged MVP via Idea Studio'
    ),
    funding_strategy: 'Gated milestone investment (M1 → M2 → M3 Sprints)',
    risks: risks.length > 0 ? risks : ['Tracked in M2 Feasibility risk register'],
    milestones: [
      {
        description: 'M1 Market Research & Gate 1 Review',
        target_date: m1 ? 'Completed' : 'Planned',
      },
      {
        description: 'M2 Feasibility & Gate 2 Review',
        target_date: m2 ? 'Completed' : 'Planned',
      },
      {
        description: `Staging & Launch (${stagingHost})`,
        target_date: idea.appSlug ? 'Graduated' : 'Upcoming',
      },
    ],
  };
}

export async function generateAndDownloadNexusDocument(
  format: NexusDocumentFormat,
  payload: NexusDocumentPayload,
  filePrefix?: string
): Promise<void> {
  const templateName = TEMPLATE_BY_FORMAT[format];
  const params = new URLSearchParams({
    template_name: templateName,
    document_type: format,
  });

  const response = await fetch(
    `${apiBase}/api/v1/documents/generate?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    let detail = `Document export failed (HTTP ${response.status})`;
    try {
      const errJson = (await response.json()) as { detail?: string; message?: string };
      detail = errJson.detail || errJson.message || detail;
    } catch {
      // keep fallback detail
    }
    throw new Error(detail);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = sanitizeFileSlug(filePrefix || payload.business_name);
  link.href = url;
  link.download = `${slug}-${templateName}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
