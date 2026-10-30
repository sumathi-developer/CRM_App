import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../../services/document.service';
import type {
  DocumentFileCategory,
  DocumentRecord,
} from '../../types/document.types';
import { DocumentsLayout } from './components/DocumentsLayout';
import {
  Badge,
  SectionCard,
  StatCard,
} from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  BriefcaseIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  DOCUMENT_CATEGORY_OPTIONS,
  formatFileSize,
  getDocumentFileCategory,
  getDocumentRelatedLinks,
  getDocumentTypeBadgeInfo,
} from './documentConstants';

export interface DocumentsExplorerPageProps {
  scope?: 'all' | 'recent' | 'shared';
}

export const DocumentsExplorerPage: React.FC<DocumentsExplorerPageProps> = ({
  scope = 'all',
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<DocumentFileCategory>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size'>('newest');

  const [deletingDoc, setDeletingDoc] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [referenceTimeMs, setReferenceTimeMs] = useState<number>(0);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await documentService.getAllDocuments();
      setDocuments(list);
      setReferenceTimeMs(Date.now());
    } catch (err: any) {
      setError(err?.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const scopedDocuments = useMemo(() => {
    let list = [...documents];

    if (scope === 'recent') {
      const cutoffMs = referenceTimeMs - 14 * 24 * 60 * 60 * 1000;
      const recentList = list.filter(
        (d) => new Date(d.createdAt).getTime() >= cutoffMs,
      );
      list = recentList.length > 0 ? recentList : list.slice(0, 15);
    } else if (scope === 'shared') {
      list = list.filter(
        (d) =>
          d.attachments.length > 0 || (d.shares && d.shares.length > 0),
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const hay = [
          d.displayTitle || '',
          d.originalName,
          d.fileName,
          d.mimeType,
          d.description || '',
          (d.tags || []).join(' '),
          d.uploadedBy?.name || '',
          d.uploadedBy?.email || '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter(
        (d) => getDocumentFileCategory(d) === categoryFilter,
      );
    }

    if (entityTypeFilter) {
      list = list.filter((d) =>
        (d.attachments || []).some(
          (att) =>
            (att.entityType || '').toUpperCase() === entityTypeFilter,
        ),
      );
    }

    if (sortBy === 'name') {
      list.sort((a, b) =>
        (a.displayTitle || a.originalName).localeCompare(
          b.displayTitle || b.originalName,
        ),
      );
    } else if (sortBy === 'size') {
      list.sort((a, b) => b.size - a.size);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return list;
  }, [
    documents,
    scope,
    search,
    categoryFilter,
    entityTypeFilter,
    sortBy,
    referenceTimeMs,
  ]);

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await documentService.deleteDocument(deletingDoc.id);
      setBannerMessage(
        `Deleted document "${deletingDoc.displayTitle || deletingDoc.originalName}".`,
      );
      setDeletingDoc(null);
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSize = useMemo(
    () => documents.reduce((acc, d) => acc + (d.size || 0), 0),
    [documents],
  );
  const sharedCount = useMemo(
    () =>
      documents.filter(
        (d) => d.attachments.length > 0 || (d.shares && d.shares.length > 0),
      ).length,
    [documents],
  );
  const recent7DaysCount = useMemo(() => {
    if (!referenceTimeMs) return 0;
    const cutoff = referenceTimeMs - 7 * 24 * 60 * 60 * 1000;
    return documents.filter(
      (d) => new Date(d.createdAt).getTime() >= cutoff,
    ).length;
  }, [documents, referenceTimeMs]);

  const pageTitle = useMemo(() => {
    if (scope === 'recent') return 'Recent Documents';
    if (scope === 'shared') return 'Shared Documents';
    return 'All Documents';
  }, [scope]);

  const pageSubtitle = useMemo(() => {
    if (scope === 'recent') {
      return 'Quickly access recently uploaded proposals, contracts, spreadsheets, and attachments.';
    }
    if (scope === 'shared') {
      return 'Documents shared with team members or attached to CRM Contacts, Leads, Deals, and Organizations.';
    }
    return 'Centralized repository for all CRM files, contracts, proposals, decks, and record attachments.';
  }, [scope]);

  const hasActiveFilters = Boolean(
    search ||
      categoryFilter !== 'ALL' ||
      entityTypeFilter ||
      sortBy !== 'newest',
  );

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setEntityTypeFilter('');
    setSortBy('newest');
  };

  return (
    <DocumentsLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <div
            className="ld-view-switcher"
            role="group"
            aria-label="Document view mode"
          >
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              List / Table
            </button>
            <button
              type="button"
              className={`ld-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Cards
            </button>
          </div>

          <Link
            to="/documents/upload"
            className="auth-btn btn-primary btn-size-small"
          >
            <PlusIcon size={15} /> Upload Document
          </Link>
        </div>
      }
    >
      {/* KPI Summary Cards */}
      <div className="lg-stat-grid">
        <StatCard
          label="Total Documents"
          value={documents.length}
          hint="Stored in CRM repository"
          tone="blue"
          icon={<BriefcaseIcon size={18} />}
        />
        <StatCard
          label="Uploaded This Week"
          value={recent7DaysCount}
          hint="Added in the last 7 days"
          tone="purple"
          icon={<ClockIcon size={18} />}
        />
        <StatCard
          label="Shared & Attached"
          value={sharedCount}
          hint="Linked to CRM records or teammates"
          tone="green"
          icon={<UsersIcon size={18} />}
        />
        <StatCard
          label="Total Volume"
          value={formatFileSize(totalSize)}
          hint="Combined file storage size"
          tone="amber"
          icon={<ActivityIcon size={18} />}
        />
      </div>

      {/* Search & Filters */}
      <FilterBar
        onRefresh={loadDocuments}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => setSearch(val)}
          placeholder="Search filename, title, uploader, tags..."
        />

        <select
          className="lg-select"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as DocumentFileCategory)
          }
          aria-label="Filter by file type"
        >
          {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          aria-label="Filter by linked CRM record type"
        >
          <option value="">All Linked Record Types</option>
          <option value="DEAL">Linked to Deals</option>
          <option value="CONTACT">Linked to Contacts</option>
          <option value="LEAD">Linked to Leads</option>
          <option value="ORGANIZATION">Linked to Organizations</option>
        </select>

        <select
          className="lg-select"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'newest' | 'name' | 'size')
          }
          aria-label="Sort documents"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="name">Sort: Name (A–Z)</option>
          <option value="size">Sort: Largest Size</option>
        </select>
      </FilterBar>

      {/* Document List / Grid */}
      <SectionCard
        title={`${pageTitle} (${scopedDocuments.length})`}
        subtitle="Preview, edit metadata, manage sharing permissions, or link documents to CRM records"
      >
        {loading ? (
          <div style={{ padding: '2.5rem' }}>
            <LoadingIndicator message="Loading documents..." />
          </div>
        ) : scopedDocuments.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="Upload a document or adjust your search and file type filters."
            action={
              <Link
                to="/documents/upload"
                className="auth-btn btn-primary btn-size-small"
              >
                <PlusIcon size={14} /> Upload Document
              </Link>
            }
          />
        ) : viewMode === 'table' ? (
          <div className="lg-table-wrap">
            <table className="lg-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Document Name</th>
                  <th>Size</th>
                  <th>Linked CRM Records & Sharing</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scopedDocuments.map((doc) => {
                  const badge = getDocumentTypeBadgeInfo(doc);
                  const related = getDocumentRelatedLinks(doc);

                  return (
                    <tr key={doc.id}>
                      <td>
                        <Badge tone={badge.tone}>{badge.shortLabel}</Badge>
                      </td>
                      <td>
                        <div className="max-w-md">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="block truncate text-sm font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {doc.displayTitle || doc.originalName}
                          </Link>
                          <p className="truncate text-xs text-gray-500">
                            {doc.originalName} · {doc.mimeType}
                          </p>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {doc.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-gray-700">
                          {formatFileSize(doc.size)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {related.map((rel) => (
                            <Link
                              key={rel.attachmentId}
                              to={rel.path}
                              className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                            >
                              {rel.entityType}: {rel.label}
                            </Link>
                          ))}
                          {doc.shares && doc.shares.length > 0 && (
                            <Badge tone="green">
                              Shared ({doc.shares.length})
                            </Badge>
                          )}
                          {related.length === 0 &&
                            (!doc.shares || doc.shares.length === 0) && (
                              <span className="text-xs text-gray-400">
                                Private
                              </span>
                            )}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-700">
                          {doc.uploadedBy?.name ||
                            doc.uploadedBy?.email ||
                            'System'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(doc.createdAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="lg-badge-row"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          <Link
                            to={`/documents/${doc.id}/preview`}
                            className="auth-btn btn-secondary btn-size-small"
                            title="Preview Document"
                          >
                            <EyeIcon size={14} /> Preview
                          </Link>
                          <Link
                            to={`/documents/${doc.id}/edit`}
                            className="auth-btn btn-secondary btn-size-small"
                            title="Edit Document"
                          >
                            <EditIcon size={14} />
                          </Link>
                          <Link
                            to={`/documents/${doc.id}/sharing`}
                            className="auth-btn btn-secondary btn-size-small"
                            title="Share Document"
                          >
                            <UsersIcon size={14} />
                          </Link>
                          <button
                            type="button"
                            className="auth-btn btn-secondary btn-size-small"
                            onClick={() => setDeletingDoc(doc)}
                            title="Delete Document"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scopedDocuments.map((doc) => {
              const badge = getDocumentTypeBadgeInfo(doc);
              const related = getDocumentRelatedLinks(doc);

              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all hover:border-blue-300"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge tone={badge.tone}>{badge.shortLabel}</Badge>
                      <span className="text-xs font-semibold text-gray-500">
                        {formatFileSize(doc.size)}
                      </span>
                    </div>

                    <Link
                      to={`/documents/${doc.id}`}
                      className="mt-2.5 block truncate text-sm font-bold text-gray-900 hover:text-blue-600"
                    >
                      {doc.displayTitle || doc.originalName}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {doc.originalName}
                    </p>

                    {doc.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                        {doc.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">
                      {related.map((rel) => (
                        <Link
                          key={rel.attachmentId}
                          to={rel.path}
                          className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                        >
                          {rel.entityType}: {rel.label}
                        </Link>
                      ))}
                      {doc.shares && doc.shares.length > 0 && (
                        <Badge tone="green">
                          {doc.shares.length} share(s)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-[11px] text-gray-400">
                      {formatDateTime(doc.createdAt)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/documents/${doc.id}/preview`}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Preview
                      </Link>
                      <Link
                        to={`/documents/${doc.id}/sharing`}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Share
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeletingDoc(doc)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                        title="Delete"
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingDoc)}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deletingDoc?.displayTitle || deletingDoc?.originalName || 'this document'}"?`}
        confirmLabel="Delete Document"
        isLoading={isDeleting}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleConfirmDelete}
      />
    </DocumentsLayout>
  );
};

export default DocumentsExplorerPage;
