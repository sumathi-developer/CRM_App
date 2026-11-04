import React from 'react';
import type {
  AnalyticsInterval,
  AnalyticsTimeframe,
  DashboardLookupOption,
  DashboardQueryFilters,
} from '../../../types/dashboard.types';
import {
  INTERVAL_OPTIONS,
  TIMEFRAME_OPTIONS,
} from '../../dashboard/dashboardConstants';
import {
  LEAD_SOURCE_FILTER_OPTIONS,
  PERFORMANCE_SORT_OPTIONS,
  type AnalyticsScreenSlug,
} from '../analyticsConstants';
import { Button } from '../../../components/ui';
import {
  ChevronDownIcon,
  FilterIcon,
  RefreshCwIcon,
  SlidersIcon,
  XIcon,
} from '../../../components/common/Icons';

interface AnalyticsFilterBarProps {
  screen: AnalyticsScreenSlug;
  filters: DashboardQueryFilters;
  onChangeFilters: (next: DashboardQueryFilters) => void;
  sourceFilter: string;
  onChangeSourceFilter: (next: string) => void;
  showComparison: boolean;
  onToggleComparison: (next: boolean) => void;
  sortBy: string;
  onChangeSortBy: (next: string) => void;
  sortOrder: 'asc' | 'desc';
  onChangeSortOrder: (next: 'asc' | 'desc') => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  teams: DashboardLookupOption[];
  users: DashboardLookupOption[];
  pipelines: DashboardLookupOption[];
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  screen,
  filters,
  onChangeFilters,
  sourceFilter,
  onChangeSourceFilter,
  showComparison,
  onToggleComparison,
  sortBy,
  onChangeSortBy,
  sortOrder,
  onChangeSortOrder,
  onReset,
  onRefresh,
  isLoading = false,
  teams,
  users,
  pipelines,
}) => {
  const showSourceDropdown =
    screen === 'leads' || screen === 'lead-sources' || screen === 'conversion';
  const showPipelineDropdown =
    screen === 'sales' || screen === 'pipeline' || screen === 'revenue';
  const showPerformanceSort = screen === 'performance';

  const activeCount = [
    Boolean(filters.timeframe && filters.timeframe !== 'LAST_30_DAYS'),
    Boolean(filters.interval),
    Boolean(filters.teamId),
    Boolean(filters.userId),
    Boolean(filters.pipelineId),
    Boolean(filters.dateFrom || filters.dateTo),
    Boolean(sourceFilter),
    Boolean(showComparison),
  ].filter(Boolean).length;

  const hasActiveFilters = activeCount > 0;

  return (
    <section
      className="crm-filter-bar"
      aria-label="Analytics filters, source filters, and comparison controls"
    >
      {/* Top Header: Title, Active Badge, Comparison Pill & Action Buttons */}
      <div className="crm-filter-header">
        <div className="crm-filter-title-group">
          <div className="crm-filter-icon-badge">
            <FilterIcon size={16} />
          </div>
          <div className="crm-filter-heading">
            <span>Analytics Filters &amp; Controls</span>
            {hasActiveFilters && (
              <span className="crm-badge crm-badge-secondary">
                <span className="crm-badge-dot" />
                {activeCount} active
              </span>
            )}
          </div>
        </div>

        <div className="crm-filter-actions">
          {/* Period Comparison Control Toggle */}
          <Button
            type="button"
            variant={showComparison ? 'secondary' : 'outline'}
            size="sm"
            pill
            onClick={() => onToggleComparison(!showComparison)}
            icon={<SlidersIcon size={13} />}
          >
            {showComparison ? 'Period Comparison: ON' : 'Compare vs. Previous Period'}
          </Button>

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
            {isLoading ? 'Refreshing...' : 'Refresh Analytics'}
          </Button>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="crm-filter-grid">
        {/* Date Range Preset */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="analytics-filter-timeframe">
            Date Filter
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="analytics-filter-timeframe"
              value={filters.timeframe || 'LAST_30_DAYS'}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  timeframe: e.target.value as AnalyticsTimeframe,
                })
              }
              aria-label="Date Filter"
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
          <label className="crm-filter-label" htmlFor="analytics-filter-interval">
            Time-Series Interval
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="analytics-filter-interval"
              value={filters.interval || ''}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  interval: (e.target.value || undefined) as
                    | AnalyticsInterval
                    | undefined,
                })
              }
              aria-label="Time-Series Interval"
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
          <label className="crm-filter-label" htmlFor="analytics-filter-team">
            Team Filter
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="analytics-filter-team"
              value={filters.teamId || ''}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  teamId: e.target.value || undefined,
                })
              }
              aria-label="Team Filter"
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

        {/* User / Rep Filter */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="analytics-filter-user">
            User / Rep Filter
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="analytics-filter-user"
              value={filters.userId || ''}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  userId: e.target.value || undefined,
                })
              }
              aria-label="User Filter"
              className="crm-filter-select"
            >
              <option value="">All Users / Reps</option>
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

        {/* Contextual 5th Filter: Source Filter OR Pipeline Filter OR Performance Sort */}
        {showSourceDropdown ? (
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="analytics-filter-source">
              Source Filter
            </label>
            <div className="crm-filter-select-wrap">
              <select
                id="analytics-filter-source"
                value={sourceFilter}
                onChange={(e) => onChangeSourceFilter(e.target.value)}
                aria-label="Source Filter"
                className="crm-filter-select"
              >
                {LEAD_SOURCE_FILTER_OPTIONS.map((opt) => (
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
        ) : showPipelineDropdown ? (
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="analytics-filter-pipeline">
              Pipeline Filter
            </label>
            <div className="crm-filter-select-wrap">
              <select
                id="analytics-filter-pipeline"
                value={filters.pipelineId || ''}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    pipelineId: e.target.value || undefined,
                  })
                }
                aria-label="Pipeline Filter"
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
        ) : showPerformanceSort ? (
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="analytics-filter-sort">
              Rank By
            </label>
            <div className="crm-filter-select-wrap">
              <select
                id="analytics-filter-sort"
                value={sortBy}
                onChange={(e) => onChangeSortBy(e.target.value)}
                aria-label="Rank By"
                className="crm-filter-select"
              >
                {PERFORMANCE_SORT_OPTIONS.map((opt) => (
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
        ) : (
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="analytics-filter-source">
              Source Filter
            </label>
            <div className="crm-filter-select-wrap">
              <select
                id="analytics-filter-source"
                value={sourceFilter}
                onChange={(e) => onChangeSourceFilter(e.target.value)}
                aria-label="Source Filter"
                className="crm-filter-select"
              >
                {LEAD_SOURCE_FILTER_OPTIONS.map((opt) => (
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
        )}
      </div>

      {/* Custom Date Range Pickers when timeframe === CUSTOM */}
      {filters.timeframe === 'CUSTOM' && (
        <div className="crm-filter-custom-dates grid grid-cols-1 gap-3 border-t border-emerald-900/10 pt-3 sm:grid-cols-2 mt-3">
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="analytics-custom-start">
              Start Date
            </label>
            <input
              id="analytics-custom-start"
              type="date"
              value={filters.dateFrom ? filters.dateFrom.slice(0, 10) : ''}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  dateFrom: e.target.value
                    ? new Date(`${e.target.value}T00:00:00Z`).toISOString()
                    : undefined,
                })
              }
              className="crm-filter-select"
            />
          </div>
          <div className="crm-filter-control">
            <label className="crm-filter-label" htmlFor="analytics-custom-end">
              End Date
            </label>
            <input
              id="analytics-custom-end"
              type="date"
              value={filters.dateTo ? filters.dateTo.slice(0, 10) : ''}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  dateTo: e.target.value
                    ? new Date(`${e.target.value}T23:59:59Z`).toISOString()
                    : undefined,
                })
              }
              className="crm-filter-select"
            />
          </div>
        </div>
      )}
    </section>
  );
};
