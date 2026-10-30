import type {
  CalendarEventItem,
  CalendarEventType,
  CalendarViewMode,
  ReminderOffsetMinutes,
} from '../../types/calendar.types';

export const CALENDAR_EVENT_TYPE_OPTIONS: Array<{
  value: CalendarEventType;
  label: string;
}> = [
  { value: 'MEETING', label: 'Meeting' },
  { value: 'CALL', label: 'Call' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TASK', label: 'Task' },
  { value: 'DEAL_CLOSING', label: 'Deal Closing' },
];

export const SCHEDULABLE_EVENT_TYPE_OPTIONS: Array<{
  value: 'MEETING' | 'CALL' | 'FOLLOW_UP' | 'EMAIL' | 'TASK';
  label: string;
}> = [
  { value: 'MEETING', label: 'Meeting' },
  { value: 'CALL', label: 'Call' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TASK', label: 'Task' },
];

export const REMINDER_OFFSET_OPTIONS: Array<{
  value: ReminderOffsetMinutes;
  label: string;
}> = [
  { value: 0, label: 'No Reminder' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export const MEETING_DURATION_OPTIONS: Array<{
  value: number;
  label: string;
}> = [
  { value: 15, label: '15 Minutes (Quick Sync)' },
  { value: 30, label: '30 Minutes (Discovery Call)' },
  { value: 45, label: '45 Minutes (Product Demo)' },
  { value: 60, label: '60 Minutes (Executive Review)' },
  { value: 90, label: '90 Minutes (Deep Dive Workshop)' },
];

export const WEEKDAY_SHORT_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function calendarEventTone(
  type?: string | null,
): 'purple' | 'blue' | 'amber' | 'green' | 'red' | 'slate' {
  switch ((type || '').toUpperCase()) {
    case 'MEETING':
      return 'purple';
    case 'CALL':
      return 'blue';
    case 'FOLLOW_UP':
      return 'amber';
    case 'EMAIL':
      return 'green';
    case 'TASK':
      return 'blue';
    case 'DEAL_CLOSING':
      return 'green';
    default:
      return 'slate';
  }
}

export function isCalendarEventOverdue(event: CalendarEventItem): boolean {
  const status = (event.status || '').toUpperCase();
  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'WON') {
    return false;
  }
  return new Date(event.start).getTime() < Date.now();
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateInputString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeOnly(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function stepCalendarDate(
  current: Date,
  view: CalendarViewMode,
  direction: -1 | 1,
): Date {
  const next = new Date(current);
  if (view === 'month') {
    next.setMonth(next.getMonth() + direction);
  } else if (view === 'week' || view === 'schedule') {
    next.setDate(next.getDate() + direction * 7);
  } else {
    next.setDate(next.getDate() + direction);
  }
  return next;
}

export function formatCalendarHeaderRange(
  focusDate: Date,
  view: CalendarViewMode,
): string {
  if (view === 'month') {
    return `${MONTH_NAMES[focusDate.getMonth()]} ${focusDate.getFullYear()}`;
  }
  if (view === 'day') {
    return focusDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  const weekDays = buildWeekDays(focusDate);
  const start = weekDays[0];
  const end = weekDays[6];
  return `${start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} – ${end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export interface CalendarGridCell {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function buildMonthGridDays(year: number, month1To12: number): CalendarGridCell[] {
  const today = new Date();
  const firstOfMonth = new Date(year, month1To12 - 1, 1);
  const startOffset = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const gridStart = new Date(year, month1To12 - 1, 1 - startOffset);

  const cells: CalendarGridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      dateKey: toDateInputString(d),
      isCurrentMonth: d.getMonth() === month1To12 - 1,
      isToday: isSameCalendarDay(d, today),
    });
  }
  return cells;
}

export function buildWeekDays(focusDate: Date): Date[] {
  const start = new Date(focusDate);
  start.setDate(focusDate.getDate() - focusDate.getDay());
  start.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function getCalendarEventRelatedLinks(event: CalendarEventItem): Array<{
  entityType: 'Deal' | 'Contact' | 'Lead';
  id: string;
  label: string;
  path: string;
}> {
  const list: Array<{
    entityType: 'Deal' | 'Contact' | 'Lead';
    id: string;
    label: string;
    path: string;
  }> = [];

  if (event.deal || event.dealId) {
    const id = event.deal?.id || event.dealId || '';
    if (id) {
      list.push({
        entityType: 'Deal',
        id,
        label: event.deal?.title || 'Linked Deal',
        path: `/deals/${id}`,
      });
    }
  }

  if (event.contact || event.contactId) {
    const id = event.contact?.id || event.contactId || '';
    if (id) {
      const name = event.contact
        ? `${event.contact.firstName || ''} ${event.contact.lastName || ''}`.trim()
        : '';
      list.push({
        entityType: 'Contact',
        id,
        label: name || event.contact?.email || 'Linked Contact',
        path: `/contacts/${id}`,
      });
    }
  }

  if (event.lead || event.leadId) {
    const id = event.lead?.id || event.leadId || '';
    if (id) {
      list.push({
        entityType: 'Lead',
        id,
        label: event.lead?.title || event.lead?.companyName || 'Linked Lead',
        path: `/leads/${id}`,
      });
    }
  }

  return list;
}

