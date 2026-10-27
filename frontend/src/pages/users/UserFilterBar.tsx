import React from 'react';
import type { UserStatus, UserRole } from '../../types/user.types';
import { SearchIcon, FilterIcon, XIcon } from '../../components/common/Icons';

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
    <div className="users-filter-bar" id="users-filter-bar">
      <div className="users-search-box">
        <SearchIcon size={16} className="search-icon-adornment" />
        <input
          type="text"
          id="user-search-input"
          placeholder="Search by user name or email address..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="user-search-input"
        />
        {search && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange('')}
            title="Clear search"
            aria-label="Clear search"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>

      <div className="users-filter-controls">
        {/* Status Filter */}
        <div className="filter-select-wrapper">
          <label htmlFor="user-filter-status" className="sr-only">
            Filter by Status
          </label>
          <select
            id="user-filter-status"
            className="filter-select"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as UserStatus | '')}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="filter-select-wrapper">
          <label htmlFor="user-filter-role" className="sr-only">
            Filter by Role
          </label>
          <select
            id="user-filter-role"
            className="filter-select"
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
        </div>

        {/* Reset Action */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-filter-reset"
            onClick={onReset}
            id="btn-reset-user-filters"
          >
            <FilterIcon size={14} />
            <span>Reset</span>
          </button>
        )}

        {totalUsers !== undefined && (
          <div className="user-count-badge">
            <span>{totalUsers} {totalUsers === 1 ? 'User' : 'Users'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
