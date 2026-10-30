import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { communicationService } from '../../services/communication.service';
import type {
  CommunicationCenterStats,
  CommunicationStreamItem,
} from '../../types/communication.types';
import { CommunicationsLayout } from './components/CommunicationsLayout';
import {
  Badge,
  SectionCard,
  StatCard,
} from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  CheckCircleIcon,
  MailIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  UsersIcon,
} from '../../components/common/Icons';
import { emailStatusTone, stripHtmlToText } from './communicationConstants';

export const CommunicationCenterPage: React.FC = () => {
  const [stats, setStats] = useState<CommunicationCenterStats>({
    overview: {
      totalEmails: 0,
      inboxTotal: 0,
      inboxUnread: 0,
      sentTotal: 0,
      draftsTotal: 0,
      starredTotal: 0,
      trashTotal: 0,
      commentsTotal: 0,
      templatesTotal: 0,
      activeIntegrationsTotal: 0,
    },
    performance: {
      deliveryRatePercentage: 100,
      openRatePercentage: 0,
      statusBreakdown: {},
    },
    recentActivity: {
      emails: [],
      comments: [],
    },
  });
  const [stream, setStream] = useState<CommunicationStreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCenterData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, streamRes] = await Promise.all([
        communicationService.getCenterStats(),
        communicationService.getCenterStream(),
      ]);
      setStats(statsRes);
      setStream(streamRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Communication Center data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCenterData();
  }, [loadCenterData]);

  return (
    <CommunicationsLayout
      title="Communication Center"
      subtitle="Unified hub for emails, inbox & sent folders, internal team comments, mentions, templates, and multi-channel communication history."
      error={error}
      onDismissError={() => setError(null)}
      actions={
        <div className="lg-badge-row">
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={loadCenterData}
          >
            <RefreshCwIcon size={15} /> Refresh
          </button>
          <Link
            to="/communications/templates"
            className="auth-btn btn-secondary btn-size-small"
          >
            Templates ({stats.overview.templatesTotal})
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
      {/* Top KPI Cards */}
      <div className="lg-stat-grid">
        <StatCard
          label="Email Inbox"
          value={stats.overview.inboxTotal}
          hint={`${stats.overview.inboxUnread} unread messages`}
          tone="blue"
          icon={<MailIcon size={18} />}
        />
        <StatCard
          label="Sent Emails"
          value={stats.overview.sentTotal}
          hint={`${stats.performance.deliveryRatePercentage}% delivery rate`}
          tone="green"
          icon={<SendIcon size={18} />}
        />
        <StatCard
          label="Internal Comments"
          value={stats.overview.commentsTotal}
          hint="Team threads & @mentions"
          tone="purple"
          icon={<UsersIcon size={18} />}
        />
        <StatCard
          label="Open Engagement"
          value={`${stats.performance.openRatePercentage}%`}
          hint={`${stats.overview.draftsTotal} saved drafts · ${stats.overview.templatesTotal} templates`}
          tone="amber"
          icon={<CheckCircleIcon size={18} />}
        />
      </div>

      {/* Quick Navigation Folder Tiles */}
      <SectionCard
        title="Email Navigation & Channels"
        subtitle="Jump directly to any communication folder or collaboration workspace"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            to="/communications/inbox"
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Inbox</span>
              {stats.overview.inboxUnread > 0 && (
                <Badge tone="blue">{stats.overview.inboxUnread} unread</Badge>
              )}
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {stats.overview.inboxTotal}
            </p>
          </Link>

          <Link
            to="/communications/sent"
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Sent Emails
              </span>
              <Badge tone="green">Outbound</Badge>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {stats.overview.sentTotal}
            </p>
          </Link>

          <Link
            to="/communications/emails?folder=DRAFTS"
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Saved Drafts
              </span>
              <Badge tone="amber">Draft</Badge>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {stats.overview.draftsTotal}
            </p>
          </Link>

          <Link
            to="/communications/comments"
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Internal Comments
              </span>
              <Badge tone="purple">Team</Badge>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {stats.overview.commentsTotal}
            </p>
          </Link>

          <Link
            to="/communications/history"
            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Full Timeline
              </span>
              <ActivityIcon size={14} />
            </div>
            <p className="mt-2 text-sm font-bold text-blue-600">
              View All History →
            </p>
          </Link>
        </div>
      </SectionCard>

      {loading ? (
        <div className="lg-card" style={{ padding: '2.5rem' }}>
          <LoadingIndicator message="Loading communication stream and recent activity..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Live Email & Communication Stream */}
          <div className="lg:col-span-7">
            <SectionCard
              title="Recent Email Stream"
              subtitle="Latest inbound, outbound, and draft emails across the workspace"
              actions={
                <Link
                  to="/communications/emails"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Open All Emails →
                </Link>
              }
            >
              {stream.length === 0 && stats.recentActivity.emails.length === 0 ? (
                <EmptyState
                  title="No emails recorded yet"
                  description="Compose your first email or apply an email template to reach out to contacts and leads."
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
                <div className="divide-y divide-gray-100">
                  {(stream.length > 0
                    ? stream
                    : stats.recentActivity.emails.map((e) => ({
                        id: e.id,
                        type: 'EMAIL' as const,
                        subject: e.subject,
                        snippet: e.snippet || stripHtmlToText(e.body),
                        folder: e.folder,
                        direction: e.direction,
                        status: e.status,
                        isRead: e.isRead,
                        isStarred: e.isStarred,
                        createdAt: e.createdAt,
                        sender: {
                          name: e.senderName || e.sender,
                          email: e.sender,
                        },
                        commentsCount: e._count?.comments || 0,
                      }))
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="slate">{item.folder}</Badge>
                          <Badge tone={emailStatusTone(item.status)}>
                            {item.status}
                          </Badge>
                          {!item.isRead && <Badge tone="blue">UNREAD</Badge>}
                          {item.commentsCount > 0 && (
                            <Badge tone="purple">
                              {item.commentsCount} comment
                              {item.commentsCount === 1 ? '' : 's'}
                            </Badge>
                          )}
                        </div>
                        <Link
                          to={`/communications/emails/${item.id}`}
                          className={`mt-1 block truncate text-sm hover:text-blue-600 ${
                            item.isRead
                              ? 'font-medium text-gray-800'
                              : 'font-bold text-gray-950'
                          }`}
                        >
                          {item.subject}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          From: {item.sender?.name || item.sender?.email} ·{' '}
                          {item.snippet || 'No preview available'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatDateTime(item.createdAt)}</span>
                        <Link
                          to={`/communications/emails/${item.id}`}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right Column: Recent Internal Comments & Delivery Breakdown */}
          <div className="space-y-6 lg:col-span-5">
            <SectionCard
              title="Recent Internal Team Comments"
              subtitle="Internal discussions & @mentions on emails and CRM records"
              actions={
                <Link
                  to="/communications/comments"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  All Comments →
                </Link>
              }
            >
              {stats.recentActivity.comments.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  No internal comments yet. Collaborate with teammates on{' '}
                  <Link
                    to="/communications/comments"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Internal Comments
                  </Link>
                  .
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900">
                          {c.author?.name || c.author?.email || 'Team Member'}
                        </strong>
                        <span className="text-[11px] text-gray-400">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-gray-700">
                        {c.content}
                      </p>
                      {c.email && (
                        <div className="mt-2">
                          <Link
                            to={`/communications/emails/${c.email.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                          >
                            Thread: {c.email.subject} →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Email Delivery Status Breakdown"
              subtitle="Status distribution across all workspace emails"
            >
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(stats.performance.statusBreakdown).map(
                  ([statusKey, count]) => (
                    <div
                      key={statusKey}
                      className="rounded-lg border border-gray-200 bg-white p-2.5 text-center"
                    >
                      <Badge tone={emailStatusTone(statusKey)}>
                        {statusKey}
                      </Badge>
                      <p className="mt-1.5 text-base font-bold text-gray-900">
                        {count}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </CommunicationsLayout>
  );
};

export default CommunicationCenterPage;

