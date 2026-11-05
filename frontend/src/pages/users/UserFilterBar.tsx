import React from 'react';
import type { UserStatus, UserRole } from '../../types/user.types';
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  RefreshCwIcon,
  ChevronDownIcon,
} from '../../components/common/Icons';

interface UserFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: UserStatus | '';
  onStatusChange: (status: UserStatus | '') => void;
  roleId: string;
  onRoleChange: (roleId: string) => void;
  roles: UserRole[];
  onReset: () => void;
  totalUsers?: number;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  roleId,
  onRoleChange,
  roles,
  onReset,
  totalUsers,
}) => {
  const hasActiveFilters = Boolean(search || status || roleId);

  return (
    <section
      className="crm-filter-bar lg-card users-filter-bar"
      id="users-filter-bar"
      aria-label="User search and directory filters"
    >
      <div className="crm-filter-header">
        <div className="crm-filter-title-group">
          <div className="crm-filter-icon-badge">
            <FilterIcon size={15} />
          </div>
          <div className="crm-filter-heading">
            <span>User Directory &amp; RBAC Controls</span>
            {hasActiveFilters && (
              <span className="crm-badge crm-badge-secondary">
                <span className="crm-badge-dot" />
                Active
              </span>
            )}
          </div>
        </div>

        <div className="crm-filter-actions">
          {typeof totalUsers === 'number' && (
            <span
              className="crm-badge crm-badge-neutral"
              style={{ fontSize: '11px', fontWeight: 700, padding: '0.35rem 0.75rem' }}
            >
              {totalUsers} {totalUsers === 1 ? 'user' : 'users'}
            </span>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              className="auth-btn btn-secondary btn-size-small"
              onClick={onReset}
              id="btn-reset-user-filters"
              title="Reset all filters"
            >
              <RefreshCwIcon size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      <div className="crm-filter-grid">
        {/* Search */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="user-search-input">
            Search Users
          </label>
          <div className="crm-filter-search-wrap">
            <SearchIcon size={15} className="crm-filter-search-icon" />
            <input
              type="search"
              id="user-search-input"
              placeholder="Search by user name or email address..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="crm-filter-select crm-filter-search-input"
            />
            {search && (
              <button
                type="button"
                className="crm-filter-search-clear"
                onClick={() => onSearchChange('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <XIcon size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="user-filter-status">
            Account Status
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="user-filter-status"
              className="crm-filter-select"
              value={status}
              onChange={(e) => onStatusChange(e.target.value as UserStatus | '')}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <ChevronDownIcon size={14} className="crm-filter-chevron" />
          </div>
        </div>

        {/* Role Filter */}
        <div className="crm-filter-control">
          <label className="crm-filter-label" htmlFor="user-filter-role">
            Assigned Role
          </label>
          <div className="crm-filter-select-wrap">
            <select
              id="user-filter-role"
              className="crm-filter-select"
              value={roleId}
              onChange={(e) => onRoleChange(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={14} className="crm-filter-chevron" />
          </div>
        </div>
      </div>
    </section>
  );
};
