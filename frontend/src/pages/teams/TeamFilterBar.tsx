import React from 'react';
import { SearchIcon, FilterIcon, RefreshCwIcon } from '../../components/common/Icons';

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
    <div className="users-filter-bar" id="teams-filter-bar">
      <div className="filter-search-box">
        <SearchIcon size={18} className="search-box-icon" />
        <input
          type="text"
          id="team-search-input"
          placeholder="Search teams by name, slug, or scope..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input-field"
          aria-label="Search teams"
        />
        {search && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange('')}
            title="Clear search query"
          >
            ×
          </button>
        )}
      </div>

      <div className="filter-controls-group">
        <div className="filter-select-wrap">
          <FilterIcon size={14} className="select-lead-icon" />
          <select
            id="team-status-filter"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="filter-select-field"
            aria-label="Filter by Team Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="filter-reset-btn"
            title="Reset all filters"
            id="teams-filter-reset-btn"
          >
            <RefreshCwIcon size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="filter-results-counter">
        <span className="results-badge">{totalResults}</span>
        <span className="results-label">{totalResults === 1 ? 'team found' : 'teams found'}</span>
      </div>
    </div>
  );
};
