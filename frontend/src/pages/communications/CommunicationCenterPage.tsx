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
        <div className="lg-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="auth-btn btn-secondary btn-size-small"
            onClick={loadCenterData}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#062E03',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
            <RefreshCwIcon size={15} /> Refresh
          </button>
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
            Templates ({stats.overview.templatesTotal})
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
      {/* Top KPI Cards */}
      <div className="lg-stat-grid" style={{ marginBottom: '1.25rem' }}>
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
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionCard
          title="Email Navigation & Channels"
          subtitle="Jump directly to any communication folder or collaboration workspace"
        >
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            <Link
              to="/communications/inbox"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '14px 16px',
                minHeight: '88px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.backgroundColor = '#F8FCF9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#062E03' }}>Inbox</span>
                {stats.overview.inboxUnread > 0 && (
                  <Badge tone="blue">{stats.overview.inboxUnread} unread</Badge>
                )}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: 700, color: '#062E03', lineHeight: 1 }}>
                {stats.overview.inboxTotal}
              </p>
            </Link>

            <Link
              to="/communications/sent"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '14px 16px',
                minHeight: '88px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.backgroundColor = '#F8FCF9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#062E03' }}>Sent Emails</span>
                <Badge tone="green">Outbound</Badge>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: 700, color: '#062E03', lineHeight: 1 }}>
                {stats.overview.sentTotal}
              </p>
            </Link>

            <Link
              to="/communications/emails?folder=DRAFTS"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '14px 16px',
                minHeight: '88px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.backgroundColor = '#F8FCF9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#062E03' }}>Saved Drafts</span>
                <Badge tone="amber">Draft</Badge>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: 700, color: '#062E03', lineHeight: 1 }}>
                {stats.overview.draftsTotal}
              </p>
            </Link>

            <Link
              to="/communications/comments"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '14px 16px',
                minHeight: '88px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.backgroundColor = '#F8FCF9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#062E03' }}>Internal Comments</span>
                <Badge tone="purple">Team</Badge>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: 700, color: '#062E03', lineHeight: 1 }}>
                {stats.overview.commentsTotal}
              </p>
            </Link>

            <Link
              to="/communications/history"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                borderRadius: '12px',
                padding: '14px 16px',
                minHeight: '88px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.backgroundColor = '#F8FCF9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#062E03' }}>Full Timeline</span>
                <ActivityIcon size={15} style={{ color: '#10B981' }} />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All History →
              </p>
            </Link>
          </div>
        </SectionCard>
      </div>

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
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#10B981',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(16, 185, 129, 0.18)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        boxShadow: '0 1px 2px rgba(6, 46, 3, 0.02)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FCF9';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.18)';
                      }}
                    >
                      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
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
                          style={{
                            display: 'block',
                            fontSize: '13.5px',
                            fontWeight: item.isRead ? 600 : 700,
                            color: '#062E03',
                            textDecoration: 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '2px',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#062E03')}
                        >
                          {item.subject}
                        </Link>
                        <p
                          style={{
                            margin: '3px 0 0 0',
                            fontSize: '12px',
                            color: '#64748B',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          From: {item.sender?.name || item.sender?.email} ·{' '}
                          {item.snippet || 'No preview available'}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          gap: '6px',
                          flexShrink: 0,
                          marginLeft: '10px',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {formatDateTime(item.createdAt)}
                        </span>
                        <Link
                          to={`/communications/emails/${item.id}`}
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#062E03',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            borderRadius: '8px',
                            padding: '4px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#10B981',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  All Comments →
                </Link>
              }
            >
              {stats.recentActivity.comments.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
                  No internal comments yet. Collaborate with teammates on{' '}
                  <Link
                    to="/communications/comments"
                    style={{ fontWeight: 600, color: '#10B981', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Internal Comments
                  </Link>
                  .
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.recentActivity.comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: '#F8FCF9',
                        border: '1px solid rgba(16, 185, 129, 0.22)',
                        borderRadius: '12px',
                        padding: '13px 15px',
                        boxShadow: '0 1px 2px rgba(6, 46, 3, 0.02)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <strong style={{ color: '#062E03', fontSize: '12.5px', fontWeight: 600 }}>
                          {c.author?.name || c.author?.email || 'Team Member'}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#334155', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                        {c.content}
                      </p>
                      {c.email && (
                        <div style={{ marginTop: '8px' }}>
                          <Link
                            to={`/communications/emails/${c.email.id}`}
                            style={{
                              color: '#10B981',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {Object.entries(stats.performance.statusBreakdown).length === 0 ? (
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '16px', color: '#64748B', fontSize: '12px' }}>
                    No delivery status metrics recorded yet.
                  </div>
                ) : (
                  Object.entries(stats.performance.statusBreakdown).map(
                    ([statusKey, count]) => (
                      <div
                        key={statusKey}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(16, 185, 129, 0.22)',
                          borderRadius: '10px',
                          padding: '12px 8px',
                          textAlign: 'center',
                          boxShadow: '0 1px 2px rgba(6, 46, 3, 0.03)',
                        }}
                      >
                        <Badge tone={emailStatusTone(statusKey)}>
                          {statusKey}
                        </Badge>
                        <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#062E03', lineHeight: 1 }}>
                          {count}
                        </p>
                      </div>
                    ),
                  )
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

