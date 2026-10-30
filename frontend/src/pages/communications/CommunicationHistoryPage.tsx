import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { communicationService } from '../../services/communication.service';
import type {
  CommunicationContactRef,
  CommunicationDealRef,
  CommunicationHistoryResponse,
  CommunicationLeadRef,
  UnifiedTimelineItem,
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
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  ActivityIcon,
  CalendarIcon,
  MailIcon,
  PlusIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  COMMUNICATION_CHANNEL_OPTIONS,
  channelBadgeTone,
} from './communicationConstants';

export const CommunicationHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('ALL');
  const [direction, setDirection] = useState('');
  const [contactId, setContactId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dealId, setDealId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [historyData, setHistoryData] = useState<CommunicationHistoryResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    summary: {
      totalCommunications: 0,
      channelBreakdown: {
        emails: 0,
        calls: 0,
        meetings: 0,
        whatsapp: 0,
        notes: 0,
        comments: 0,
      },
    },
  });

  const [contacts, setContacts] = useState<CommunicationContactRef[]>([]);
  const [leads, setLeads] = useState<CommunicationLeadRef[]>([]);
  const [deals, setDeals] = useState<CommunicationDealRef[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      communicationService.getContactsLookup(),
      communicationService.getLeadsLookup(),
      communicationService.getDealsLookup(),
    ])
      .then(([c, l, d]) => {
        setContacts(c);
        setLeads(l);
        setDeals(d);
      })
      .catch(() => {});
  }, []);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communicationService.getHistoryTimeline({
        search: search.trim() || undefined,
        channel: channel === 'ALL' ? undefined : channel,
        direction: direction || undefined,
        contactId: contactId || undefined,
        leadId: leadId || undefined,
        dealId: dealId || undefined,
        page,
        limit,
      });
      setHistoryData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load communication history timeline.');
    } finally {
      setLoading(false);
    }
  }, [search, channel, direction, contactId, leadId, dealId, page]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const hasActiveFilters = Boolean(
    search ||
      channel !== 'ALL' ||
      direction ||
      contactId ||
      leadId ||
      dealId,
  );

  const handleResetFilters = () => {
    setSearch('');
    setChannel('ALL');
    setDirection('');
    setContactId('');
    setLeadId('');
    setDealId('');
    setPage(1);
  };

  const getEntityPath = (item: UnifiedTimelineItem): string | null => {
    if (!item.entity) return null;
    const type = item.entity.type.toUpperCase();
    if (type === 'CONTACT') return `/contacts/${item.entity.id}`;
    if (type === 'LEAD') return `/leads/${item.entity.id}`;
    if (type === 'DEAL') return `/deals/${item.entity.id}`;
    return null;
  };

  const getItemDetailPath = (item: UnifiedTimelineItem): string | null => {
    if (item.type === 'EMAIL') return `/communications/emails/${item.id}`;
    if (
      item.type === 'CALL' ||
      item.type === 'MEETING' ||
      item.type === 'FOLLOW_UP'
    ) {
      return `/activities/${item.id}`;
    }
    if (item.type === 'COMMENT' && item.metadata?.emailId) {
      return `/communications/emails/${item.metadata.emailId}`;
    }
    return null;
  };

  const breakdown = historyData.summary.channelBreakdown;

  return (
    <CommunicationsLayout
      title="Communication History"
      subtitle="Unified chronological timeline of all CRM emails, calls, meetings, internal comments, and notes across Contacts, Leads, and Deals."
      error={error}
      onDismissError={() => setError(null)}
      actions={
        <div className="lg-badge-row">
          <Link
            to="/communications/comments"
            className="auth-btn btn-secondary btn-size-small"
          >
            Internal Comments
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
      {/* Channel Summary KPIs */}
      <div className="lg-stat-grid">
        <StatCard
          label="Total Touchpoints"
          value={historyData.summary.totalCommunications}
          hint="Unified multi-channel history"
          tone="blue"
          icon={<ActivityIcon size={18} />}
        />
        <StatCard
          label="Emails Logged"
          value={breakdown.emails}
          hint="Inbound & outbound threads"
          tone="green"
          icon={<MailIcon size={18} />}
        />
        <StatCard
          label="Calls & Meetings"
          value={breakdown.calls + breakdown.meetings}
          hint={`${breakdown.calls} calls · ${breakdown.meetings} meetings`}
          tone="purple"
          icon={<CalendarIcon size={18} />}
        />
        <StatCard
          label="Comments & Notes"
          value={breakdown.comments + breakdown.notes}
          hint={`${breakdown.comments} comments · ${breakdown.notes} notes`}
          tone="amber"
          icon={<UsersIcon size={18} />}
        />
      </div>

      {/* Filters */}
      <FilterBar
        onRefresh={loadTimeline}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search timeline subjects, notes, comments..."
        />

        <select
          className="lg-select"
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by channel"
        >
          {COMMUNICATION_CHANNEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by direction"
        >
          <option value="">All Directions</option>
          <option value="OUTBOUND">Outbound</option>
          <option value="INBOUND">Inbound</option>
          <option value="INTERNAL">Internal</option>
        </select>

        <select
          className="lg-select"
          value={contactId}
          onChange={(e) => {
            setContactId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by Contact"
        >
          <option value="">All Contacts</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              Contact: {c.firstName} {c.lastName}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={leadId}
          onChange={(e) => {
            setLeadId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by Lead"
        >
          <option value="">All Leads</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              Lead: {l.title}
            </option>
          ))}
        </select>

        <select
          className="lg-select"
          value={dealId}
          onChange={(e) => {
            setDealId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by Deal"
        >
          <option value="">All Deals</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              Deal: {d.title}
            </option>
          ))}
        </select>
      </FilterBar>

      {/* Timeline Feed */}
      <SectionCard
        title={`Communication Timeline (${historyData.total})`}
        subtitle="Chronological stream of interactions and internal notes"
      >
        {loading ? (
          <div style={{ padding: '2.5rem' }}>
            <LoadingIndicator message="Loading communication timeline..." />
          </div>
        ) : historyData.items.length === 0 ? (
          <EmptyState
            title="No communication history matches your filters"
            description="Try resetting your channel or entity filters, or compose a new email."
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
          <div className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-4 before:w-0.5 before:bg-gray-200">
            {historyData.items.map((item) => {
              const entityPath = getEntityPath(item);
              const detailPath = getItemDetailPath(item);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="relative pl-10"
                >
                  <div className="absolute top-3 left-2.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs" />

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={channelBadgeTone(item.channel)}>
                          {item.channel}
                        </Badge>
                        <Badge
                          tone={
                            item.direction === 'INBOUND'
                              ? 'green'
                              : item.direction === 'INTERNAL'
                                ? 'amber'
                                : 'slate'
                          }
                        >
                          {item.direction}
                        </Badge>
                        {item.status && (
                          <Badge tone="blue">{item.status}</Badge>
                        )}
                      </div>

                      <span className="text-xs text-gray-400">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>

                    <div className="mt-2">
                      {detailPath ? (
                        <Link
                          to={detailPath}
                          className="text-sm font-bold text-gray-900 hover:text-blue-600"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <h4 className="text-sm font-bold text-gray-900">
                          {item.title}
                        </h4>
                      )}
                      {item.content && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
                          {item.content}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-xs text-gray-500">
                      <span>
                        By:{' '}
                        <strong>
                          {item.author?.name ||
                            item.author?.email ||
                            'CRM System'}
                        </strong>
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.entity && entityPath && (
                          <Link
                            to={entityPath}
                            className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                          >
                            {item.entity.type}: {item.entity.name || 'Record'} →
                          </Link>
                        )}
                        {detailPath && (
                          <Link
                            to={detailPath}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Open Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {historyData.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-600">
            <span>
              Page <strong>{page}</strong> of{' '}
              <strong>{historyData.totalPages}</strong> ({historyData.total}{' '}
              total events)
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
                disabled={page >= historyData.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(historyData.totalPages, p + 1))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </CommunicationsLayout>
  );
};

export default CommunicationHistoryPage;

