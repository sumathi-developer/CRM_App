export type SearchEntityType =
  | 'LEADS'
  | 'CONTACTS'
  | 'COMPANIES'
  | 'DEALS'
  | 'ACTIVITIES'
  | 'DOCUMENTS'
  | 'NOTES'
  | 'USERS';

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
  createdAt?: Date;
  updatedAt?: Date;
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
