import React from 'react';
import { SearchIcon, FilterIcon, RefreshCwIcon, ChevronDownIcon, XIcon } from '../../components/common/Icons';

interface TeamFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  totalResults: number;
}

export const TeamFilterBar: React.FC<TeamFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onReset,
  totalResults,
}) => {
  const hasActiveFilters = Boolean(search || (status && status !== 'ALL'));

  return (
    <section
      className="crm-filter-bar lg-card users-filter-bar"
      id="teams-filter-bar"
      aria-label="Team search and filters"
    >
      <div className="crm-filter-header">
        <div className="crm-filter-title-group">
          <div className="crm-filter-icon-badge">
            <FilterIcon size={15} />
          </div>
          <div className="crm-filter-heading">
            <span>Teams &amp; Hierarchy Controls</span>
            {hasActiveFilters && (
              <span className="crm-badge crm-badge-secondary">
                <span className="crm-badge-dot" />
                Filtered
              </span>
            )}
          </div>
        </div>

        <div className="crm-filter-actions">
          <span
            className="crm-badge crm-badge-neutral"
            style={{ fontSize: '11px', fontWeight: 700, padding: '0.35rem 0.75rem' }}
          >
            {totalResults} {totalResults === 1 ? 'team' : 'teams'} found
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="auth-btn btn-secondary btn-size-small"
              title="Reset all filters"
              id="teams-filter-reset-btn"
            >
              <RefreshCwIcon size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      <div className="crm-filter-grid">
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="team-search-input">
            Search Teams
          </label>
          <div className="crm-filter-search-wrap">
            <SearchIcon size={15} className="crm-filter-search-icon" />
            <input
              type="search"
              id="team-search-input"
              placeholder="Search teams by name, slug, or scope..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="crm-filter-select crm-filter-search-input"
              aria-label="Search teams"
            />
            {search && (
              <button
                type="button"
                className="crm-filter-search-clear"
                onClick={() => onSearchChange('')}
                title="Clear search query"
              >
                <XIcon size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="team-status-filter">
            Status
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="team-status-filter"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="crm-filter-select"
              aria-label="Filter by Team Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <ChevronDownIcon size={14} className="crm-filter-chevron" />
          </div>
        </div>
      </div>
    </section>
  );
};
