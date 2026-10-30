import { api } from './api';
import { activityService } from './activity.service';
import { dealService } from './deal.service';
import type {
  CalendarContactRef,
  CalendarDayResponse,
  CalendarDealRef,
  CalendarEventCategory,
  CalendarEventItem,
  CalendarEventsQuery,
  CalendarLeadRef,
  CalendarMonthResponse,
  CalendarReminderRecord,
  CalendarSummaryResponse,
  CalendarUserRef,
  CalendarWeekResponse,
  CreateCalendarEventPayload,
  CrmNotificationItem,
  ReminderOffsetMinutes,
  UpdateCalendarEventPayload,
} from '../types/calendar.types';

const REMINDERS_STORAGE_KEY = 'crm_calendar_reminders_v1';

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

function getStoredReminderMap(): Record<
  string,
  { offsetMinutes: ReminderOffsetMinutes; dismissed?: boolean; snoozedUntil?: string | null }
> {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveStoredReminderMap(
  map: Record<
    string,
    { offsetMinutes: ReminderOffsetMinutes; dismissed?: boolean; snoozedUntil?: string | null }
  >,
) {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function normalizeCalendarEvent(raw: any): CalendarEventItem {
  const storedMap = getStoredReminderMap();
  const id = raw.id;
  const stored = storedMap[id];
  const category: CalendarEventCategory =
    raw.category ||
    (raw.type === 'TASK'
      ? 'TASK'
      : raw.type === 'DEAL_CLOSING'
        ? 'DEAL'
        : 'ACTIVITY');

  return {
    id,
    title: raw.title || raw.subject || 'Untitled Event',
    description: raw.description ?? null,
    start:
      typeof raw.start === 'string'
        ? raw.start
        : raw.start
          ? new Date(raw.start).toISOString()
          : raw.scheduledAt || raw.dueDate || new Date().toISOString(),
    end:
      typeof raw.end === 'string'
        ? raw.end
        : raw.end
          ? new Date(raw.end).toISOString()
          : raw.completedAt || null,
    allDay: Boolean(raw.allDay ?? (category === 'TASK' || category === 'DEAL')),
    category,
    type: raw.type || (category === 'TASK' ? 'TASK' : 'MEETING'),
    status: raw.status || 'PENDING',
    priority: raw.priority || 'MEDIUM',
    contactId: raw.contactId ?? raw.contact?.id ?? null,
    contact: raw.contact ?? null,
    leadId: raw.leadId ?? raw.lead?.id ?? null,
    lead: raw.lead ?? null,
    dealId: raw.dealId ?? raw.deal?.id ?? null,
    deal: raw.deal ?? null,
    assignedToId: raw.assignedToId ?? raw.assignedTo?.id ?? null,
    assignedTo: raw.assignedTo ?? null,
    reminderMinutes: stored?.offsetMinutes ?? 15,
  };
}

class CalendarApiService {
  /* ---------------- Calendar Views & Events APIs ---------------- */

  async getEvents(query?: CalendarEventsQuery): Promise<CalendarEventItem[]> {
    const res = await api.get<any>(
      `/calendar/events${buildQuery(query as Record<string, unknown>)}`,
    );
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return list.map(normalizeCalendarEvent);
  }

  async getMonthView(params: {
    year: number;
    month: number;
    userId?: string;
  }): Promise<CalendarMonthResponse> {
    const res = await api.get<any>(`/calendar/month${buildQuery(params)}`);
    const data = res?.data || res;
    const events = Array.isArray(data?.events)
      ? data.events.map(normalizeCalendarEvent)
      : [];
    return {
      year: data?.year || params.year,
      month: data?.month || params.month,
      totalEvents: data?.totalEvents ?? events.length,
      pendingEvents: data?.pendingEvents ?? 0,
      completedEvents: data?.completedEvents ?? 0,
      overdueEvents: data?.overdueEvents ?? 0,
      events,
    };
  }

  async getWeekView(params: {
    date: string;
    userId?: string;
  }): Promise<CalendarWeekResponse> {
    const res = await api.get<any>(`/calendar/week${buildQuery(params)}`);
    const data = res?.data || res;
    const events = Array.isArray(data?.events)
      ? data.events.map(normalizeCalendarEvent)
      : [];
    return {
      weekStart: data?.weekStart || params.date,
      weekEnd: data?.weekEnd || params.date,
      totalEvents: data?.totalEvents ?? events.length,
      events,
    };
  }

  async getDayView(params: {
    date: string;
    userId?: string;
  }): Promise<CalendarDayResponse> {
    const res = await api.get<any>(`/calendar/day${buildQuery(params)}`);
    const data = res?.data || res;
    const events = Array.isArray(data?.events)
      ? data.events.map(normalizeCalendarEvent)
      : [];
    return {
      date: data?.date || params.date,
      totalEvents: data?.totalEvents ?? events.length,
      events,
    };
  }

  async getSummary(userId?: string): Promise<CalendarSummaryResponse> {
    const res = await api.get<any>(
      `/calendar/summary${buildQuery(userId ? { userId } : undefined)}`,
    );
    const data = res?.data || res;
    const todayEvents = Array.isArray(data?.todayEvents)
      ? data.todayEvents.map(normalizeCalendarEvent)
      : [];
    return {
      todayCount: data?.todayCount ?? todayEvents.length,
      weekCount: data?.weekCount ?? 0,
      overdueCount: data?.overdueCount ?? 0,
      upcomingMeetingsCount: data?.upcomingMeetingsCount ?? 0,
      todayEvents,
    };
  }

  /* ---------------- Event CRUD ---------------- */

  async scheduleEvent(
    payload: CreateCalendarEventPayload,
  ): Promise<CalendarEventItem> {
    const allowedScheduleTypes = ['MEETING', 'CALL', 'EMAIL', 'FOLLOW_UP', 'TASK'];
    const normalizedType = allowedScheduleTypes.includes(
      (payload.type || '').toUpperCase(),
    )
      ? (payload.type || 'MEETING').toUpperCase()
      : 'MEETING';

    const res = await api.post<any>('/calendar/schedule', {
      type: normalizedType,
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
      priority: payload.priority || 'MEDIUM',
      contactId: payload.contactId,
      leadId: payload.leadId,
      dealId: payload.dealId,
      assignedToId: payload.assignedToId,
    });

    const created = res?.data || res;
    if (payload.reminderMinutes !== undefined && created?.id) {
      this.setEventReminderOffset(created.id, payload.reminderMinutes);
    }

    return normalizeCalendarEvent({
      ...created,
      title: created?.subject || created?.title || payload.title,
      start: created?.scheduledAt || created?.dueDate || payload.startTime,
      category: normalizedType === 'TASK' ? 'TASK' : 'ACTIVITY',
      type: normalizedType,
    });
  }

  async getEventById(
    id: string,
    preferredCategory?: CalendarEventCategory,
  ): Promise<CalendarEventItem> {
    if (preferredCategory === 'DEAL') {
      const deal = await dealService.getDealById(id);
      return normalizeCalendarEvent({
        id: deal.id,
        title: `Deal Closing: ${deal.title}`,
        description: `Expected close date for ${deal.title}`,
        start: deal.expectedCloseDate || deal.createdAt,
        allDay: true,
        category: 'DEAL',
        type: 'DEAL_CLOSING',
        status: deal.status,
        priority: 'HIGH',
        contact: deal.contact,
        deal: { id: deal.id, title: deal.title, value: deal.value },
        assignedTo: deal.owner,
      });
    }

    const act = await activityService.getActivityById(
      id,
      preferredCategory === 'TASK' ? 'TASK' : undefined,
    );

    return normalizeCalendarEvent({
      id: act.id,
      title: act.subject,
      description: act.description,
      start: act.scheduledAt || act.createdAt,
      end: act.completedAt,
      allDay: act.recordSource === 'TASK',
      category: act.recordSource === 'TASK' ? 'TASK' : 'ACTIVITY',
      type: act.type,
      status: act.status,
      priority: act.priority,
      contactId: act.contactId,
      contact: act.contact,
      leadId: act.leadId,
      lead: act.lead,
      dealId: act.dealId,
      deal: act.deal,
      assignedToId: act.assignedToId,
      assignedTo: act.assignedTo,
    });
  }

  async updateEvent(
    id: string,
    payload: UpdateCalendarEventPayload,
    category: CalendarEventCategory = 'ACTIVITY',
  ): Promise<CalendarEventItem> {
    if (payload.reminderMinutes !== undefined) {
      this.setEventReminderOffset(id, payload.reminderMinutes);
    }

    const updated = await activityService.updateActivityRecord(
      id,
      {
        type: payload.type,
        subject: payload.title,
        description: payload.description,
        scheduledAt: payload.startTime,
        completedAt: payload.endTime,
        status: payload.status,
        priority: payload.priority,
        contactId: payload.contactId,
        leadId: payload.leadId,
        dealId: payload.dealId,
        assignedToId: payload.assignedToId,
      },
      category === 'TASK' ? 'TASK' : 'ACTIVITY',
    );

    return normalizeCalendarEvent({
      id: updated.id,
      title: updated.subject,
      description: updated.description,
      start: updated.scheduledAt || updated.createdAt,
      end: updated.completedAt,
      allDay: updated.recordSource === 'TASK',
      category: updated.recordSource === 'TASK' ? 'TASK' : 'ACTIVITY',
      type: updated.type,
      status: updated.status,
      priority: updated.priority,
      contactId: updated.contactId,
      contact: updated.contact,
      leadId: updated.leadId,
      lead: updated.lead,
      dealId: updated.dealId,
      deal: updated.deal,
      assignedToId: updated.assignedToId,
      assignedTo: updated.assignedTo,
    });
  }

  async toggleEventComplete(event: CalendarEventItem): Promise<CalendarEventItem> {
    if (event.category === 'DEAL') {
      return event;
    }
    const updated = await activityService.markActivityComplete({
      id: event.id,
      recordSource: event.category === 'TASK' ? 'TASK' : 'ACTIVITY',
      status: event.status,
    });
    return this.getEventById(updated.id, event.category);
  }

  async deleteEvent(
    id: string,
    category: CalendarEventCategory = 'ACTIVITY',
  ): Promise<{ message: string }> {
    return activityService.deleteActivityRecord(
      id,
      category === 'TASK' ? 'TASK' : 'ACTIVITY',
    );
  }

  /* ---------------- Reminders & Notifications ---------------- */

  setEventReminderOffset(eventId: string, offsetMinutes: ReminderOffsetMinutes) {
    const map = getStoredReminderMap();
    map[eventId] = {
      ...map[eventId],
      offsetMinutes,
      dismissed: false,
    };
    saveStoredReminderMap(map);
  }

  dismissReminder(eventId: string) {
    const map = getStoredReminderMap();
    map[eventId] = {
      offsetMinutes: map[eventId]?.offsetMinutes ?? 15,
      dismissed: true,
    };
    saveStoredReminderMap(map);
  }

  snoozeReminder(eventId: string, minutes = 15) {
    const map = getStoredReminderMap();
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    map[eventId] = {
      offsetMinutes: map[eventId]?.offsetMinutes ?? 15,
      dismissed: false,
      snoozedUntil,
    };
    saveStoredReminderMap(map);
  }

  async getUpcomingReminders(): Promise<CalendarReminderRecord[]> {
    const now = new Date();
    const next14Days = new Date(now);
    next14Days.setDate(now.getDate() + 14);

    const events = await this.getEvents({
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: next14Days.toISOString(),
    });

    const map = getStoredReminderMap();

    return events
      .filter((ev) => (ev.status || '').toUpperCase() !== 'COMPLETED')
      .map((ev) => {
        const stored = map[ev.id];
        const offsetMinutes: ReminderOffsetMinutes =
          stored?.offsetMinutes ?? ev.reminderMinutes ?? 15;
        const startMs = new Date(ev.start).getTime();
        const remindAtMs = startMs - offsetMinutes * 60 * 1000;
        return {
          id: `rem-${ev.id}`,
          eventId: ev.id,
          eventCategory: ev.category,
          eventTitle: ev.title,
          eventType: ev.type,
          eventStart: ev.start,
          offsetMinutes,
          remindAt: new Date(remindAtMs).toISOString(),
          dismissed: Boolean(stored?.dismissed),
          snoozedUntil: stored?.snoozedUntil || null,
        };
      })
      .filter((r) => !r.dismissed && r.offsetMinutes > 0)
      .sort(
        (a, b) =>
          new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime(),
      );
  }

  async getNotifications(): Promise<CrmNotificationItem[]> {
    try {
      const res = await api.get<any>('/notifications');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return list;
    } catch {
      return [];
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    await api.patch<any>(`/notifications/${id}/read`, {});
  }

  async markAllNotificationsRead(): Promise<void> {
    await api.patch<any>('/notifications/read-all', {});
  }

  /* ---------------- Lookups ---------------- */

  async getAssignableUsers(): Promise<CalendarUserRef[]> {
    return activityService.getAssignableUsers();
  }

  async getContactsLookup(): Promise<CalendarContactRef[]> {
    return activityService.getContactsLookup();
  }

  async getLeadsLookup(): Promise<CalendarLeadRef[]> {
    return activityService.getLeadsLookup();
  }

  async getDealsLookup(): Promise<CalendarDealRef[]> {
    return activityService.getDealsLookup();
  }
}

export const calendarService = new CalendarApiService();
export default calendarService;

