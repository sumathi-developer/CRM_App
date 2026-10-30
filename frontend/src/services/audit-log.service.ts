import { api } from './api';
import type {
  AuditLogEntry,
  AuditLogListResponse,
  AuditLogQueryFilters,
  AuditLogSummary,
  EntityAuditTrailResponse,
  ExportAuditLogsPayload,
} from '../types/audit-log.types';

class AuditLogService {
  /**
   * Fetch paginated audit logs with search and filtering
   */
  async getLogs(filters?: AuditLogQueryFilters): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();

    if (filters?.search?.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters?.q?.trim()) {
      params.append('q', filters.q.trim());
    }
    if (filters?.action) {
      params.append('action', filters.action);
    }
    if (filters?.entityType) {
      params.append('entityType', filters.entityType);
    }
    if (filters?.entityId?.trim()) {
      params.append('entityId', filters.entityId.trim());
    }
    if (filters?.userId?.trim()) {
      params.append('userId', filters.userId.trim());
    }
    if (filters?.workspaceId?.trim()) {
      params.append('workspaceId', filters.workspaceId.trim());
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    if (filters?.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters?.sortOrder) {
      params.append('sortOrder', filters.sortOrder);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<any>(`/audit-logs${queryString}`);

    // Standardize response payload format
    if (res?.data && res?.meta) {
      return {
        data: Array.isArray(res.data) ? res.data : [],
        meta: {
          total: Number(res.meta.total) || 0,
          page: Number(res.meta.page) || 1,
          limit: Number(res.meta.limit) || 20,
          totalPages: Number(res.meta.totalPages) || 1,
        },
      };
    }

    if (Array.isArray(res)) {
      return {
        data: res,
        meta: {
          total: res.length,
          page: 1,
          limit: res.length || 20,
          totalPages: 1,
        },
      };
    }

    return {
      data: Array.isArray(res?.data) ? res.data : [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
  }

  /**
   * Fetch statistical breakdown of audit logs
   */
  async getSummary(workspaceId?: string): Promise<AuditLogSummary> {
    const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
    const res = await api.get<any>(`/audit-logs/summary${query}`);

    const payload = res?.data ?? res;
    return {
      totalLogs: Number(payload?.totalLogs) || 0,
      successCount: Number(payload?.successCount) || 0,
      failureCount: Number(payload?.failureCount) || 0,
      warningCount: Number(payload?.warningCount) || 0,
      actionsBreakdown: payload?.actionsBreakdown || {},
      entitiesBreakdown: payload?.entitiesBreakdown || {},
      topActiveUsers: Array.isArray(payload?.topActiveUsers)
        ? payload.topActiveUsers
        : [],
      recentActivity: Array.isArray(payload?.recentActivity)
        ? payload.recentActivity
        : [],
    };
  }

  /**
   * Fetch single audit log entry by ID (read-only)
   */
  async getLogById(id: string): Promise<AuditLogEntry> {
    const res = await api.get<any>(`/audit-logs/${id}`);
    return res?.data ?? res;
  }

  /**
   * Fetch chronological audit history for a specific entity
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<EntityAuditTrailResponse> {
    const res = await api.get<any>(
      `/audit-logs/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}?limit=${limit}`,
    );
    const payload = res?.data ?? res;
    return {
      entityType: payload?.entityType || entityType,
      entityId: payload?.entityId || entityId,
      totalEntries: Number(payload?.totalEntries) || 0,
      history: Array.isArray(payload?.history) ? payload.history : [],
    };
  }

  /**
   * Export audit logs to CSV or JSON file and trigger browser download
   */
  async exportLogs(
    payload: ExportAuditLogsPayload,
  ): Promise<{ success: boolean; filename: string; count?: number }> {
    const format = payload.format === 'CSV' ? 'CSV' : 'JSON';
    const body: Record<string, any> = {
      format,
      limit: payload.limit || 500,
    };

    if (payload.search?.trim()) body.search = payload.search.trim();
    if (payload.action) body.action = payload.action;
    if (payload.entityType) body.entityType = payload.entityType;
    if (payload.entityId?.trim()) body.entityId = payload.entityId.trim();
    if (payload.userId?.trim()) body.userId = payload.userId.trim();
    if (payload.workspaceId?.trim()) body.workspaceId = payload.workspaceId.trim();
    if (payload.status) body.status = payload.status;
    if (payload.startDate) body.startDate = payload.startDate;
    if (payload.endDate) body.endDate = payload.endDate;

    const res = await api.post<any>('/audit-logs/export', body);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-logs-export-${timestamp}.${format.toLowerCase()}`;

    let blob: Blob;
    let count: number | undefined;

    if (format === 'CSV') {
      const csvContent = typeof res === 'string' ? res : res?.data || '';
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      count = csvContent ? csvContent.split('\n').length - 1 : 0;
    } else {
      const jsonData = res?.data ?? res;
      const jsonContent = JSON.stringify(jsonData, null, 2);
      blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      count = Array.isArray(jsonData) ? jsonData.length : undefined;
    }

    // Trigger browser file download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename, count };
  }
}

export const auditLogService = new AuditLogService();

