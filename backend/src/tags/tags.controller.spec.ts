import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TagStatus } from './enums/tag-status.enum';
import { TagEntityType } from './enums/tag-entity-type.enum';

describe('TagsController', () => {
  let controller: TagsController;
  let serviceMock: Partial<TagsService>;

  beforeEach(() => {
    serviceMock = {
      create: vi.fn().mockResolvedValue({
        id: 'tag-1',
        name: 'Urgent',
        color: '#ef4444',
        status: TagStatus.ACTIVE,
        usageCount: 0,
      }),
      findAll: vi.fn().mockResolvedValue({
        data: [{ id: 'tag-1', name: 'Urgent', usageCount: 0 }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
      findOne: vi.fn().mockResolvedValue({
        id: 'tag-1',
        name: 'Urgent',
        usageCount: 5,
      }),
      update: vi.fn().mockResolvedValue({
        id: 'tag-1',
        name: 'Super Urgent',
        usageCount: 5,
      }),
      remove: vi.fn().mockResolvedValue({
        message: 'Tag successfully archived',
      }),
      getTagUsage: vi.fn().mockResolvedValue({
        tagId: 'tag-1',
        name: 'Urgent',
        totalUsage: 5,
        breakdown: { LEAD: 2, CONTACT: 3, COMPANY: 0, DEAL: 0, ACTIVITY: 0, DOCUMENT: 0 },
        recentEntities: [],
      } as any),
      getGlobalUsageSummary: vi.fn().mockResolvedValue({
        totalTags: 10,
        activeTags: 8,
        inactiveTags: 1,
        archivedTags: 1,
        totalAssignments: 25,
        assignmentsByEntityType: { LEAD: 10, CONTACT: 15, COMPANY: 0, DEAL: 0, ACTIVITY: 0, DOCUMENT: 0 },
        topTags: [],
        unusedTagsCount: 2,
      }),
      getEntityTags: vi.fn().mockResolvedValue([
        { id: 'tag-1', name: 'Urgent' },
      ]),
      attachTags: vi.fn().mockResolvedValue([
        { id: 'tag-1', name: 'Urgent' },
      ]),
      detachTag: vi.fn().mockResolvedValue({
        message: 'Tag detached successfully',
      }),
      detachTags: vi.fn().mockResolvedValue({
        message: 'Detached 2 tag(s) successfully',
        detachedCount: 2,
      }),
      bulkAssign: vi.fn().mockResolvedValue({
        message: 'Bulk tag assignment completed',
        totalOperations: 4,
      }),
      bulkDetach: vi.fn().mockResolvedValue({
        message: 'Bulk tag detachment completed',
        detachedCount: 4,
      }),
    };

    controller = new TagsController(serviceMock as TagsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return new tag', async () => {
      const dto = { name: 'Urgent', color: '#ef4444' };
      const user = { id: 'u-1', activeWorkspaceId: 'ws-1' };

      const result = await controller.create(dto, user);

      expect(serviceMock.create).toHaveBeenCalledWith(dto, user);
      expect(result).toHaveProperty('id', 'tag-1');
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      const query = { search: 'urg', page: 1, limit: 10 };
      const user = { id: 'u-1' };

      const result = await controller.findAll(query, user);

      expect(serviceMock.findAll).toHaveBeenCalledWith(query, user);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = await controller.findOne('tag-1');
      expect(serviceMock.findOne).toHaveBeenCalledWith('tag-1');
      expect(result).toHaveProperty('id', 'tag-1');
    });
  });

  describe('update', () => {
    it('should call service.update with id, dto, user', async () => {
      const dto = { name: 'Super Urgent' };
      const user = { id: 'u-1' };

      const result = await controller.update('tag-1', dto, user);

      expect(serviceMock.update).toHaveBeenCalledWith('tag-1', dto, user);
      expect(result).toHaveProperty('name', 'Super Urgent');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed query parameters', async () => {
      await controller.remove('tag-1', 'true', 'false');
      expect(serviceMock.remove).toHaveBeenCalledWith('tag-1', true, false);

      await controller.remove('tag-2', undefined, undefined);
      expect(serviceMock.remove).toHaveBeenCalledWith('tag-2', false, false);
    });
  });

  describe('getGlobalUsageSummary', () => {
    it('should call service.getGlobalUsageSummary with workspaceId', async () => {
      const result = await controller.getGlobalUsageSummary('ws-1');
      expect(serviceMock.getGlobalUsageSummary).toHaveBeenCalledWith('ws-1');
      expect(result.totalTags).toBe(10);
    });
  });

  describe('getTagUsage', () => {
    it('should call service.getTagUsage with tagId', async () => {
      const result = await controller.getTagUsage('tag-1');
      expect(serviceMock.getTagUsage).toHaveBeenCalledWith('tag-1');
      expect(result.tagId).toBe('tag-1');
    });
  });

  describe('Entity tagging', () => {
    it('should get tags for an entity', async () => {
      const result = await controller.getEntityTags('LEAD', 'lead-1');
      expect(serviceMock.getEntityTags).toHaveBeenCalledWith('LEAD', 'lead-1');
      expect(result).toHaveLength(1);
    });

    it('should attach tags to an entity', async () => {
      const dto = { tagIds: ['tag-1'] };
      const user = { id: 'u-1' };
      const result = await controller.attachTags('CONTACT', 'contact-1', dto, user);

      expect(serviceMock.attachTags).toHaveBeenCalledWith('CONTACT', 'contact-1', dto, user);
      expect(result).toHaveLength(1);
    });

    it('should detach single tag from entity', async () => {
      const result = await controller.detachTag('DEAL', 'deal-1', 'tag-1');
      expect(serviceMock.detachTag).toHaveBeenCalledWith('DEAL', 'deal-1', 'tag-1');
      expect(result.message).toContain('detached successfully');
    });

    it('should detach multiple tags from entity', async () => {
      const dto = { tagIds: ['tag-1', 'tag-2'] };
      const result = await controller.detachTags('ACTIVITY', 'act-1', dto);
      expect(serviceMock.detachTags).toHaveBeenCalledWith('ACTIVITY', 'act-1', dto);
      expect(result.detachedCount).toBe(2);
    });

    it('should bulk assign tags', async () => {
      const dto = {
        entityType: TagEntityType.LEAD,
        entityIds: ['l-1', 'l-2'],
        tagIds: ['tag-1'],
      };
      const user = { id: 'u-1' };
      const result = await controller.bulkAssign(dto, user);

      expect(serviceMock.bulkAssign).toHaveBeenCalledWith(dto, user);
      expect(result.totalOperations).toBe(4);
    });

    it('should bulk detach tags', async () => {
      const dto = {
        entityType: TagEntityType.LEAD,
        entityIds: ['l-1', 'l-2'],
        tagIds: ['tag-1'],
      };
      const result = await controller.bulkDetach(dto);

      expect(serviceMock.bulkDetach).toHaveBeenCalledWith(dto);
      expect(result.detachedCount).toBe(4);
    });
  });
});
