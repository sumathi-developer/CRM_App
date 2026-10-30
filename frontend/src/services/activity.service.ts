import { api } from './api';
import { userService } from './user.service';
import { contactService } from './contact.service';
import { leadService } from './lead.service';
import { dealService } from './deal.service';
import type {
  ActivityContactRef,
  ActivityDealRef,
  ActivityLeadRef,
  ActivityQueryParams,
  ActivityRecord,
  ActivityRecordSource,
  ActivityUserRef,
  CreateActivityRecordPayload,
  PaginatedActivities,
  UpdateActivityRecordPayload,
} from '../types/activity.types';

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

function normalizeActivityItem(item: any): ActivityRecord {
  return {
    id: item.id,
    recordSource: 'ACTIVITY',
    type: item.type || 'CALL',
    subject: item.subject || item.title || 'Untitled Activity',
    description: item.description ?? null,
    scheduledAt: item.scheduledAt || item.dueDate || null,
    completedAt: item.completedAt ?? null,
    status: item.status || 'PENDING',
    priority: item.priority || 'MEDIUM',
    contactId: item.contactId ?? item.contact?.id ?? null,
    contact: item.contact ?? null,
    leadId: item.leadId ?? item.lead?.id ?? null,
    lead: item.lead ?? null,
    dealId: item.dealId ?? item.deal?.id ?? null,
    deal: item.deal ?? null,
    assignedToId: item.assignedToId ?? item.assignedTo?.id ?? null,
    assignedTo: item.assignedTo ?? null,
    createdById: item.createdById ?? item.createdBy?.id ?? null,
    createdBy: item.createdBy ?? null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt,
  };
}

function normalizeTaskItem(item: any): ActivityRecord {
  return {
    id: item.id,
    recordSource: 'TASK',
    type: 'TASK',
    subject: item.title || item.subject || 'Untitled Task',
    description: item.description ?? null,
    scheduledAt: item.dueDate || item.scheduledAt || null,
    completedAt: item.completedAt ?? null,
    status: item.status || 'PENDING',
    priority: item.priority || 'MEDIUM',
    contactId: item.contactId ?? item.contact?.id ?? null,
    contact: item.contact ?? null,
    leadId: item.leadId ?? item.lead?.id ?? null,
    lead: item.lead ?? null,
    dealId: item.dealId ?? item.deal?.id ?? null,
    deal: item.deal ?? null,
    assignedToId: item.assignedToId ?? item.assignedTo?.id ?? null,
    assignedTo: item.assignedTo ?? null,
    createdById: item.createdById ?? item.createdBy?.id ?? null,
    createdBy: item.createdBy ?? null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt,
  };
}

class ActivityService {
  /* ---------------- Core Activities & Tasks Fetching ---------------- */

  async getActivities(query?: ActivityQueryParams): Promise<PaginatedActivities> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const typeFilter = (query?.type || '').toUpperCase();

    // If explicitly filtering for TASK only, query /tasks
    if (typeFilter === 'TASK') {
      const res = await api.get<any>(
        `/tasks${buildQuery({
          page,
          limit,
          search: query?.search,
          status: query?.status,
          priority: query?.priority,
          contactId: query?.contactId,
          leadId: query?.leadId,
          dealId: query?.dealId,
          assignedToId: query?.assignedToId,
        })}`,
      );
      const rawItems = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const items = rawItems.map(normalizeTaskItem);
      const meta = res?.meta || {
        total: items.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(items.length / limit)),
      };
      return { data: items, meta };
    }

    // If filtering for a specific Activity type (CALL, MEETING, FOLLOW_UP, EMAIL, WHATSAPP)
    if (typeFilter && typeFilter !== 'TASK') {
      const res = await api.get<any>(
        `/activities${buildQuery({
          page,
          limit,
          type: typeFilter,
          status: query?.status,
          contactId: query?.contactId,
          leadId: query?.leadId,
          dealId: query?.dealId,
          assignedToId: query?.assignedToId,
        })}`,
      );
      const rawItems = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const items = rawItems.map(normalizeActivityItem);
      const meta = res?.meta || {
        total: items.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(items.length / limit)),
      };
      return { data: items, meta };
    }

    // Otherwise, fetch both /activities and /tasks and merge them chronologically
    const [actRes, taskRes] = await Promise.all([
      api
        .get<any>(
          `/activities${buildQuery({
            page,
            limit,
            status: query?.status,
            contactId: query?.contactId,
            leadId: query?.leadId,
            dealId: query?.dealId,
            assignedToId: query?.assignedToId,
          })}`,
        )
        .catch(() => ({ data: [], meta: { total: 0 } })),
      api
        .get<any>(
          `/tasks${buildQuery({
            page,
            limit,
            search: query?.search,
            status: query?.status,
            priority: query?.priority,
            contactId: query?.contactId,
            leadId: query?.leadId,
            dealId: query?.dealId,
            assignedToId: query?.assignedToId,
          })}`,
        )
        .catch(() => ({ data: [], meta: { total: 0 } })),
    ]);

    const actItems: ActivityRecord[] = (
      Array.isArray(actRes) ? actRes : Array.isArray(actRes?.data) ? actRes.data : []
    ).map(normalizeActivityItem);

    const taskItems: ActivityRecord[] = (
      Array.isArray(taskRes) ? taskRes : Array.isArray(taskRes?.data) ? taskRes.data : []
    ).map(normalizeTaskItem);

    const combined = [...actItems, ...taskItems].sort((a, b) => {
      const dA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
      const dB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
      return dB - dA;
    });

    const total =
      (Number(actRes?.meta?.total) || actItems.length) +
      (Number(taskRes?.meta?.total) || taskItems.length);

    return {
      data: combined,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /* ---------------- Date-Scoped Endpoints ---------------- */

  async getTodayActivities(): Promise<ActivityRecord[]> {
    const [acts, tasks] = await Promise.all([
      api.get<any>('/activities/today').catch(() => []),
      api.get<any>('/tasks/today').catch(() => []),
    ]);
    const actList = (Array.isArray(acts) ? acts : acts?.data || []).map(normalizeActivityItem);
    const taskList = (Array.isArray(tasks) ? tasks : tasks?.data || []).map(normalizeTaskItem);
    return [...actList, ...taskList];
  }

  async getUpcomingActivities(): Promise<ActivityRecord[]> {
    const [acts, tasks] = await Promise.all([
      api.get<any>('/activities/upcoming').catch(() => []),
      api.get<any>('/tasks/upcoming').catch(() => []),
    ]);
    const actList = (Array.isArray(acts) ? acts : acts?.data || []).map(normalizeActivityItem);
    const taskList = (Array.isArray(tasks) ? tasks : tasks?.data || []).map(normalizeTaskItem);
    return [...actList, ...taskList];
  }

  async getOverdueActivities(): Promise<ActivityRecord[]> {
    const [acts, tasks] = await Promise.all([
      api.get<any>('/activities/overdue').catch(() => []),
      api.get<any>('/tasks/overdue').catch(() => []),
    ]);
    const actList = (Array.isArray(acts) ? acts : acts?.data || []).map(normalizeActivityItem);
    const taskList = (Array.isArray(tasks) ? tasks : tasks?.data || []).map(normalizeTaskItem);
    return [...actList, ...taskList];
  }

  /* ---------------- Single Record Get / Create / Update / Delete ---------------- */

  async getActivityById(
    id: string,
    preferredSource?: ActivityRecordSource,
  ): Promise<ActivityRecord> {
    if (preferredSource === 'TASK') {
      try {
        const res = await api.get<any>(`/tasks/${id}`);
        return normalizeTaskItem(res?.data || res);
      } catch {
        const res = await api.get<any>(`/activities/${id}`);
        return normalizeActivityItem(res?.data || res);
      }
    }

    try {
      const res = await api.get<any>(`/activities/${id}`);
      return normalizeActivityItem(res?.data || res);
    } catch {
      const res = await api.get<any>(`/tasks/${id}`);
      return normalizeTaskItem(res?.data || res);
    }
  }

  async createActivityRecord(
    payload: CreateActivityRecordPayload,
  ): Promise<ActivityRecord> {
    const normalizedType = (payload.type || 'CALL').toUpperCase();

    if (normalizedType === 'TASK') {
      const res = await api.post<any>('/tasks', {
        title: payload.subject,
        description: payload.description,
        dueDate: payload.scheduledAt,
        status: payload.status || 'PENDING',
        priority: payload.priority || 'MEDIUM',
        contactId: payload.contactId,
        leadId: payload.leadId,
        dealId: payload.dealId,
        assignedToId: payload.assignedToId,
      });
      return normalizeTaskItem(res?.data || res);
    }

    const res = await api.post<any>('/activities', {
      type: normalizedType,
      subject: payload.subject,
      description: payload.description,
      scheduledAt: payload.scheduledAt,
      status: payload.status || 'PENDING',
      priority: payload.priority || 'MEDIUM',
      contactId: payload.contactId,
      leadId: payload.leadId,
      dealId: payload.dealId,
      assignedToId: payload.assignedToId,
    });
    return normalizeActivityItem(res?.data || res);
  }

  async updateActivityRecord(
    id: string,
    payload: UpdateActivityRecordPayload,
    recordSource: ActivityRecordSource = 'ACTIVITY',
  ): Promise<ActivityRecord> {
    if (recordSource === 'TASK' || (payload.type || '').toUpperCase() === 'TASK') {
      const res = await api.patch<any>(`/tasks/${id}`, {
        title: payload.subject,
        description: payload.description,
        dueDate: payload.scheduledAt,
        completedAt: payload.completedAt,
        status: payload.status,
        priority: payload.priority,
        contactId: payload.contactId,
        leadId: payload.leadId,
        dealId: payload.dealId,
        assignedToId: payload.assignedToId,
      });
      return normalizeTaskItem(res?.data || res);
    }

    const res = await api.patch<any>(`/activities/${id}`, {
      type: payload.type,
      subject: payload.subject,
      description: payload.description,
      scheduledAt: payload.scheduledAt,
      completedAt: payload.completedAt,
      status: payload.status,
      priority: payload.priority,
      assignedToId: payload.assignedToId,
    });
    return normalizeActivityItem(res?.data || res);
  }

  async markActivityComplete(
    activity: Pick<ActivityRecord, 'id' | 'recordSource' | 'status'>,
  ): Promise<ActivityRecord> {
    const nextStatus = activity.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const completedAt =
      nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined;

    if (activity.recordSource === 'TASK') {
      if (nextStatus === 'COMPLETED') {
        const res = await api.patch<any>(`/tasks/${activity.id}/complete`, {});
        return normalizeTaskItem(res?.data || res);
      }
      return this.updateActivityRecord(
        activity.id,
        { status: 'PENDING' },
        'TASK',
      );
    }

    return this.updateActivityRecord(
      activity.id,
      { status: nextStatus, completedAt },
      'ACTIVITY',
    );
  }

  async assignActivity(
    activity: Pick<ActivityRecord, 'id' | 'recordSource'>,
    assignedToId: string,
  ): Promise<ActivityRecord> {
    if (activity.recordSource === 'TASK') {
      const res = await api.patch<any>(`/tasks/${activity.id}/assign`, {
        assignedToId,
      });
      return normalizeTaskItem(res?.data || res);
    }
    return this.updateActivityRecord(
      activity.id,
      { assignedToId },
      'ACTIVITY',
    );
  }

  async deleteActivityRecord(
    id: string,
    recordSource: ActivityRecordSource = 'ACTIVITY',
  ): Promise<{ message: string }> {
    if (recordSource === 'TASK') {
      const res = await api.delete<any>(`/tasks/${id}`);
      return res?.data || res;
    }
    const res = await api.delete<any>(`/activities/${id}`);
    return res?.data || res;
  }

  /* ---------------- Related Record Lookups ---------------- */

  async getAssignableUsers(): Promise<ActivityUserRef[]> {
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

  async getContactsLookup(): Promise<ActivityContactRef[]> {
    try {
      const res = await contactService.getContacts({ limit: 100 });
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async getLeadsLookup(): Promise<ActivityLeadRef[]> {
    try {
      const res = await leadService.getLeads({ limit: 100 });
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async getDealsLookup(): Promise<ActivityDealRef[]> {
    try {
      const res = await dealService.getDeals({ limit: 100 });
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  }
}

export const activityService = new ActivityService();
export default activityService;

