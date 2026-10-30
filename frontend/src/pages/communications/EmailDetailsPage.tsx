import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { communicationService } from '../../services/communication.service';
import type {
  CommunicationCommentItem,
  CommunicationUserRef,
  EmailMessageItem,
} from '../../types/communication.types';
import { CommunicationsLayout } from './components/CommunicationsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  MailIcon,
  SendIcon,
  TrashIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  emailStatusTone,
  formatBytes,
  getEmailRelatedLinks,
  stripHtmlToText,
} from './communicationConstants';

export const EmailDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState<EmailMessageItem | null>(null);
  const [comments, setComments] = useState<CommunicationCommentItem[]>([]);
  const [users, setUsers] = useState<CommunicationUserRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Reply / Forward composer state
  const [composerMode, setComposerMode] = useState<
    'none' | 'reply' | 'replyAll' | 'forward'
  >('none');
  const [replyBody, setReplyBody] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [sendingAction, setSendingAction] = useState(false);

  // Internal comment composer state
  const [commentText, setCommentText] = useState('');
  const [selectedMentionIds, setSelectedMentionIds] = useState<string[]>([]);
  const [postingComment, setPostingComment] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEmailAndComments = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [emailRes, commentsRes, usersRes] = await Promise.all([
        communicationService.getEmailById(id),
        communicationService.getCommentsByEmail(id).catch(() => []),
        communicationService.getUsersLookup().catch(() => []),
      ]);
      setEmail(emailRes);
      setComments(
        commentsRes.length > 0 ? commentsRes : emailRes.comments || [],
      );
      setUsers(usersRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load email details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmailAndComments();
  }, [loadEmailAndComments]);

  const handleToggleStar = async () => {
    if (!email) return;
    try {
      const updated = await communicationService.updateEmail(email.id, {
        isStarred: !email.isStarred,
      });
      setEmail((prev) =>
        prev ? { ...prev, isStarred: updated.isStarred } : prev,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update star status.');
    }
  };

  const handleReplyOrForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);

    if (composerMode === 'forward') {
      const recipients = forwardTo
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (recipients.length === 0) {
        setError('Please enter at least one recipient email to forward to.');
        return;
      }
      setSendingAction(true);
      try {
        await communicationService.forwardEmail(email.id, {
          recipients,
          message: replyBody.trim() || undefined,
        });
        setBannerMessage('Email forwarded.');
        setComposerMode('none');
        setReplyBody('');
        setForwardTo('');
        await loadEmailAndComments();
      } catch (err: any) {
        setError(err?.message || 'Failed to forward email.');
      } finally {
        setSendingAction(false);
      }
      return;
    }

    if (!replyBody.trim()) {
      setError('Please enter a reply message.');
      return;
    }

    setSendingAction(true);
    try {
      await communicationService.replyToEmail(email.id, {
        body: replyBody.trim(),
        replyAll: composerMode === 'replyAll',
      });
      setBannerMessage('Reply sent and added to thread.');
      setComposerMode('none');
      setReplyBody('');
      await loadEmailAndComments();
    } catch (err: any) {
      setError(err?.message || 'Failed to send reply.');
    } finally {
      setSendingAction(false);
    }
  };

  const handleAddMentionUser = (user: CommunicationUserRef) => {
    const handle = `@${user.name.split(' ')[0] || user.email}`;
    if (!commentText.includes(handle)) {
      setCommentText((prev) => `${prev}${prev ? ' ' : ''}${handle} `);
    }
    if (!selectedMentionIds.includes(user.id)) {
      setSelectedMentionIds((prev) => [...prev, user.id]);
    }
  };

  const handlePostInternalComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !commentText.trim()) return;
    setPostingComment(true);
    setError(null);
    try {
      const created = await communicationService.createComment({
        content: commentText.trim(),
        emailId: email.id,
        threadId: email.threadId || email.id,
        contactId: email.contactId || undefined,
        leadId: email.leadId || undefined,
        dealId: email.dealId || undefined,
        mentionedUserIds:
          selectedMentionIds.length > 0 ? selectedMentionIds : undefined,
        isInternal: true,
      });
      setComments((prev) => [...prev, created]);
      setCommentText('');
      setSelectedMentionIds([]);
      setBannerMessage('Internal comment posted to thread.');
    } catch (err: any) {
      setError(err?.message || 'Failed to post internal comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await communicationService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete comment.');
    }
  };

  const handleConfirmDeleteEmail = async () => {
    if (!email) return;
    setDeleting(true);
    try {
      await communicationService.deleteEmail(email.id);
      navigate('/communications/emails');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete email.');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <CommunicationsLayout
        title="Email Details"
        subtitle="Loading email conversation thread and internal comments..."
      >
        <div className="lg-card" style={{ padding: '2.5rem' }}>
          <LoadingIndicator message="Loading email details..." />
        </div>
      </CommunicationsLayout>
    );
  }

  if (!email) {
    return (
      <CommunicationsLayout
        title="Email Not Found"
        subtitle="The requested email could not be loaded."
        error={error}
      >
        <EmptyState
          title="Email not found"
          description="It may have been permanently deleted."
          action={
            <Link
              to="/communications/emails"
              className="auth-btn btn-primary btn-size-small"
            >
              Back to Emails
            </Link>
          }
        />
      </CommunicationsLayout>
    );
  }

  const relatedLinks = getEmailRelatedLinks(email);
  const threadMessages =
    email.threadMessages && email.threadMessages.length > 0
      ? email.threadMessages
      : [email];

  return (
    <CommunicationsLayout
      title={email.subject}
      subtitle={`Folder: ${email.folder} · ${threadMessages.length} message(s) in thread`}
      activeEmail={email}
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={handleToggleStar}
          >
            {email.isStarred ? '★ Starred' : '☆ Star'}
          </button>
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={() => setComposerMode('reply')}
          >
            <SendIcon size={14} /> Reply
          </button>
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={() => setComposerMode('forward')}
          >
            Forward
          </button>
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={() => setDeleteModalOpen(true)}
          >
            <TrashIcon size={14} /> Delete
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Conversation Thread & Reply/Forward Composer */}
        <div className="space-y-6 lg:col-span-8">
          <SectionCard
            title={`Conversation Thread (${threadMessages.length})`}
            subtitle="Chronological email messages and attachments in this thread"
          >
            <div className="space-y-4">
              {threadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-gray-900">
                          {msg.senderName || msg.sender}
                        </strong>
                        <span className="text-xs text-gray-500">
                          &lt;{msg.sender}&gt;
                        </span>
                        <Badge tone={emailStatusTone(msg.status)}>
                          {msg.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        To:{' '}
                        {msg.recipients.length > 0
                          ? msg.recipients.join(', ')
                          : '—'}
                        {msg.cc.length > 0 && ` · CC: ${msg.cc.join(', ')}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(msg.sentAt || msg.createdAt)}
                    </span>
                  </div>

                  {/* Email Body Content */}
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {stripHtmlToText(msg.body) || msg.body}
                  </div>

                  {/* Message Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <MailIcon size={13} />
                        <span>Attachments ({msg.attachments.length})</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={att.id || `${att.filename}-${idx}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800"
                          >
                            <span className="font-medium">{att.filename}</span>
                            <span className="text-[10px] text-gray-400">
                              ({formatBytes(att.size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons to open inline Reply / Reply All / Forward */}
            {composerMode === 'none' ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setComposerMode('reply')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <SendIcon size={14} /> Reply
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('replyAll')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Reply All
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('forward')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Forward
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleReplyOrForward}
                className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs uppercase tracking-wider text-blue-900">
                    {composerMode === 'forward'
                      ? 'Forward Email'
                      : composerMode === 'replyAll'
                        ? `Reply All to ${email.sender}`
                        : `Reply to ${email.sender}`}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setComposerMode('none')}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>

                {composerMode === 'forward' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Forward To (comma separated emails)
                    </label>
                    <input
                      type="text"
                      value={forwardTo}
                      onChange={(e) => setForwardTo(e.target.value)}
                      placeholder="colleague@company.com, manager@company.com"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <textarea
                  rows={4}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={
                    composerMode === 'forward'
                      ? 'Optional note to include above forwarded message...'
                      : 'Write your reply...'
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs focus:border-blue-500 focus:outline-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setComposerMode('none')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={sendingAction}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <SendIcon size={13} />
                    {sendingAction
                      ? 'Sending...'
                      : composerMode === 'forward'
                        ? 'Forward Email'
                        : 'Send Reply'}
                  </button>
                </div>
              </form>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Internal Comments & Mentions + Metadata */}
        <div className="space-y-6 lg:col-span-4">
          <SectionCard
            title={`Internal Team Comments (${comments.length})`}
            subtitle="Strictly internal notes & @mentions — never sent to external recipients"
          >
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="py-3 text-xs text-gray-500">
                  No internal comments on this email thread yet. Mention a
                  teammate below to collaborate.
                </p>
              ) : (
                <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900">
                          {c.author?.name || c.author?.email || 'Team Member'}
                        </strong>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">
                            {formatDateTime(c.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete comment"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-gray-800">
                        {c.content}
                      </p>
                      {c.mentions && c.mentions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.mentions.map((m) => (
                            <Badge key={m.userId} tone="purple">
                              @{m.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Internal Comment Form */}
              <form
                onSubmit={handlePostInternalComment}
                className="space-y-2.5 border-t border-gray-100 pt-3"
              >
                <div className="flex flex-wrap items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600">
                    <UsersIcon size={12} /> @Mention teammate:
                  </span>
                  {users.slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAddMentionUser(u)}
                      className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 hover:bg-purple-100"
                    >
                      @{u.name.split(' ')[0] || u.email}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add an internal team comment or @mention a colleague..."
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {postingComment ? 'Posting...' : 'Post Internal Comment'}
                </button>
              </form>
            </div>
          </SectionCard>

          <SectionCard
            title="Related CRM Records"
            subtitle="Linked Contact, Lead, or Deal"
          >
            {relatedLinks.length === 0 ? (
              <p className="text-xs text-gray-500">
                No CRM record is linked to this email thread.
              </p>
            ) : (
              <div className="space-y-2">
                {relatedLinks.map((rel) => (
                  <Link
                    key={`${rel.entityType}-${rel.id}`}
                    to={rel.path}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div>
                      <Badge tone="blue">{rel.entityType}</Badge>
                      <p className="mt-1 font-semibold text-gray-900">
                        {rel.label}
                      </p>
                    </div>
                    <span className="text-blue-600">Open →</span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Delivery & Tracking Metadata"
            subtitle="Engagement metrics & provider details"
          >
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <Badge tone={emailStatusTone(email.status)}>
                  {email.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Direction:</span>
                <strong>{email.direction}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Provider:</span>
                <strong>{email.provider || 'SYSTEM'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Opens / Clicks:</span>
                <strong>
                  {email.openCount} opens · {email.clickCount} clicks
                </strong>
              </div>
              <div className="pt-2">
                <Link
                  to="/communications/compose"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                >
                  <MailIcon size={13} /> Compose new email →
                </Link>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Email"
        message={`Are you sure you want to delete "${email.subject}"?`}
        confirmLabel={
          email.folder === 'TRASH' ? 'Delete Permanently' : 'Move to Trash'
        }
        isLoading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteEmail}
      />
    </CommunicationsLayout>
  );
};

export default EmailDetailsPage;
