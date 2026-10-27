import React from 'react';
import { ShieldIcon } from '../common/Icons';

interface UserRoleBadgeProps {
  roleName?: string;
  className?: string;
  showIcon?: boolean;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  roleName = 'USER',
  className = '',
  showIcon = true,
}) => {
  const normalized = (roleName || 'USER').toUpperCase();
  const roleClass =
    normalized.includes('ADMIN') || normalized === 'OWNER'
      ? 'role-admin'
      : normalized.includes('MANAGE')
      ? 'role-manager'
      : normalized === 'USER' || normalized === 'MEMBER'
      ? 'role-user'
      : 'role-custom';

  return (
    <span className={`user-role-badge ${roleClass} ${className}`}>
      {showIcon && <ShieldIcon size={12} />}
      <span>{roleName}</span>
    </span>
  );
};
