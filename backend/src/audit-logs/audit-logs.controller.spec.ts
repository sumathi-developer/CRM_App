import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditAction } from './enums/audit-action.enum';
import { AuditEntityType } from './enums/audit-entity-type.enum';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let serviceMock: Partial<AuditLogsService>;

  beforeEach(() => {
    serviceMock = {
      create: vi.fn().mockResolvedValue({
        id: 'log-1',
        action: AuditAction.CREATE,
        entityType: AuditEntityType.LEAD,
      }),
      findAll: vi.fn().mockResolvedValue({
        data: [{ id: 'log-1', action: AuditAction.CREATE }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
      findOne: vi.fn().mockResolvedValue({
        id: 'log-1',
        action: AuditAction.CREATE,
      }),
      getSummary: vi.fn().mockResolvedValue({
        totalLogs: 100,
        successCount: 95,
        failureCount: 5,
        warningCount: 0,
        actionsBreakdown: { CREATE: 60, UPDATE: 40 },
        entitiesBreakdown: { LEAD: 70, DEAL: 30 },
        topActiveUsers: [],
        recentActivity: [],
      }),
      getEntityAuditTrail: vi.fn().mockResolvedValue({
        entityType: 'LEAD',
        entityId: 'lead-1',
        totalEntries: 1,
        history: [{ id: 'log-1', action: AuditAction.CREATE }],
      }),
      exportLogs: vi.fn().mockResolvedValue({
        format: 'JSON',
        count: 1,
        data: [{ id: 'log-1' }],
      }),
      cleanup: vi.fn().mockResolvedValue({
        message: 'Successfully purged 10 audit log records older than 90 days',
        deletedCount: 10,
        olderThanDays: 90,
      }),
    };

    controller = new AuditLogsController(serviceMock as AuditLogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate create call to service', async () => {
      const dto = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.LEAD,
      };
      const user = { id: 'u-1', email: 'u1@crm.com' };
      const req = { ip: '127.0.0.1' } as any;

      const result = await controller.create(dto, user, req);

      expect(serviceMock.create).toHaveBeenCalledWith(dto, user, req);
      expect(result).toHaveProperty('id', 'log-1');
    });
  });

  describe('findAll', () => {
    it('should delegate findAll call to service', async () => {
      const query = { page: 1, limit: 10 };
      const user = { id: 'u-1' };

      const result = await controller.findAll(query, user);

      expect(serviceMock.findAll).toHaveBeenCalledWith(query, user);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    it('should delegate getSummary call to service', async () => {
      const result = await controller.getSummary('ws-1');

      expect(serviceMock.getSummary).toHaveBeenCalledWith('ws-1');
      expect(result.totalLogs).toBe(100);
    });
  });

  describe('exportLogs', () => {
    it('should delegate exportLogs call to service', async () => {
      const dto = { format: 'JSON' as const };
      const user = { id: 'u-1' };

      const result = await controller.exportLogs(dto, user);

      expect(serviceMock.exportLogs).toHaveBeenCalledWith(dto, user);
      expect(result.format).toBe('JSON');
    });
  });

  describe('cleanup', () => {
    it('should delegate cleanup call to service', async () => {
      const dto = { olderThanDays: 90 };
      const user = { id: 'u-1' };

      const result = await controller.cleanup(dto, user);

      expect(serviceMock.cleanup).toHaveBeenCalledWith(dto, user);
      expect(result.deletedCount).toBe(10);
    });
  });

  describe('getEntityAuditTrail', () => {
    it('should delegate getEntityAuditTrail call to service', async () => {
      const result = await controller.getEntityAuditTrail('LEAD', 'lead-1', 50);

      expect(serviceMock.getEntityAuditTrail).toHaveBeenCalledWith(
        'LEAD',
        'lead-1',
        50,
      );
      expect(result.entityType).toBe('LEAD');
    });
  });

  describe('findOne', () => {
    it('should delegate findOne call to service', async () => {
      const result = await controller.findOne('log-1');

      expect(serviceMock.findOne).toHaveBeenCalledWith('log-1');
      expect(result.id).toBe('log-1');
    });
  });
});
