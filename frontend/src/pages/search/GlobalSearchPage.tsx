import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { searchService } from '../../services/search.service';
import type {
  GlobalSearchResponse,
  PaginatedSearchResponse,
  SearchEntityType,
  SearchHistoryRecord,
  SearchResultItem,
  SearchScopeSlug,
  SearchSuggestion,
  SearchUserLookup,
} from '../../types/search.types';
import {
  ALL_SEARCH_ENTITY_TYPES,
  entityBadgeTone,
  QUICK_SAMPLE_SEARCHES,
  resolveSearchResultPath,
  SEARCH_SCOPE_META,
} from './searchConstants';
import { SearchLayout } from './components/SearchLayout';
import { SearchResultCard } from './components/SearchResultCard';
import {
  Badge,
  SectionCard,
  StatCard,
} from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  ArrowRightIcon,
  ClockIcon,
  FilterIcon,
  RefreshCwIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '../../components/common/Icons';

interface GlobalSearchPageProps {
  scope: SearchScopeSlug;
}

export const GlobalSearchPage: React.FC<GlobalSearchPageProps> = ({ scope }) => {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const meta = SEARCH_SCOPE_META[scope] || SEARCH_SCOPE_META.all;
  const initialQuery = searchParams.get('q') || '';

  // Search Input & Debounced Query State
  const [inputQuery, setInputQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(
    initialQuery.trim(),
  );

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Filters State
  const [exactMatch, setExactMatch] = useState<boolean>(false);
  const [selectedEntities, setSelectedEntities] = useState<SearchEntityType[]>(
    [],
  );
  const [displayMode, setDisplayMode] = useState<'grouped' | 'combined'>(
    'grouped',
  );
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Data State
  const [globalData, setGlobalData] = useState<GlobalSearchResponse | null>(
    null,
  );
  const [entityData, setEntityData] =
    useState<PaginatedSearchResponse<SearchResultItem> | null>(null);
  const [historyItems, setHistoryItems] = useState<SearchHistoryRecord[]>([]);
  const [usersLookup, setUsersLookup] = useState<SearchUserLookup[]>([]);

  // UI Feedback State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | string[] | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync URL ?q= changes into local state when switching scopes or browser navigation
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    setInputQuery(urlQ);
    setDebouncedQuery(urlQ.trim());
  }, [searchParams]);

  // Reset entity-specific filters and pagination when switching scope
  useEffect(() => {
    setStatusFilter('');
    setTypeFilter('');
    setOwnerFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, [scope]);

  // Debounce inputQuery -> debouncedQuery + URL param (~300ms)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = inputQuery.trim();
      setDebouncedQuery(trimmed);
      setPage(1);

      const currentUrlQ = (searchParams.get('q') || '').trim();
      if (trimmed !== currentUrlQ) {
        if (trimmed) {
          setSearchParams({ q: trimmed }, { replace: true });
        } else {
          setSearchParams({}, { replace: true });
        }
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [inputQuery, searchParams, setSearchParams]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load autocomplete suggestions when typing >= 2 chars
  useEffect(() => {
    const trimmed = inputQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const entityFilter: SearchEntityType[] | undefined =
          scope === 'all'
            ? selectedEntities.length > 0
              ? selectedEntities
              : undefined
            : meta.entityType
              ? [meta.entityType]
              : undefined;
        const res = await searchService.getSuggestions({
          q: trimmed,
          entities: entityFilter,
          limit: 6,
        });
        if (!cancelled) {
          setSuggestions(res);
        }
      } catch {
        // Ignore suggestion errors silently
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputQuery, scope, selectedEntities, meta.entityType]);

  // Load Search History & Users Lookup
  const loadSearchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await searchService.getSearchHistory({
        page: 1,
        limit: 10,
      });
      setHistoryItems(res.items || []);
    } catch {
      // Non-blocking
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSearchHistory();
  }, [loadSearchHistory]);

  useEffect(() => {
    let active = true;
    searchService
      .getUsersLookup()
      .then((users) => {
        if (active) setUsersLookup(users);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Execute Search whenever debouncedQuery, scope, or filters change
  const executeSearch = useCallback(async () => {
    const q = debouncedQuery.trim();
    if (!q) {
      setGlobalData(null);
      setEntityData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (scope === 'all') {
        const entitiesParam =
          selectedEntities.length > 0 ? selectedEntities : undefined;
        const response = await searchService.globalSearch({
          q,
          entities: entitiesParam,
          exact: exactMatch || undefined,
          workspaceId: currentWorkspace?.id,
          page,
          limit,
        });
        setGlobalData(response);
        void loadSearchHistory();
      } else {
        const [entityResponse, overviewCounts] = await Promise.all([
          searchService.searchEntity(scope, {
            q,
            exact: exactMatch || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            ownerId: ownerFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            workspaceId: currentWorkspace?.id,
            page,
            limit,
          }),
          searchService
            .globalSearch({
              q,
              exact: exactMatch || undefined,
              workspaceId: currentWorkspace?.id,
              page: 1,
              limit: 5,
            })
            .catch(() => null),
        ]);
        setEntityData(entityResponse);
        if (overviewCounts) {
          setGlobalData(overviewCounts);
        }
        void loadSearchHistory();
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      setError(
        apiErr?.response?.data?.message ||
          'Failed to execute search. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedQuery,
    scope,
    selectedEntities,
    exactMatch,
    statusFilter,
    typeFilter,
    ownerFilter,
    dateFrom,
    dateTo,
    page,
    currentWorkspace?.id,
    loadSearchHistory,
  ]);

  useEffect(() => {
    void executeSearch();
  }, [executeSearch]);

  // Handlers
  const toggleEntitySelection = (entityType: SearchEntityType) => {
    setPage(1);
    setSelectedEntities((prev) =>
      prev.includes(entityType)
        ? prev.filter((item) => item !== entityType)
        : [...prev, entityType],
    );
  };

  const handleApplyQuery = (queryText: string) => {
    const trimmed = queryText.trim();
    setInputQuery(trimmed);
    setDebouncedQuery(trimmed);
    setShowSuggestions(false);
    setPage(1);
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setExactMatch(false);
    setSelectedEntities([]);
    setStatusFilter('');
    setTypeFilter('');
    setOwnerFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await searchService.deleteSearchHistoryItem(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError('Could not remove search history entry.');
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const res = await searchService.clearSearchHistory();
      setHistoryItems([]);
      setSuccess(res.message || 'Search history cleared.');
    } catch {
      setError('Could not clear search history.');
    }
  };

  const hasActiveFilters =
    exactMatch ||
    selectedEntities.length > 0 ||
    Boolean(statusFilter) ||
    Boolean(typeFilter) ||
    Boolean(ownerFilter) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const counts = globalData?.counts;
  const currentResults: SearchResultItem[] =
    scope === 'all' ? globalData?.results || [] : entityData?.items || [];
  const totalMatches =
    scope === 'all' ? globalData?.total || 0 : entityData?.total || 0;
  const totalPages =
    scope === 'all'
      ? globalData?.meta?.totalPages || 1
      : entityData?.totalPages || 1;

  return (
    <SearchLayout
      scope={scope}
      queryParam={debouncedQuery || inputQuery}
      counts={counts}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {debouncedQuery && (
            <button
              type="button"
              onClick={() => void executeSearch()}
              className="lg-btn lg-btn-secondary"
            >
              <RefreshCwIcon size={15} />
              <span>Refresh</span>
            </button>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="lg-btn lg-btn-secondary"
            >
              <XIcon size={15} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      }
    >
      {/* 1. Prominent Global Search Bar + Autocomplete Dropdown */}
      <SectionCard
        title="Search Query & Filters"
        subtitle="Type a keyword for debounced search or select instant suggestions"
      >
        <div ref={searchBoxRef} className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyQuery(inputQuery);
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <SearchIcon size={18} />
              </span>
              <input
                type="search"
                value={inputQuery}
                onChange={(e) => {
                  setInputQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={meta.placeholder}
                aria-label={meta.label}
                id="global-search-input"
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-10 text-sm text-gray-900 shadow-xs transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => handleApplyQuery('')}
                  title="Clear search input"
                  aria-label="Clear search input"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <XIcon size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-700 select-none hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(e) => {
                    setExactMatch(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Exact Match</span>
              </label>

              <button
                type="submit"
                className="lg-btn lg-btn-primary"
                style={{ padding: '0.68rem 1.2rem' }}
              >
                <SearchIcon size={16} />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Instant Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute right-0 left-0 z-30 mt-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                <span>Instant Matches</span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {suggestions.map((suggestion) => {
                  const targetPath = resolveSearchResultPath({
                    id: suggestion.entityId || suggestion.id,
                    entityType: suggestion.entityType,
                    title: suggestion.text,
                    relevanceScore: 100,
                    matchedFields: [],
                    url: suggestion.url,
                  });

                  return (
                    <div
                      key={`${suggestion.entityType}-${suggestion.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-blue-50/60"
                    >
                      <button
                        type="button"
                        onClick={() => handleApplyQuery(suggestion.text)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <Badge tone={entityBadgeTone(suggestion.entityType)}>
                          {suggestion.entityType}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-900">
                            {suggestion.text}
                          </p>
                          {suggestion.subtitle && (
                            <p className="truncate text-[11px] text-gray-500">
                              {suggestion.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(targetPath);
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        <span>Open</span>
                        <ArrowRightIcon size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Contextual Filters Bar */}
        <div className="mt-4 border-t border-gray-100 pt-3.5">
          {scope === 'all' ? (
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                  <FilterIcon size={13} />
                  <span>Filter Categories:</span>
                </span>
                {ALL_SEARCH_ENTITY_TYPES.map((item) => {
                  const isSelected = selectedEntities.includes(item.type);
                  const categoryCount = counts?.[item.type];
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => toggleEntitySelection(item.type)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      <span>{item.label}</span>
                      {categoryCount !== undefined && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {categoryCount}
                        </span>
                      )}
                    </button>
                  );
                })}
                {selectedEntities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedEntities([])}
                    className="ml-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    All Categories
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-start lg:self-auto">
                <span className="text-xs font-semibold text-gray-500">
                  Display:
                </span>
                <button
                  type="button"
                  onClick={() => setDisplayMode('grouped')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    displayMode === 'grouped'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Categorized
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('combined')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    displayMode === 'combined'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Relevance List
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {meta.statusOptions && meta.statusOptions.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                    Status / Stage
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    {meta.statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {meta.typeOptions && meta.typeOptions.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                    Activity Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    {meta.typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope !== 'users' && scope !== 'companies' && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                    Owner / Assignee
                  </label>
                  <select
                    value={ownerFilter}
                    onChange={(e) => {
                      setOwnerFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">All Owners</option>
                    {usersLookup.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.email ? `(${u.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                  Created From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                  Created To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 3. Category Summary Strip when a search query is active */}
      {debouncedQuery && counts && (
        <div className="lg-stats-grid">
          <StatCard
            label="Total Matches"
            value={globalData?.total ?? totalMatches}
            hint={`Query: "${debouncedQuery}"`}
            tone="blue"
          />
          <StatCard
            label="Leads & Contacts"
            value={(counts.LEADS || 0) + (counts.CONTACTS || 0)}
            hint={`${counts.LEADS || 0} Leads • ${counts.CONTACTS || 0} Contacts`}
            tone="green"
          />
          <StatCard
            label="Companies & Deals"
            value={(counts.COMPANIES || 0) + (counts.DEALS || 0)}
            hint={`${counts.COMPANIES || 0} Companies • ${counts.DEALS || 0} Deals`}
            tone="purple"
          />
          <StatCard
            label="Activities, Docs & Notes"
            value={
              (counts.ACTIVITIES || 0) +
              (counts.DOCUMENTS || 0) +
              (counts.NOTES || 0)
            }
            hint={`${counts.ACTIVITIES || 0} Activities • ${counts.NOTES || 0} Notes`}
            tone="amber"
          />
        </div>
      )}

      {/* 4. Main Content Area + Search History Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left/Main Results Column (8 cols on lg) */}
        <div className="space-y-6 lg:col-span-8">
          {isLoading ? (
            <SectionCard
              title="Searching CRM Records"
              subtitle={`Matching "${debouncedQuery}" in ${meta.shortLabel}`}
            >
              <LoadingIndicator
                message={`Searching ${meta.shortLabel} for "${debouncedQuery}"...`}
              />
            </SectionCard>
          ) : !debouncedQuery ? (
            /* Empty State (when no search query is entered yet) */
            <SectionCard
              title="Start Searching Across Your CRM"
              subtitle="Enter a keyword above or choose a sample search or entity scope below."
            >
              <EmptyState
                title="Ready to search CRM records"
                description="Type a person's name, email address, phone number, organization, deal title, activity subject, document filename, or note keyword."
                action={
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    {QUICK_SAMPLE_SEARCHES.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => handleApplyQuery(sample)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                      >
                        Search &ldquo;{sample}&rdquo;
                      </button>
                    ))}
                  </div>
                }
              />

              {/* Browse by Entity Scope Directory */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Search by Entity Category
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {ALL_SEARCH_ENTITY_TYPES.map((cat) => {
                    const catMeta = SEARCH_SCOPE_META[cat.slug];
                    return (
                      <Link
                        key={cat.type}
                        to={catMeta.path}
                        className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 transition hover:border-blue-400 hover:bg-white hover:shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <Badge tone={entityBadgeTone(cat.type)}>
                              {cat.label}
                            </Badge>
                            <ArrowRightIcon
                              size={13}
                              className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                            />
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                            {catMeta.subtitle}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          ) : totalMatches === 0 || currentResults.length === 0 ? (
            /* No-Results State */
            <SectionCard
              title={`No matches for "${debouncedQuery}"`}
              subtitle={`Searched in ${meta.label}`}
            >
              <EmptyState
                title={`No ${meta.shortLabel} records matched "${debouncedQuery}"`}
                description="Try broadening your search terms, turning off Exact Match, or switching to Search All to inspect other CRM entity categories."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="lg-btn lg-btn-secondary"
                      >
                        Reset Active Filters
                      </button>
                    )}
                    {scope !== 'all' && (
                      <Link
                        to={`/search?q=${encodeURIComponent(debouncedQuery)}`}
                        className="lg-btn lg-btn-primary"
                      >
                        Search All Categories
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApplyQuery('')}
                      className="lg-btn lg-btn-secondary"
                    >
                      Clear Search
                    </button>
                  </div>
                }
              />
            </SectionCard>
          ) : scope === 'all' &&
            displayMode === 'grouped' &&
            globalData?.grouped ? (
            /* Categorized Grouped Results View */
            <div className="space-y-5">
              {ALL_SEARCH_ENTITY_TYPES.filter((cat) =>
                selectedEntities.length > 0
                  ? selectedEntities.includes(cat.type)
                  : true,
              ).map((cat) => {
                const groupItems = globalData.grouped[cat.type] || [];
                const totalInCat =
                  globalData.counts?.[cat.type] ?? groupItems.length;
                if (groupItems.length === 0) return null;

                return (
                  <SectionCard
                    key={cat.type}
                    title={`${cat.label} (${totalInCat})`}
                    subtitle={`Top matching ${cat.label.toLowerCase()} records for "${debouncedQuery}"`}
                    actions={
                      <Link
                        to={`/search/${cat.slug}?q=${encodeURIComponent(debouncedQuery)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <span>
                          View all {totalInCat} in {cat.label}
                        </span>
                        <ArrowRightIcon size={13} />
                      </Link>
                    }
                  >
                    <div className="space-y-3">
                      {groupItems.map((item) => (
                        <SearchResultCard
                          key={`${item.entityType}-${item.id}`}
                          item={item}
                        />
                      ))}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          ) : (
            /* Combined Relevance List OR Entity-Specific Paginated Results */
            <SectionCard
              title={`${meta.label} Results (${totalMatches})`}
              subtitle={`Showing page ${page} of ${totalPages} for "${debouncedQuery}"`}
            >
              <div className="space-y-3">
                {currentResults.map((item) => (
                  <SearchResultCard
                    key={`${item.entityType}-${item.id}`}
                    item={item}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs text-gray-500">
                    Page <strong>{page}</strong> of{' '}
                    <strong>{totalPages}</strong> ({totalMatches} total results)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="lg-btn lg-btn-secondary"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="lg-btn lg-btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          )}
        </div>

        {/* Right Column: Search History & Category Breakdown (4 cols on lg) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Category Breakdown Nav Card */}
          <SectionCard
            title="Result Categories"
            subtitle="Switch scope to apply entity-specific filters"
          >
            <div className="space-y-1.5">
              {ALL_SEARCH_ENTITY_TYPES.map((cat) => {
                const count = counts?.[cat.type];
                const isActiveScope = scope === cat.slug;
                const qs = debouncedQuery
                  ? `?q=${encodeURIComponent(debouncedQuery)}`
                  : '';

                return (
                  <Link
                    key={cat.type}
                    to={`/search/${cat.slug}${qs}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      isActiveScope
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isActiveScope
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200/80 text-gray-700'
                      }`}
                    >
                      {count !== undefined ? count : '—'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          {/* Recent Search History Card */}
          <SectionCard
            title="Recent Search History"
            subtitle="Click a recent query to run it again"
            actions={
              historyItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleClearAllHistory()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                >
                  <TrashIcon size={12} />
                  <span>Clear All</span>
                </button>
              ) : undefined
            }
          >
            {isHistoryLoading && historyItems.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">
                Loading search history...
              </p>
            ) : historyItems.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-medium text-gray-500">
                  No recent search history yet.
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Queries you run across CRM entities will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyItems.map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyQuery(hist.query)}
                      className="group flex min-w-0 flex-1 items-start gap-2 text-left"
                    >
                      <span className="mt-0.5 text-gray-400 group-hover:text-blue-600">
                        <ClockIcon size={13} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-gray-800 group-hover:text-blue-600">
                          {hist.query}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {hist.resultsCount} results • {hist.entityType} •{' '}
                          {formatDateTime(hist.createdAt)}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteHistoryItem(hist.id)}
                      title="Delete history entry"
                      aria-label="Delete history entry"
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </SearchLayout>
  );
};
