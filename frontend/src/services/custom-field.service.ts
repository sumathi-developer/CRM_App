import { api } from './api';
import type {
  CustomFieldEntity,
  CustomFieldOption,
  CreateCustomFieldPayload,
  UpdateCustomFieldPayload,
  CustomFieldQueryFilters,
  PaginatedCustomFieldsResponse,
  EntityLayoutResponse,
  CustomFieldEntityType,
  CustomFieldType,
  TypeMigrationPreviewResponse,
  ChangeFieldTypePayload,
} from '../types/custom-field.types';

class CustomFieldService {
  private layoutCache = new Map<string, { timestamp: number; data: EntityLayoutResponse }>();
  private fieldsCache = new Map<string, { timestamp: number; data: PaginatedCustomFieldsResponse }>();

  /**
   * Clear all custom field client-side caches
   */
  clearCache(): void {
    this.layoutCache.clear();
    this.fieldsCache.clear();
  }

  /**
   * Preload layouts for all 5 CRM entities in parallel so modal preview renders in 0ms
   */
  async preloadAllLayouts(workspaceId?: string): Promise<void> {
    const entities: CustomFieldEntityType[] = ['LEAD', 'CONTACT', 'COMPANY', 'DEAL', 'ACTIVITY'];
    await Promise.allSettled(entities.map((e) => this.getEntityLayout(e, workspaceId)));
  }

  /**
   * List custom fields with pagination and filters
   */
  async getCustomFields(
    query?: CustomFieldQueryFilters,
    forceRefresh = false,
  ): Promise<PaginatedCustomFieldsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search?.trim()) params.append('search', query.search.trim());
    if (query?.entityType) params.append('entityType', query.entityType);
    if (query?.fieldType) params.append('fieldType', query.fieldType);
    if (query?.section) params.append('section', query.section);
    if (query?.isVisible !== undefined) params.append('isVisible', String(query.isVisible));
    if (query?.isSearchable !== undefined) params.append('isSearchable', String(query.isSearchable));
    if (query?.isFilterable !== undefined) params.append('isFilterable', String(query.isFilterable));
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));
    if (query?.workspaceId) params.append('workspaceId', query.workspaceId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const cacheKey = queryString;

    if (!forceRefresh) {
      const cached = this.fieldsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30_000) {
        return cached.data;
      }
    }

    const response = await api.get<any>(`/custom-fields${queryString}`);

    let formatted: PaginatedCustomFieldsResponse;
    if (response?.data && response?.meta) {
      formatted = response as PaginatedCustomFieldsResponse;
    } else if (Array.isArray(response)) {
      formatted = {
        data: response,
        meta: {
          total: response.length,
          page: 1,
          limit: response.length || 50,
          totalPages: 1,
        },
      };
    } else {
      formatted = {
        data: response?.data || [],
        meta: response?.meta || { total: 0, page: 1, limit: 50, totalPages: 1 },
      };
    }

    this.fieldsCache.set(cacheKey, { timestamp: Date.now(), data: formatted });
    return formatted;
  }

  /**
   * Get single custom field definition with options and history
   */
  async getCustomFieldById(id: string): Promise<CustomFieldEntity> {
    const response = await api.get<any>(`/custom-fields/${id}`);
    return (response?.data || response) as CustomFieldEntity;
  }

  /**
   * Create a new custom field definition
   */
  async createCustomField(payload: CreateCustomFieldPayload): Promise<CustomFieldEntity> {
    const response = await api.post<any>('/custom-fields', payload);
    this.clearCache();
    return (response?.data || response) as CustomFieldEntity;
  }

  /**
   * Update an existing custom field definition
   */
  async updateCustomField(id: string, payload: UpdateCustomFieldPayload): Promise<CustomFieldEntity> {
    const response = await api.patch<any>(`/custom-fields/${id}`, payload);
    this.clearCache();
    return (response?.data || response) as CustomFieldEntity;
  }

  /**
   * Delete or archive a custom field
   */
  async deleteCustomField(id: string, hardDelete = false): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<any>(`/custom-fields/${id}${hardDelete ? '?hardDelete=true' : ''}`);
    this.clearCache();
    return (response?.data || response) as { success: boolean; message: string };
  }

  /**
   * Get organized dynamic layout for an entity type with in-memory caching
   */
  async getEntityLayout(
    entityType: CustomFieldEntityType,
    workspaceId?: string,
    forceRefresh = false,
  ): Promise<EntityLayoutResponse> {
    const cacheKey = `${entityType}_${workspaceId || 'default'}`;

    if (!forceRefresh) {
      const cached = this.layoutCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60_000) {
        return cached.data;
      }
    }

    const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
    const response = await api.get<any>(`/custom-fields/layout/${entityType}${query}`);
    const data = (response?.data || response) as EntityLayoutResponse;

    this.layoutCache.set(cacheKey, { timestamp: Date.now(), data });
    return data;
  }

  /**
   * Reorder fields and section positions
   */
  async reorderFields(items: { id: string; order: number; section?: string }[]): Promise<any> {
    const res = await api.post('/custom-fields/layout/reorder', { fields: items });
    this.clearCache();
    return res;
  }

  /**
   * Get options for a field
   */
  async getFieldOptions(fieldId: string): Promise<CustomFieldOption[]> {
    const response = await api.get<any>(`/custom-fields/${fieldId}/options`);
    const data = response?.data || response;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Add a new option to a field
   */
  async addFieldOption(
    fieldId: string,
    option: { label: string; value: string; color?: string; order?: number },
  ): Promise<CustomFieldOption> {
    const response = await api.post<any>(`/custom-fields/${fieldId}/options`, option);
    return (response?.data || response) as CustomFieldOption;
  }

  /**
   * Update a field option
   */
  async updateFieldOption(
    fieldId: string,
    optionId: string,
    option: Partial<CustomFieldOption>,
  ): Promise<CustomFieldOption> {
    const response = await api.patch<any>(`/custom-fields/${fieldId}/options/${optionId}`, option);
    return (response?.data || response) as CustomFieldOption;
  }

  /**
   * Delete a field option
   */
  async deleteFieldOption(fieldId: string, optionId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<any>(`/custom-fields/${fieldId}/options/${optionId}`);
    return (response?.data || response) as { success: boolean; message: string };
  }

  /**
   * Preview safe type conversion compatibility
   */
  async previewTypeChange(
    fieldId: string,
    targetType: CustomFieldType,
    strategy = 'PRESERVE',
  ): Promise<TypeMigrationPreviewResponse> {
    const response = await api.post<any>(`/custom-fields/${fieldId}/change-type/preview`, {
      targetType,
      strategy,
    });
    return (response?.data || response) as TypeMigrationPreviewResponse;
  }

  /**
   * Execute safe type migration
   */
  async executeTypeChange(fieldId: string, payload: ChangeFieldTypePayload): Promise<any> {
    const response = await api.post<any>(`/custom-fields/${fieldId}/change-type`, payload);
    return response?.data || response;
  }
}

export const customFieldService = new CustomFieldService();
