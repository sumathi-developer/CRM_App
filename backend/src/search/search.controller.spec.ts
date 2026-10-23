import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
import { SearchHistoryService } from './services/search-history.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchServiceMock: Partial<SearchService>;
  let searchHistoryServiceMock: Partial<SearchHistoryService>;

  beforeEach(() => {
    searchServiceMock = {
      globalSearch: vi.fn().mockResolvedValue({
        query: 'Acme',
        total: 2,
        counts: { LEADS: 1, CONTACTS: 1 },
        results: [],
        grouped: {},
        meta: { page: 1, limit: 20, totalPages: 1 },
      }),
      searchSingleEntity: vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      }),
      getSuggestions: vi.fn().mockResolvedValue([
        { id: '1', text: 'Acme Corp', entityType: 'COMPANIES' },
      ]),
    };

    searchHistoryServiceMock = {
      getHistory: vi.fn().mockResolvedValue({
        data: [{ id: 'sh-1', query: 'Acme' }],
        meta: { total: 1, page: 1, limit: 20 },
      }),
      deleteItem: vi.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      clearAll: vi.fn().mockResolvedValue({ success: true, message: 'Cleared' }),
    };

    controller = new SearchController(
      searchServiceMock as SearchService,
      searchHistoryServiceMock as SearchHistoryService,
    );
  });

  it('should call globalSearch with query and user', async () => {
    const user = { id: 'user-1', role: 'ADMIN' };
    const req = { workspace: { id: 'ws-1' } };
    const dto = { q: 'Acme', page: 1, limit: 20 };

    const result = await controller.globalSearch(dto, user, req);

    expect(result.query).toBe('Acme');
    expect(searchServiceMock.globalSearch).toHaveBeenCalledWith(dto, user, req.workspace);
  });

  it('should call getSuggestions for autocomplete', async () => {
    const user = { id: 'user-1' };
    const req = { workspace: undefined };
    const dto = { q: 'Ac', limit: 5 };

    const suggestions = await controller.getSuggestions(dto, user, req);

    expect(suggestions).toHaveLength(1);
    expect(searchServiceMock.getSuggestions).toHaveBeenCalledWith(dto, user, undefined);
  });

  it('should call searchSingleEntity for entity specific queries', async () => {
    const user = { id: 'user-1' };
    const req = {};
    const dto = { q: 'John', page: 1, limit: 10 };

    await controller.searchEntity('leads', dto, user, req);

    expect(searchServiceMock.searchSingleEntity).toHaveBeenCalledWith('leads', dto, user, undefined);
  });

  it('should get search history for current user', async () => {
    const query = { page: 1, limit: 10 };
    const history = await controller.getSearchHistory(query, 'user-1');

    expect(history.data).toHaveLength(1);
    expect(searchHistoryServiceMock.getHistory).toHaveBeenCalledWith('user-1', query);
  });

  it('should clear search history for current user', async () => {
    const res = await controller.clearSearchHistory('user-1', 'ws-1');

    expect(res.success).toBe(true);
    expect(searchHistoryServiceMock.clearAll).toHaveBeenCalledWith('user-1', 'ws-1');
  });

  it('should delete a single search history item', async () => {
    const res = await controller.deleteSearchHistoryItem('sh-1', 'user-1');

    expect(res.success).toBe(true);
    expect(searchHistoryServiceMock.deleteItem).toHaveBeenCalledWith('sh-1', 'user-1');
  });
});
