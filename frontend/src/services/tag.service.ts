import { api } from './api';
import type {
  TagEntity,
  CreateTagPayload,
  UpdateTagPayload,
  TagQueryParams,
  PaginatedTagsResponse,
  TagUsageDetail,
  TagUsageSummary,
  DeleteTagResult,
} from '../types/tag.types';

class TagService {
  /**
   * Fetch paginated list of tags with optional filters and sorting
   */
  async getTags(query?: TagQueryParams): Promise<PaginatedTagsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search?.trim()) params.append('search', query.search.trim());
    if (query?.status) params.append('status', query.status);
    if (query?.workspaceId) params.append('workspaceId', query.workspaceId);
    if (query?.entityType) params.append('entityType', query.entityType);
    if (query?.isProtected !== undefined) params.append('isProtected', String(query.isProtected));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<any>(`/tags${queryString}`);

    if (response?.data && response?.meta) {
      return response as PaginatedTagsResponse;
    }
    if (Array.isArray(response)) {
      return {
        data: response,
        meta: {
          total: response.length,
          page: 1,
          limit: response.length || 20,
          totalPages: 1,
        },
      };
    }
    return {
      data: response?.data || [],
      meta: response?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }

  /**
   * Get single tag details with usage count
   */
  async getTagById(id: string): Promise<TagEntity> {
    const response = await api.get<TagEntity>(`/tags/${id}`);
    return response;
  }

  /**
   * Create a new tag in the workspace
   */
  async createTag(payload: CreateTagPayload): Promise<TagEntity> {
    const response = await api.post<TagEntity>('/tags', payload);
    return response;
  }

  /**
   * Update an existing tag
   */
  async updateTag(id: string, payload: UpdateTagPayload): Promise<TagEntity> {
    const response = await api.patch<TagEntity>(`/tags/${id}`, payload);
    return response;
  }

  /**
   * Delete or archive a tag:
   * - hardDelete=false (default): soft-delete/archive tag
   * - hardDelete=true: permanently delete tag (requires force=true if usage > 0)
   */
  async deleteTag(id: string, hardDelete = false, force = false): Promise<DeleteTagResult> {
    const params = new URLSearchParams();
    if (hardDelete) params.append('hardDelete', 'true');
    if (force) params.append('force', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.delete<DeleteTagResult>(`/tags/${id}${queryString}`);
    return response;
  }

  /**
   * Get detailed usage statistics and recent entities for a specific tag
   */
  async getTagUsage(id: string): Promise<TagUsageDetail> {
    const response = await api.get<TagUsageDetail>(`/tags/${id}/usage`);
    return response;
  }

  /**
   * Get global CRM tag usage statistics across all entities
   */
  async getGlobalUsageSummary(workspaceId?: string): Promise<TagUsageSummary> {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<TagUsageSummary>(`/tags/usage${queryString}`);
    return response;
  }
}

export const tagService = new TagService();
