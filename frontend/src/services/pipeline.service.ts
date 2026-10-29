import { api } from './api';
import type {
  Pipeline,
  PipelineStage,
  PipelineDeal,
  PaginatedDeals,
  DealQueryParams,
  CreatePipelinePayload,
  UpdatePipelinePayload,
  CreatePipelineStagePayload,
  UpdatePipelineStagePayload,
  CreatePipelineDealPayload,
  UpdatePipelineDealPayload,
  DealStatus,
  PipelineModuleSettings,
} from '../types/pipeline.types';

const SETTINGS_STORAGE_KEY = 'crm_pipelines_module_settings_v1';
const ACTIVE_PIPELINE_STORAGE_KEY = 'crm_active_pipeline_id_v1';

export const DEFAULT_PIPELINE_SETTINGS: PipelineModuleSettings = {
  defaultView: 'board',
  defaultCurrency: 'USD',
  showWeightedValue: true,
  showStageProbabilityBar: true,
  enableDragAndDrop: true,
  rottenDealDays: 30,
  autoSyncProbabilityWithStage: true,
};

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    sp.append(key, String(typeof value === 'string' ? value.trim() : value));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function normalizePaginatedDeals(res: any, fallbackLimit = 50): PaginatedDeals {
  if (res?.data && res?.meta) {
    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: res.meta,
    };
  }
  const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return {
    data: items,
    meta: {
      total: items.length,
      page: 1,
      limit: items.length || fallbackLimit,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

class PipelineService {
  /* ---------------- Active Pipeline Selection Persistence ---------------- */

  getSavedPipelineId(): string {
    try {
      return localStorage.getItem(ACTIVE_PIPELINE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  setSavedPipelineId(pipelineId: string): void {
    try {
      if (pipelineId) {
        localStorage.setItem(ACTIVE_PIPELINE_STORAGE_KEY, pipelineId);
      } else {
        localStorage.removeItem(ACTIVE_PIPELINE_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  /* ---------------- Core Pipelines CRUD ---------------- */

  async getPipelines(): Promise<Pipeline[]> {
    const res = await api.get<any>('/pipelines');
    const list = Array.isArray(res) ? res : res?.data;
    const pipelines: Pipeline[] = Array.isArray(list) ? list : [];
    return pipelines.map((p) => ({
      ...p,
      stages: Array.isArray(p.stages)
        ? [...p.stages].sort((a, b) => a.order - b.order)
        : [],
    }));
  }

  async getPipelineById(id: string): Promise<Pipeline> {
    const res = await api.get<any>(`/pipelines/${id}`);
    const p: Pipeline = res?.data || res;
    return {
      ...p,
      stages: Array.isArray(p?.stages)
        ? [...p.stages].sort((a, b) => a.order - b.order)
        : [],
    };
  }

  async createPipeline(payload: CreatePipelinePayload): Promise<Pipeline> {
    const res = await api.post<any>('/pipelines', payload);
    const p: Pipeline = res?.data || res;
    return {
      ...p,
      stages: Array.isArray(p?.stages) ? p.stages : [],
    };
  }

  async updatePipeline(id: string, payload: UpdatePipelinePayload): Promise<Pipeline> {
    const res = await api.patch<any>(`/pipelines/${id}`, payload);
    const p: Pipeline = res?.data || res;
    return {
      ...p,
      stages: Array.isArray(p?.stages)
        ? [...p.stages].sort((a, b) => a.order - b.order)
        : [],
    };
  }

  async deletePipeline(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/pipelines/${id}`);
    return res?.data || res;
  }

  /* ---------------- Pipeline Stages Management ---------------- */

  async getStages(pipelineId: string): Promise<PipelineStage[]> {
    const res = await api.get<any>(`/pipelines/${pipelineId}/stages`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? [...list].sort((a, b) => a.order - b.order) : [];
  }

  async createStage(
    pipelineId: string,
    payload: CreatePipelineStagePayload,
  ): Promise<PipelineStage> {
    const res = await api.post<any>(`/pipelines/${pipelineId}/stages`, payload);
    return res?.data || res;
  }

  async updateStage(
    pipelineId: string,
    stageId: string,
    payload: UpdatePipelineStagePayload,
  ): Promise<PipelineStage> {
    const res = await api.patch<any>(`/pipelines/${pipelineId}/stages/${stageId}`, payload);
    return res?.data || res;
  }

  /* ---------------- Deals in Pipeline ---------------- */

  async getDeals(query?: DealQueryParams): Promise<PaginatedDeals> {
    const res = await api.get<any>(`/deals${buildQuery(query as Record<string, unknown>)}`);
    return normalizePaginatedDeals(res, query?.limit || 50);
  }

  async createDeal(payload: CreatePipelineDealPayload): Promise<PipelineDeal> {
    const res = await api.post<any>('/deals', payload);
    return res?.data || res;
  }

  async updateDeal(id: string, payload: UpdatePipelineDealPayload): Promise<PipelineDeal> {
    const res = await api.patch<any>(`/deals/${id}`, payload);
    return res?.data || res;
  }

  async moveDealToStage(dealId: string, stageId: string): Promise<PipelineDeal> {
    const res = await api.patch<any>(`/deals/${dealId}/stage`, { stageId });
    return res?.data || res;
  }

  async updateDealStatus(dealId: string, status: DealStatus | string): Promise<PipelineDeal> {
    const res = await api.patch<any>(`/deals/${dealId}/status`, { status });
    return res?.data || res;
  }

  async deleteDeal(dealId: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/deals/${dealId}`);
    return res?.data || res;
  }

  /* ---------------- Pipeline Module Settings ---------------- */

  getLocalSettings(): PipelineModuleSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PIPELINE_SETTINGS };
      return { ...DEFAULT_PIPELINE_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PIPELINE_SETTINGS };
    }
  }

  async getSettings(): Promise<PipelineModuleSettings> {
    const local = this.getLocalSettings();
    try {
      const res = await api.get<any>('/settings');
      const list = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(list)) {
        const record = list.find((item: any) => item.key === 'pipelines_module_config');
        if (record?.value) {
          const parsed =
            typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
          const merged = { ...DEFAULT_PIPELINE_SETTINGS, ...local, ...parsed };
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {
      // fallback to localStorage
    }
    return local;
  }

  async saveSettings(settings: PipelineModuleSettings): Promise<PipelineModuleSettings> {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    try {
      await api.patch<any>('/settings/pipelines_module_config', {
        value: JSON.stringify(settings),
      });
    } catch {
      // persisted locally if backend setting key is not pre-seeded
    }
    return settings;
  }
}

export const pipelineService = new PipelineService();
export default pipelineService;

