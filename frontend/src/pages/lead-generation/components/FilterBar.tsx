import React, { useEffect, useState } from 'react';
import { SearchIcon, XIcon, RefreshCwIcon } from '../../../components/common/Icons';
import type { Option } from '../leadGenConstants';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  debounceMs?: number;
}

/** Search box with debounced change propagation. */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  id,
  debounceMs = 350,
}) => {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (local === value) return;
    const timer = window.setTimeout(() => onChange(local), debounceMs);
    return () => window.clearTimeout(timer);
  }, [local, value, onChange, debounceMs]);

  return (
    <div className="lg-search">
      <SearchIcon size={16} className="lg-search-icon" />
      <input
        id={id}
        type="search"
        className="lg-search-input"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-label={placeholder}
      />
      {local && (
        <button
          type="button"
          className="lg-search-clear"
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          aria-label="Clear search"
        >
          <XIcon size={14} />
        </button>
      )}
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
  <label className="lg-filter-select" htmlFor={id}>
    <span className="lg-filter-label">{label}</span>
    <select id={id} className="lg-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

interface FilterBarProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

/** Wrapper row for search + filter controls. */
export const FilterBar: React.FC<FilterBarProps> = ({ children, onRefresh, onReset, hasActiveFilters }) => (
  <div className="lg-card lg-filter-bar">
    <div className="lg-filter-controls">{children}</div>
    <div className="lg-filter-actions">
      {hasActiveFilters && onReset && (
        <button type="button" className="lg-link-btn" onClick={onReset}>
          Reset filters
        </button>
      )}
      {onRefresh && (
        <button
          type="button"
          className="lg-icon-btn"
          onClick={onRefresh}
          title="Refresh"
          aria-label="Refresh"
        >
          <RefreshCwIcon size={16} />
        </button>
      )}
    </div>
  </div>
);
