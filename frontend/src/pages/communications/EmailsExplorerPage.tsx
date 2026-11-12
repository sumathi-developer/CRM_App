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
        <div className="lg-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/communications/templates"
            className="auth-btn btn-secondary btn-size-small"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#062E03',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
            Templates
          </Link>
          <Link
            to="/communications/compose"
            className="auth-btn btn-primary btn-size-small"
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backgroundColor: '#F8FCF9',
            padding: '10px 16px',
            fontSize: '12px',
            color: '#062E03',
          }}
        >
          <span className="font-semibold">
            {selectedIds.length} email(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBatchAction('MARK_READ')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#062E03',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EAF4ED')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              Mark Read
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('MARK_UNREAD')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#062E03',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EAF4ED')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              Mark Unread
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('STAR')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#062E03',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EAF4ED')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              Star
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('ARCHIVE')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#062E03',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EAF4ED')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('DELETE')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
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
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PlusIcon size={14} /> Compose Email
              </Link>
            }
          />
        ) : (
          <div className="lg-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="lg-table" style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      checked={
                        emails.length > 0 && selectedIds.length === emails.length
                      }
                      onChange={handleToggleSelectAll}
                      aria-label="Select all emails"
                    />
                  </th>
                  <th style={{ width: '38px', textAlign: 'center', verticalAlign: 'middle' }}>★</th>
                  <th style={{ width: '190px', minWidth: '170px', verticalAlign: 'middle' }}>From / Recipients</th>
                  <th style={{ minWidth: '220px', verticalAlign: 'middle' }}>Subject & Snippet</th>
                  <th style={{ width: '120px', minWidth: '100px', verticalAlign: 'middle' }}>Related Record</th>
                  <th style={{ width: '100px', minWidth: '90px', verticalAlign: 'middle' }}>Status</th>
                  <th style={{ width: '150px', minWidth: '140px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>Date</th>
                  <th style={{ width: '180px', minWidth: '180px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>Actions</th>
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
                      <td style={{ width: '38px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(email.id)}
                          aria-label={`Select ${email.subject}`}
                        />
                      </td>
                      <td style={{ width: '38px', textAlign: 'center', verticalAlign: 'middle' }}>
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                          }}
                        >
                          ★
                        </button>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
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
                      <td style={{ verticalAlign: 'middle' }}>
                        <div className="max-w-md">
                          <Link
                            to={
                              email.isDraft
                                ? `/communications/compose?draftId=${email.id}`
                                : `/communications/emails/${email.id}`
                            }
                            className={`block truncate text-sm hover:text-emerald-600 ${
                              !email.isRead
                                ? 'font-bold text-gray-950'
                                : 'font-medium text-gray-800'
                            }`}
                            style={{ transition: 'color 0.15s ease' }}
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
                      <td style={{ verticalAlign: 'middle' }}>
                        {related.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {related.map((rel) => (
                              <Link
                                key={`${rel.entityType}-${rel.id}`}
                                to={rel.path}
                                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                style={{
                                  backgroundColor: '#EAF4ED',
                                  color: '#062E03',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  textDecoration: 'none',
                                }}
                              >
                                {rel.entityType}: {rel.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
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
                      <td style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {formatDateTime(email.sentAt || email.createdAt)}
                        </span>
                      </td>
                      <td style={{ width: '180px', minWidth: '180px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '6px',
                            flexWrap: 'nowrap',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {email.isDraft ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/communications/compose?draftId=${email.id}`,
                                )
                              }
                              style={{
                                backgroundColor: '#FFFFFF',
                                color: '#062E03',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease',
                                height: '30px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#EAF4ED';
                                e.currentTarget.style.borderColor = '#10B981';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                              }}
                              title="Edit Draft"
                            >
                              <SendIcon size={12} />
                              <span>Edit Draft</span>
                            </button>
                          ) : (
                            <Link
                              to={`/communications/emails/${email.id}`}
                              style={{
                                backgroundColor: '#FFFFFF',
                                color: '#062E03',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                borderRadius: '8px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease',
                                height: '30px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#EAF4ED';
                                e.currentTarget.style.borderColor = '#10B981';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                              }}
                              title="View Email Details"
                            >
                              <EyeIcon size={13} />
                              <span>View</span>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleRead(email)}
                            title={
                              email.isRead ? 'Mark as Unread' : 'Mark as Read'
                            }
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#062E03',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '8px',
                              width: '30px',
                              height: '30px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
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
                            {email.isRead ? (
                              <MailIcon size={13} />
                            ) : (
                              <CheckCircleIcon size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmail(email)}
                            title="Delete Email"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              width: '30px',
                              height: '30px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEF2F2';
                              e.currentTarget.style.borderColor = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                          >
                            <TrashIcon size={13} />
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
                style={{
                  backgroundColor: '#FFFFFF',
                  color: page <= 1 ? '#94A3B8' : '#062E03',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: page >= totalPages ? '#94A3B8' : '#062E03',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
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

