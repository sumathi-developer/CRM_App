import React, { useState } from 'react';
import type {
  AuditLogQueryFilters,
  AuditScreenSlug,
} from '../../../types/audit-log.types';
import {
  AUDIT_ACTIONS_LIST,
  AUDIT_ENTITIES_LIST,
} from '../auditLogConstants';
import {
  ChevronDownIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersIcon,
  XIcon,
} from '../../../components/common/Icons';

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogQueryFilters;
  users: UserOption[];
  activeScreen?: AuditScreenSlug;
  isLoading: boolean;
  isExporting: boolean;
  onFilterChange: (updates: Partial<AuditLogQueryFilters>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onExport: (format: 'CSV' | 'JSON') => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  users,
  activeScreen: _activeScreen,
  isLoading,
  isExporting,
  onFilterChange,
  onResetFilters,
  onRefresh,
  onExport,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Quick date presets
  const handleDatePreset = (preset: 'today' | '7days' | '30days' | 'all') => {
    if (preset === 'all') {
      onFilterChange({ startDate: undefined, endDate: undefined, page: 1 });
      return;
    }

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();

    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (preset === '7days') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (preset === '30days') {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    onFilterChange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      page: 1,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.action ||
      filters.entityType ||
      filters.entityId ||
      filters.userId ||
      filters.status ||
      filters.startDate ||
      filters.endDate,
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6">
      {/* Top Row: Search Input + Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) =>
              onFilterChange({ search: e.target.value, page: 1 })
            }
            placeholder="Search by user name, email, action, or entity..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Advanced Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              isAdvancedOpen || hasActiveFilters
                ? 'border-purple-400 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersIcon size={14} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCwIcon
              size={14}
              className={isLoading ? 'animate-spin text-purple-600' : ''}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
            >
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              <ChevronDownIcon size={14} />
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExport('CSV');
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExport('JSON');
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as JSON (.json)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Presets Row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3 text-xs">
        <span className="font-semibold text-gray-500 mr-1">Date Range:</span>
        <button
          type="button"
          onClick={() => handleDatePreset('all')}
          className={`rounded-full px-2.5 py-1 font-medium transition ${
            !filters.startDate && !filters.endDate
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Time
        </button>
        <button
          type="button"
          onClick={() => handleDatePreset('today')}
          className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 hover:bg-gray-200"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleDatePreset('7days')}
          className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 hover:bg-gray-200"
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => handleDatePreset('30days')}
          className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 hover:bg-gray-200"
        >
          Last 30 Days
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
          >
            <XIcon size={12} />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      {isAdvancedOpen && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* User Filter */}
            <div>
              <label
                htmlFor="audit-filter-user"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                User / Actor
              </label>
              <select
                id="audit-filter-user"
                value={filters.userId || ''}
                onChange={(e) =>
                  onFilterChange({ userId: e.target.value || undefined, page: 1 })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">All Users & System</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Event / Action Filter */}
            <div>
              <label
                htmlFor="audit-filter-action"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                Event Type
              </label>
              <select
                id="audit-filter-action"
                value={filters.action || ''}
                onChange={(e) =>
                  onFilterChange({
                    action: e.target.value || undefined,
                    page: 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">All Event Types</option>
                {AUDIT_ACTIONS_LIST.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label} ({act.value})
                  </option>
                ))}
              </select>
            </div>

            {/* Record / Entity Filter */}
            <div>
              <label
                htmlFor="audit-filter-entity"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                Record Category
              </label>
              <select
                id="audit-filter-entity"
                value={filters.entityType || ''}
                onChange={(e) =>
                  onFilterChange({
                    entityType: e.target.value || undefined,
                    page: 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {AUDIT_ENTITIES_LIST.map((ent) => (
                  <option key={ent.value} value={ent.value}>
                    {ent.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="audit-filter-status"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                Execution Status
              </label>
              <select
                id="audit-filter-status"
                value={filters.status || ''}
                onChange={(e) =>
                  onFilterChange({
                    status: e.target.value || undefined,
                    page: 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILURE">Failed Only</option>
                <option value="WARNING">Warning Only</option>
              </select>
            </div>

            {/* Start Date Custom */}
            <div>
              <label
                htmlFor="audit-filter-start-date"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                From Date
              </label>
              <input
                id="audit-filter-start-date"
                type="date"
                value={
                  filters.startDate ? filters.startDate.substring(0, 10) : ''
                }
                onChange={(e) =>
                  onFilterChange({
                    startDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                    page: 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* End Date Custom */}
            <div>
              <label
                htmlFor="audit-filter-end-date"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                To Date
              </label>
              <input
                id="audit-filter-end-date"
                type="date"
                value={filters.endDate ? filters.endDate.substring(0, 10) : ''}
                onChange={(e) =>
                  onFilterChange({
                    endDate: e.target.value
                      ? new Date(
                          `${e.target.value}T23:59:59.999Z`,
                        ).toISOString()
                      : undefined,
                    page: 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Specific Record UUID */}
            <div className="sm:col-span-2">
              <label
                htmlFor="audit-filter-record-id"
                className="block text-xs font-semibold uppercase text-gray-500 mb-1"
              >
                Specific Entity / Record ID
              </label>
              <input
                id="audit-filter-record-id"
                type="text"
                value={filters.entityId || ''}
                onChange={(e) =>
                  onFilterChange({
                    entityId: e.target.value || undefined,
                    page: 1,
                  })
                }
                placeholder="Target entity UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
