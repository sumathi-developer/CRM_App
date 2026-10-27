export interface AuditLogSummary {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  warningCount: number;
  actionsBreakdown: Record<string, number>;
  entitiesBreakdown: Record<string, number>;
  topActiveUsers: Array<{
    userId: string | null;
    userEmail: string | null;
    userName: string | null;
    activityCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    entityName: string | null;
    userName: string | null;
    userEmail: string | null;
    status: string;
    createdAt: Date;
  }>;
}
