import { api, ApiError } from './api';
import type {
  Lead,
  PaginatedLeads,
  LeadQueryParams,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadStatus,
  ConvertLeadPayload,
  ConvertLeadResponse,
  LeadActivity,
  CreateLeadActivityPayload,
  UpdateLeadActivityPayload,
  LeadNote,
  CreateLeadNotePayload,
  UpdateLeadNotePayload,
  LeadTask,
  LeadTimelineEvent,
  LeadDocumentRecord,
  PipelineOption,
  LeadModuleSettings,
} from '../types/lead.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const SETTINGS_STORAGE_KEY = 'crm_leads_module_settings_v1';

export const DEFAULT_LEAD_SETTINGS: LeadModuleSettings = {
  defaultStatus: 'NEW',
  defaultSource: 'WEBSITE',
  defaultView: 'table',
  pageSize: 10,
  hotScoreThreshold: 70,
  warmScoreThreshold: 40,
  requireQualifiedForConversion: true,
  autoCreateDealOnConversion: true,
  preventDuplicateEmails: true,
  autoScoreOnCreate: true,
  autoRouteOnCreate: false,
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

function normalizePaginated<T>(res: any, fallbackLimit = 10): { data: T[]; meta: PaginatedLeads['meta'] } {
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

class LeadService {
  /* ---------------- Core Leads CRUD ---------------- */

  async getLeads(query?: LeadQueryParams): Promise<PaginatedLeads> {
    const res = await api.get<any>(`/leads${buildQuery(query as Record<string, unknown>)}`);
    return normalizePaginated<Lead>(res, query?.limit || 10);
  }

  async getLeadById(id: string): Promise<Lead> {
    const res = await api.get<any>(`/leads/${id}`);
    return res?.data || res;
  }

  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    const res = await api.post<any>('/leads', payload);
    return res?.data || res;
  }

  async updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
    const res = await api.patch<any>(`/leads/${id}`, payload);
    return res?.data || res;
  }

  async deleteLead(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/leads/${id}`);
    return res?.data || res;
  }

  /* ---------------- Status, Assignment & Conversion ---------------- */

  async updateLeadStatus(id: string, status: LeadStatus | string): Promise<Lead> {
    const res = await api.patch<any>(`/leads/${id}/status`, { status });
    return res?.data || res;
  }

  async assignLead(id: string, ownerId: string): Promise<Lead> {
    const res = await api.patch<any>(`/leads/${id}/assign`, { ownerId });
    return res?.data || res;
  }

  async convertLead(id: string, payload: ConvertLeadPayload): Promise<ConvertLeadResponse> {
    const res = await api.post<any>(`/leads/${id}/convert`, payload);
    return res?.data || res;
  }

  /* ---------------- Lead Activities & Timeline ---------------- */

  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    const res = await api.get<any>(`/leads/${leadId}/activities`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getActivitiesList(query?: {
    leadId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeadActivity[]; meta: PaginatedLeads['meta'] }> {
    const res = await api.get<any>(`/activities${buildQuery(query)}`);
    return normalizePaginated<LeadActivity>(res, query?.limit || 20);
  }

  async createActivity(payload: CreateLeadActivityPayload): Promise<LeadActivity> {
    const res = await api.post<any>('/activities', payload);
    return res?.data || res;
  }

  async updateActivity(id: string, payload: UpdateLeadActivityPayload): Promise<LeadActivity> {
    const res = await api.patch<any>(`/activities/${id}`, payload);
    return res?.data || res;
  }

  async deleteActivity(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/activities/${id}`);
    return res?.data || res;
  }

  async getLeadTasks(leadId: string): Promise<LeadTask[]> {
    const res = await api.get<any>(`/leads/${leadId}/tasks`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getLeadTimeline(leadId: string): Promise<LeadTimelineEvent[]> {
    const res = await api.get<any>(`/leads/${leadId}/timeline`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  /* ---------------- Lead Notes ---------------- */

  async getLeadNotes(leadId: string): Promise<LeadNote[]> {
    const res = await api.get<any>(`/leads/${leadId}/notes`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getNotesList(query?: {
    leadId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeadNote[]; meta: PaginatedLeads['meta'] }> {
    const res = await api.get<any>(`/notes${buildQuery(query)}`);
    return normalizePaginated<LeadNote>(res, query?.limit || 20);
  }

  async createNote(payload: CreateLeadNotePayload): Promise<LeadNote> {
    const res = await api.post<any>('/notes', payload);
    return res?.data || res;
  }

  async updateNote(id: string, payload: UpdateLeadNotePayload): Promise<LeadNote> {
    const res = await api.patch<any>(`/notes/${id}`, payload);
    return res?.data || res;
  }

  async deleteNote(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/notes/${id}`);
    return res?.data || res;
  }

  /* ---------------- Lead Documents / Files ---------------- */

  async getAllFiles(): Promise<LeadDocumentRecord[]> {
    const res = await api.get<any>('/files');
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getLeadFiles(leadId: string): Promise<LeadDocumentRecord[]> {
    const files = await this.getAllFiles();
    return files.filter((f) =>
      (f.attachments || []).some(
        (att) => att.leadId === leadId || (att.entityType === 'LEAD' && att.entityId === leadId),
      ),
    );
  }

  async uploadFileRecord(file: File): Promise<LeadDocumentRecord> {
    const formData = new FormData();
    formData.append('file', file);

    const token = api.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message || 'Failed to upload file';
      throw new ApiError(msg, response.status, data?.error);
    }

    return (data?.data || data) as LeadDocumentRecord;
  }

  async attachFileToLead(fileId: string, leadId: string): Promise<any> {
    const res = await api.post<any>(`/files/${fileId}/attach`, {
      entityType: 'LEAD',
      entityId: leadId,
      leadId,
    });
    return res?.data || res;
  }

  async uploadAndAttachToLead(leadId: string, file: File): Promise<LeadDocumentRecord> {
    const uploaded = await this.uploadFileRecord(file);
    await this.attachFileToLead(uploaded.id, leadId);
    return uploaded;
  }

  async detachFile(fileId: string, attachmentId?: string): Promise<{ message: string }> {
    const q = attachmentId ? `?attachmentId=${encodeURIComponent(attachmentId)}` : '';
    const res = await api.delete<any>(`/files/${fileId}/attach${q}`);
    return res?.data || res;
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/files/${fileId}`);
    return res?.data || res;
  }

  /* ---------------- Pipelines (for Lead Conversion) ---------------- */

  async getPipelines(): Promise<PipelineOption[]> {
    try {
      const res = await api.get<any>('/pipelines');
      const list = Array.isArray(res) ? res : res?.data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /* ---------------- Lead Settings ---------------- */

  getLocalSettings(): LeadModuleSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_LEAD_SETTINGS };
      return { ...DEFAULT_LEAD_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_LEAD_SETTINGS };
    }
  }

  async getSettings(): Promise<LeadModuleSettings> {
    const local = this.getLocalSettings();
    try {
      const res = await api.get<any>('/settings');
      const list = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(list)) {
        const record = list.find((item: any) => item.key === 'leads_module_config');
        if (record?.value) {
          const parsed = JSON.parse(record.value);
          const merged = { ...DEFAULT_LEAD_SETTINGS, ...local, ...parsed };
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {
      // Non-admin or offline fallback uses local storage
    }
    return local;
  }

  async saveSettings(settings: LeadModuleSettings): Promise<LeadModuleSettings> {
    const merged = { ...DEFAULT_LEAD_SETTINGS, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    try {
      await api.patch('/settings', {
        key: 'leads_module_config',
        value: JSON.stringify(merged),
        category: 'LEADS',
        isPublic: true,
      });
    } catch {
      // Saved locally even if current user does not have system ADMIN role
    }
    return merged;
  }
}

export const leadService = new LeadService();

