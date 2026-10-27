import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { ExportAuditLogsDto } from './dto/export-audit-logs.dto';
import { AuditLogCleanupDto } from './dto/audit-log-cleanup.dto';
import { AuditStatus } from './enums/audit-status.enum';
import { AuditLogSummary } from './interfaces/audit-summary.interface';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to extract client IP from express request or forwarded headers
   */
  private extractIp(req?: any): string | null {
    if (!req) return null;
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || null;
  }

  /**
   * Record a new audit log entry
   */
  async create(dto: CreateAuditLogDto, currentUser?: any, req?: any) {
    const userId = currentUser?.id ?? null;
    const userEmail = currentUser?.email ?? null;
    const userName =
      currentUser?.name ??
      (currentUser?.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : null);

    const workspaceId =
      dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    const ipAddress = dto.ipAddress ?? this.extractIp(req);
    const userAgent = dto.userAgent ?? (req?.headers?.['user-agent'] as string) ?? null;

    const log = await this.prisma.auditLog.create({
      data: {
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId ?? null,
        entityName: dto.entityName ?? null,
        userId,
        userEmail,
        userName,
        workspaceId,
        details: dto.details ?? {},
        ipAddress,
        userAgent,
        status: dto.status ?? AuditStatus.SUCCESS,
      },
    });

    this.logger.log(
      `[AuditLog] ${log.action} on ${log.entityType}${log.entityId ? ` (${log.entityId})` : ''} by ${userEmail || 'System'} - Status: ${log.status}`,
    );

    return log;
  }

  /**
   * List all audit logs with multi-field search, filtering, and pagination
   */
  async findAll(query: AuditLogQueryDto, currentUser?: any) {
    const {
      search,
      q,
      action,
      entityType,
      entityId,
      userId,
      workspaceId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const searchTerm = (search || q)?.trim();
    const targetWorkspaceId = workspaceId ?? currentUser?.activeWorkspaceId;

    const where: any = {};

    if (targetWorkspaceId) {
      where.workspaceId = targetWorkspaceId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (searchTerm) {
      where.OR = [
        { userEmail: { contains: searchTerm, mode: 'insensitive' } },
        { userName: { contains: searchTerm, mode: 'insensitive' } },
        { entityName: { contains: searchTerm, mode: 'insensitive' } },
        { action: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single audit log details by ID
   */
  async findOne(id: string, workspaceId?: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Audit log entry with ID "${id}" not found`);
    }

    if (workspaceId && log.workspaceId && log.workspaceId !== workspaceId) {
      throw new NotFoundException(
        `Audit log entry with ID "${id}" not found in this workspace`,
      );
    }

    return log;
  }

  /**
   * Get chronological audit trail history for a specific CRM entity
   */
  async getEntityAuditTrail(
    entityTypeInput: string,
    entityId: string,
    limit = 50,
  ) {
    if (!entityTypeInput || !entityId) {
      throw new BadRequestException('entityType and entityId are required');
    }

    const entityType = entityTypeInput.toUpperCase().trim();

    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 200),
    });

    return {
      entityType,
      entityId,
      totalEntries: logs.length,
      history: logs,
    };
  }

  /**
   * Compute audit log statistics and activity metrics
   */
  async getSummary(workspaceId?: string): Promise<AuditLogSummary> {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const [
      totalLogs,
      successCount,
      failureCount,
      warningCount,
      actionGroups,
      entityGroups,
      userGroups,
      recentLogs,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({
        where: { ...where, status: AuditStatus.SUCCESS },
      }),
      this.prisma.auditLog.count({
        where: { ...where, status: AuditStatus.FAILURE },
      }),
      this.prisma.auditLog.count({
        where: { ...where, status: AuditStatus.WARNING },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { _all: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { _all: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId', 'userEmail', 'userName'],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: { _all: true },
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 5,
      }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          entityName: true,
          userName: true,
          userEmail: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const actionsBreakdown: Record<string, number> = {};
    for (const ag of actionGroups) {
      actionsBreakdown[ag.action] = ag._count._all;
    }

    const entitiesBreakdown: Record<string, number> = {};
    for (const eg of entityGroups) {
      entitiesBreakdown[eg.entityType] = eg._count._all;
    }

    const topActiveUsers = userGroups.map((ug) => ({
      userId: ug.userId,
      userEmail: ug.userEmail,
      userName: ug.userName,
      activityCount: ug._count._all,
    }));

    return {
      totalLogs,
      successCount,
      failureCount,
      warningCount,
      actionsBreakdown,
      entitiesBreakdown,
      topActiveUsers,
      recentActivity: recentLogs,
    };
  }

  /**
   * Export audit logs in JSON or RFC 4180 CSV format
   */
  async exportLogs(dto: ExportAuditLogsDto, currentUser?: any) {
    const { format = 'JSON', ...queryParams } = dto;

    // Fetch matching logs with limit up to 1000
    const query = {
      ...queryParams,
      page: 1,
      limit: Math.min(queryParams.limit ?? 500, 1000),
    };

    const result = await this.findAll(query, currentUser);
    const logs = result.data;

    if (format === 'CSV') {
      const headers = [
        'ID',
        'Timestamp',
        'Action',
        'Entity Type',
        'Entity ID',
        'Entity Name',
        'User Name',
        'User Email',
        'Status',
        'IP Address',
        'Details',
      ];

      const csvRows = logs.map((log) => {
        const detailsString = log.details
          ? JSON.stringify(log.details).replace(/"/g, '""')
          : '';
        return [
          `"${log.id}"`,
          `"${log.createdAt.toISOString()}"`,
          `"${log.action}"`,
          `"${log.entityType}"`,
          `"${log.entityId || ''}"`,
          `"${(log.entityName || '').replace(/"/g, '""')}"`,
          `"${(log.userName || '').replace(/"/g, '""')}"`,
          `"${log.userEmail || ''}"`,
          `"${log.status}"`,
          `"${log.ipAddress || ''}"`,
          `"${detailsString}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\r\n');

      return {
        format: 'CSV',
        filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
        count: logs.length,
        content: csvContent,
      };
    }

    return {
      format: 'JSON',
      filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.json`,
      count: logs.length,
      data: logs,
    };
  }

  /**
   * Retention Cleanup: Purge logs older than X days
   */
  async cleanup(dto: AuditLogCleanupDto, currentUser?: any) {
    const days = dto.olderThanDays ?? 90;
    if (days < 7) {
      throw new BadRequestException('Retention period cannot be less than 7 days');
    }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const targetWorkspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId;

    const where: any = {
      createdAt: {
        lt: cutoff,
      },
    };

    if (targetWorkspaceId) {
      where.workspaceId = targetWorkspaceId;
    }

    const deleteResult = await this.prisma.auditLog.deleteMany({
      where,
    });

    this.logger.log(
      `[AuditLog] Purged ${deleteResult.count} logs older than ${days} days (cutoff: ${cutoff.toISOString()}) by user ${currentUser?.email || 'admin'}`,
    );

    return {
      message: `Successfully purged ${deleteResult.count} audit log records older than ${days} days`,
      deletedCount: deleteResult.count,
      olderThanDays: days,
      cutoffDate: cutoff.toISOString(),
      workspaceId: targetWorkspaceId ?? null,
    };
  }
}
