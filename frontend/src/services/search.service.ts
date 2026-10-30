import { api } from './api';
import { activityService } from './activity.service';
import type {
  EntitySearchQueryParams,
  GlobalSearchQueryParams,
  GlobalSearchResponse,
  PaginatedSearchResponse,
  SearchEntityType,
  SearchHistoryRecord,
  SearchResultItem,
  SearchSuggestion,
  SearchUserLookup,
} from '../types/search.types';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        sp.append(key, value.join(','));
      }
      return;
    }
    if (typeof value === 'string' && value.trim() === '') return;
    sp.append(key, String(typeof value === 'string' ? value.trim() : value));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function normalizeResultItem(raw: any): SearchResultItem {
  return {
    id: raw.id,
    entityType: (raw.entityType || 'LEADS') as SearchEntityType,
    title: raw.title || 'Untitled Record',
    subtitle: raw.subtitle || undefined,
    description: raw.description || undefined,
    relevanceScore: Number(raw.relevanceScore ?? 1),
    matchedFields: Array.isArray(raw.matchedFields) ? raw.matchedFields : [],
    snippet: raw.snippet || undefined,
    url: raw.url || '/workspaces',
    metadata: raw.metadata || {},
    createdAt: raw.createdAt || undefined,
    updatedAt: raw.updatedAt || undefined,
  };
}

function extractPaginated<T>(
  res: any,
  mapper: (item: any) => T,
  fallbackPage = 1,
  fallbackLimit = 20,
): PaginatedSearchResponse<T> {
  const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
  const rawItems = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];
  const meta = payload?.meta || res?.meta || {};
  const total = Number(meta.total ?? payload?.total ?? rawItems.length);
  const page = Number(meta.page ?? payload?.page ?? fallbackPage);
  const limit = Number(meta.limit ?? payload?.limit ?? fallbackLimit);
  const totalPages = Number(
    meta.totalPages ??
      payload?.totalPages ??
      Math.max(1, Math.ceil(total / Math.max(1, limit))),
  );

  return {
    items: rawItems.map(mapper),
    total,
    page,
    limit,
    totalPages,
  };
}

class SearchApiService {
  /**
   * Perform unified global search across all or selected CRM entities.
   */
  async globalSearch(
    params: GlobalSearchQueryParams,
  ): Promise<GlobalSearchResponse> {
    const res = await api.get<any>(
      `/search${buildQuery(params as unknown as Record<string, unknown>)}`,
    );
    const data = res?.data || res;

    const results = Array.isArray(data?.results)
      ? data.results.map(normalizeResultItem)
      : [];

    const grouped: Record<string, SearchResultItem[]> = {};
    if (data?.grouped && typeof data.grouped === 'object') {
      Object.entries(data.grouped).forEach(([key, arr]) => {
        if (Array.isArray(arr)) {
          grouped[key] = arr.map(normalizeResultItem);
        }
      });
    }

    const total = Number(data?.total ?? results.length);
    const page = Number(data?.meta?.page ?? params.page ?? 1);
    const limit = Number(data?.meta?.limit ?? params.limit ?? 20);
    const totalPages = Number(
      data?.meta?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))),
    );

    return {
      query: data?.query ?? params.q,
      exact: Boolean(data?.exact ?? params.exact),
      total,
      counts: data?.counts || {},
      results,
      grouped,
      meta: {
        page,
        limit,
        totalPages,
        hasNextPage: Boolean(data?.meta?.hasNextPage ?? page < totalPages),
        hasPrevPage: Boolean(data?.meta?.hasPrevPage ?? page > 1),
        executionTimeMs: Number(data?.meta?.executionTimeMs ?? 0),
      },
    };
  }

  /**
   * Perform entity-specific search with entity filters (leads, contacts, companies, deals, activities, documents, notes, users).
   */
  async searchEntity(
    entitySlug: string,
    params: EntitySearchQueryParams,
  ): Promise<PaginatedSearchResponse<SearchResultItem>> {
    const normalizedSlug = entitySlug.toLowerCase().trim();
    const res = await api.get<any>(
      `/search/${normalizedSlug}${buildQuery(
        params as unknown as Record<string, unknown>,
      )}`,
    );
    return extractPaginated(
      res,
      normalizeResultItem,
      params.page,
      params.limit,
    );
  }

  /**
   * Fast autocomplete suggestions as the user types.
   */
  async getSuggestions(params: {
    q: string;
    entities?: SearchEntityType[];
    limit?: number;
  }): Promise<SearchSuggestion[]> {
    if (!params.q.trim()) return [];
    try {
      const res = await api.get<any>(
        `/search/suggestions${buildQuery(
          params as unknown as Record<string, unknown>,
        )}`,
      );
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Fetch recent search history for current user.
   */
  async getSearchHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedSearchResponse<SearchHistoryRecord>> {
    try {
      const res = await api.get<any>(
        `/search/history${buildQuery(params as Record<string, unknown>)}`,
      );
      return extractPaginated(
        res,
        (raw) => ({
          id: raw.id,
          userId: raw.userId,
          query: raw.query || '',
          entityType: raw.entityType || 'ALL',
          resultsCount: Number(raw.resultsCount ?? 0),
          workspaceId: raw.workspaceId ?? null,
          createdAt: raw.createdAt || new Date().toISOString(),
        }),
        params?.page,
        params?.limit,
      );
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  }

  /**
   * Delete a single search history item.
   */
  async deleteSearchHistoryItem(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/search/history/${id}`);
    return res?.data || res || { message: 'Search history item deleted' };
  }

  /**
   * Clear all search history for current user.
   */
  async clearSearchHistory(): Promise<{ message: string }> {
    const res = await api.delete<any>('/search/history');
    return res?.data || res || { message: 'Search history cleared' };
  }

  /**
   * Fetch assignable users for owner filter dropdown.
   */
  async getUsersLookup(): Promise<SearchUserLookup[]> {
    return activityService.getAssignableUsers();
  }
}

export const searchService = new SearchApiService();
export default searchService;

