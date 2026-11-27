export type IdeaStudioTab = 'submit' | 'inbox' | 'workspace';

export interface IdeaStudioConfig {
  configured: boolean;
  tenant: string;
  stagingDomain: string;
  hostedUiUrl: string | null;
  proxyMode: 'backend' | 'direct';
}

export interface IdeaRecord {
  id: string;
  title: string;
  description?: string;
  stage?: string;
  status?: string;
  tags?: string[];
  targetEntities?: string;
  prompt?: string;
  tenantId?: string;
  appSlug?: string;
  appProfilePath?: string;
  profilePath?: string;
  scaffoldPath?: string;
  scaffoldMode?: string;
  stagingHostname?: string;
  stagingPreviewUrl?: string;
  stagingStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MilestoneReport {
  id?: string;
  ideaId?: string;
  milestone: string;
  skill?: string;
  createdAt?: string;
  reportMarkdown?: string;
  reportData?: {
    executive_summary?: string;
    summary?: string;
    market_saturation?: {
      score?: string | number;
    };
    [key: string]: unknown;
  };
}

export interface GateDecision {
  id?: string;
  gateKey?: string;
  fromStage?: string;
  toStage?: string;
  decision: string;
  actor?: string;
  notes?: string;
  createdAt?: string;
}

export interface GateStatusResponse {
  ideaId?: string;
  currentStage: string;
  reports?: MilestoneReport[];
  decisions?: GateDecision[];
}

export interface SprintTask {
  id: string;
  title: string;
  status?: string;
  ciStatus?: string;
  prUrl?: string;
  prNumber?: number | string;
  branchName?: string;
  buildSummary?: string;
  lastRunAt?: string;
}

export interface SprintRecord {
  id: string;
  initiativeId?: string;
  ideaId?: string;
  appSlug?: string;
  number?: number;
  name: string;
  goal?: string;
  status?: string;
  ciStatus?: string;
  branchName?: string;
  prUrl?: string;
  demoUrl?: string;
  lastRunSummary?: string;
  taskIds?: string[];
  tasks?: SprintTask[];
}

export interface InitiativeRecord {
  id: string;
  ideaId?: string;
  name: string;
  owner?: string;
  tenantId?: string;
}

export interface StagingStepStatus {
  status?: string;
  detail?: string;
}

export interface StagingDeployment {
  ideaId?: string;
  appSlug?: string;
  hostname?: string;
  previewUrl?: string;
  status?: string;
  domainRule?: string;
  dns?: StagingStepStatus;
  proxy?: StagingStepStatus;
  tls?: StagingStepStatus;
  updatedAt?: string;
}

export interface FinOpsMilestoneEntry {
  milestone: string;
  costUsd: number;
  callCount: number;
  totalTokens?: number;
}

export interface FinOpsIdeaEntry {
  ideaId: string;
  ideaTitle?: string;
  appSlug?: string;
  costUsd: number;
  callCount: number;
  totalTokens?: number;
  byMilestone?: FinOpsMilestoneEntry[];
}

export interface FinOpsRollup {
  tenantId?: string;
  totalCostUsd: number;
  callCount: number;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  totalTokens?: number;
  byMilestone?: FinOpsMilestoneEntry[];
  byIdea?: FinOpsIdeaEntry[];
}

export interface CreateIdeaInput {
  title: string;
  description: string;
  targetEntities?: string;
  tags?: string[];
  prompt?: string;
}

export interface EvaluateGateInput {
  fromStage: string;
  toStage: string;
  decision: 'approve' | 'request_revision' | 'kill';
  notes?: string;
}
