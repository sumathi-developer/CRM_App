import React, { useEffect, useState } from 'react';
import {
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  FilterIcon,
  ChevronDownIcon,
} from '../../../components/common/Icons';
import type { Option } from '../leadGenConstants';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  debounceMs?: number;
  label?: string;
}

/** Search box with debounced change propagation and standardized label. */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search records...',
  id = 'search-input-control',
  debounceMs = 350,
  label = 'Search Records',
}) => {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (local === value) return;
    const timer = window.setTimeout(() => onChange(local), debounceMs);
    return () => window.clearTimeout(timer);
  }, [local, value, onChange, debounceMs]);

  return (
    <div className="crm-filter-control lg-filter-control lg-search-control">
      {label && (
        <label className="crm-filter-label lg-filter-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="crm-filter-search-wrap lg-search">
        <SearchIcon size={15} className="crm-filter-search-icon lg-search-icon" />
        <input
          id={id}
          type="search"
          className="crm-filter-select crm-filter-search-input lg-search-input"
          placeholder={placeholder}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          aria-label={placeholder}
        />
        {local && (
          <button
            type="button"
            className="crm-filter-search-clear lg-search-clear"
            onClick={() => {
              setLocal('');
              onChange('');
            }}
            aria-label="Clear search"
          >
            <XIcon size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  allLabel?: string;
  id?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  options,
  onChange,
  allLabel = 'All',
  id,
}) => (
  <div className="crm-filter-control lg-filter-control lg-filter-select-wrap">
    {label && (
      <label className="crm-filter-label lg-filter-label" htmlFor={id}>
        {label}
      </label>
    )}
    <div className="crm-filter-select-wrap">
      <select
        id={id}
        className="crm-filter-select lg-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={14} className="crm-filter-chevron" />
    </div>
  </div>
);

interface FilterBarProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  title?: string;
  className?: string;
}

/** Standardized CRM Filter Bar with header controls and responsive grid. */
export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onRefresh,
  onReset,
  hasActiveFilters,
  title = 'Filters & Search Controls',
  className = '',
}) => (
  <section
    className={`crm-filter-bar lg-card lg-filter-bar ${className}`.trim()}
    aria-label="Filters and search controls"
  >
    <div className="crm-filter-header">
      <div className="crm-filter-title-group">
        <div className="crm-filter-icon-badge">
          <FilterIcon size={15} />
        </div>
        <div className="crm-filter-heading">
          <span>{title}</span>
          {hasActiveFilters && (
            <span className="crm-badge crm-badge-secondary">
              <span className="crm-badge-dot" />
              Active
            </span>
          )}
        </div>
      </div>
      <div className="crm-filter-actions lg-filter-actions">
        {hasActiveFilters && onReset && (
          <button
            type="button"
            className="crm-filter-action-btn crm-filter-reset-btn"
            onClick={onReset}
            title="Reset filters"
          >
            <XIcon size={13} />
            <span>Reset Filters</span>
          </button>
        )}
        {onRefresh && (
          <button
            type="button"
            className="crm-filter-action-btn crm-filter-refresh-btn"
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCwIcon size={14} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
    <div className="crm-filter-grid lg-filter-controls">{children}</div>
  </section>
);
