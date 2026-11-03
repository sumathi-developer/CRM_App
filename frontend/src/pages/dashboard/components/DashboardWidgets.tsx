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
  BriefcaseIcon,
  CalendarIcon,
  ChevronDownIcon,
  FilterIcon,
  RefreshCwIcon,
  TargetIcon,
  XIcon,
} from '../../../components/common/Icons';
import { Button } from '../../../components/ui/Button';

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
  const badgeClass =
    direction === 'UP'
      ? 'crm-badge crm-badge-secondary'
      : direction === 'DOWN'
        ? 'crm-badge crm-badge-danger'
        : 'crm-badge crm-badge-neutral';
  const arrow = direction === 'UP' ? '↑' : direction === 'DOWN' ? '↓' : '→';

  const cardBody = (
    <div className={`crm-kpi-card tone-${tone}`}>
      <div className="crm-kpi-top-row">
        <span className="crm-kpi-label" title={label}>{label}</span>
        {icon && <div className={`crm-kpi-icon-wrap tone-${tone}`}>{icon}</div>}
      </div>

      <div className="crm-kpi-mid-row">
        <span className="crm-kpi-value">{value}</span>
        {metric && (
          <span
            className={badgeClass}
            style={{ fontSize: '10px', padding: '0.15rem 0.45rem', lineHeight: 1 }}
            title="Period-over-period change"
          >
            <span>{arrow}</span>
            <span>{Math.abs(pct).toFixed(1)}%</span>
          </span>
        )}
      </div>

      <div className="crm-kpi-footer">
        {metric ? (
          <span className="crm-kpi-prev">
            Prev:{' '}
            <strong style={{ color: '#cbd5e1' }}>
              {formatPrev
                ? formatPrev(metric.previous)
                : formatNumber(metric.previous)}
            </strong>
          </span>
        ) : subtitle ? (
          <span className="crm-kpi-prev" style={{ color: '#94a3b8' }}>{subtitle}</span>
        ) : (
          <span />
        )}
        {to && (
          <span className="crm-kpi-view-link">
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
  const activeCount = [
    Boolean(filters.timeframe && filters.timeframe !== 'LAST_30_DAYS'),
    Boolean(filters.interval),
    Boolean(filters.teamId),
    Boolean(filters.userId),
    Boolean(filters.pipelineId),
    Boolean(filters.dateFrom || filters.dateTo),
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0;

  return (
    <section
      className="crm-filter-bar"
      aria-label="Dashboard filters and timeframe controls"
    >
      <div className="crm-filter-header">
        <div className="crm-filter-title-group">
          <div className="crm-filter-icon-badge">
            <FilterIcon size={16} />
          </div>
          <div className="crm-filter-heading">
            <span>Dashboard Filters</span>
            {hasActiveFilters && (
              <span className="crm-badge crm-badge-secondary">
                <span className="crm-badge-dot" />
                {activeCount} active
              </span>
            )}
          </div>
        </div>

        <div className="crm-filter-actions">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              pill
              onClick={onReset}
              icon={<XIcon size={13} />}
            >
              Reset Filters
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            pill
            onClick={onRefresh}
            loading={isLoading}
            icon={<RefreshCwIcon size={13} />}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <div className="crm-filter-grid">
        {/* Timeframe Selector */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="dashboard-filter-timeframe">
            Date Range
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="dashboard-filter-timeframe"
              value={filters.timeframe || 'LAST_30_DAYS'}
              onChange={(e) =>
                onChange({
                  ...filters,
                  timeframe: e.target.value as AnalyticsTimeframe,
                })
              }
              aria-label="Date Range"
              className="crm-filter-select"
            >
              {TIMEFRAME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="crm-filter-chevron">
              <ChevronDownIcon size={14} />
            </span>
          </div>
        </div>

        {/* Aggregation Interval */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="dashboard-filter-interval">
            Chart Interval
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="dashboard-filter-interval"
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
              className="crm-filter-select"
            >
              <option value="">Auto Interval</option>
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="crm-filter-chevron">
              <ChevronDownIcon size={14} />
            </span>
          </div>
        </div>

        {/* Team Filter */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="dashboard-filter-team">
            Sales Team
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="dashboard-filter-team"
              value={filters.teamId || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  teamId: e.target.value || undefined,
                })
              }
              aria-label="Sales Team"
              className="crm-filter-select"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="crm-filter-chevron">
              <ChevronDownIcon size={14} />
            </span>
          </div>
        </div>

        {/* User / Sales Rep Filter */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="dashboard-filter-user">
            User / Representative
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="dashboard-filter-user"
              value={filters.userId || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  userId: e.target.value || undefined,
                })
              }
              aria-label="User or Representative"
              className="crm-filter-select"
            >
              <option value="">All Representatives</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <span className="crm-filter-chevron">
              <ChevronDownIcon size={14} />
            </span>
          </div>
        </div>

        {/* Pipeline Filter */}
        {showPipelineFilter && (
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="dashboard-filter-pipeline">
              Pipeline
            </label>
            <div className="crm-filter-select-wrap">
              <select
                id="dashboard-filter-pipeline"
                value={filters.pipelineId || ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    pipelineId: e.target.value || undefined,
                  })
                }
                aria-label="Pipeline"
                className="crm-filter-select"
              >
                <option value="">Default / All Pipelines</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="crm-filter-chevron">
                <ChevronDownIcon size={14} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Date Range Pickers when timeframe === CUSTOM */}
      {filters.timeframe === 'CUSTOM' && (
        <div className="crm-filter-custom-dates">
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="dashboard-filter-date-from">
              Start Date
            </label>
            <input
              id="dashboard-filter-date-from"
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
              className="crm-filter-input"
            />
          </div>
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="dashboard-filter-date-to">
              End Date
            </label>
            <input
              id="dashboard-filter-date-to"
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
              className="crm-filter-input"
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
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
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
        <div className="crm-pipeline-stages-list">
          {stages.map((stage) => {
            const widthPct = Math.max(
              (stage.totalValue / maxStageValue) * 100,
              stage.dealCount > 0 ? 4 : 0,
            );
            return (
              <div key={stage.stageId} className="crm-pipeline-stage-item">
                <div className="crm-pipeline-stage-row">
                  {/* Left: Stage dot + Name */}
                  <div className="crm-pipeline-stage-identity">
                    <span
                      className="crm-pipeline-stage-dot"
                      style={{ background: stage.color || '#10b981' }}
                    />
                    <Link
                      to={`/deals?stageId=${stage.stageId}`}
                      className="crm-pipeline-stage-name"
                      title={stage.stageName}
                    >
                      {stage.stageName}
                    </Link>
                  </div>

                  {/* Badges: Fixed column */}
                  <div className="crm-pipeline-stage-badges">
                    <span className="crm-stage-pill count">
                      {stage.dealCount} {stage.dealCount === 1 ? 'deal' : 'deals'}
                    </span>
                    <span className="crm-stage-pill prob">
                      {stage.winProbability}% prob.
                    </span>
                  </div>

                  {/* Metrics: Right-aligned */}
                  <div className="crm-pipeline-stage-metrics">
                    <span className="crm-pipeline-stage-value">
                      {formatCurrency(stage.totalValue)}
                    </span>
                    <span className="crm-pipeline-stage-weighted">
                      Weighted: {formatCurrency(stage.weightedValue)}
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="crm-pipeline-track">
                  <div
                    className="crm-pipeline-fill"
                    style={{
                      width: `${widthPct}%`,
                      background: stage.color || '#10b981',
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

  const hasData = points.length >= 2 && points.some((p) => p.value > 0);

  return (
    <SectionCard
      title="Revenue Summary & Projections"
      subtitle="Closed-won revenue, active pipeline value, and probability-weighted forecast"
      actions={
        <Link
          to="/deals/won"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>Won Deals</span>
          <ArrowRightIcon size={13} />
        </Link>
      }
    >
      {/* 4 Standardized Metric Cards: Uniform Height, Uniform Typography */}
      <div className="crm-revenue-metrics-grid">
        <div className="crm-revenue-kpi-card tone-emerald">
          <span className="crm-revenue-kpi-label">Closed-Won</span>
          <span className="crm-revenue-kpi-value">
            {formatCurrency(rev?.closedWonRevenue?.current)}
          </span>
          <span className="crm-revenue-kpi-sub">Realized Revenue</span>
        </div>

        <div className="crm-revenue-kpi-card tone-cyan">
          <span className="crm-revenue-kpi-label">Weighted Forecast</span>
          <span className="crm-revenue-kpi-value">
            {formatCurrency(rev?.weightedForecastRevenue)}
          </span>
          <span className="crm-revenue-kpi-sub">Probability Calibrated</span>
        </div>

        <div className="crm-revenue-kpi-card tone-purple">
          <span className="crm-revenue-kpi-label">Open Pipeline</span>
          <span className="crm-revenue-kpi-value">
            {formatCurrency(rev?.activePipelineValue)}
          </span>
          <span className="crm-revenue-kpi-sub">Active Deal Value</span>
        </div>

        <div className="crm-revenue-kpi-card tone-amber">
          <span className="crm-revenue-kpi-label">Avg Won Deal</span>
          <span className="crm-revenue-kpi-value">
            {formatCurrency(rev?.avgRevenuePerDeal)}
          </span>
          <span className="crm-revenue-kpi-sub">Per Closed Customer</span>
        </div>
      </div>

      {/* Chart Section */}
      {hasData ? (
        <LineChart
          points={points}
          height={180}
          emptyText="No closed-won revenue recorded in the selected date range."
        />
      ) : (
        <div className="crm-revenue-projection-empty">
          <div className="crm-revenue-projection-graphic">
            <svg width="100%" height="60" viewBox="0 0 360 60" fill="none">
              <path
                d="M 10 50 Q 90 45, 180 32 T 350 10"
                stroke="rgba(16, 185, 129, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              <circle cx="350" cy="10" r="4" fill="#10b981" />
            </svg>
          </div>
          <div className="crm-revenue-projection-text">
            <span className="crm-revenue-projection-title">
              Pipeline Trajectory: {formatCurrency(rev?.weightedForecastRevenue)} Expected
            </span>
            <p className="crm-revenue-projection-hint">
              No closed-won revenue finalized in this date range. Projections will automatically plot as deals advance across pipeline stages.
            </p>
          </div>
        </div>
      )}
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
        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
      >
        <span>All Deals</span>
        <ArrowRightIcon size={13} />
      </Link>
    }
    className="crm-recent-widget-card"
  >
    {deals.length === 0 ? (
      <div className="crm-widget-empty-state">
        <div className="crm-widget-empty-icon">
          <BriefcaseIcon size={24} />
        </div>
        <p className="crm-widget-empty-title">No deals found</p>
        <p className="crm-widget-empty-desc">
          Create a new deal to start tracking pipeline revenue.
        </p>
        <Link to="/deals/create" className="crm-widget-empty-btn">
          + Create Deal
        </Link>
      </div>
    ) : (
      <div className="crm-recent-list">
        {deals.map((deal) => (
          <div key={deal.id} className="crm-recent-item">
            <div className="crm-recent-item-main">
              <div className="crm-recent-item-title-row">
                <Link
                  to={`/deals/${deal.id}`}
                  className="crm-recent-item-title"
                  title={deal.title}
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
              <p className="crm-recent-item-sub">
                {deal.organization?.name ||
                  (deal.contact
                    ? `${deal.contact.firstName} ${deal.contact.lastName}`
                    : 'No organization linked')}
                {deal.owner?.name ? ` • Owner: ${deal.owner.name}` : ''}
              </p>
            </div>

            <div className="crm-recent-item-end">
              <div className="crm-recent-item-val-wrap">
                <span className="crm-recent-item-val">
                  {formatCurrency(deal.value)}
                </span>
                {deal.probability !== undefined && (
                  <span className="crm-recent-item-prob">
                    {deal.probability}% prob
                  </span>
                )}
              </div>
              <Link
                to={`/deals/${deal.id}`}
                className="crm-item-action-btn"
                title="View Deal"
              >
                <span>View</span>
                <ArrowRightIcon size={11} />
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
        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
      >
        <span>All Leads</span>
        <ArrowRightIcon size={13} />
      </Link>
    }
    className="crm-recent-widget-card"
  >
    {leads.length === 0 ? (
      <div className="crm-widget-empty-state">
        <div className="crm-widget-empty-icon">
          <TargetIcon size={24} />
        </div>
        <p className="crm-widget-empty-title">No leads found</p>
        <p className="crm-widget-empty-desc">
          Capture or import leads to populate your acquisition funnel.
        </p>
        <Link to="/leads/create" className="crm-widget-empty-btn">
          + Create Lead
        </Link>
      </div>
    ) : (
      <div className="crm-recent-list">
        {leads.map((lead) => (
          <div key={lead.id} className="crm-recent-item">
            <div className="crm-recent-item-main">
              <div className="crm-recent-item-title-row">
                <Link
                  to={`/leads/${lead.id}`}
                  className="crm-recent-item-title"
                  title={formatLeadDisplayName(lead)}
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
              <p className="crm-recent-item-sub">
                {lead.company || lead.email || 'No company'}
                {lead.owner?.name ? ` • Owner: ${lead.owner.name}` : ''}
              </p>
            </div>

            <div className="crm-recent-item-end">
              <div className="crm-score-badge" title="Lead Qualification Score">
                <span className="crm-score-badge-label">Score</span>
                <span className="crm-score-badge-val">{lead.leadScore ?? 0}</span>
              </div>
              <Link
                to={`/leads/${lead.id}`}
                className="crm-item-action-btn"
                title="View Lead"
              >
                <span>View</span>
                <ArrowRightIcon size={11} />
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
        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
      >
        <span>All Activities</span>
        <ArrowRightIcon size={13} />
      </Link>
    }
    className="crm-recent-widget-card"
  >
    {activities.length === 0 ? (
      <div className="crm-widget-empty-state">
        <div className="crm-widget-empty-icon">
          <CalendarIcon size={24} />
        </div>
        <p className="crm-widget-empty-title">No recent activities</p>
        <p className="crm-widget-empty-desc">
          Log a call, schedule a meeting, or create a follow-up task.
        </p>
        <Link to="/activities/create" className="crm-widget-empty-btn">
          + Log Activity
        </Link>
      </div>
    ) : (
      <div className="crm-recent-list">
        {activities.map((act) => (
          <div key={act.id} className="crm-recent-item">
            <div className="crm-recent-item-main">
              <div className="crm-recent-item-title-row">
                <Badge tone="blue">{humanize(act.type)}</Badge>
                <Link
                  to={`/activities/${act.id}`}
                  className="crm-recent-item-title"
                  title={act.subject || 'Untitled Activity'}
                >
                  {act.subject || 'Untitled Activity'}
                </Link>
                <Badge tone={toneForStatus(act.status)}>
                  {humanize(act.status)}
                </Badge>
              </div>
              <p className="crm-recent-item-sub">
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

            <div className="crm-recent-item-end">
              <Link
                to={`/activities/${act.id}`}
                className="crm-item-action-btn"
                title="View Activity Details"
              >
                <span>Details</span>
                <ArrowRightIcon size={11} />
              </Link>
            </div>
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

