import React from 'react';
import type { UserStatus } from '../../types/user.types';

interface UserStatusBadgeProps {
  status?: UserStatus | string;
  className?: string;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  status = 'ACTIVE',
  className = '',
}) => {
  const normalized = (status || 'ACTIVE').toUpperCase();
  const statusClass =
    normalized === 'ACTIVE'
      ? 'status-active'
      : normalized === 'SUSPENDED'
      ? 'status-suspended'
      : 'status-inactive';

  return (
    <span className={`user-status-badge ${statusClass} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{normalized}</span>
    </span>
  );
};
