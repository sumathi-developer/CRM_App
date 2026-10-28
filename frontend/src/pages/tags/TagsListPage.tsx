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
        <div className="page-header-row">
          <div className="page-header-text">
            <div className="page-breadcrumbs">
              <span className="breadcrumb-root">Workspace</span>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" />
              <span className="breadcrumb-current">Tags</span>
            </div>
            <h1 className="page-title">
              <span className="title-icon-wrap">
                <TagIcon size={24} />
              </span>
              <span>CRM Tags Management</span>
            </h1>
            <p className="page-subtitle">
              Organize, segment, and track leads, contacts, deals, and activities across your workspace.
            </p>
          </div>

          <div className="page-header-actions">
            <Link
              to="/tags/usage"
              className="auth-btn btn-secondary"
              title="View workspace-wide tag usage statistics"
              id="global-tag-usage-btn"
            >
              <BarChart2Icon size={16} />
              <span>Usage Analytics</span>
            </Link>

            {canManageTags && (
              <Link
                to="/tags/create"
                className="auth-btn btn-primary"
                id="create-new-tag-btn"
              >
                <PlusIcon size={16} />
                <span>Create Tag</span>
              </Link>
            )}
          </div>
        </div>

        {/* Global Overview Metrics Strip */}
        {globalStats && (
          <div className="tags-metrics-strip">
            <div className="tag-metric-card">
              <div className="metric-icon-wrap blue">
                <TagIcon size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Tags</span>
                <span className="metric-val">{globalStats.totalTags}</span>
              </div>
            </div>

            <div className="tag-metric-card">
              <div className="metric-icon-wrap emerald">
                <CheckCircleIcon size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Active Tags</span>
                <span className="metric-val">{globalStats.activeTags}</span>
              </div>
            </div>

            <div className="tag-metric-card">
              <div className="metric-icon-wrap amber">
                <LockIcon size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Archived Tags</span>
                <span className="metric-val">{globalStats.archivedTags}</span>
              </div>
            </div>

            <div className="tag-metric-card">
              <div className="metric-icon-wrap purple">
                <BarChart2Icon size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total CRM Assignments</span>
                <span className="metric-val">{globalStats.totalAssignments}</span>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {apiError && (
          <div className="page-alert-wrap">
            <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
          </div>
        )}

        {apiSuccess && (
          <div className="page-alert-wrap">
            <SuccessMessage message={apiSuccess} onDismiss={() => setApiSuccess(null)} />
          </div>
        )}

        {/* Filters and Search Toolbar */}
        <div className="tags-toolbar-card">
          <div className="tags-search-input-wrap">
            <SearchIcon size={18} className="search-field-icon" />
            <input
              type="text"
              id="tag-search-input"
              className="tags-search-input"
              placeholder="Search tags by name or description..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          <div className="tags-filters-group">
            {/* Status Filter */}
            <div className="filter-select-wrap">
              <label htmlFor="filter-status-select" className="filter-mini-label">
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
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Protected Filter */}
            <div className="filter-select-wrap">
              <label htmlFor="filter-protection-select" className="filter-mini-label">
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
              >
                <option value="ALL">All Tags</option>
                <option value="PROTECTED">Protected Only</option>
                <option value="UNPROTECTED">Standard Only</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="filter-select-wrap">
              <label htmlFor="filter-entity-select" className="filter-mini-label">
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
            <div className="filter-select-wrap">
              <label htmlFor="filter-sort-select" className="filter-mini-label">
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
            >
              <RefreshCwIcon size={16} />
            </button>
          </div>
        </div>

        {/* Content Table / Grid */}
        <div className="tags-table-card">
          {isLoading ? (
            <div className="tags-loading-state">
              <LoadingIndicator size="medium" />
              <p className="loading-state-text">Loading tags from workspace...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="tags-empty-container">
              <EmptyState
                title={searchQuery ? 'No matching tags found' : 'No tags created yet'}
                description={
                  searchQuery
                    ? `No tags matched your search query "${searchQuery}". Try adjusting your filters.`
                    : 'Tags help you categorize deals, leads, contacts, and track team activities effectively.'
                }
              />
              <div className="empty-actions-row">
                {searchQuery ? (
                  <button
                    type="button"
                    className="auth-btn btn-secondary"
                    onClick={handleClearSearch}
                  >
                    Clear Search
                  </button>
                ) : canManageTags ? (
                  <Link to="/tags/create" className="auth-btn btn-primary">
                    <PlusIcon size={16} />
                    <span>Create Your First Tag</span>
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="tags-table-responsive">
                <table className="tags-data-table">
                  <thead>
                    <tr>
                      <th className="col-tag">Tag Name & Badge</th>
                      <th className="col-desc">Description</th>
                      <th className="col-status">Status</th>
                      <th className="col-usage">Usage Count</th>
                      <th className="col-created">Created</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map((tag) => (
                      <tr key={tag.id} className="tag-table-row">
                        {/* Tag Name & Badge */}
                        <td className="col-tag">
                          <div className="tag-item-cell">
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
                              >
                                <LockIcon size={11} />
                                <span>Protected</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="col-desc">
                          <span className="tag-desc-text">
                            {tag.description || <span className="text-muted-dash">—</span>}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="col-status">
                          <span
                            className={`tag-status-pill status-${tag.status.toLowerCase()}`}
                          >
                            <span className="status-dot" />
                            <span>{tag.status}</span>
                          </span>
                        </td>

                        {/* Usage Count */}
                        <td className="col-usage">
                          <Link
                            to={`/tags/${tag.id}/usage`}
                            className="tag-usage-count-link"
                            title="Click to view detailed CRM entity usage breakdown"
                          >
                            <BarChart2Icon size={13} />
                            <span className="usage-count-num">{tag.usageCount}</span>
                            <span className="usage-count-label">
                              {tag.usageCount === 1 ? 'assignment' : 'assignments'}
                            </span>
                          </Link>
                        </td>

                        {/* Created Date */}
                        <td className="col-created">
                          <span className="tag-date-text">
                            {new Date(tag.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>

                        {/* Controls */}
                        <td className="col-actions">
                          <div className="tag-actions-group">
                            {/* View Usage Button */}
                            <Link
                              to={`/tags/${tag.id}/usage`}
                              className="tag-action-icon-btn usage"
                              title="View Tag Usage Breakdown"
                              aria-label={`View usage for ${tag.name}`}
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
                              >
                                <EditIcon size={15} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="tag-action-icon-btn disabled"
                                title="You lack permissions to edit tags"
                                disabled
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
                              >
                                <TrashIcon size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="tag-action-icon-btn disabled"
                                title="You lack permissions to delete tags"
                                disabled
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
              <div className="tags-pagination-footer">
                <div className="pagination-count-info">
                  Showing <strong>{tags.length}</strong> of <strong>{totalCount}</strong> tags
                </div>

                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1 || isLoading}
                    >
                      Previous
                    </button>

                    <div className="pagination-pages-list">
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
                              {hasGap && <span className="pagination-gap">...</span>}
                              <button
                                type="button"
                                className={`pagination-page-num ${
                                  p === currentPage ? 'is-active' : ''
                                }`}
                                onClick={() => setCurrentPage(p)}
                                disabled={isLoading}
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
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

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
