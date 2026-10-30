export type SearchEntityType =
  | 'LEADS'
  | 'CONTACTS'
  | 'COMPANIES'
  | 'DEALS'
  | 'ACTIVITIES'
  | 'DOCUMENTS'
  | 'NOTES'
  | 'USERS';

export type SearchScopeSlug =
  | 'all'
  | 'leads'
  | 'contacts'
  | 'companies'
  | 'deals'
  | 'activities'
  | 'documents'
  | 'notes'
  | 'users';

export interface SearchResultItem {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  relevanceScore: number;
  matchedFields: string[];
  snippet?: string;
  url: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export type GroupedSearchResults = {
  [key in SearchEntityType]?: SearchResultItem[];
};

export interface GlobalSearchResponse {
  query: string;
  exact: boolean;
  total: number;
  counts: Record<string, number>;
  results: SearchResultItem[];
  grouped: GroupedSearchResults;
  meta: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    executionTimeMs: number;
  };
}

export interface SearchSuggestion {
  id: string;
  text: string;
  entityType: SearchEntityType;
  subtitle?: string;
  entityId: string;
  url: string;
  icon?: string;
}

export interface SearchHistoryRecord {
  id: string;
  userId: string;
  query: string;
  entityType: string;
  resultsCount: number;
  workspaceId?: string | null;
  createdAt: string;
}

export interface PaginatedSearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GlobalSearchQueryParams {
  q: string;
  entities?: SearchEntityType[];
  exact?: boolean;
  workspaceId?: string;
  page?: number;
  limit?: number;
}

export interface EntitySearchQueryParams {
  q: string;
  exact?: boolean;
  status?: string;
  stage?: string;
  type?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  workspaceId?: string;
  page?: number;
  limit?: number;
}

export interface SearchUserLookup {
  id: string;
  name: string;
  email?: string;
}

