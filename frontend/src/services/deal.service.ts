import { api } from './api';
import { leadService } from './lead.service';
import { contactService } from './contact.service';
import { pipelineService } from './pipeline.service';
import { userService } from './user.service';
import type {
  Deal,
  PaginatedDeals,
  DealQueryParams,
  CreateDealPayload,
  UpdateDealPayload,
  DealStatus,
  DealActivity,
  CreateDealActivityPayload,
  UpdateDealActivityPayload,
  DealNote,
  CreateDealNotePayload,
  UpdateDealNotePayload,
  DealTask,
  DealTimelineEvent,
  DealDocumentRecord,
  DealModuleSettings,
  DealOrganizationOption,
  DealUserOption,
  Pipeline,
} from '../types/deal.types';

const SETTINGS_STORAGE_KEY = 'crm_deals_module_settings_v1';

export const DEFAULT_DEAL_SETTINGS: DealModuleSettings = {
  defaultView: 'table',
  defaultCurrency: 'USD',
  defaultProbability: 20,
  pageSize: 10,
  showWeightedValue: true,
  requireNoteOnLost: false,
  celebrateWonDeals: true,
};

class DealService {
  /* ---------------- Core Deals CRUD ---------------- */

  async getDeals(query?: DealQueryParams): Promise<PaginatedDeals> {
    return pipelineService.getDeals(query);
  }

  async getDealById(id: string): Promise<Deal> {
    const res = await api.get<any>(`/deals/${id}`);
    return res?.data || res;
  }

  async createDeal(payload: CreateDealPayload): Promise<Deal> {
    return pipelineService.createDeal(payload);
  }

  async updateDeal(id: string, payload: UpdateDealPayload): Promise<Deal> {
    return pipelineService.updateDeal(id, payload);
  }

  async deleteDeal(id: string): Promise<{ message: string }> {
    return pipelineService.deleteDeal(id);
  }

  /* ---------------- Stage, Status & Owner Assignment ---------------- */

  async updateDealStage(id: string, stageId: string): Promise<Deal> {
    return pipelineService.moveDealToStage(id, stageId);
  }

  async updateDealStatus(id: string, status: DealStatus | string): Promise<Deal> {
    return pipelineService.updateDealStatus(id, status);
  }

  async assignDeal(id: string, ownerId: string): Promise<Deal> {
    const res = await api.patch<any>(`/deals/${id}/assign`, { ownerId });
    return res?.data || res;
  }

  /* ---------------- Pipelines, Organizations & Users ---------------- */

  async getPipelines(): Promise<Pipeline[]> {
    return pipelineService.getPipelines();
  }

  async getOrganizations(): Promise<DealOrganizationOption[]> {
    return contactService.getOrganizations();
  }

  async getAssignableUsers(): Promise<DealUserOption[]> {
    try {
      const res = await userService.getUsers({ limit: 100 });
      return (res?.data || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
      }));
    } catch {
      return [];
    }
  }

  /* ---------------- Deal Activities, Tasks & Timeline ---------------- */

  async getDealActivities(dealId: string): Promise<DealActivity[]> {
    const res = await api.get<any>(`/deals/${dealId}/activities`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async createActivity(payload: CreateDealActivityPayload): Promise<DealActivity> {
    const res = await api.post<any>('/activities', payload);
    return res?.data || res;
  }

  async updateActivity(id: string, payload: UpdateDealActivityPayload): Promise<DealActivity> {
    const res = await api.patch<any>(`/activities/${id}`, payload);
    return res?.data || res;
  }

  async deleteActivity(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/activities/${id}`);
    return res?.data || res;
  }

  async getDealTasks(dealId: string): Promise<DealTask[]> {
    const res = await api.get<any>(`/deals/${dealId}/tasks`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getDealTimeline(dealId: string): Promise<DealTimelineEvent[]> {
    const res = await api.get<any>(`/deals/${dealId}/timeline`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  /* ---------------- Deal Notes ---------------- */

  async getDealNotes(dealId: string): Promise<DealNote[]> {
    const res = await api.get<any>(`/deals/${dealId}/notes`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async createNote(payload: CreateDealNotePayload): Promise<DealNote> {
    const res = await api.post<any>('/notes', payload);
    return res?.data || res;
  }

  async updateNote(id: string, payload: UpdateDealNotePayload): Promise<DealNote> {
    const res = await api.patch<any>(`/notes/${id}`, payload);
    return res?.data || res;
  }

  async deleteNote(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/notes/${id}`);
    return res?.data || res;
  }

  /* ---------------- Deal Documents / Files ---------------- */

  async getAllFiles(): Promise<DealDocumentRecord[]> {
    return leadService.getAllFiles();
  }

  async getDealFiles(dealId: string): Promise<DealDocumentRecord[]> {
    const files = await this.getAllFiles();
    return files.filter((f) =>
      (f.attachments || []).some(
        (att) =>
          att.dealId === dealId || (att.entityType === 'DEAL' && att.entityId === dealId),
      ),
    );
  }

  async attachFileToDeal(fileId: string, dealId: string): Promise<any> {
    const res = await api.post<any>(`/files/${fileId}/attach`, {
      entityType: 'DEAL',
      entityId: dealId,
      dealId,
    });
    return res?.data || res;
  }

  async uploadAndAttachToDeal(dealId: string, file: File): Promise<DealDocumentRecord> {
    const uploaded = await leadService.uploadFileRecord(file);
    await this.attachFileToDeal(uploaded.id, dealId);
    return uploaded;
  }

  async detachFile(fileId: string, attachmentId?: string): Promise<{ message: string }> {
    return leadService.detachFile(fileId, attachmentId);
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    return leadService.deleteFile(fileId);
  }

  /* ---------------- Deal Module Settings ---------------- */

  getLocalSettings(): DealModuleSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DEAL_SETTINGS };
      return { ...DEFAULT_DEAL_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_DEAL_SETTINGS };
    }
  }

  async getSettings(): Promise<DealModuleSettings> {
    const local = this.getLocalSettings();
    try {
      const res = await api.get<any>('/settings');
      const list = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(list)) {
        const record = list.find((item: any) => item.key === 'deals_module_config');
        if (record?.value) {
          const parsed =
            typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
          const merged = { ...DEFAULT_DEAL_SETTINGS, ...local, ...parsed };
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {
      // fallback to localStorage
    }
    return local;
  }

  async saveSettings(settings: DealModuleSettings): Promise<DealModuleSettings> {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    try {
      await api.patch<any>('/settings/deals_module_config', {
        value: JSON.stringify(settings),
      });
    } catch {
      // persisted locally if backend setting key is not pre-seeded
    }
    return settings;
  }
}

export const dealService = new DealService();
export default dealService;
