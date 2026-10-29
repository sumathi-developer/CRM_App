import type { PaginationMeta, SortDirection } from './lead.types';

export type { PaginationMeta, SortDirection };

export type PipelineViewMode = 'overview' | 'board' | 'list' | 'table';

export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  winProbability: number;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    deals?: number;
  };
}

export interface PipelineDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: DealStatus | string;
  probability: number;
  expectedCloseDate?: string | null;
  closedAt?: string | null;
  pipelineId?: string | null;
  pipeline?: {
    id: string;
    name: string;
  } | null;
  stageId?: string | null;
  stage?: PipelineStage | null;
  organizationId?: string | null;
  organization?: {
    id: string;
    name: string;
    industry?: string | null;
  } | null;
  contactId?: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  ownerId?: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    activities?: number;
    tasks?: number;
    notes?: number;
    products?: number;
  };
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
  stages: PipelineStage[];
  deals?: PipelineDeal[];
  _count?: {
    deals?: number;
  };
}

export interface CreatePipelinePayload {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export type UpdatePipelinePayload = Partial<CreatePipelinePayload>;

export interface CreatePipelineStagePayload {
  name: string;
  order: number;
  winProbability?: number;
  color?: string;
}

export type UpdatePipelineStagePayload = Partial<CreatePipelineStagePayload>;

export interface DealQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  stageId?: string;
  pipelineId?: string;
  ownerId?: string;
}

export interface PaginatedDeals {
  data: PipelineDeal[];
  meta: PaginationMeta;
}

export interface CreatePipelineDealPayload {
  title: string;
  value: number;
  currency?: string;
  pipelineId?: string;
  stageId?: string;
  probability?: number;
  expectedCloseDate?: string;
  organizationId?: string;
  contactId?: string;
  ownerId?: string;
}

export interface UpdatePipelineDealPayload extends Partial<CreatePipelineDealPayload> {
  status?: DealStatus | string;
}

export interface PipelineModuleSettings {
  defaultView: PipelineViewMode;
  defaultCurrency: string;
  showWeightedValue: boolean;
  showStageProbabilityBar: boolean;
  enableDragAndDrop: boolean;
  rottenDealDays: number;
  autoSyncProbabilityWithStage: boolean;
}

