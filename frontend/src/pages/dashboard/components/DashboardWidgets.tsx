import React from 'react';
import { Link } from 'react-router-dom';
import type {
  AnalyticsInterval,
  AnalyticsTimeframe,
  DashboardLookupOption,
  DashboardQueryFilters,
  DashboardRecentActivity,
  DashboardRecentDeal,
  DashboardRecentLead,
  MetricWithTrend,
  PipelineAnalyticsResponse,
  RepPerformanceMetric,
  RevenueAnalyticsResponse,
  TeamMetric,
} from '../../../types/dashboard.types';
import {
  Badge,
  ScorePill,
  SectionCard,
} from '../../lead-generation/components/Cards';
import { LineChart } from '../../lead-generation/components/Charts';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
  humanize,
  toneForStatus,
  type Tone,
} from '../../lead-generation/leadGenConstants';
import {
  formatLeadDisplayName,
  INTERVAL_OPTIONS,
  TIMEFRAME_OPTIONS,
} from '../dashboardConstants';
import {
  ArrowRightIcon,
  FilterIcon,
  RefreshCwIcon,
  XIcon,
} from '../../../components/common/Icons';

/* ==========================================================================
   1. Loading Skeleton
   ========================================================================== */

export const DashboardSkeleton: React.FC<{ cardCount?: number }> = ({
  cardCount = 4,
}) => (
  <div className="space-y-6" role="status" aria-label="Loading dashboard data">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cardCount }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-xs"
        >
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-7 w-32 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-28 rounded bg-gray-100" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="h-4 w-44 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-64 rounded bg-gray-100" />
        <div className="mt-6 h-44 w-full rounded-lg bg-gray-100" />
      </div>
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="h-4 w-44 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-64 rounded bg-gray-100" />
        <div className="mt-6 space-y-3">
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
        </div>
      </div>
    </div>
  </div>
);

/* ==========================================================================
   2. Reusable KPI Card with Period Trend
   ========================================================================== */

interface DashboardKpiCardProps {
  label: string;
  value: React.ReactNode;
  metric?: MetricWithTrend;
  formatPrev?: (n: number) => string;
  subtitle?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  to?: string;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  label,
  value,
  metric,
  formatPrev,
  subtitle,
  icon,
  tone = 'blue',
  to,
}) => {
  const direction = metric?.direction || 'FLAT';
  const pct = Number(metric?.percentage ?? 0);
  const badgeColor =
    direction === 'UP'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : direction === 'DOWN'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-gray-100 text-gray-600 border-gray-200';
  const arrow = direction === 'UP' ? '↑' : direction === 'DOWN' ? '↓' : '→';

  const cardBody = (
    <div
      className={`lg-card lg-stat-card tone-${tone} flex flex-col justify-between transition hover:shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="lg-stat-label">{label}</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="lg-stat-value">{value}</span>
            {metric && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badgeColor}`}
                title="Period-over-period change"
              >
                <span>{arrow}</span>
                <span>{Math.abs(pct).toFixed(1)}%</span>
              </span>
            )}
          </div>
        </div>
        {icon && <div className="lg-stat-icon shrink-0">{icon}</div>}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
        {metric ? (
          <span>
            Prev:{' '}
            <strong className="text-gray-700">
              {formatPrev
                ? formatPrev(metric.previous)
                : formatNumber(metric.previous)}
            </strong>
          </span>
        ) : subtitle ? (
          <span>{subtitle}</span>
        ) : (
          <span />
        )}
        {to && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
            <span>View</span>
            <ArrowRightIcon size={11} />
          </span>
        )}
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block no-underline">
      {cardBody}
    </Link>
  ) : (
    cardBody
  );
};

/* ==========================================================================
   3. Dashboard Filter Bar (Date, Interval, Team, User, Pipeline)
   ========================================================================== */

interface DashboardFilterBarProps {
  filters: DashboardQueryFilters;
  onChange: (next: DashboardQueryFilters) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  teams: DashboardLookupOption[];
  users: DashboardLookupOption[];
  pipelines: DashboardLookupOption[];
  showPipelineFilter?: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  onRefresh,
  isLoading = false,
  teams,
  users,
  pipelines,
  showPipelineFilter = true,
}) => {
  const hasActiveFilters =
    (filters.timeframe && filters.timeframe !== 'LAST_30_DAYS') ||
    Boolean(filters.interval) ||
    Boolean(filters.teamId) ||
    Boolean(filters.userId) ||
    Boolean(filters.pipelineId) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  return (
    <section
      className="lg-card mb-6 p-4"
      aria-label="Dashboard filters and timeframe controls"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-600 uppercase">
          <FilterIcon size={14} />
          <span>Dashboard Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <XIcon size={13} />
              <span>Reset Filters</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white disabled:opacity-50"
          >
            <RefreshCwIcon size={13} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Timeframe Selector */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
            Date Range
          </label>
          <select
            value={filters.timeframe || 'LAST_30_DAYS'}
            onChange={(e) =>
              onChange({
                ...filters,
                timeframe: e.target.value as AnalyticsTimeframe,
              })
            }
            aria-label="Date Range"
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
          >
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Aggregation Interval */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
            Chart Interval
          </label>
          <select
            value={filters.interval || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                interval: (e.target.value || undefined) as
                  | AnalyticsInterval
                  | undefined,
              })
            }
            aria-label="Chart Interval"
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="">Auto Interval</option>
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Team Filter */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
            Sales Team
          </label>
          <select
            value={filters.teamId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                teamId: e.target.value || undefined,
              })
            }
            aria-label="Sales Team"
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* User / Sales Rep Filter */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
            User / Representative
          </label>
          <select
            value={filters.userId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                userId: e.target.value || undefined,
              })
            }
            aria-label="User or Representative"
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All Representatives</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pipeline Filter */}
        {showPipelineFilter && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
              Pipeline
            </label>
            <select
              value={filters.pipelineId || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  pipelineId: e.target.value || undefined,
                })
              }
              aria-label="Pipeline"
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="">Default / All Pipelines</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Custom Date Range Pickers when timeframe === CUSTOM */}
      {filters.timeframe === 'CUSTOM' && (
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
              Start Date
            </label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.slice(0, 10) : ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dateFrom: e.target.value
                    ? new Date(`${e.target.value}T00:00:00Z`).toISOString()
                    : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
              End Date
            </label>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.slice(0, 10) : ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dateTo: e.target.value
                    ? new Date(`${e.target.value}T23:59:59Z`).toISOString()
                    : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      )}
    </section>
  );
};

/* ==========================================================================
   4. Pipeline Summary Widget
   ========================================================================== */

export const PipelineSummaryWidget: React.FC<{
  pipeline?: PipelineAnalyticsResponse | null;
}> = ({ pipeline }) => {
  const stages = pipeline?.stages || [];
  const maxStageValue = Math.max(...stages.map((s) => s.totalValue), 1);
  const pipelineLink = pipeline?.pipelineId
    ? `/pipelines/${pipeline.pipelineId}`
    : '/pipelines';

  return (
    <SectionCard
      title={`Pipeline Summary — ${pipeline?.pipelineName || 'Sales Pipeline'}`}
      subtitle={`${formatNumber(pipeline?.totalDeals)} active deals • ${formatCurrency(pipeline?.totalPipelineValue)} total • ${formatCurrency(pipeline?.totalWeightedValue)} weighted forecast`}
      actions={
        <Link
          to={pipelineLink}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <span>Open Pipeline</span>
          <ArrowRightIcon size={13} />
        </Link>
      }
    >
      {stages.length === 0 ? (
        <EmptyState
          title="No pipeline stages configured"
          description="Create or select a sales pipeline to inspect stage distribution and weighted deal value."
          action={
            <Link to="/pipelines/create" className="lg-btn lg-btn-primary">
              Create Pipeline
            </Link>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {stages.map((stage) => {
            const widthPct = Math.max(
              (stage.totalValue / maxStageValue) * 100,
              stage.dealCount > 0 ? 4 : 0,
            );
            return (
              <div
                key={stage.stageId}
                className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: stage.color || '#3b82f6' }}
                    />
                    <Link
                      to={`/deals?stageId=${stage.stageId}`}
                      className="text-xs font-bold text-gray-900 hover:text-blue-600"
                    >
                      {stage.stageName}
                    </Link>
                    <Badge tone="slate">{stage.dealCount} deals</Badge>
                    <Badge tone="blue">{stage.winProbability}% prob.</Badge>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(stage.totalValue)}
                    </span>
                    <span className="ml-2 text-gray-500">
                      (Weighted: {formatCurrency(stage.weightedValue)})
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${widthPct}%`,
                      background: stage.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

/* ==========================================================================
   5. Revenue Summary Widget
   ========================================================================== */

export const RevenueSummaryWidget: React.FC<{
  revenue?: RevenueAnalyticsResponse | null;
}> = ({ revenue }) => {
  const rev = revenue?.revenue;
  const points = (revenue?.timeSeries || []).map((pt) => ({
    label: pt.label || pt.date.slice(5),
    value: pt.value,
  }));

  return (
    <SectionCard
      title="Revenue Summary & Projections"
      subtitle="Closed-won revenue, active pipeline value, and probability-weighted forecast"
      actions={
        <Link
          to="/deals/won"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <span>Won Deals</span>
          <ArrowRightIcon size={13} />
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">
            Closed-Won
          </span>
          <p className="mt-1 text-base font-bold text-gray-900">
            {formatCurrency(rev?.closedWonRevenue?.current)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <span className="text-[11px] font-semibold text-blue-700 uppercase">
            Weighted Forecast
          </span>
          <p className="mt-1 text-base font-bold text-gray-900">
            {formatCurrency(rev?.weightedForecastRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
          <span className="text-[11px] font-semibold text-purple-700 uppercase">
            Open Pipeline
          </span>
          <p className="mt-1 text-base font-bold text-gray-900">
            {formatCurrency(rev?.activePipelineValue)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <span className="text-[11px] font-semibold text-amber-700 uppercase">
            Avg Won Deal
          </span>
          <p className="mt-1 text-base font-bold text-gray-900">
            {formatCurrency(rev?.avgRevenuePerDeal)}
          </p>
        </div>
      </div>

      <LineChart
        points={points}
        height={200}
        emptyText="No closed-won revenue recorded in the selected date range."
      />
    </SectionCard>
  );
};

/* ==========================================================================
   6. Recent Deals Widget
   ========================================================================== */

export const RecentDealsWidget: React.FC<{
  deals: DashboardRecentDeal[];
}> = ({ deals }) => (
  <SectionCard
    title="Recent Deals"
    subtitle="Latest opportunities and high-value deals across your pipeline"
    actions={
      <Link
        to="/deals"
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        <span>All Deals</span>
        <ArrowRightIcon size={13} />
      </Link>
    }
  >
    {deals.length === 0 ? (
      <EmptyState
        title="No deals found"
        description="Create a new deal to start tracking pipeline revenue."
        action={
          <Link to="/deals/create" className="lg-btn lg-btn-primary">
            Create Deal
          </Link>
        }
      />
    ) : (
      <div className="divide-y divide-gray-100">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/deals/${deal.id}`}
                  className="truncate text-xs font-bold text-gray-900 hover:text-blue-600"
                >
                  {deal.title}
                </Link>
                <Badge tone={toneForStatus(deal.status)}>
                  {humanize(deal.status)}
                </Badge>
                {deal.stage?.name && (
                  <Badge tone="blue">{deal.stage.name}</Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {deal.organization?.name ||
                  (deal.contact
                    ? `${deal.contact.firstName} ${deal.contact.lastName}`
                    : 'No organization linked')}
                {deal.owner?.name ? ` • Owner: ${deal.owner.name}` : ''}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-right">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {formatCurrency(deal.value)}
                </p>
                {deal.probability !== undefined && (
                  <p className="text-[10px] text-gray-400">
                    {deal.probability}% probability
                  </p>
                )}
              </div>
              <Link
                to={`/deals/${deal.id}`}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);

/* ==========================================================================
   7. Recent Leads Widget
   ========================================================================== */

export const RecentLeadsWidget: React.FC<{
  leads: DashboardRecentLead[];
}> = ({ leads }) => (
  <SectionCard
    title="Recent Leads"
    subtitle="Newly captured and top-scoring leads ready for qualification"
    actions={
      <Link
        to="/leads"
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        <span>All Leads</span>
        <ArrowRightIcon size={13} />
      </Link>
    }
  >
    {leads.length === 0 ? (
      <EmptyState
        title="No leads found"
        description="Capture or import leads to populate your acquisition funnel."
        action={
          <Link to="/leads/create" className="lg-btn lg-btn-primary">
            Create Lead
          </Link>
        }
      />
    ) : (
      <div className="divide-y divide-gray-100">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/leads/${lead.id}`}
                  className="truncate text-xs font-bold text-gray-900 hover:text-blue-600"
                >
                  {formatLeadDisplayName(lead)}
                </Link>
                <Badge tone={toneForStatus(lead.status)}>
                  {humanize(lead.status)}
                </Badge>
                {lead.source && (
                  <Badge tone="purple">{humanize(lead.source)}</Badge>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {lead.company || lead.email || 'No company'}
                {lead.owner?.name ? ` • Owner: ${lead.owner.name}` : ''}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <ScorePill score={lead.leadScore} />
              <Link
                to={`/leads/${lead.id}`}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);

/* ==========================================================================
   8. Recent Activities Widget
   ========================================================================== */

export const RecentActivitiesWidget: React.FC<{
  activities: DashboardRecentActivity[];
}> = ({ activities }) => (
  <SectionCard
    title="Recent Activities"
    subtitle="Calls, meetings, follow-ups, and emails across your CRM"
    actions={
      <Link
        to="/activities"
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        <span>All Activities</span>
        <ArrowRightIcon size={13} />
      </Link>
    }
  >
    {activities.length === 0 ? (
      <EmptyState
        title="No recent activities"
        description="Log a call, schedule a meeting, or create a follow-up task."
        action={
          <Link to="/activities/create" className="lg-btn lg-btn-primary">
            Log Activity
          </Link>
        }
      />
    ) : (
      <div className="divide-y divide-gray-100">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{humanize(act.type)}</Badge>
                <Link
                  to={`/activities/${act.id}`}
                  className="truncate text-xs font-bold text-gray-900 hover:text-blue-600"
                >
                  {act.subject || 'Untitled Activity'}
                </Link>
                <Badge tone={toneForStatus(act.status)}>
                  {humanize(act.status)}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {act.assignedTo?.name
                  ? `Assignee: ${act.assignedTo.name}`
                  : 'Unassigned'}
                {act.contact
                  ? ` • Contact: ${act.contact.firstName} ${act.contact.lastName}`
                  : ''}
                {act.scheduledAt || act.createdAt
                  ? ` • ${formatDateTime(act.scheduledAt || act.createdAt)}`
                  : ''}
              </p>
            </div>

            <Link
              to={`/activities/${act.id}`}
              className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              Details
            </Link>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);

/* ==========================================================================
   9. Team Performance & Representative Leaderboard Widget
   ========================================================================== */

export const TeamPerformanceWidget: React.FC<{
  teams: TeamMetric[];
  reps: RepPerformanceMetric[];
}> = ({ teams, reps }) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {/* Team Comparison Table */}
    <SectionCard
      title="Sales Team Comparison"
      subtitle="Deal closures, win rate, and revenue generated per team"
      actions={
        <Link
          to="/teams"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <span>All Teams</span>
          <ArrowRightIcon size={13} />
        </Link>
      }
    >
      {teams.length === 0 ? (
        <EmptyState
          title="No teams found"
          description="Create sales teams to compare team quotas, win rates, and revenue."
          action={
            <Link to="/teams/create" className="lg-btn lg-btn-primary">
              Create Team
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                <th className="pb-2.5">Team</th>
                <th className="pb-2.5 text-right">Members</th>
                <th className="pb-2.5 text-right">Deals Won</th>
                <th className="pb-2.5 text-right">Win Rate</th>
                <th className="pb-2.5 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((team) => (
                <tr key={team.teamId} className="hover:bg-gray-50/70">
                  <td className="py-2.5">
                    <Link
                      to={`/teams/${team.teamId}/performance`}
                      className="font-bold text-gray-900 hover:text-blue-600"
                    >
                      {team.teamName}
                    </Link>
                    {team.leaderName && (
                      <p className="text-[11px] text-gray-400">
                        Lead: {team.leaderName}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-700">
                    {formatNumber(team.memberCount)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-700">
                    {formatNumber(team.dealsWon)} / {formatNumber(team.dealsCount)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={team.winRate >= 40 ? 'green' : 'amber'}>
                      {formatPercent(team.winRate)}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right font-bold text-gray-900">
                    {formatCurrency(team.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>

    {/* Representative Leaderboard */}
    <SectionCard
      title="Representative Leaderboard"
      subtitle="Top sales representatives ranked by closed-won revenue"
      actions={
        <Link
          to="/users"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <span>All Users</span>
          <ArrowRightIcon size={13} />
        </Link>
      }
    >
      {reps.length === 0 ? (
        <EmptyState
          title="No representative data"
          description="Assign deals and activities to sales reps to track rankings."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                <th className="pb-2.5">Rank & Rep</th>
                <th className="pb-2.5 text-right">Won</th>
                <th className="pb-2.5 text-right">Win Rate</th>
                <th className="pb-2.5 text-right">Activities</th>
                <th className="pb-2.5 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reps.map((rep) => (
                <tr key={rep.userId} className="hover:bg-gray-50/70">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          rep.rank === 1
                            ? 'bg-amber-100 text-amber-800'
                            : rep.rank === 2
                              ? 'bg-gray-200 text-gray-800'
                              : rep.rank === 3
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        #{rep.rank}
                      </span>
                      <div>
                        <Link
                          to={`/users/${rep.userId}/performance`}
                          className="font-bold text-gray-900 hover:text-blue-600"
                        >
                          {rep.name}
                        </Link>
                        <p className="text-[10px] text-gray-400">
                          {rep.role || rep.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-700">
                    {formatNumber(rep.dealsWon)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={rep.winRate >= 40 ? 'green' : 'slate'}>
                      {formatPercent(rep.winRate)}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-700">
                    {formatNumber(rep.activitiesCompleted)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-gray-900">
                    {formatCurrency(rep.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  </div>
);

