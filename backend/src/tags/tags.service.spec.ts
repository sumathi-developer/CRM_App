import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagStatus } from './enums/tag-status.enum';
import { TagEntityType } from './enums/tag-entity-type.enum';

describe('TagsService', () => {
  let service: TagsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      tag: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      tagAssignment: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        groupBy: vi.fn(),
      },
      lead: {
        findUnique: vi.fn(),
      },
      contact: {
        findUnique: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
      },
      deal: {
        findUnique: vi.fn(),
      },
      activity: {
        findUnique: vi.fn(),
      },
      fileRecord: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((promises) => Promise.all(promises)),
    };

    service = new TagsService(prismaMock);
  });

  describe('create', () => {
    it('should create a tag successfully with defaults and trimmed name', async () => {
      prismaMock.tag.findFirst.mockResolvedValue(null);
      prismaMock.tag.create.mockResolvedValue({
        id: 'tag-1',
        name: 'Enterprise Lead',
        color: '#3b82f6',
        description: 'Large enterprise deals',
        status: TagStatus.ACTIVE,
        isProtected: false,
        workspaceId: 'ws-1',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { assignments: 0 },
      });

      const result = await service.create(
        {
          name: '  Enterprise Lead  ',
          description: 'Large enterprise deals',
          workspaceId: 'ws-1',
        },
        { id: 'user-1' },
      );

      expect(result.id).toBe('tag-1');
      expect(result.name).toBe('Enterprise Lead');
      expect(result.usageCount).toBe(0);
      expect(prismaMock.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Enterprise Lead',
            color: '#3b82f6',
            workspaceId: 'ws-1',
            createdById: 'user-1',
          }),
        }),
      );
    });

    it('should throw ConflictException if tag name already exists in the same workspace', async () => {
      prismaMock.tag.findFirst.mockResolvedValue({
        id: 'existing-tag',
        name: 'VIP',
        workspaceId: 'ws-1',
      });

      await expect(
        service.create({ name: 'vip', workspaceId: 'ws-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if tag name is empty', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of tags with usageCount', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'Hot Lead',
          color: '#ef4444',
          description: null,
          status: TagStatus.ACTIVE,
          isProtected: false,
          workspaceId: 'ws-1',
          createdById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { assignments: 5 },
        },
      ];

      prismaMock.tag.findMany.mockResolvedValue(mockTags);
      prismaMock.tag.count.mockResolvedValue(1);

      const result = await service.findAll({
        search: 'hot',
        workspaceId: 'ws-1',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].usageCount).toBe(5);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by entityType and status', async () => {
      prismaMock.tag.findMany.mockResolvedValue([]);
      prismaMock.tag.count.mockResolvedValue(0);

      await service.findAll({
        status: TagStatus.ACTIVE,
        entityType: TagEntityType.LEAD,
      });

      expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TagStatus.ACTIVE,
            assignments: {
              some: {
                entityType: TagEntityType.LEAD,
              },
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a tag with usageCount if found', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'Urgent',
        _count: { assignments: 3 },
      });

      const result = await service.findOne('tag-1');
      expect(result.id).toBe('tag-1');
      expect(result.usageCount).toBe(3);
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      prismaMock.tag.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update tag details', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'Old Name',
        workspaceId: 'ws-1',
      });
      prismaMock.tag.findFirst.mockResolvedValue(null);
      prismaMock.tag.update.mockResolvedValue({
        id: 'tag-1',
        name: 'New Name',
        color: '#10b981',
        _count: { assignments: 2 },
      });

      const result = await service.update('tag-1', {
        name: 'New Name',
        color: '#10b981',
      });

      expect(result.name).toBe('New Name');
      expect(result.usageCount).toBe(2);
    });

    it('should throw ConflictException if new name conflicts with existing tag in workspace', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'Old Name',
        workspaceId: 'ws-1',
      });
      prismaMock.tag.findFirst.mockResolvedValue({
        id: 'tag-2',
        name: 'Conflict Name',
        workspaceId: 'ws-1',
      });

      await expect(
        service.update('tag-1', { name: 'Conflict Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove (safe handling & protection)', () => {
    it('should prevent deletion when tag isProtected=true', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-protected',
        name: 'System Tag',
        isProtected: true,
        _count: { assignments: 0 },
      });

      await expect(service.remove('tag-protected')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should archive tag safely by default (hardDelete=false) preserving assignments', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'Active Tag',
        isProtected: false,
        _count: { assignments: 4 },
      });
      prismaMock.tag.update.mockResolvedValue({
        id: 'tag-1',
        name: 'Active Tag',
        status: TagStatus.ARCHIVED,
        _count: { assignments: 4 },
      });

      const result = await service.remove('tag-1', false);

      expect(result.message).toContain('archived');
      expect(result.assignmentsPreserved).toBe(4);
      expect(prismaMock.tag.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: TagStatus.ARCHIVED },
        }),
      );
    });

    it('should throw BadRequestException if hardDelete=true, active assignments exist, and force=false', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'In Use Tag',
        isProtected: false,
        _count: { assignments: 3 },
      });

      await expect(service.remove('tag-1', true, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should permanently delete tag and assignments when hardDelete=true and force=true', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'In Use Tag',
        isProtected: false,
        _count: { assignments: 3 },
      });
      prismaMock.tagAssignment.deleteMany.mockResolvedValue({ count: 3 });
      prismaMock.tag.delete.mockResolvedValue({ id: 'tag-1' });

      const result = await service.remove('tag-1', true, true);

      expect(result.message).toContain('permanently deleted');
      expect(result.detachedAssignments).toBe(3);
    });
  });

  describe('CRM entity validation and attachment', () => {
    it('should verify entity existence for Leads, Contacts, Companies, Deals, Activities, Documents', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({
        id: 'l-1',
        title: 'Acme Deal Lead',
      });
      const lead = await service.verifyEntityExists(TagEntityType.LEAD, 'l-1');
      expect(lead.name).toBe('Acme Deal Lead');

      prismaMock.contact.findUnique.mockResolvedValue({
        id: 'c-1',
        firstName: 'John',
        lastName: 'Doe',
      });
      const contact = await service.verifyEntityExists(
        TagEntityType.CONTACT,
        'c-1',
      );
      expect(contact.name).toBe('John Doe');

      prismaMock.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        name: 'Acme Corp',
      });
      const company = await service.verifyEntityExists(
        TagEntityType.COMPANY,
        'org-1',
      );
      expect(company.name).toBe('Acme Corp');

      prismaMock.deal.findUnique.mockResolvedValue({
        id: 'd-1',
        title: 'Enterprise Contract',
      });
      const deal = await service.verifyEntityExists(TagEntityType.DEAL, 'd-1');
      expect(deal.name).toBe('Enterprise Contract');

      prismaMock.activity.findUnique.mockResolvedValue({
        id: 'a-1',
        subject: 'Intro Call',
      });
      const activity = await service.verifyEntityExists(
        TagEntityType.ACTIVITY,
        'a-1',
      );
      expect(activity.name).toBe('Intro Call');

      prismaMock.fileRecord.findUnique.mockResolvedValue({
        id: 'f-1',
        originalName: 'Proposal.pdf',
      });
      const doc = await service.verifyEntityExists(
        TagEntityType.DOCUMENT,
        'f-1',
      );
      expect(doc.name).toBe('Proposal.pdf');
    });

    it('should throw NotFoundException if entity does not exist', async () => {
      prismaMock.lead.findUnique.mockResolvedValue(null);
      await expect(
        service.verifyEntityExists(TagEntityType.LEAD, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should attach existing tags to an entity', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({
        id: 'l-1',
        title: 'Lead 1',
      });
      prismaMock.tag.findMany.mockResolvedValue([
        { id: 't-1', name: 'VIP', status: TagStatus.ACTIVE },
      ]);
      prismaMock.tagAssignment.upsert.mockResolvedValue({ id: 'assign-1' });
      prismaMock.tagAssignment.findMany.mockResolvedValue([
        {
          id: 'assign-1',
          createdAt: new Date(),
          tag: { id: 't-1', name: 'VIP' },
        },
      ]);

      const result = await service.attachTags(
        'LEAD',
        'l-1',
        { tagIds: ['t-1'] },
        { id: 'u-1' },
      );

      expect(result).toHaveLength(1);
      expect(prismaMock.tagAssignment.upsert).toHaveBeenCalled();
    });

    it('should create new tags on the fly when tagNames are passed to attachTags', async () => {
      prismaMock.contact.findUnique.mockResolvedValue({
        id: 'c-1',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      prismaMock.tag.findFirst.mockResolvedValue(null);
      prismaMock.tag.create.mockResolvedValue({
        id: 't-new',
        name: 'New Custom Tag',
      });
      prismaMock.tagAssignment.upsert.mockResolvedValue({ id: 'assign-2' });
      prismaMock.tagAssignment.findMany.mockResolvedValue([
        {
          id: 'assign-2',
          createdAt: new Date(),
          tag: { id: 't-new', name: 'New Custom Tag' },
        },
      ]);

      const result = await service.attachTags(
        'CONTACT',
        'c-1',
        { tagNames: ['New Custom Tag'] },
        { id: 'u-1' },
      );

      expect(prismaMock.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'New Custom Tag' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should detach a single tag from an entity', async () => {
      prismaMock.deal.findUnique.mockResolvedValue({ id: 'd-1', title: 'Deal' });
      prismaMock.tagAssignment.findUnique.mockResolvedValue({ id: 'assign-1' });
      prismaMock.tagAssignment.delete.mockResolvedValue({ id: 'assign-1' });

      const result = await service.detachTag('DEAL', 'd-1', 'tag-1');
      expect(result.message).toContain('detached successfully');
      expect(prismaMock.tagAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
      });
    });

    it('should bulk assign tags to multiple entities', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({ id: 'l-1', title: 'Lead 1' });
      prismaMock.tag.findMany.mockResolvedValue([
        { id: 't-1', name: 'Hot', status: TagStatus.ACTIVE },
      ]);
      prismaMock.tagAssignment.upsert.mockResolvedValue({ id: 'assign-1' });

      const result = await service.bulkAssign({
        entityType: TagEntityType.LEAD,
        entityIds: ['l-1'],
        tagIds: ['t-1'],
      });

      expect(result.totalOperations).toBe(1);
    });
  });

  describe('Tag Usage Statistics', () => {
    it('should get detailed usage statistics for a specific tag', async () => {
      prismaMock.tag.findUnique.mockResolvedValue({
        id: 't-1',
        name: 'High Priority',
        color: '#ef4444',
        status: TagStatus.ACTIVE,
        isProtected: false,
        _count: { assignments: 5 },
      });

      prismaMock.tagAssignment.groupBy.mockResolvedValue([
        { entityType: 'LEAD', _count: { _all: 3 } },
        { entityType: 'DEAL', _count: { _all: 2 } },
      ]);

      prismaMock.tagAssignment.findMany.mockResolvedValue([
        {
          id: 'as-1',
          entityType: 'LEAD',
          entityId: 'l-1',
          createdAt: new Date(),
        },
      ]);
      prismaMock.lead.findUnique.mockResolvedValue({
        id: 'l-1',
        title: 'Big Lead',
      });

      const usage = await service.getTagUsage('t-1');

      expect(usage.tagId).toBe('t-1');
      expect(usage.totalUsage).toBe(5);
      expect(usage.breakdown.LEAD).toBe(3);
      expect(usage.breakdown.DEAL).toBe(2);
      expect(usage.recentEntities).toHaveLength(1);
      expect(usage.recentEntities[0].entityName).toBe('Big Lead');
    });

    it('should get global tag usage summary', async () => {
      prismaMock.tag.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(1) // inactive
        .mockResolvedValueOnce(1) // archived
        .mockResolvedValueOnce(2); // unused

      prismaMock.tagAssignment.count.mockResolvedValue(25);
      prismaMock.tagAssignment.groupBy.mockResolvedValue([
        { entityType: 'CONTACT', _count: { _all: 15 } },
        { entityType: 'COMPANY', _count: { _all: 10 } },
      ]);
      prismaMock.tag.findMany.mockResolvedValue([
        {
          id: 't-1',
          name: 'Customer',
          color: '#10b981',
          status: 'ACTIVE',
          isProtected: false,
          _count: { assignments: 15 },
        },
      ]);

      const summary = await service.getGlobalUsageSummary();

      expect(summary.totalTags).toBe(10);
      expect(summary.activeTags).toBe(8);
      expect(summary.totalAssignments).toBe(25);
      expect(summary.assignmentsByEntityType.CONTACT).toBe(15);
      expect(summary.assignmentsByEntityType.COMPANY).toBe(10);
      expect(summary.topTags).toHaveLength(1);
      expect(summary.topTags[0].usageCount).toBe(15);
    });
  });
});
