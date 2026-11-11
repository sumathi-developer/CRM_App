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
  const [activePreset, setActivePreset] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Quick date presets
  const handleDatePreset = (preset: 'today' | '7days' | '30days' | 'all') => {
    setActivePreset(preset);
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
    <div
      className="lg-card"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(16, 185, 129, 0.22)',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Row: Search Input + Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              zIndex: 2,
            }}
          >
            <SearchIcon size={17} />
          </div>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) =>
              onFilterChange({ search: e.target.value, page: 1 })
            }
            placeholder="Search by user name, email, action, or entity..."
            style={{
              width: '100%',
              height: '42px',
              paddingLeft: '42px',
              paddingRight: filters.search ? '38px' : '14px',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              backgroundColor: '#FFFFFF',
              color: '#062E03',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10B981';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '', page: 1 })}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Clear search"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Advanced Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '10px',
              border: isAdvancedOpen || hasActiveFilters
                ? '1px solid #10B981'
                : '1px solid rgba(16, 185, 129, 0.28)',
              backgroundColor: isAdvancedOpen || hasActiveFilters ? '#EAF4ED' : '#FFFFFF',
              color: '#062E03',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <SlidersIcon size={14} style={{ color: '#10B981' }} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '9999px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                !
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              backgroundColor: '#FFFFFF',
              color: '#062E03',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            title="Refresh logs"
          >
            <RefreshCwIcon
              size={14}
              className={isLoading ? 'animate-spin' : ''}
              style={{ color: '#10B981' }}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              style={{
                height: '42px',
                padding: '0 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.32)',
                transition: 'all 0.15s ease',
              }}
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
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '6px',
                    width: '180px',
                    borderRadius: '10px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                    padding: '4px',
                    zIndex: 20,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExport('CSV');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#062E03',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#EAF4ED';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Export as CSV (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExport('JSON');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#062E03',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#EAF4ED';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Export as JSON (.json)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Presets Row (Clean pills without black blobs) */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(16, 185, 129, 0.14)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
        }}
      >
        <span style={{ fontWeight: 600, color: '#062E03', marginRight: '4px' }}>
          Date Range:
        </span>
        {(
          [
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 Days' },
            { key: '30days', label: 'Last 30 Days' },
          ] as const
        ).map((item) => {
          const isPresetActive =
            item.key === 'all'
              ? !filters.startDate && !filters.endDate
              : activePreset === item.key && Boolean(filters.startDate);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleDatePreset(item.key)}
              style={{
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 600,
                border: isPresetActive
                  ? '1px solid #10B981'
                  : '1px solid rgba(16, 185, 129, 0.25)',
                backgroundColor: isPresetActive ? '#10B981' : '#F1F8F3',
                color: isPresetActive ? '#FFFFFF' : '#062E03',
                cursor: 'pointer',
                boxShadow: isPresetActive
                  ? '0 2px 6px rgba(16, 185, 129, 0.28)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setActivePreset('all');
              onResetFilters();
            }}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#10B981',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EAF4ED';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <XIcon size={12} />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      {isAdvancedOpen && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(16, 185, 129, 0.18)',
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* User Filter */}
            <div>
              <label
                htmlFor="audit-filter-user"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
              >
                User / Actor
              </label>
              <select
                id="audit-filter-user"
                value={filters.userId || ''}
                onChange={(e) =>
                  onFilterChange({ userId: e.target.value || undefined, page: 1 })
                }
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
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
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
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
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
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
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
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
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
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
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
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
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
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
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
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
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* End Date Custom */}
            <div>
              <label
                htmlFor="audit-filter-end-date"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
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
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Specific Record UUID */}
            <div className="sm:col-span-2">
              <label
                htmlFor="audit-filter-record-id"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#062E03',
                  marginBottom: '6px',
                }}
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
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  padding: '0 10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
