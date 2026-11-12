import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { tagService } from '../../services/tag.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type {
  TagEntity,
  TagStatus,
  TagEntityType,
} from '../../types/tag.types';
import { Navbar } from '../../components/common/Navbar';
import { TagBadge } from './TagBadge';
import { DeleteTagModal } from './DeleteTagModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { EmptyState } from '../../components/common/EmptyState';
import {
  TagIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  BarChart2Icon,
  LockIcon,
  XIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

export const TagsListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { currentWorkspace, userRoleInWorkspace } = useWorkspace();
  const [, startTransition] = useTransition();

  // State
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TagStatus | 'ALL'>('ALL');
  const [protectedFilter, setProtectedFilter] = useState<'ALL' | 'PROTECTED' | 'UNPROTECTED'>('ALL');
  const [entityFilter, setEntityFilter] = useState<TagEntityType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'usageCount'>('usageCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Global usage summary for top strip
  const [globalStats, setGlobalStats] = useState<{
    totalTags: number;
    activeTags: number;
    archivedTags: number;
    totalAssignments: number;
  } | null>(null);

  // Delete modal state
  const [tagToDelete, setTagToDelete] = useState<TagEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Permission check
  const canManageTags =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  const workspaceId = currentWorkspace?.id;

  // Load Tags & Quick Metrics
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const isProtectedParam =
        protectedFilter === 'PROTECTED' ? true : protectedFilter === 'UNPROTECTED' ? false : undefined;

      const [tagsResponse, summaryResponse] = await Promise.all([
        tagService.getTags({
          page: currentPage,
          limit: pageSize,
          search: searchQuery.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          isProtected: isProtectedParam,
          entityType: entityFilter === 'ALL' ? undefined : entityFilter,
          sortBy,
          sortOrder,
          workspaceId,
        }),
        tagService.getGlobalUsageSummary(workspaceId).catch(() => null),
      ]);

      setTags(tagsResponse.data || []);
      setTotalCount(tagsResponse.meta?.total || 0);
      setTotalPages(tagsResponse.meta?.totalPages || 1);

      if (summaryResponse) {
        setGlobalStats({
          totalTags: summaryResponse.totalTags,
          activeTags: summaryResponse.activeTags,
          archivedTags: summaryResponse.archivedTags,
          totalAssignments: summaryResponse.totalAssignments,
        });
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load tags. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchQuery,
    statusFilter,
    protectedFilter,
    entityFilter,
    sortBy,
    sortOrder,
    workspaceId,
  ]);

  useEffect(() => {
    loadTags();
  }, [loadTags, refreshTrigger]);

  // Handle Search Input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setSearchQuery(val);
      setCurrentPage(1);
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle Delete / Archive
  const handleDeleteConfirm = async (tagId: string, hardDelete: boolean, force: boolean) => {
    setIsDeleting(true);
    setApiError(null);
    try {
      const res = await tagService.deleteTag(tagId, hardDelete, force);
      setApiSuccess(res.message || 'Tag deleted successfully');
      setTagToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setApiError(err.message || 'Could not delete tag.');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main-content tags-page-container">
        {/* Header Section */}
        <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
          <div className="page-header-text">
            <div className="page-breadcrumbs">
              <span className="breadcrumb-root">Workspace</span>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" />
              <span className="breadcrumb-current">Tags</span>
            </div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#062E03', fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>
              <span
                className="title-icon-wrap"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EAF4ED',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TagIcon size={22} />
              </span>
              <span>CRM Tags Management</span>
            </h1>
            <p className="page-subtitle" style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              Organize, segment, and track leads, contacts, deals, and activities across your workspace.
            </p>
          </div>

          <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/tags/usage"
              className="auth-btn btn-secondary"
              title="View workspace-wide tag usage statistics"
              id="global-tag-usage-btn"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#062E03',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EAF4ED';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
              }}
            >
              <BarChart2Icon size={16} />
              <span>Usage Analytics</span>
            </Link>

            {canManageTags && (
              <Link
                to="/tags/create"
                className="auth-btn btn-primary"
                id="create-new-tag-btn"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.borderColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.borderColor = '#10B981';
                }}
              >
                <PlusIcon size={16} />
                <span>Create Tag</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Overview Metrics Strip */}
        {globalStats && (
          <div
            className="tags-metrics-strip"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              className="tag-metric-card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                className="metric-icon-wrap blue"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TagIcon size={20} />
              </div>
              <div className="metric-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  className="metric-label"
                  style={{
                    color: '#64748B',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Total Tags
                </span>
                <span
                  className="metric-val"
                  style={{
                    color: '#062E03',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginTop: '2px',
                  }}
                >
                  {globalStats.totalTags}
                </span>
              </div>
            </div>

            <div
              className="tag-metric-card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                className="metric-icon-wrap emerald"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#EAF4ED',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircleIcon size={20} />
              </div>
              <div className="metric-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  className="metric-label"
                  style={{
                    color: '#64748B',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Active Tags
                </span>
                <span
                  className="metric-val"
                  style={{
                    color: '#062E03',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginTop: '2px',
                  }}
                >
                  {globalStats.activeTags}
                </span>
              </div>
            </div>

            <div
              className="tag-metric-card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                className="metric-icon-wrap amber"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid rgba(245, 158, 11, 0.28)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LockIcon size={20} />
              </div>
              <div className="metric-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  className="metric-label"
                  style={{
                    color: '#64748B',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Archived Tags
                </span>
                <span
                  className="metric-val"
                  style={{
                    color: '#062E03',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginTop: '2px',
                  }}
                >
                  {globalStats.archivedTags}
                </span>
              </div>
            </div>

            <div
              className="tag-metric-card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                className="metric-icon-wrap purple"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#F5EEFB',
                  border: '1px solid rgba(139, 92, 246, 0.28)',
                  color: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BarChart2Icon size={20} />
              </div>
              <div className="metric-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  className="metric-label"
                  style={{
                    color: '#64748B',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Total CRM Assignments
                </span>
                <span
                  className="metric-val"
                  style={{
                    color: '#062E03',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginTop: '2px',
                  }}
                >
                  {globalStats.totalAssignments}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {apiError && (
          <div className="page-alert-wrap" style={{ marginBottom: '1.25rem' }}>
            <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
          </div>
        )}

        {apiSuccess && (
          <div className="page-alert-wrap" style={{ marginBottom: '1.25rem' }}>
            <SuccessMessage message={apiSuccess} onDismiss={() => setApiSuccess(null)} />
          </div>
        )}

        {/* Filters and Search Toolbar */}
        <div
          className="tags-toolbar-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            className="tags-search-input-wrap"
            style={{
              position: 'relative',
              flex: '1 1 280px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <SearchIcon
              size={18}
              className="search-field-icon"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#10B981',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
            <input
              type="text"
              id="tag-search-input"
              className="tags-search-input"
              placeholder="Search tags by name or description..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchQuery ? '36px' : '14px',
                height: '38px',
                fontSize: '13px',
                color: '#062E03',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          <div
            className="tags-filters-group"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Status Filter */}
            <div className="filter-select-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px' }}>
              <label htmlFor="filter-status-select" className="filter-mini-label" style={{ color: '#64748B', fontWeight: 600 }}>
                Status:
              </label>
              <select
                id="filter-status-select"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#062E03',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Protected Filter */}
            <div className="filter-select-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px' }}>
              <label htmlFor="filter-protection-select" className="filter-mini-label" style={{ color: '#64748B', fontWeight: 600 }}>
                Protection:
              </label>
              <select
                id="filter-protection-select"
                className="filter-select"
                value={protectedFilter}
                onChange={(e) => {
                  setProtectedFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#062E03',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Tags</option>
                <option value="PROTECTED">Protected Only</option>
                <option value="UNPROTECTED">Standard Only</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="filter-select-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px' }}>
              <label htmlFor="filter-entity-select" className="filter-mini-label" style={{ color: '#64748B', fontWeight: 600 }}>
                Entity:
              </label>
              <select
                id="filter-entity-select"
                className="filter-select"
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#062E03',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Entities</option>
                <option value="LEAD">Leads</option>
                <option value="CONTACT">Contacts</option>
                <option value="COMPANY">Companies</option>
                <option value="DEAL">Deals</option>
                <option value="ACTIVITY">Activities</option>
                <option value="DOCUMENT">Documents</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="filter-select-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px' }}>
              <label htmlFor="filter-sort-select" className="filter-mini-label" style={{ color: '#64748B', fontWeight: 600 }}>
                Sort:
              </label>
              <select
                id="filter-sort-select"
                className="filter-select"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [any, any];
                  setSortBy(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#062E03',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="usageCount-desc">Most Used First</option>
                <option value="usageCount-asc">Least Used First</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              title="Refresh tag list"
              aria-label="Refresh tag list"
              style={{
                height: '38px',
                width: '38px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#062E03',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EAF4ED';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
              }}
            >
              <RefreshCwIcon size={16} />
            </button>
          </div>
        </div>

        {/* Content Table / Grid / Empty State */}
        {isLoading ? (
          <div
            className="tags-loading-state"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid rgba(16, 185, 129, 0.22)',
              boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            }}
          >
            <LoadingIndicator size="medium" />
            <p className="loading-state-text" style={{ color: '#64748B', marginTop: '12px', fontSize: '13px' }}>
              Loading tags from workspace...
            </p>
          </div>
        ) : tags.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No matching tags found' : 'No tags created yet'}
            description={
              searchQuery
                ? `No tags matched your search query "${searchQuery}". Try adjusting your filters.`
                : 'Tags help you categorize deals, leads, contacts, and track team activities effectively.'
            }
            action={
              searchQuery ? (
                <button
                  type="button"
                  className="auth-btn btn-secondary"
                  onClick={handleClearSearch}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#062E03',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EAF4ED';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                  }}
                >
                  Clear Search
                </button>
              ) : canManageTags ? (
                <Link
                  to="/tags/create"
                  className="auth-btn btn-primary"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.borderColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                >
                  <PlusIcon size={16} />
                  <span>Create Your First Tag</span>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div
            className="tags-table-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(16, 185, 129, 0.22)',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
              overflow: 'hidden',
            }}
          >
            <div className="tags-table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
              <table className="tags-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FCF9', borderBottom: '1px solid rgba(16, 185, 129, 0.18)' }}>
                  <tr>
                    <th className="col-tag" style={{ padding: '12px 16px', color: '#062E03', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FCF9' }}>Tag Name & Badge</th>
                    <th className="col-desc" style={{ padding: '12px 16px', color: '#062E03', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FCF9' }}>Description</th>
                    <th className="col-status" style={{ padding: '12px 16px', color: '#062E03', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FCF9' }}>Status</th>
                    <th className="col-usage" style={{ padding: '12px 16px', color: '#062E03', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FCF9' }}>Usage Count</th>
                    <th className="col-created" style={{ padding: '12px 16px', color: '#062E03', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FCF9' }}>Created</th>
                    <th className="col-actions" style={{ padding: '12px 16px', color: '#062E03', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FCF9', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr
                      key={tag.id}
                      className="tag-table-row"
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderBottom: '1px solid rgba(16, 185, 129, 0.08)',
                      }}
                    >
                      {/* Tag Name & Badge */}
                      <td className="col-tag" style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div className="tag-item-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TagBadge
                            name={tag.name}
                            color={tag.color}
                            status={tag.status}
                            isProtected={tag.isProtected}
                            size="md"
                          />
                          {tag.isProtected && (
                            <span
                              className="tag-protected-chip"
                              title="Protected tag: Deletion blocked to safeguard workflows"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#D97706',
                                backgroundColor: '#FEF3C7',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              <LockIcon size={11} />
                              <span>Protected</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="col-desc" style={{ padding: '12px 16px', color: '#4B5563', fontSize: '13px', verticalAlign: 'middle' }}>
                        <span className="tag-desc-text">
                          {tag.description || <span className="text-muted-dash" style={{ color: '#94A3B8' }}>—</span>}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="col-status" style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span
                          className={`tag-status-pill status-${tag.status.toLowerCase()}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: tag.status === 'ACTIVE' ? '#EAF4ED' : tag.status === 'ARCHIVED' ? '#FEF3C7' : '#F1F5F9',
                            color: tag.status === 'ACTIVE' ? '#10B981' : tag.status === 'ARCHIVED' ? '#D97706' : '#64748B',
                          }}
                        >
                          <span
                            className="status-dot"
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: tag.status === 'ACTIVE' ? '#10B981' : tag.status === 'ARCHIVED' ? '#D97706' : '#64748B',
                            }}
                          />
                          <span>{tag.status}</span>
                        </span>
                      </td>

                      {/* Usage Count */}
                      <td className="col-usage" style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <Link
                          to={`/tags/${tag.id}/usage`}
                          className="tag-usage-count-link"
                          title="Click to view detailed CRM entity usage breakdown"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#062E03',
                            fontWeight: 600,
                            fontSize: '13px',
                            textDecoration: 'none',
                          }}
                        >
                          <BarChart2Icon size={14} style={{ color: '#10B981' }} />
                          <span className="usage-count-num" style={{ color: '#062E03' }}>{tag.usageCount}</span>
                          <span className="usage-count-label" style={{ color: '#64748B', fontSize: '12px' }}>
                            {tag.usageCount === 1 ? 'assignment' : 'assignments'}
                          </span>
                        </Link>
                      </td>

                      {/* Created Date */}
                      <td className="col-created" style={{ padding: '12px 16px', color: '#64748B', fontSize: '13px', verticalAlign: 'middle' }}>
                        <span className="tag-date-text">
                          {new Date(tag.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Controls */}
                      <td className="col-actions" style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div className="tag-actions-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* View Usage Button */}
                          <Link
                            to={`/tags/${tag.id}/usage`}
                            className="tag-action-icon-btn usage"
                            title="View Tag Usage Breakdown"
                            aria-label={`View usage for ${tag.name}`}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              backgroundColor: '#FFFFFF',
                              color: '#10B981',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                            }}
                          >
                            <BarChart2Icon size={15} />
                          </Link>

                          {/* Edit Button */}
                          {canManageTags ? (
                            <Link
                              to={`/tags/${tag.id}/edit`}
                              className="tag-action-icon-btn edit"
                              title="Edit Tag"
                              aria-label={`Edit ${tag.name}`}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                backgroundColor: '#FFFFFF',
                                color: '#062E03',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                              }}
                            >
                              <EditIcon size={15} />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="tag-action-icon-btn disabled"
                              title="You lack permissions to edit tags"
                              disabled
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#CBD5E1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'not-allowed',
                              }}
                            >
                              <EditIcon size={15} />
                            </button>
                          )}

                          {/* Delete / Archive Button */}
                          {canManageTags ? (
                            <button
                              type="button"
                              className="tag-action-icon-btn delete"
                              title={
                                tag.isProtected
                                  ? 'Tag is protected (click to manage)'
                                  : 'Archive or Delete Tag'
                              }
                              onClick={() => setTagToDelete(tag)}
                              aria-label={`Delete ${tag.name}`}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                backgroundColor: '#FFFFFF',
                                color: '#EF4444',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <TrashIcon size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="tag-action-icon-btn disabled"
                              title="You lack permissions to delete tags"
                              disabled
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#CBD5E1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'not-allowed',
                              }}
                            >
                              <TrashIcon size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              className="tags-pagination-footer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                backgroundColor: '#F8FCF9',
                borderTop: '1px solid rgba(16, 185, 129, 0.15)',
              }}
            >
              <div className="pagination-count-info" style={{ color: '#062E03', fontSize: '13px' }}>
                Showing <strong>{tags.length}</strong> of <strong>{totalCount}</strong> tags
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isLoading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      backgroundColor: '#FFFFFF',
                      color: '#062E03',
                      fontSize: '12px',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage <= 1 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>

                  <div className="pagination-pages-list" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 1 && p <= currentPage + 1)
                      )
                      .map((p, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const hasGap = prevPage && p - prevPage > 1;

                        return (
                          <React.Fragment key={p}>
                            {hasGap && <span className="pagination-gap" style={{ color: '#64748B' }}>...</span>}
                            <button
                              type="button"
                              className={`pagination-page-num ${
                                p === currentPage ? 'is-active' : ''
                              }`}
                              onClick={() => setCurrentPage(p)}
                              disabled={isLoading}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: p === currentPage ? '1px solid #10B981' : '1px solid rgba(16, 185, 129, 0.2)',
                                backgroundColor: p === currentPage ? '#10B981' : '#FFFFFF',
                                color: p === currentPage ? '#FFFFFF' : '#062E03',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isLoading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      backgroundColor: '#FFFFFF',
                      color: '#062E03',
                      fontSize: '12px',
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage >= totalPages ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteTagModal
          isOpen={Boolean(tagToDelete)}
          tag={tagToDelete}
          onClose={() => setTagToDelete(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
        />
      </main>
    </div>
  );
};
