import type {
  ActivityDateFilter,
  ActivityItemType,
  ActivityRecord,
  ActivityRecordPriority,
  ActivityRecordStatus,
  ActivitySortField,
  SortDirection,
} from '../../types/activity.types';

export const ACTIVITY_ITEM_TYPE_OPTIONS: Array<{
  value: ActivityItemType;
  label: string;
}> = [
  { value: 'CALL', label: 'Call' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TASK', label: 'Task' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

export const ACTIVITY_RECORD_STATUS_OPTIONS: Array<{
  value: ActivityRecordStatus;
  label: string;
}> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const ACTIVITY_RECORD_PRIORITY_OPTIONS: Array<{
  value: ActivityRecordPriority;
  label: string;
}> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export const ACTIVITY_DATE_FILTER_OPTIONS: Array<{
  value: ActivityDateFilter;
  label: string;
}> = [
  { value: 'ALL', label: 'All Dates' },
  { value: 'TODAY', label: 'Due Today' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'CUSTOM', label: 'Custom Date Range' },
];

export const ACTIVITY_SORT_OPTIONS: Array<{
  value: ActivitySortField;
  label: string;
}> = [
  { value: 'scheduledAt', label: 'Due / Scheduled Date' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'subject', label: 'Subject / Title' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Activity Type' },
];

export function isActivityOverdue(activity: ActivityRecord): boolean {
  const status = (activity.status || '').toUpperCase();
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  if (!activity.scheduledAt) return false;
  return new Date(activity.scheduledAt).getTime() < Date.now();
}

export function activityTypeTone(
  type?: string | null,
): 'blue' | 'purple' | 'green' | 'amber' | 'slate' {
  switch ((type || '').toUpperCase()) {
    case 'CALL':
      return 'blue';
    case 'MEETING':
      return 'purple';
    case 'FOLLOW_UP':
      return 'amber';
    case 'EMAIL':
      return 'green';
    case 'TASK':
      return 'blue';
    case 'WHATSAPP':
      return 'green';
    default:
      return 'slate';
  }
}

export function activityRecordStatusTone(
  status?: string | null,
  overdue = false,
): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'green';
  if (normalized === 'CANCELLED') return 'slate';
  if (overdue) return 'red';
  if (normalized === 'IN_PROGRESS') return 'blue';
  return 'amber';
}

export function activityRecordPriorityTone(
  priority?: string | null,
): 'red' | 'amber' | 'blue' | 'slate' {
  switch ((priority || '').toUpperCase()) {
    case 'URGENT':
    case 'HIGH':
      return 'red';
    case 'MEDIUM':
      return 'amber';
    case 'LOW':
      return 'blue';
    default:
      return 'slate';
  }
}

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export interface RelatedCrmRecordInfo {
  entityType: 'Lead' | 'Contact' | 'Deal';
  id: string;
  label: string;
  path: string;
}

export function getRelatedRecords(activity: ActivityRecord): RelatedCrmRecordInfo[] {
  const links: RelatedCrmRecordInfo[] = [];

  if (activity.deal || activity.dealId) {
    const id = activity.deal?.id || activity.dealId || '';
    if (id) {
      links.push({
        entityType: 'Deal',
        id,
        label: activity.deal?.title || 'Linked Deal',
        path: `/deals/${id}`,
      });
    }
  }

  if (activity.contact || activity.contactId) {
    const id = activity.contact?.id || activity.contactId || '';
    if (id) {
      const name = activity.contact
        ? `${activity.contact.firstName || ''} ${activity.contact.lastName || ''}`.trim()
        : '';
      links.push({
        entityType: 'Contact',
        id,
        label: name || activity.contact?.email || 'Linked Contact',
        path: `/contacts/${id}`,
      });
    }
  }

  if (activity.lead || activity.leadId) {
    const id = activity.lead?.id || activity.leadId || '';
    if (id) {
      links.push({
        entityType: 'Lead',
        id,
        label:
          activity.lead?.title ||
          activity.lead?.companyName ||
          'Linked Lead',
        path: `/leads/${id}`,
      });
    }
  }

  return links;
}

export function computeActivityMetrics(activities: ActivityRecord[]) {
  const total = activities.length;
  const completedCount = activities.filter(
    (a) => (a.status || '').toUpperCase() === 'COMPLETED',
  ).length;
  const pendingCount = activities.filter((a) => {
    const st = (a.status || '').toUpperCase();
    return st === 'PENDING' || st === 'IN_PROGRESS';
  }).length;
  const overdueCount = activities.filter(isActivityOverdue).length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const dueTodayCount = activities.filter((a) => {
    if (!a.scheduledAt) return false;
    const t = new Date(a.scheduledAt).getTime();
    return t >= startOfToday.getTime() && t <= endOfToday.getTime();
  }).length;

  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return {
    total,
    completedCount,
    pendingCount,
    overdueCount,
    dueTodayCount,
    completionRate,
  };
}

export function filterAndSortActivities(
  activities: ActivityRecord[],
  options: {
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    relatedEntityFilter?: '' | 'LEAD' | 'CONTACT' | 'DEAL';
    dateFilter?: ActivityDateFilter;
    fromDate?: string;
    toDate?: string;
    onlyOverdue?: boolean;
    sortField?: ActivitySortField;
    sortDirection?: SortDirection;
  },
): ActivityRecord[] {
  const {
    search = '',
    type = '',
    status = '',
    priority = '',
    assignedToId = '',
    relatedEntityFilter = '',
    dateFilter = 'ALL',
    fromDate = '',
    toDate = '',
    onlyOverdue = false,
    sortField = 'scheduledAt',
    sortDirection = 'desc',
  } = options;

  const q = search.trim().toLowerCase();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  const filtered = activities.filter((act) => {
    if (type && (act.type || '').toUpperCase() !== type.toUpperCase()) {
      return false;
    }
    if (status && (act.status || '').toUpperCase() !== status.toUpperCase()) {
      return false;
    }
    if (priority && (act.priority || '').toUpperCase() !== priority.toUpperCase()) {
      return false;
    }
    if (assignedToId && act.assignedToId !== assignedToId) {
      return false;
    }
    if (relatedEntityFilter === 'LEAD' && !act.leadId && !act.lead) {
      return false;
    }
    if (relatedEntityFilter === 'CONTACT' && !act.contactId && !act.contact) {
      return false;
    }
    if (relatedEntityFilter === 'DEAL' && !act.dealId && !act.deal) {
      return false;
    }

    if (onlyOverdue && !isActivityOverdue(act)) {
      return false;
    }

    if (dateFilter !== 'ALL') {
      if (dateFilter === 'OVERDUE') {
        if (!isActivityOverdue(act)) return false;
      } else if (!act.scheduledAt) {
        return false;
      } else {
        const ts = new Date(act.scheduledAt).getTime();
        if (dateFilter === 'TODAY') {
          if (ts < startOfToday.getTime() || ts > endOfToday.getTime()) return false;
        } else if (dateFilter === 'UPCOMING') {
          if (ts <= now.getTime() || (act.status || '').toUpperCase() === 'COMPLETED') {
            return false;
          }
        } else if (dateFilter === 'THIS_WEEK') {
          if (ts < startOfToday.getTime() || ts > endOfWeek.getTime()) return false;
        } else if (dateFilter === 'CUSTOM') {
          if (fromDate) {
            const fromTs = new Date(fromDate).setHours(0, 0, 0, 0);
            if (ts < fromTs) return false;
          }
          if (toDate) {
            const toTs = new Date(toDate).setHours(23, 59, 59, 999);
            if (ts > toTs) return false;
          }
        }
      }
    }

    if (q) {
      const hay = [
        act.subject,
        act.description || '',
        act.type,
        act.status,
        act.priority,
        act.assignedTo?.name || '',
        act.assignedTo?.email || '',
        act.contact?.firstName || '',
        act.contact?.lastName || '',
        act.lead?.title || '',
        act.lead?.companyName || '',
        act.deal?.title || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  const dir = sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (sortField) {
      case 'priority': {
        const wA = PRIORITY_WEIGHT[(a.priority || '').toUpperCase()] || 0;
        const wB = PRIORITY_WEIGHT[(b.priority || '').toUpperCase()] || 0;
        return dir * (wA - wB);
      }
      case 'subject':
        return dir * (a.subject || '').localeCompare(b.subject || '');
      case 'status':
        return dir * (a.status || '').localeCompare(b.status || '');
      case 'type':
        return dir * (a.type || '').localeCompare(b.type || '');
      case 'createdAt': {
        const cA = new Date(a.createdAt || 0).getTime();
        const cB = new Date(b.createdAt || 0).getTime();
        return dir * (cA - cB);
      }
      case 'scheduledAt':
      default: {
        const tA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
        const tB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
        return dir * (tA - tB);
      }
    }
  });
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateActivitiesCsv(activities: ActivityRecord[]): string {
  const cols = [
    'id',
    'type',
    'subject',
    'status',
    'priority',
    'scheduledAt',
    'completedAt',
    'overdue',
    'assignee',
    'relatedRecords',
    'description',
    'createdAt',
  ];

  const rows = activities.map((act) => {
    const related = getRelatedRecords(act)
      .map((r) => `${r.entityType}: ${r.label}`)
      .join(' | ');
    return [
      act.id,
      act.type,
      act.subject,
      act.status,
      act.priority,
      act.scheduledAt || '',
      act.completedAt || '',
      isActivityOverdue(act) ? 'YES' : 'NO',
      act.assignedTo?.name || act.assignedTo?.email || '',
      related,
      act.description || '',
      act.createdAt,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [cols.join(','), ...rows].join('\n');
}

