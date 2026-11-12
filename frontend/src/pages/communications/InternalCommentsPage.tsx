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
import { FilterBar, FilterSelect, SearchInput } from '../lead-generation/components/FilterBar';
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
        <div className="lg-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to={
              mode === 'mentions'
                ? '/communications/comments'
                : '/communications/mentions'
            }
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
            {mode === 'mentions' ? 'View All Comments' : 'View @Mentions'}
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
      {/* Summary KPIs */}
      <div className="lg-stat-grid" style={{ marginBottom: '1.25rem' }}>
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

            <FilterSelect
              label="Mentioned User"
              value={mentionedUserFilter}
              onChange={(val) => setMentionedUserFilter(val)}
              options={users.map((u) => ({
                value: u.id,
                label: `@${u.name}`,
              }))}
              allLabel="All Mentioned Users"
            />

            <FilterSelect
              label="Associated Deal"
              value={dealFilter}
              onChange={(val) => setDealFilter(val)}
              options={deals.map((d) => ({
                value: d.id,
                label: d.title,
              }))}
              allLabel="All Deals"
            />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(16, 185, 129, 0.22)',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(6, 46, 3, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                      e.currentTarget.style.backgroundColor = '#FCFDFD';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.22)';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    {/* Header Row: Author + Badge & Date + Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '13.5px', fontWeight: 600, color: '#062E03' }}>
                          {c.author?.name || c.author?.email || 'Team Member'}
                        </strong>
                        <Badge tone="amber">Internal Only</Badge>
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          color: '#64748B',
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap' }}>{formatDateTime(c.createdAt)}</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingComment(c);
                              setEditContent(c.content);
                            }}
                            title="Edit comment"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#062E03',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              padding: 0,
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
                              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                            }}
                          >
                            <EditIcon size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingComment(c)}
                            title="Delete comment"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
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
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comment Body */}
                    {editingComment?.id === c.id ? (
                      <div style={{ marginTop: '10px' }}>
                        <textarea
                          rows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            border: '1px solid #10B981',
                            padding: '8px 10px',
                            fontSize: '12px',
                            color: '#062E03',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingComment(null)}
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#062E03',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(c.id)}
                            style={{
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        style={{
                          margin: '10px 0 12px 0',
                          fontSize: '13px',
                          color: '#1E293B',
                          lineHeight: '1.55',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {c.content}
                      </p>
                    )}

                    {/* Bottom Metadata: Mentions & Linked Context */}
                    {((c.mentions && c.mentions.length > 0) || c.email || c.contact || c.lead || c.deal) && (
                      <div
                        style={{
                          borderTop: '1px solid rgba(16, 185, 129, 0.12)',
                          paddingTop: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {/* Teammates Mentioned */}
                        {c.mentions && c.mentions.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                              Mentioned:
                            </span>
                            {c.mentions.map((m) => (
                              <span
                                key={m.userId}
                                title={m.email}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#F5EEFB',
                                  color: '#6B21A8',
                                  border: '1px solid rgba(147, 51, 234, 0.22)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                }}
                              >
                                @{m.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Linked CRM Records */}
                        {(c.email || c.contact || c.lead || c.deal) && (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                              Linked:
                            </span>
                            {c.email && (
                              <Link
                                to={`/communications/emails/${c.email.id}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#EAF4ED',
                                  color: '#062E03',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                ✉ Email: {c.email.subject} →
                              </Link>
                            )}
                            {c.contact && (
                              <Link
                                to={`/contacts/${c.contact.id}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#EAF4ED',
                                  color: '#062E03',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                👤 Contact: {c.contact.firstName} {c.contact.lastName} →
                              </Link>
                            )}
                            {c.lead && (
                              <Link
                                to={`/leads/${c.lead.id}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#FEF3C7',
                                  color: '#92400E',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                🎯 Lead: {c.lead.title} →
                              </Link>
                            )}
                            {c.deal && (
                              <Link
                                to={`/deals/${c.deal.id}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  border: '1px solid rgba(100, 116, 139, 0.25)',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                💼 Deal: {c.deal.title} →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
            <form onSubmit={handleCreateComment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#062E03' }}>
                  Quick @Mention Teammates
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '130px',
                    overflowY: 'auto',
                    padding: '2px',
                  }}
                >
                  {users.map((u) => {
                    const isTagged = selectedMentionIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleInsertMention(u)}
                        style={{
                          borderRadius: '16px',
                          border: isTagged ? '1px solid #10B981' : '1px solid rgba(16, 185, 129, 0.25)',
                          backgroundColor: isTagged ? '#10B981' : '#F1F8F3',
                          color: isTagged ? '#FFFFFF' : '#062E03',
                          padding: '3px 9px',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isTagged) {
                            e.currentTarget.style.backgroundColor = '#EAF4ED';
                            e.currentTarget.style.borderColor = '#10B981';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isTagged) {
                            e.currentTarget.style.backgroundColor = '#F1F8F3';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                          }
                        }}
                      >
                        @{u.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#062E03' }}>
                  Comment Content <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write an internal note (e.g. Hey @Alex, let's offer a 10% annual discount on this deal)..."
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    backgroundColor: '#FFFFFF',
                    padding: '10px 12px',
                    fontSize: '12px',
                    color: '#062E03',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#10B981')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)')}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 600, color: '#062E03' }}>
                  Link to CRM Record (Optional)
                </p>

                <select
                  value={linkedContactId}
                  onChange={(e) => setLinkedContactId(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    backgroundColor: '#FFFFFF',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#062E03',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
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
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    backgroundColor: '#FFFFFF',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#062E03',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
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
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    backgroundColor: '#FFFFFF',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#062E03',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
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
                disabled={submitting}
                style={{
                  width: '100%',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.75 : 1,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.borderColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.borderColor = '#10B981';
                  }
                }}
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

