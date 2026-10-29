import { api } from './api';
import { leadService } from './lead.service';
import type {
  Contact,
  PaginatedContacts,
  ContactQueryParams,
  CreateContactPayload,
  UpdateContactPayload,
  ConvertContactPayload,
  ConvertContactResponse,
  ContactActivity,
  CreateContactActivityPayload,
  UpdateContactActivityPayload,
  ContactNote,
  CreateContactNotePayload,
  UpdateContactNotePayload,
  ContactTask,
  ContactDeal,
  ContactTimelineEvent,
  ContactDocumentRecord,
  ContactOrganization,
  PipelineOption,
} from '../types/contact.types';

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

function normalizePaginated<T>(
  res: any,
  fallbackLimit = 10,
): { data: T[]; meta: PaginatedContacts['meta'] } {
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

class ContactService {
  /* ---------------- Core Contacts CRUD ---------------- */

  async getContacts(query?: ContactQueryParams): Promise<PaginatedContacts> {
    const res = await api.get<any>(`/contacts${buildQuery(query as Record<string, unknown>)}`);
    return normalizePaginated<Contact>(res, query?.limit || 10);
  }

  async getContactById(id: string): Promise<Contact> {
    const res = await api.get<any>(`/contacts/${id}`);
    return res?.data || res;
  }

  async createContact(payload: CreateContactPayload): Promise<Contact> {
    const res = await api.post<any>('/contacts', payload);
    return res?.data || res;
  }

  async updateContact(id: string, payload: UpdateContactPayload): Promise<Contact> {
    const res = await api.patch<any>(`/contacts/${id}`, payload);
    return res?.data || res;
  }

  async deleteContact(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/contacts/${id}`);
    return res?.data || res;
  }

  async convertContact(id: string, payload: ConvertContactPayload): Promise<ConvertContactResponse> {
    const res = await api.post<any>(`/contacts/${id}/convert`, payload);
    return res?.data || res;
  }

  /* ---------------- Organizations & Pipelines ---------------- */

  async getOrganizations(): Promise<ContactOrganization[]> {
    try {
      const res = await api.get<any>('/organizations?limit=100');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return list;
    } catch {
      return [];
    }
  }

  async getPipelines(): Promise<PipelineOption[]> {
    return leadService.getPipelines();
  }

  /* ---------------- Contact Activities, Deals, Tasks & Timeline ---------------- */

  async getContactActivities(contactId: string): Promise<ContactActivity[]> {
    const res = await api.get<any>(`/contacts/${contactId}/activities`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async createActivity(payload: CreateContactActivityPayload): Promise<ContactActivity> {
    const res = await api.post<any>('/activities', payload);
    return res?.data || res;
  }

  async updateActivity(id: string, payload: UpdateContactActivityPayload): Promise<ContactActivity> {
    const res = await api.patch<any>(`/activities/${id}`, payload);
    return res?.data || res;
  }

  async deleteActivity(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/activities/${id}`);
    return res?.data || res;
  }

  async getContactDeals(contactId: string): Promise<ContactDeal[]> {
    const res = await api.get<any>(`/contacts/${contactId}/deals`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getContactTasks(contactId: string): Promise<ContactTask[]> {
    const res = await api.get<any>(`/contacts/${contactId}/tasks`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async getContactTimeline(contactId: string): Promise<ContactTimelineEvent[]> {
    const [contact, activities, notes, tasks, deals] = await Promise.all([
      this.getContactById(contactId).catch(() => null),
      this.getContactActivities(contactId).catch(() => []),
      this.getContactNotes(contactId).catch(() => []),
      this.getContactTasks(contactId).catch(() => []),
      this.getContactDeals(contactId).catch(() => []),
    ]);

    const events: ContactTimelineEvent[] = [];

    if (contact) {
      events.push({
        type: 'CONTACT_CREATED',
        title: `Contact profile created (${contact.firstName} ${contact.lastName})`,
        date: contact.createdAt,
        data: {
          description: contact.jobTitle
            ? `${contact.jobTitle}${contact.department ? ` · ${contact.department}` : ''}`
            : contact.email,
        },
      });
    }

    activities.forEach((act) => {
      events.push({
        type: 'ACTIVITY',
        title: `${act.type}: ${act.subject}`,
        date: act.scheduledAt || act.createdAt,
        data: act,
      });
    });

    notes.forEach((note) => {
      events.push({
        type: 'NOTE',
        title: note.title || 'Note added',
        date: note.createdAt,
        data: note,
      });
    });

    tasks.forEach((task) => {
      events.push({
        type: 'TASK',
        title: `Task: ${task.title} (${task.status})`,
        date: task.dueDate || task.createdAt,
        data: task,
      });
    });

    deals.forEach((deal) => {
      events.push({
        type: 'DEAL',
        title: `Deal linked: ${deal.title} (${deal.status})`,
        date: deal.createdAt,
        data: {
          description: deal.stage?.name ? `Pipeline stage: ${deal.stage.name}` : undefined,
        },
      });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /* ---------------- Contact Notes ---------------- */

  async getContactNotes(contactId: string): Promise<ContactNote[]> {
    const res = await api.get<any>(`/contacts/${contactId}/notes`);
    const list = Array.isArray(res) ? res : res?.data;
    return Array.isArray(list) ? list : [];
  }

  async createNote(payload: CreateContactNotePayload): Promise<ContactNote> {
    const res = await api.post<any>('/notes', payload);
    return res?.data || res;
  }

  async updateNote(id: string, payload: UpdateContactNotePayload): Promise<ContactNote> {
    const res = await api.patch<any>(`/notes/${id}`, payload);
    return res?.data || res;
  }

  async deleteNote(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/notes/${id}`);
    return res?.data || res;
  }

  /* ---------------- Contact Documents / Files ---------------- */

  async getAllFiles(): Promise<ContactDocumentRecord[]> {
    return leadService.getAllFiles();
  }

  async getContactFiles(contactId: string): Promise<ContactDocumentRecord[]> {
    const files = await this.getAllFiles();
    return files.filter((f) =>
      (f.attachments || []).some(
        (att) =>
          att.contactId === contactId ||
          (att.entityType === 'CONTACT' && att.entityId === contactId),
      ),
    );
  }

  async attachFileToContact(fileId: string, contactId: string): Promise<any> {
    const res = await api.post<any>(`/files/${fileId}/attach`, {
      entityType: 'CONTACT',
      entityId: contactId,
      contactId,
    });
    return res?.data || res;
  }

  async uploadAndAttachToContact(
    contactId: string,
    file: File,
  ): Promise<ContactDocumentRecord> {
    const uploaded = await leadService.uploadFileRecord(file);
    await this.attachFileToContact(uploaded.id, contactId);
    return uploaded;
  }

  async detachFile(fileId: string, attachmentId?: string): Promise<{ message: string }> {
    return leadService.detachFile(fileId, attachmentId);
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    return leadService.deleteFile(fileId);
  }
}

export const contactService = new ContactService();
export default contactService;
