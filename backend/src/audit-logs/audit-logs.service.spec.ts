import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditAction } from './enums/audit-action.enum';
import { AuditEntityType } from './enums/audit-entity-type.enum';
import { AuditStatus } from './enums/audit-status.enum';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      auditLog: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    service = new AuditLogsService(prismaMock);
  });

  describe('create', () => {
    it('should create an audit log with user context and IP', async () => {
      const mockCreated = {
        id: 'log-1',
        action: AuditAction.CREATE,
        entityType: AuditEntityType.LEAD,
        entityId: 'lead-1',
        entityName: 'Acme Lead',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userName: 'John Doe',
        workspaceId: 'ws-1',
        details: { status: 'NEW' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: AuditStatus.SUCCESS,
        createdAt: new Date(),
      };

      prismaMock.auditLog.create.mockResolvedValue(mockCreated);

      const result = await service.create(
        {
          action: AuditAction.CREATE,
          entityType: AuditEntityType.LEAD,
          entityId: 'lead-1',
          entityName: 'Acme Lead',
          details: { status: 'NEW' },
        },
        {
          id: 'user-1',
          email: 'user@example.com',
          name: 'John Doe',
          activeWorkspaceId: 'ws-1',
        },
        {
          ip: '192.168.1.1',
          headers: { 'user-agent': 'Mozilla/5.0' },
        },
      );

      expect(result.id).toBe('log-1');
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.CREATE,
            entityType: AuditEntityType.LEAD,
            userId: 'user-1',
            userEmail: 'user@example.com',
            userName: 'John Doe',
            ipAddress: '192.168.1.1',
          }),
        }),
      );
    });

    it('should handle system action without current user', async () => {
      prismaMock.auditLog.create.mockResolvedValue({
        id: 'log-2',
        action: AuditAction.DELETE,
        entityType: AuditEntityType.SYSTEM,
        status: AuditStatus.SUCCESS,
      });

      const result = await service.create({
        action: AuditAction.DELETE,
        entityType: AuditEntityType.SYSTEM,
      });

      expect(result.id).toBe('log-2');
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null,
            userEmail: null,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs with metadata', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.DEAL,
          createdAt: new Date(),
        },
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);
      prismaMock.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'deal',
        action: AuditAction.UPDATE,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should apply date range filters', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.auditLog.count.mockResolvedValue(0);

      await service.findAll({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.999Z',
      });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return audit log by ID', async () => {
      prismaMock.auditLog.findUnique.mockResolvedValue({
        id: 'log-1',
        action: AuditAction.LOGIN,
      });

      const result = await service.findOne('log-1');
      expect(result.id).toBe('log-1');
    });

    it('should throw NotFoundException if log not found', async () => {
      prismaMock.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEntityAuditTrail', () => {
    it('should return chronological history for a CRM entity', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: AuditAction.UPDATE, createdAt: new Date() },
        { id: 'log-2', action: AuditAction.CREATE, createdAt: new Date() },
      ]);

      const result = await service.getEntityAuditTrail('LEAD', 'lead-123');

      expect(result.entityType).toBe('LEAD');
      expect(result.entityId).toBe('lead-123');
      expect(result.totalEntries).toBe(2);
      expect(result.history).toHaveLength(2);
    });

    it('should throw BadRequestException if entityType or entityId missing', async () => {
      await expect(
        service.getEntityAuditTrail('', 'lead-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSummary', () => {
    it('should return audit analytics summary', async () => {
      prismaMock.auditLog.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(45) // success
        .mockResolvedValueOnce(4) // failure
        .mockResolvedValueOnce(1); // warning

      prismaMock.auditLog.groupBy
        .mockResolvedValueOnce([
          { action: 'CREATE', _count: { _all: 30 } },
          { action: 'UPDATE', _count: { _all: 20 } },
        ])
        .mockResolvedValueOnce([
          { entityType: 'LEAD', _count: { _all: 35 } },
          { entityType: 'DEAL', _count: { _all: 15 } },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'u-1',
            userEmail: 'u1@crm.com',
            userName: 'User 1',
            _count: { _all: 25 },
          },
        ]);

      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: 'CREATE',
          entityType: 'LEAD',
          createdAt: new Date(),
        },
      ]);

      const summary = await service.getSummary('ws-1');

      expect(summary.totalLogs).toBe(50);
      expect(summary.successCount).toBe(45);
      expect(summary.failureCount).toBe(4);
      expect(summary.warningCount).toBe(1);
      expect(summary.actionsBreakdown.CREATE).toBe(30);
      expect(summary.entitiesBreakdown.LEAD).toBe(35);
      expect(summary.topActiveUsers).toHaveLength(1);
      expect(summary.topActiveUsers[0].userEmail).toBe('u1@crm.com');
      expect(summary.recentActivity).toHaveLength(1);
    });
  });

  describe('exportLogs', () => {
    it('should export audit logs in JSON format', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: AuditAction.LOGIN,
          createdAt: new Date(),
        },
      ]);
      prismaMock.auditLog.count.mockResolvedValue(1);

      const result = await service.exportLogs({ format: 'JSON' });

      expect(result.format).toBe('JSON');
      expect(result.count).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should export audit logs in CSV format with RFC 4180 escaping', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.COMPANY,
          entityId: 'org-1',
          entityName: 'Acme "Global" Inc.',
          userName: 'John "Admin" Doe',
          userEmail: 'admin@acme.com',
          status: AuditStatus.SUCCESS,
          ipAddress: '10.0.0.1',
          details: { field: 'name' },
          createdAt: new Date('2026-01-15T10:00:00.000Z'),
        },
      ]);
      prismaMock.auditLog.count.mockResolvedValue(1);

      const result = await service.exportLogs({ format: 'CSV' });

      expect(result.format).toBe('CSV');
      expect(result.count).toBe(1);
      expect(result.content).toContain('ID,Timestamp,Action');
      expect(result.content).toContain('Acme ""Global"" Inc.');
      expect(result.content).toContain('admin@acme.com');
    });
  });

  describe('cleanup (retention policy)', () => {
    it('should purge logs older than specified days', async () => {
      prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 120 });

      const result = await service.cleanup({ olderThanDays: 60 });

      expect(result.deletedCount).toBe(120);
      expect(result.olderThanDays).toBe(60);
      expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lt: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should reject retention periods under 7 days', async () => {
      await expect(service.cleanup({ olderThanDays: 3 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
