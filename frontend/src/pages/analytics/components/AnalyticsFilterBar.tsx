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
import {
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

  const hasActiveFilters =
    (filters.timeframe && filters.timeframe !== 'LAST_30_DAYS') ||
    Boolean(filters.interval) ||
    Boolean(filters.teamId) ||
    Boolean(filters.userId) ||
    Boolean(filters.pipelineId) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(sourceFilter);

  return (
    <section
      className="lg-card mb-6 p-4"
      aria-label="Analytics filters, source filters, and comparison controls"
    >
      {/* Top Row: Label, Comparison Toggle, Reset & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-600 uppercase">
          <FilterIcon size={14} />
          <span>Analytics Filters &amp; Comparison Controls</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Comparison Control Toggle */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 select-none hover:bg-gray-100">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => onToggleComparison(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <SlidersIcon size={12} />
            <span>Compare vs. Previous Period</span>
          </label>

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
            <span>{isLoading ? 'Refreshing...' : 'Refresh Analytics'}</span>
          </button>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Date Range Preset */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
            Date Filter
          </label>
          <select
            value={filters.timeframe || 'LAST_30_DAYS'}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                timeframe: e.target.value as AnalyticsTimeframe,
              })
            }
            aria-label="Date Filter"
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
            Time-Series Interval
          </label>
          <select
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
            Team Filter
          </label>
          <select
            value={filters.teamId || ''}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                teamId: e.target.value || undefined,
              })
            }
            aria-label="Team Filter"
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

        {/* User / Rep Filter */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
            User / Rep Filter
          </label>
          <select
            value={filters.userId || ''}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                userId: e.target.value || undefined,
              })
            }
            aria-label="User Filter"
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All Users / Reps</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contextual 5th Filter: Source Filter OR Pipeline Filter OR Performance Sort */}
        {showSourceDropdown ? (
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
              Source Filter
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => onChangeSourceFilter(e.target.value)}
              aria-label="Source Filter"
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
            >
              {LEAD_SOURCE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : showPipelineDropdown ? (
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
              Pipeline Filter
            </label>
            <select
              value={filters.pipelineId || ''}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  pipelineId: e.target.value || undefined,
                })
              }
              aria-label="Pipeline Filter"
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
        ) : showPerformanceSort ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                Rank By
              </label>
              <select
                value={sortBy}
                onChange={(e) => onChangeSortBy(e.target.value)}
                aria-label="Rank By"
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
              >
                {PERFORMANCE_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) =>
                  onChangeSortOrder(e.target.value as 'asc' | 'desc')
                }
                aria-label="Sort Order"
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="desc">Top First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase">
              Source Filter
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => onChangeSourceFilter(e.target.value)}
              aria-label="Source Filter"
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-600 focus:outline-none"
            >
              {LEAD_SOURCE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
                onChangeFilters({
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
                onChangeFilters({
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

