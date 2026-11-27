import type {
  CreateIdeaInput,
  EvaluateGateInput,
  FinOpsRollup,
  GateStatusResponse,
  IdeaRecord,
  IdeaStudioConfig,
  InitiativeRecord,
  MilestoneReport,
  SprintRecord,
  StagingDeployment,
} from '@/types/ideaStudio';

export const IDEA_STUDIO_TENANT = 'nexus-solutions';
export const IDEA_STUDIO_STAGING_DOMAIN = 'nexus-solutions.us';

interface ViteEnv {
  VITE_API_BASE?: string;
  VITE_IDEA_STUDIO_API_URL?: string;
  VITE_IDEA_STUDIO_PUBLIC_URL?: string;
}

const env = ((import.meta as unknown as { env?: ViteEnv }).env || {}) as ViteEnv;

const apiBase = (env.VITE_API_BASE || '').trim().replace(/\/+$/, '');
const directControlApiBase = (env.VITE_IDEA_STUDIO_API_URL || '').trim().replace(/\/+$/, '');
const explicitPublicUiUrl = (env.VITE_IDEA_STUDIO_PUBLIC_URL || '').trim();

export const isDirectMode = Boolean(directControlApiBase);

export function getDefaultHostedUiUrl(tenant = IDEA_STUDIO_TENANT): string | null {
  if (explicitPublicUiUrl) {
    return explicitPublicUiUrl;
  }
  if (directControlApiBase) {
    return `${directControlApiBase}/idea-studio?mode=public&tenant=${encodeURIComponent(tenant)}`;
  }
  return null;
}

function buildEndpointUrl(
  resourcePath: string,
  extraQuery?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  if (isDirectMode) {
    params.set('tenant_id', IDEA_STUDIO_TENANT);
  }
  if (extraQuery) {
    Object.entries(extraQuery).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        params.set(key, val);
      }
    });
  }
  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : '';

  if (isDirectMode) {
    return `${directControlApiBase}/api/mission-control${resourcePath}${suffix}`;
  }
  return `${apiBase}/api/idea-studio${resourcePath}${suffix}`;
}

export class IdeaStudioApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'IdeaStudioApiError';
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(
  method: 'GET' | 'POST',
  resourcePath: string,
  options?: {
    body?: Record<string, unknown>;
    query?: Record<string, string | undefined>;
  }
): Promise<T> {
  const url = buildEndpointUrl(resourcePath, options?.query);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Tenant-Id': IDEA_STUDIO_TENANT,
  };

  let bodyString: string | undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    bodyString = JSON.stringify({
      ...(options?.body || {}),
      tenantId: IDEA_STUDIO_TENANT,
    });
  }

  const response = await fetch(url, {
    method,
    headers,
    body: bodyString,
  });

  const text = await response.text();
  let parsed: Record<string, unknown> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      (parsed && typeof parsed.message === 'string' && parsed.message) ||
      (parsed && typeof parsed.detail === 'string' && parsed.detail) ||
      (parsed && typeof parsed.error === 'string' && parsed.error) ||
      `Idea Studio request failed (HTTP ${response.status})`;
    const code = parsed && typeof parsed.error === 'string' ? parsed.error : undefined;
    throw new IdeaStudioApiError(message, response.status, code);
  }

  return (parsed ?? {}) as T;
}

export const ideaStudioApi = {
  async getConfig(): Promise<IdeaStudioConfig> {
    if (isDirectMode) {
      return {
        configured: true,
        tenant: IDEA_STUDIO_TENANT,
        stagingDomain: IDEA_STUDIO_STAGING_DOMAIN,
        hostedUiUrl: getDefaultHostedUiUrl(IDEA_STUDIO_TENANT),
        proxyMode: 'direct',
      };
    }

    try {
      const config = await requestJson<IdeaStudioConfig>('GET', '/config');
      return {
        configured: Boolean(config.configured),
        tenant: config.tenant || IDEA_STUDIO_TENANT,
        stagingDomain: config.stagingDomain || IDEA_STUDIO_STAGING_DOMAIN,
        hostedUiUrl: config.hostedUiUrl || getDefaultHostedUiUrl(config.tenant || IDEA_STUDIO_TENANT),
        proxyMode: 'backend',
      };
    } catch {
      return {
        configured: false,
        tenant: IDEA_STUDIO_TENANT,
        stagingDomain: IDEA_STUDIO_STAGING_DOMAIN,
        hostedUiUrl: getDefaultHostedUiUrl(IDEA_STUDIO_TENANT),
        proxyMode: 'backend',
      };
    }
  },

  async listIdeas(): Promise<IdeaRecord[]> {
    const res = await requestJson<{ ideas?: IdeaRecord[] }>('GET', '/ideas');
    return Array.isArray(res.ideas) ? res.ideas : [];
  },

  async createIdea(input: CreateIdeaInput): Promise<IdeaRecord> {
    const res = await requestJson<{ idea: IdeaRecord }>('POST', '/ideas', {
      body: {
        title: input.title,
        description: input.description,
        targetEntities: input.targetEntities || '',
        tags: input.tags || [],
        prompt: input.prompt || '',
      },
    });
    return res.idea;
  },

  async getGateStatus(ideaId: string): Promise<GateStatusResponse> {
    return requestJson<GateStatusResponse>(
      'GET',
      `/ideas/${encodeURIComponent(ideaId)}/gates`
    );
  },

  async evaluateGate(
    ideaId: string,
    input: EvaluateGateInput
  ): Promise<Record<string, unknown>> {
    return requestJson<Record<string, unknown>>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/gates`,
      {
        body: {
          fromStage: input.fromStage,
          toStage: input.toStage,
          decision: input.decision,
          notes: input.notes || '',
        },
      }
    );
  },

  async runMarketResearch(
    ideaId: string,
    offline = false
  ): Promise<{ report?: MilestoneReport; idea?: IdeaRecord }> {
    return requestJson<{ report?: MilestoneReport; idea?: IdeaRecord }>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/reports/market-research`,
      { body: { offline } }
    );
  },

  async runFeasibilityViability(
    ideaId: string,
    offline = false
  ): Promise<{ report?: MilestoneReport; idea?: IdeaRecord }> {
    return requestJson<{ report?: MilestoneReport; idea?: IdeaRecord }>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/reports/feasibility-viability`,
      { body: { offline } }
    );
  },

  async graduateIdea(
    ideaId: string
  ): Promise<{ appSlug?: string; profilePath?: string }> {
    return requestJson<{ appSlug?: string; profilePath?: string }>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/graduate`,
      { body: {} }
    );
  },

  async scaffoldIdea(
    ideaId: string
  ): Promise<{ appSlug?: string; scaffoldPath?: string; mode?: string }> {
    return requestJson<{ appSlug?: string; scaffoldPath?: string; mode?: string }>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/scaffold`,
      { body: {} }
    );
  },

  async listSprints(): Promise<SprintRecord[]> {
    const res = await requestJson<{ sprints?: SprintRecord[] }>('GET', '/sprints');
    return Array.isArray(res.sprints) ? res.sprints : [];
  },

  async startSprintOne(params: {
    initiativeId?: string;
    ideaId: string;
    appSlug?: string;
    ideaTitle: string;
  }): Promise<{ sprint?: SprintRecord }> {
    return requestJson<{ sprint?: SprintRecord }>('POST', '/sprints', {
      body: {
        initiativeId: params.initiativeId || '',
        ideaId: params.ideaId,
        appSlug: params.appSlug || '',
        name: 'Sprint 1: Core MVP',
        goal: `Deliver initial Sprint 1 milestones for ${params.ideaTitle}.`,
        number: 1,
        status: 'active',
        seedTasks: true,
      },
    });
  },

  async startNextSprint(
    ideaId: string
  ): Promise<{ sprint?: SprintRecord }> {
    return requestJson<{ sprint?: SprintRecord }>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/sprints/next`,
      { body: { seedTasks: true } }
    );
  },

  async executeSprint(
    sprintId: string,
    openPr = true
  ): Promise<{
    mode?: string;
    ciStatus?: string;
    executedTasks?: unknown[];
  }> {
    return requestJson<{
      mode?: string;
      ciStatus?: string;
      executedTasks?: unknown[];
    }>('POST', `/sprints/${encodeURIComponent(sprintId)}/execute`, {
      body: { openPr },
    });
  },

  async listInitiatives(): Promise<InitiativeRecord[]> {
    const res = await requestJson<{ initiatives?: InitiativeRecord[] }>('GET', '/initiatives');
    return Array.isArray(res.initiatives) ? res.initiatives : [];
  },

  async listStaging(): Promise<StagingDeployment[]> {
    const res = await requestJson<{ deployments?: StagingDeployment[] }>('GET', '/staging');
    return Array.isArray(res.deployments) ? res.deployments : [];
  },

  async getIdeaStaging(ideaId: string): Promise<StagingDeployment> {
    return requestJson<StagingDeployment>(
      'GET',
      `/ideas/${encodeURIComponent(ideaId)}/staging`
    );
  },

  async provisionStaging(
    ideaId: string
  ): Promise<{ staging?: StagingDeployment }> {
    return requestJson<{ staging?: StagingDeployment }>(
      'POST',
      `/ideas/${encodeURIComponent(ideaId)}/staging/provision`,
      { body: {} }
    );
  },

  async getTenantFinOps(): Promise<FinOpsRollup> {
    return requestJson<FinOpsRollup>('GET', '/finops');
  },

  async getIdeaFinOps(ideaId: string): Promise<FinOpsRollup> {
    return requestJson<FinOpsRollup>(
      'GET',
      `/ideas/${encodeURIComponent(ideaId)}/finops`
    );
  },
};
