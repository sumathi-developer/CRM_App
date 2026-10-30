import type {
  ActivityContactRef,
  ActivityDealRef,
  ActivityLeadRef,
  ActivityRecordPriority,
  ActivityRecordStatus,
  ActivityUserRef,
} from './activity.types';

export type CalendarContactRef = ActivityContactRef;
export type CalendarDealRef = ActivityDealRef;
export type CalendarLeadRef = ActivityLeadRef;
export type CalendarEventPriority = ActivityRecordPriority;
export type CalendarEventStatus = ActivityRecordStatus;
export type CalendarUserRef = ActivityUserRef;

export type CalendarViewMode = 'month' | 'week' | 'day' | 'schedule';

export type CalendarEventCategory = 'ACTIVITY' | 'TASK' | 'DEAL';

export type CalendarEventType =
  | 'MEETING'
  | 'CALL'
  | 'FOLLOW_UP'
  | 'EMAIL'
  | 'TASK'
  | 'WHATSAPP'
  | 'DEAL_CLOSING';

export type ReminderOffsetMinutes = 0 | 5 | 15 | 30 | 60 | 1440;

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  start: string;
  end?: string | null;
  allDay: boolean;
  category: CalendarEventCategory;
  type: CalendarEventType | string;
  status: CalendarEventStatus | string;
  priority?: CalendarEventPriority | string;
  contactId?: string | null;
  contact?: ActivityContactRef | null;
  leadId?: string | null;
  lead?: ActivityLeadRef | null;
  dealId?: string | null;
  deal?: ActivityDealRef | null;
  assignedToId?: string | null;
  assignedTo?: ActivityUserRef | null;
  reminderMinutes?: ReminderOffsetMinutes;
}

export interface CalendarEventsQuery {
  start?: string;
  end?: string;
  type?: string;
  status?: string;
  userId?: string;
  contactId?: string;
  dealId?: string;
  leadId?: string;
}

export interface CalendarMonthResponse {
  year: number;
  month: number;
  totalEvents: number;
  pendingEvents: number;
  completedEvents: number;
  overdueEvents: number;
  events: CalendarEventItem[];
}

export interface CalendarWeekResponse {
  weekStart: string;
  weekEnd: string;
  totalEvents: number;
  events: CalendarEventItem[];
}

export interface CalendarDayResponse {
  date: string;
  totalEvents: number;
  events: CalendarEventItem[];
}

export interface CalendarSummaryResponse {
  todayCount: number;
  weekCount: number;
  overdueCount: number;
  upcomingMeetingsCount: number;
  todayEvents: CalendarEventItem[];
}

export interface CreateCalendarEventPayload {
  type: 'MEETING' | 'CALL' | 'EMAIL' | 'FOLLOW_UP' | 'TASK' | string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  priority?: CalendarEventPriority | string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedToId?: string;
  reminderMinutes?: ReminderOffsetMinutes;
}

export interface UpdateCalendarEventPayload {
  type?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: CalendarEventStatus | string;
  priority?: CalendarEventPriority | string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedToId?: string;
  reminderMinutes?: ReminderOffsetMinutes;
}

export interface CalendarReminderRecord {
  id: string;
  eventId: string;
  eventCategory: CalendarEventCategory;
  eventTitle: string;
  eventType: string;
  eventStart: string;
  offsetMinutes: ReminderOffsetMinutes;
  remindAt: string;
  dismissed?: boolean;
  snoozedUntil?: string | null;
}

export interface CrmNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' | string;
  isRead: boolean;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}
