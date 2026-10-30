import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communicationService } from '../../services/communication.service';
import type {
  CommunicationCommentItem,
  CommunicationContactRef,
  CommunicationDealRef,
  CommunicationLeadRef,
  CommunicationUserRef,
} from '../../types/communication.types';
import { CommunicationsLayout } from './components/CommunicationsLayout';
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
  EditIcon,
  MailIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from '../../components/common/Icons';

export interface InternalCommentsPageProps {
  mode?: 'comments' | 'mentions';
}

export const InternalCommentsPage: React.FC<InternalCommentsPageProps> = ({
  mode = 'comments',
}) => {
  const { user } = useAuth();

  const [comments, setComments] = useState<CommunicationCommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [mentionedUserFilter, setMentionedUserFilter] = useState<string>(() =>
    mode === 'mentions' && user?.id ? user.id : '',
  );
  const [contactFilter, setContactFilter] = useState('');
  const [dealFilter, setDealFilter] = useState('');

  // Lookups
  const [users, setUsers] = useState<CommunicationUserRef[]>([]);
  const [contacts, setContacts] = useState<CommunicationContactRef[]>([]);
  const [leads, setLeads] = useState<CommunicationLeadRef[]>([]);
  const [deals, setDeals] = useState<CommunicationDealRef[]>([]);

  // New / Edit comment state
  const [content, setContent] = useState('');
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const [linkedContactId, setLinkedContactId] = useState('');
  const [linkedLeadId, setLinkedLeadId] = useState('');
  const [linkedDealId, setLinkedDealId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingComment, setEditingComment] =
    useState<CommunicationCommentItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingComment, setDeletingComment] =
    useState<CommunicationCommentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      communicationService.getUsersLookup(),
      communicationService.getContactsLookup(),
      communicationService.getLeadsLookup(),
      communicationService.getDealsLookup(),
    ])
      .then(([u, c, l, d]) => {
        setUsers(u);
        setContacts(c);
        setLeads(l);
        setDeals(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'mentions' && user?.id && !mentionedUserFilter) {
      setMentionedUserFilter(user.id);
    } else if (mode === 'comments') {
      setMentionedUserFilter('');
    }
  }, [mode, user?.id]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communicationService.getComments({
        search: search.trim() || undefined,
        mentionedUserId: mentionedUserFilter || undefined,
        contactId: contactFilter || undefined,
        dealId: dealFilter || undefined,
        limit: 50,
      });

      let list = res.items;
      if (mode === 'mentions' && !mentionedUserFilter) {
        // Show all comments that contain at least one @mention
        list = list.filter((c) => c.mentions && c.mentions.length > 0);
      }

      setComments(list);
      setTotal(list.length);
    } catch (err: any) {
      setError(err?.message || 'Failed to load internal comments.');
    } finally {
      setLoading(false);
    }
  }, [search, mentionedUserFilter, contactFilter, dealFilter, mode]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleInsertMention = (u: CommunicationUserRef) => {
    const token = `@${u.name.split(' ')[0] || u.email}`;
    if (!content.includes(token)) {
      setContent((prev) => `${prev}${prev ? ' ' : ''}${token} `);
    }
    if (!selectedMentionIds.includes(u.id)) {
      setSelectedMentionIds((prev) => [...prev, u.id]);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await communicationService.createComment({
        content: content.trim(),
        contactId: linkedContactId || undefined,
        leadId: linkedLeadId || undefined,
        dealId: linkedDealId || undefined,
        mentionedUserIds:
          selectedMentionIds.length > 0 ? selectedMentionIds : undefined,
        isInternal: true,
      });
      setContent('');
      setSelectedMentionIds([]);
      setBannerMessage('Internal comment posted and mentioned users notified.');
      await loadComments();
    } catch (err: any) {
      setError(err?.message || 'Failed to create internal comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await communicationService.updateComment(id, {
        content: editContent.trim(),
      });
      setEditingComment(null);
      setBannerMessage('Internal comment updated.');
      await loadComments();
    } catch (err: any) {
      setError(err?.message || 'Failed to update comment.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingComment) return;
    setIsDeleting(true);
    try {
      await communicationService.deleteComment(deletingComment.id);
      setBannerMessage('Internal comment removed.');
      setDeletingComment(null);
      await loadComments();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete comment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const commentsWithMentionsCount = comments.filter(
    (c) => c.mentions && c.mentions.length > 0,
  ).length;
  const myMentionsCount = comments.filter((c) =>
    (c.mentions || []).some(
      (m) => m.userId === user?.id || m.email === user?.email,
    ),
  ).length;

  return (
    <CommunicationsLayout
      title={mode === 'mentions' ? 'Mentions (@User)' : 'Internal Comments'}
      subtitle={
        mode === 'mentions'
          ? 'Review internal team comments where you or your teammates were @mentioned.'
          : 'Collaborate privately on emails, contacts, leads, and deals with internal team comments and @mentions.'
      }
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <Link
            to={
              mode === 'mentions'
                ? '/communications/comments'
                : '/communications/mentions'
            }
            className="auth-btn btn-secondary btn-size-small"
          >
            {mode === 'mentions' ? 'View All Comments' : 'View @Mentions'}
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
      {/* Summary KPIs */}
      <div className="lg-stat-grid">
        <StatCard
          label="Visible Comments"
          value={total}
          hint="Strictly internal team notes"
          tone="blue"
          icon={<UsersIcon size={18} />}
        />
        <StatCard
          label="Comments with @Mentions"
          value={commentsWithMentionsCount}
          hint="Tagged team discussions"
          tone="purple"
          icon={<UserIcon size={18} />}
        />
        <StatCard
          label="Mentioning Me"
          value={myMentionsCount}
          hint={user?.email || 'Current authenticated user'}
          tone="amber"
          icon={<MailIcon size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Comment Feed & Filters */}
        <div className="space-y-6 lg:col-span-8">
          <FilterBar
            onRefresh={loadComments}
            onReset={() => {
              setSearch('');
              setMentionedUserFilter('');
              setContactFilter('');
              setDealFilter('');
            }}
            hasActiveFilters={Boolean(
              search || mentionedUserFilter || contactFilter || dealFilter,
            )}
          >
            <SearchInput
              value={search}
              onChange={(val: string) => setSearch(val)}
              placeholder="Search internal comments or @mentions..."
            />

            <select
              className="lg-select"
              value={mentionedUserFilter}
              onChange={(e) => setMentionedUserFilter(e.target.value)}
              aria-label="Filter by mentioned user"
            >
              <option value="">All Mentioned Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  Mentioning @{u.name}
                </option>
              ))}
            </select>

            <select
              className="lg-select"
              value={dealFilter}
              onChange={(e) => setDealFilter(e.target.value)}
              aria-label="Filter by deal"
            >
              <option value="">All Deals</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  Deal: {d.title}
                </option>
              ))}
            </select>
          </FilterBar>

          <SectionCard
            title={
              mode === 'mentions'
                ? `@Mention Feed (${comments.length})`
                : `Internal Team Comments (${comments.length})`
            }
            subtitle="All comments are internal to your CRM team and never sent to external email recipients"
          >
            {loading ? (
              <div style={{ padding: '2.5rem' }}>
                <LoadingIndicator message="Loading comments..." />
              </div>
            ) : comments.length === 0 ? (
              <EmptyState
                title={
                  mode === 'mentions'
                    ? 'No @mentions found for the selected filter'
                    : 'No internal comments yet'
                }
                description="Use the composer on the right to post an internal comment and @mention a teammate."
              />
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-gray-900">
                          {c.author?.name || c.author?.email || 'Team Member'}
                        </strong>
                        <Badge tone="amber">Internal Only</Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatDateTime(c.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingComment(c);
                            setEditContent(c.content);
                          }}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Edit comment"
                        >
                          <EditIcon size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingComment(c)}
                          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete comment"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    </div>

                    {editingComment?.id === c.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          rows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingComment(null)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(c.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                        {c.content}
                      </p>
                    )}

                    {/* Mentions & Linked Context Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5 text-xs">
                      {c.mentions &&
                        c.mentions.map((m) => (
                          <Badge key={m.userId} tone="purple">
                            @{m.name} ({m.email})
                          </Badge>
                        ))}

                      {c.email && (
                        <Link
                          to={`/communications/emails/${c.email.id}`}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Email: {c.email.subject} →
                        </Link>
                      )}

                      {c.contact && (
                        <Link
                          to={`/contacts/${c.contact.id}`}
                          className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          Contact: {c.contact.firstName} {c.contact.lastName} →
                        </Link>
                      )}

                      {c.lead && (
                        <Link
                          to={`/leads/${c.lead.id}`}
                          className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                        >
                          Lead: {c.lead.title} →
                        </Link>
                      )}

                      {c.deal && (
                        <Link
                          to={`/deals/${c.deal.id}`}
                          className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-800 hover:bg-purple-100"
                        >
                          Deal: {c.deal.title} →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: Post Internal Comment & @Mention Teammates */}
        <div className="lg:col-span-4">
          <SectionCard
            title="New Internal Comment"
            subtitle="Tag teammates with @mentions and optionally link a CRM record"
          >
            <form onSubmit={handleCreateComment} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Quick @Mention Teammates
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => {
                    const isTagged = selectedMentionIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleInsertMention(u)}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                          isTagged
                            ? 'border-purple-600 bg-purple-600 text-white'
                            : 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100'
                        }`}
                      >
                        @{u.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Comment Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write an internal note (e.g. Hey @Alex, let's offer a 10% annual discount on this deal)..."
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700">
                  Link to CRM Record (Optional)
                </p>

                <select
                  value={linkedContactId}
                  onChange={(e) => setLinkedContactId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                >
                  <option value="">No Contact Linked</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contact: {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>

                <select
                  value={linkedLeadId}
                  onChange={(e) => setLinkedLeadId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                >
                  <option value="">No Lead Linked</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lead: {l.title}
                    </option>
                  ))}
                </select>

                <select
                  value={linkedDealId}
                  onChange={(e) => setLinkedDealId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                >
                  <option value="">No Deal Linked</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      Deal: {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Posting Comment...' : 'Post Internal Comment'}
              </button>
            </form>
          </SectionCard>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingComment)}
        title="Delete Internal Comment"
        message="Are you sure you want to delete this internal team comment?"
        confirmLabel="Delete Comment"
        isLoading={isDeleting}
        onClose={() => setDeletingComment(null)}
        onConfirm={handleConfirmDelete}
      />
    </CommunicationsLayout>
  );
};

export default InternalCommentsPage;

