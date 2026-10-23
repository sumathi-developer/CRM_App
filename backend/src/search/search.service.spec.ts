import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from './services/search.service';
import { SearchHistoryService } from './services/search-history.service';
import { RelevanceScorer } from './utils/relevance-scorer.util';
import { PermissionFilter } from './utils/permission-filter.util';

describe('Global Search Service (Module 16)', () => {
  let searchService: SearchService;
  let searchHistoryService: SearchHistoryService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      lead: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      contact: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      organization: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      deal: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      activity: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      fileRecord: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      note: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    };

    searchHistoryService = new SearchHistoryService(prismaMock);
    searchService = new SearchService(prismaMock, searchHistoryService);
  });

  describe('RelevanceScorer', () => {
    it('should assign a higher score to exact matches than partial matches', () => {
      const exactScore = RelevanceScorer.scoreRecord(
        { name: 'Acme Corp' },
        'Acme Corp',
        { name: 2.0 },
        false,
      );

      const partialScore = RelevanceScorer.scoreRecord(
        { name: 'Acme Corporation International' },
        'Acme',
        { name: 2.0 },
        false,
      );

      expect(exactScore.score).toBeGreaterThan(partialScore.score);
      expect(exactScore.matchedFields).toContain('name');
    });

    it('should generate highlighted snippets with <mark> tags', () => {
      const text = 'Customer requested follow-up meeting regarding enterprise software upgrade.';
      const snippet = RelevanceScorer.generateSnippet(text, 'software', 50);

      expect(snippet).toContain('<mark>software</mark>');
    });

    it('should sort results by relevance score descending', () => {
      const items: any[] = [
        { id: '1', relevanceScore: 40, createdAt: new Date() },
        { id: '2', relevanceScore: 120, createdAt: new Date() },
        { id: '3', relevanceScore: 80, createdAt: new Date() },
      ];

      const sorted = RelevanceScorer.sortResults(items);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('PermissionFilter', () => {
    it('should grant ADMIN users access to all 8 entities', () => {
      const adminContext = {
        userId: 'admin-1',
        userRole: 'ADMIN',
        isSystemAdmin: true,
      };

      const allowed = PermissionFilter.filterAllowedEntities(undefined, adminContext);
      expect(allowed).toHaveLength(8);
      expect(allowed).toContain('LEADS');
      expect(allowed).toContain('DEALS');
      expect(allowed).toContain('USERS');
    });

    it('should filter out unauthorized entities for restricted members', () => {
      const restrictedContext = {
        userId: 'user-1',
        userRole: 'MEMBER',
        workspacePermissions: ['contacts:read', 'notes:read'], // No deals or leads!
        isSystemAdmin: false,
      };

      const allowed = PermissionFilter.filterAllowedEntities(undefined, restrictedContext);
      expect(allowed).toContain('CONTACTS');
      expect(allowed).toContain('NOTES');
      expect(allowed).not.toContain('DEALS');
      expect(allowed).not.toContain('LEADS');
    });
  });

  describe('SearchService.globalSearch', () => {
    it('should search across permitted entities and return ranked results', async () => {
      prismaMock.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          title: 'Acme Lead',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@acme.com',
          companyName: 'Acme',
          status: 'QUALIFIED',
          leadScore: 85,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      prismaMock.contact.findMany.mockResolvedValue([
        {
          id: 'contact-1',
          firstName: 'Alice',
          lastName: 'Acme',
          email: 'alice@acme.com',
          jobTitle: 'VP Sales',
          stage: 'CUSTOMER',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await searchService.globalSearch(
        { q: 'Acme', limit: 10 },
        { id: 'user-1', role: { name: 'ADMIN' } },
      );

      expect(response.query).toBe('Acme');
      expect(response.total).toBe(2);
      expect(response.results).toHaveLength(2);
      expect(response.counts.LEADS).toBe(1);
      expect(response.counts.CONTACTS).toBe(1);
      expect(response.grouped.LEADS).toBeDefined();
      expect(response.grouped.CONTACTS).toBeDefined();
    });

    it('should strictly exclude entity results when user lacks permission', async () => {
      prismaMock.deal.findMany.mockResolvedValue([
        {
          id: 'deal-1',
          title: 'Acme Mega Deal',
          value: 50000,
          currency: 'USD',
          status: 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // User without deals permission
      const response = await searchService.globalSearch(
        { q: 'Acme' },
        {
          id: 'user-1',
          role: { name: 'VIEWER' },
          workspacePermissions: ['contacts:read'], // Only contacts
        },
      );

      // Deals search was never queried
      expect(prismaMock.deal.findMany).not.toHaveBeenCalled();
      expect(response.counts.DEALS).toBeUndefined();
    });
  });

  describe('SearchService.searchSingleEntity', () => {
    it('should perform single entity search with pagination', async () => {
      prismaMock.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          title: 'TechCorp Lead',
          companyName: 'TechCorp',
          status: 'NEW',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await searchService.searchSingleEntity(
        'leads',
        { q: 'TechCorp', page: 1, limit: 10 },
        { id: 'user-1', role: { name: 'ADMIN' } },
      );

      expect(res.data).toHaveLength(1);
      expect(res.data[0].entityType).toBe('LEADS');
      expect(res.meta.total).toBe(1);
    });

    it('should throw ForbiddenException if user lacks entity permission', async () => {
      await expect(
        searchService.searchSingleEntity(
          'deals',
          { q: 'Enterprise' },
          {
            id: 'user-1',
            role: { name: 'MEMBER' },
            workspacePermissions: ['contacts:read'],
          },
        ),
      ).rejects.toThrow('User is not authorized');
    });
  });

  describe('SearchService.getSuggestions', () => {
    it('should return lightweight suggestions for autocomplete dropdown', async () => {
      prismaMock.contact.findMany.mockResolvedValue([
        {
          id: 'contact-1',
          firstName: 'Robert',
          lastName: 'Smith',
          email: 'robert@corp.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const suggestions = await searchService.getSuggestions(
        { q: 'Rob', limit: 5 },
        { id: 'user-1', role: { name: 'ADMIN' } },
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].text).toBe('Robert Smith');
      expect(suggestions[0].entityType).toBe('CONTACTS');
      expect(suggestions[0].icon).toBe('users');
    });
  });

  describe('SearchHistoryService', () => {
    it('should query search history using raw SQL', async () => {
      prismaMock.$queryRawUnsafe
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([
          {
            id: 'sh-1',
            userId: 'user-1',
            query: 'Acme',
            entityType: 'ALL',
            resultsCount: 5,
            createdAt: new Date(),
          },
        ]);

      const history = await searchHistoryService.getHistory('user-1', { page: 1, limit: 10 });
      expect(history.data).toHaveLength(1);
      expect(history.meta.total).toBe(1);
      expect(history.data[0].query).toBe('Acme');
    });

    it('should delete a search history item', async () => {
      const res = await searchHistoryService.deleteItem('sh-1', 'user-1');
      expect(res.success).toBe(true);
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "SearchHistory" WHERE "id" = $1'),
        'sh-1',
        'user-1',
      );
    });

    it('should clear all search history for a user', async () => {
      const res = await searchHistoryService.clearAll('user-1');
      expect(res.success).toBe(true);
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM "SearchHistory" WHERE "userId" = $1'),
        'user-1',
      );
    });
  });
});
