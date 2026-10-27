import React from 'react';
import { ShieldIcon } from '../../components/common/Icons';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface UserStatusBadgeProps {
  status: UserStatus | string;
  size?: 'small' | 'medium';
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, size = 'small' }) => {
  const normStatus = (status || 'ACTIVE').toUpperCase();

  const getStatusClass = () => {
    switch (normStatus) {
      case 'ACTIVE':
        return 'user-status-pill pill-active';
      case 'SUSPENDED':
        return 'user-status-pill pill-suspended';
      case 'INACTIVE':
      default:
        return 'user-status-pill pill-inactive';
    }
  };

  const getDotClass = () => {
    switch (normStatus) {
      case 'ACTIVE':
        return 'status-dot dot-active';
      case 'SUSPENDED':
        return 'status-dot dot-suspended';
      case 'INACTIVE':
      default:
        return 'status-dot dot-inactive';
    }
  };

  return (
    <span className={`${getStatusClass()} size-${size}`} role="status">
      <span className={getDotClass()} aria-hidden="true" />
      <span>{normStatus}</span>
    </span>
  );
};

interface UserRoleBadgeProps {
  roleName?: string | null;
  size?: 'small' | 'medium';
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ roleName, size = 'small' }) => {
  const name = (roleName || 'MEMBER').toUpperCase();

  const getRoleVariant = () => {
    if (name.includes('ADMIN') || name.includes('OWNER')) {
      return 'role-badge-admin';
    }
    if (name.includes('MANAGER') || name.includes('LEAD')) {
      return 'role-badge-manager';
    }
    if (name.includes('SALES')) {
      return 'role-badge-sales';
    }
    return 'role-badge-default';
  };

  return (
    <span className={`user-role-badge ${getRoleVariant()} size-${size}`}>
      <ShieldIcon size={size === 'small' ? 12 : 14} />
      <span>{name}</span>
    </span>
  );
};
