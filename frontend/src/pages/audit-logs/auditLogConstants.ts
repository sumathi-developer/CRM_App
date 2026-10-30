import type {
  AuditLogAction,
  AuditLogEntityType,
  AuditLogStatus,
  AuditScreenSlug,
} from '../../types/audit-log.types';

export interface AuditScreenMeta {
  slug: AuditScreenSlug;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
  defaultAction?: string;
  defaultEntityType?: string;
}

export const AUDIT_SCREENS_META: Record<AuditScreenSlug, AuditScreenMeta> = {
  all: {
    slug: 'all',
    label: 'All Activity Logs',
    shortLabel: 'All Logs',
    path: '/audit-logs/all',
    description:
      'Complete chronological trail of all user actions, data mutations, and system events.',
  },
  'user-activity': {
    slug: 'user-activity',
    label: 'User Activity',
    shortLabel: 'User Activity',
    path: '/audit-logs/user-activity',
    description:
      'Track actions initiated by team members across the CRM platform.',
  },
  'record-changes': {
    slug: 'record-changes',
    label: 'Record Changes',
    shortLabel: 'Record Changes',
    path: '/audit-logs/record-changes',
    description:
      'Audit log of creates, modifications, and deletions on CRM entities.',
  },
  'permission-changes': {
    slug: 'permission-changes',
    label: 'Permission Changes',
    shortLabel: 'Permission Changes',
    path: '/audit-logs/permission-changes',
    description:
      'Changes to roles, security settings, user assignments, and access policies.',
    defaultEntityType: 'ROLE',
  },
  'login-history': {
    slug: 'login-history',
    label: 'Login History',
    shortLabel: 'Login History',
    path: '/audit-logs/login-history',
    description:
      'Authentication history, session sign-ins, logouts, and client IP addresses.',
    defaultAction: 'LOGIN',
  },
  'system-events': {
    slug: 'system-events',
    label: 'System Events',
    shortLabel: 'System Events',
    path: '/audit-logs/system-events',
    description:
      'System-level actions, automated routines, data imports, and workspace configurations.',
    defaultEntityType: 'SYSTEM',
  },
};

export const AUDIT_NAV_ITEMS: AuditScreenMeta[] = [
  AUDIT_SCREENS_META.all,
  AUDIT_SCREENS_META['user-activity'],
  AUDIT_SCREENS_META['record-changes'],
  AUDIT_SCREENS_META['permission-changes'],
  AUDIT_SCREENS_META['login-history'],
  AUDIT_SCREENS_META['system-events'],
];

export const AUDIT_ACTIONS_LIST: Array<{
  value: AuditLogAction;
  label: string;
  color: string;
}> = [
  { value: 'CREATE', label: 'Created', color: 'emerald' },
  { value: 'UPDATE', label: 'Updated', color: 'blue' },
  { value: 'DELETE', label: 'Deleted', color: 'rose' },
  { value: 'LOGIN', label: 'Login', color: 'purple' },
  { value: 'LOGOUT', label: 'Logout', color: 'slate' },
  { value: 'EXPORT', label: 'Exported', color: 'amber' },
  { value: 'IMPORT', label: 'Imported', color: 'indigo' },
  { value: 'STATUS_CHANGE', label: 'Status Changed', color: 'teal' },
  { value: 'ASSIGN', label: 'Assigned', color: 'cyan' },
  { value: 'RESTORE', label: 'Restored', color: 'emerald' },
  { value: 'VIEW', label: 'Viewed', color: 'slate' },
];

export const AUDIT_ENTITIES_LIST: Array<{
  value: AuditLogEntityType;
  label: string;
}> = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'DEAL', label: 'Deal' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'TASK', label: 'Task' },
  { value: 'NOTE', label: 'Note' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role & Permissions' },
  { value: 'WORKSPACE', label: 'Workspace' },
  { value: 'TAG', label: 'Tag' },
  { value: 'CUSTOM_FIELD', label: 'Custom Field' },
  { value: 'SETTING', label: 'Setting' },
  { value: 'SYSTEM', label: 'System Event' },
];

export const AUDIT_STATUS_META: Record<
  AuditLogStatus,
  { label: string; badgeClass: string }
> = {
  SUCCESS: {
    label: 'Success',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  FAILURE: {
    label: 'Failed',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  WARNING: {
    label: 'Warning',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

/**
 * Format ISO string to human-friendly display date and time
 */
export function formatAuditDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Relative time calculation (e.g. "12m ago")
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

/**
 * Simple user agent parser to extract browser and operating system
 */
export function parseUserAgent(ua?: string | null): {
  browser: string;
  os: string;
} {
  if (!ua) return { browser: 'Unknown Client', os: 'Unknown OS' };

  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('PostmanRuntime')) browser = 'Postman API';
  else if (ua.includes('curl/')) browser = 'cURL';

  let os = 'OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('iPhone')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

/**
 * Get styling badge classes for an action
 */
export function getActionBadgeClass(action?: string): string {
  const norm = (action || '').toUpperCase();
  switch (norm) {
    case 'CREATE':
    case 'RESTORE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DELETE':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'LOGIN':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'LOGOUT':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'EXPORT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'IMPORT':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'STATUS_CHANGE':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'ASSIGN':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

/**
 * Get styling badge classes for an entity type
 */
export function getEntityBadgeClass(entityType?: string): string {
  const norm = (entityType || '').toUpperCase();
  switch (norm) {
    case 'LEAD':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'CONTACT':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'COMPANY':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'DEAL':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'ACTIVITY':
    case 'TASK':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'NOTE':
    case 'DOCUMENT':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'USER':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'ROLE':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'WORKSPACE':
    case 'SETTING':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'SYSTEM':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

