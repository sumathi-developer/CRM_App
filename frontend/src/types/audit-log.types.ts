/**
 * Audit Log Module Type Definitions
 * Maps to backend /audit-logs API and Prisma AuditLog schema.
 */

export type AuditLogAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'STATUS_CHANGE'
  | 'ASSIGN'
  | 'RESTORE'
  | 'VIEW';

export type AuditLogEntityType =
  | 'LEAD'
  | 'CONTACT'
  | 'COMPANY'
  | 'DEAL'
  | 'ACTIVITY'
  | 'TASK'
  | 'NOTE'
  | 'DOCUMENT'
  | 'USER'
  | 'ROLE'
  | 'WORKSPACE'
  | 'TAG'
  | 'CUSTOM_FIELD'
  | 'SETTING'
  | 'SYSTEM';

export type AuditLogStatus = 'SUCCESS' | 'FAILURE' | 'WARNING';

export interface AuditLogEntry {
  id: string;
  action: AuditLogAction | string;
  entityType: AuditLogEntityType | string;
  entityId: string | null;
  entityName: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  workspaceId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  status: AuditLogStatus;
  createdAt: string;
}

export interface AuditLogPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogListResponse {
  data: AuditLogEntry[];
  meta: AuditLogPaginationMeta;
}

export interface TopActiveUserStat {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  activityCount: number;
}

export interface AuditLogSummary {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
  actionsBreakdown: Record<string, number>;
  entitiesBreakdown: Record<string, number>;
  topActiveUsers: TopActiveUserStat[];
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    entityName: string | null;
    userName: string | null;
    userEmail: string | null;
    status: AuditLogStatus;
    createdAt: string;
  }>;
}

export type AuditScreenSlug =
  | 'all'
  | 'user-activity'
  | 'record-changes'
  | 'permission-changes'
  | 'login-history'
  | 'system-events';

export interface AuditLogQueryFilters {
  search?: string;
  q?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  workspaceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'entityType' | 'userEmail';
  sortOrder?: 'asc' | 'desc';
}

export interface ExportAuditLogsPayload extends AuditLogQueryFilters {
  format?: 'JSON' | 'CSV';
}

export interface EntityAuditTrailResponse {
  entityType: string;
  entityId: string;
  totalEntries: number;
  history: AuditLogEntry[];
}

