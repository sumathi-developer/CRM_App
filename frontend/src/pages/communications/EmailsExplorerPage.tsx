import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { communicationService } from '../../services/communication.service';
import type {
  BatchEmailActionType,
  EmailFolder,
  EmailMessageItem,
  EmailStatus,
} from '../../types/communication.types';
import { CommunicationsLayout } from './components/CommunicationsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { FilterBar, SearchInput } from '../lead-generation/components/FilterBar';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  CheckCircleIcon,
  EyeIcon,
  MailIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from '../../components/common/Icons';
import {
  EMAIL_STATUS_OPTIONS,
  emailStatusTone,
  getEmailRelatedLinks,
  stripHtmlToText,
} from './communicationConstants';

export interface EmailsExplorerPageProps {
  forcedFolder?: 'ALL' | 'INBOX' | 'SENT';
}

export const EmailsExplorerPage: React.FC<EmailsExplorerPageProps> = ({
  forcedFolder,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryFolder = (searchParams.get('folder') || '').toUpperCase() as
    | EmailFolder
    | 'STARRED'
    | '';

  const [activeFolder, setActiveFolder] = useState<EmailFolder | 'STARRED'>(
    () => {
      if (forcedFolder) return forcedFolder;
      if (
        queryFolder === 'INBOX' ||
        queryFolder === 'SENT' ||
        queryFolder === 'DRAFTS' ||
        queryFolder === 'ARCHIVE' ||
        queryFolder === 'TRASH' ||
        queryFolder === 'STARRED'
      ) {
        return queryFolder;
      }
      return 'ALL';
    },
  );

  useEffect(() => {
    if (forcedFolder) {
      setActiveFolder(forcedFolder);
    } else if (queryFolder) {
      setActiveFolder(queryFolder as EmailFolder | 'STARRED');
    }
  }, [forcedFolder, queryFolder]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [emails, setEmails] = useState<EmailMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingEmail, setDeletingEmail] = useState<EmailMessageItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const commonQuery = {
        search: search.trim() || undefined,
        status: (statusFilter as EmailStatus) || undefined,
        isRead: unreadOnly ? false : undefined,
        page,
        limit,
      };

      let result;
      if (activeFolder === 'INBOX') {
        result = await communicationService.getInboxEmails(commonQuery);
      } else if (activeFolder === 'SENT') {
        result = await communicationService.getSentEmails(commonQuery);
      } else if (activeFolder === 'DRAFTS') {
        result = await communicationService.getDraftEmails(commonQuery);
      } else if (activeFolder === 'STARRED') {
        result = await communicationService.getStarredEmails(commonQuery);
      } else if (activeFolder === 'TRASH') {
        result = await communicationService.getTrashEmails(commonQuery);
      } else {
        result = await communicationService.getEmails({
          ...commonQuery,
          folder: activeFolder === 'ALL' ? undefined : activeFolder,
        });
      }

      setEmails(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load emails.');
    } finally {
      setLoading(false);
    }
  }, [activeFolder, search, statusFilter, unreadOnly, page]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const handleSelectFolder = (folder: EmailFolder | 'STARRED') => {
    setPage(1);
    setActiveFolder(folder);
    if (!forcedFolder) {
      if (folder === 'ALL') {
        setSearchParams({});
      } else {
        setSearchParams({ folder });
      }
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map((e) => e.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBatchAction = async (action: BatchEmailActionType) => {
    if (selectedIds.length === 0) return;
    try {
      await communicationService.batchEmailAction({
        emailIds: selectedIds,
        action,
      });
      setBannerMessage(
        `Applied "${action.replace(/_/g, ' ')}" to ${selectedIds.length} email(s).`,
      );
      await loadEmails();
    } catch (err: any) {
      setError(err?.message || 'Batch action failed.');
    }
  };

  const handleToggleStar = async (email: EmailMessageItem) => {
    try {
      await communicationService.updateEmail(email.id, {
        isStarred: !email.isStarred,
      });
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id
            ? { ...item, isStarred: !email.isStarred }
            : item,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update star status.');
    }
  };

  const handleToggleRead = async (email: EmailMessageItem) => {
    try {
      await communicationService.updateEmail(email.id, {
        isRead: !email.isRead,
      });
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id ? { ...item, isRead: !email.isRead } : item,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update read status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmail) return;
    setIsDeleting(true);
    try {
      await communicationService.deleteEmail(deletingEmail.id);
      setBannerMessage(`Deleted "${deletingEmail.subject}".`);
      setDeletingEmail(null);
      await loadEmails();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete email.');
    } finally {
      setIsDeleting(false);
    }
  };

  const pageTitle = useMemo(() => {
    if (forcedFolder === 'INBOX') return 'Email Inbox';
    if (forcedFolder === 'SENT') return 'Sent Emails';
    if (activeFolder === 'DRAFTS') return 'Draft Emails';
    if (activeFolder === 'STARRED') return 'Starred Emails';
    if (activeFolder === 'TRASH') return 'Trash';
    return 'Emails';
  }, [forcedFolder, activeFolder]);

  const pageSubtitle = useMemo(() => {
    if (forcedFolder === 'INBOX') {
      return 'View and manage incoming client, lead, and stakeholder emails.';
    }
    if (forcedFolder === 'SENT') {
      return 'Track outbound sent emails, delivery statuses, opens, and thread responses.';
    }
    return 'Browse, search, filter, and manage all CRM emails across Inbox, Sent, Drafts, Starred, and Trash.';
  }, [forcedFolder]);

  const hasActiveFilters = Boolean(search || statusFilter || unreadOnly);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setUnreadOnly(false);
    setPage(1);
  };

  const folderTabs: Array<{ key: EmailFolder | 'STARRED'; label: string }> = [
    { key: 'ALL', label: 'All Emails' },
    { key: 'INBOX', label: 'Inbox' },
    { key: 'SENT', label: 'Sent' },
    { key: 'DRAFTS', label: 'Drafts' },
    { key: 'STARRED', label: 'Starred' },
    { key: 'ARCHIVE', label: 'Archive' },
    { key: 'TRASH', label: 'Trash' },
  ];

  return (
    <CommunicationsLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <Link
            to="/communications/templates"
            className="auth-btn btn-secondary btn-size-small"
          >
            Templates
          </Link>
          <Link
            to="/communications/compose"
            className="auth-btn btn-primary btn-size-small"
          >
            <PlusIcon size={15} /> Compose Email
          </Link>
        </div>
      }
    >
      {/* Folder Navigation Tabs */}
      <div
        className="lg-card"
        style={{
          padding: '0.65rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div className="ld-view-switcher" role="tablist" aria-label="Email folders">
          {folderTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeFolder === tab.key}
              className={`ld-view-btn ${activeFolder === tab.key ? 'active' : ''}`}
              onClick={() => handleSelectFolder(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="lg-muted">
          Total: <strong>{total}</strong> {total === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Search & Filters */}
      <FilterBar
        onRefresh={loadEmails}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search subject, sender, recipient, body snippet..."
        />

        <select
          className="lg-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by delivery status"
        >
          <option value="">All Statuses</option>
          {EMAIL_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Unread only</span>
        </label>
      </FilterBar>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-900">
          <span className="font-semibold">
            {selectedIds.length} email(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBatchAction('MARK_READ')}
              className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 font-medium text-gray-800 hover:bg-gray-50"
            >
              Mark Read
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('MARK_UNREAD')}
              className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 font-medium text-gray-800 hover:bg-gray-50"
            >
              Mark Unread
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('STAR')}
              className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 font-medium text-gray-800 hover:bg-gray-50"
            >
              Star
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('ARCHIVE')}
              className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 font-medium text-gray-800 hover:bg-gray-50"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('DELETE')}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 font-medium text-red-700 hover:bg-red-100"
            >
              Move to Trash
            </button>
          </div>
        </div>
      )}

      {/* Email List Table */}
      <SectionCard
        title={`${pageTitle} (${total})`}
        subtitle="Click any email subject to view the full conversation thread, attachments, and internal comments"
      >
        {loading ? (
          <div style={{ padding: '2.5rem' }}>
            <LoadingIndicator message="Loading emails..." />
          </div>
        ) : emails.length === 0 ? (
          <EmptyState
            title="No emails found in this view"
            description="Try adjusting your search filters or compose a new email message."
            action={
              <Link
                to="/communications/compose"
                className="auth-btn btn-primary btn-size-small"
              >
                <PlusIcon size={14} /> Compose Email
              </Link>
            }
          />
        ) : (
          <div className="lg-table-wrap">
            <table className="lg-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={
                        emails.length > 0 && selectedIds.length === emails.length
                      }
                      onChange={handleToggleSelectAll}
                      aria-label="Select all emails"
                    />
                  </th>
                  <th style={{ width: '40px' }}>★</th>
                  <th>From / Recipients</th>
                  <th>Subject & Snippet</th>
                  <th>Related Record</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => {
                  const related = getEmailRelatedLinks(email);
                  const isSelected = selectedIds.includes(email.id);
                  const previewSnippet =
                    email.snippet || stripHtmlToText(email.body).slice(0, 110);

                  return (
                    <tr
                      key={email.id}
                      style={{
                        background: !email.isRead ? '#f8fafc' : undefined,
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(email.id)}
                          aria-label={`Select ${email.subject}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStar(email)}
                          title={email.isStarred ? 'Unstar' : 'Star'}
                          className="text-base leading-none"
                          style={{
                            color: email.isStarred ? '#f59e0b' : '#cbd5e1',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          ★
                        </button>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs ${
                              !email.isRead
                                ? 'font-bold text-gray-900'
                                : 'font-medium text-gray-800'
                            }`}
                          >
                            {email.direction === 'INBOUND' ? (
                              <>From: {email.senderName || email.sender}</>
                            ) : (
                              <>
                                To:{' '}
                                {email.recipients.length > 0
                                  ? email.recipients.join(', ')
                                  : 'No recipient'}
                              </>
                            )}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {email.folder} · {email.direction}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-md">
                          <Link
                            to={
                              email.isDraft
                                ? `/communications/compose?draftId=${email.id}`
                                : `/communications/emails/${email.id}`
                            }
                            className={`block truncate text-sm hover:text-blue-600 ${
                              !email.isRead
                                ? 'font-bold text-gray-950'
                                : 'font-medium text-gray-800'
                            }`}
                          >
                            {email.subject}
                          </Link>
                          <p className="truncate text-xs text-gray-500">
                            {previewSnippet || 'No message body preview'}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {email.attachments.length > 0 && (
                              <Badge tone="slate">
                                📎 {email.attachments.length} file
                                {email.attachments.length === 1 ? '' : 's'}
                              </Badge>
                            )}
                            {(email._count?.comments || 0) > 0 && (
                              <Badge tone="purple">
                                💬 {email._count?.comments} comment
                                {email._count?.comments === 1 ? '' : 's'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {related.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {related.map((rel) => (
                              <Link
                                key={`${rel.entityType}-${rel.id}`}
                                to={rel.path}
                                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                              >
                                {rel.entityType}: {rel.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Badge tone={emailStatusTone(email.status)}>
                            {email.status}
                          </Badge>
                          {email.openCount > 0 && (
                            <span className="text-[10px] text-gray-500">
                              Opened {email.openCount}×
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600">
                          {formatDateTime(email.sentAt || email.createdAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="lg-badge-row"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          {email.isDraft ? (
                            <button
                              type="button"
                              className="auth-btn btn-secondary btn-size-small"
                              onClick={() =>
                                navigate(
                                  `/communications/compose?draftId=${email.id}`,
                                )
                              }
                            >
                              <SendIcon size={13} /> Edit Draft
                            </button>
                          ) : (
                            <Link
                              to={`/communications/emails/${email.id}`}
                              className="auth-btn btn-secondary btn-size-small"
                              title="View Email Details"
                            >
                              <EyeIcon size={14} /> View
                            </Link>
                          )}
                          <button
                            type="button"
                            className="auth-btn btn-secondary btn-size-small"
                            onClick={() => handleToggleRead(email)}
                            title={
                              email.isRead ? 'Mark as Unread' : 'Mark as Read'
                            }
                          >
                            {email.isRead ? (
                              <MailIcon size={14} />
                            ) : (
                              <CheckCircleIcon size={14} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="auth-btn btn-secondary btn-size-small"
                            onClick={() => setDeletingEmail(email)}
                            title="Delete Email"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-600">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> (
              {total} total emails)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingEmail)}
        title="Delete Email"
        message={`Are you sure you want to delete "${deletingEmail?.subject || 'this email'}"?`}
        confirmLabel={
          deletingEmail?.folder === 'TRASH'
            ? 'Delete Permanently'
            : 'Move to Trash'
        }
        isLoading={isDeleting}
        onClose={() => setDeletingEmail(null)}
        onConfirm={handleConfirmDelete}
      />
    </CommunicationsLayout>
  );
};

export default EmailsExplorerPage;

