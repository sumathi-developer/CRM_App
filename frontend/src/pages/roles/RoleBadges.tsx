import React from 'react';
import { LockIcon, ShieldIcon } from '../../components/common/Icons';

interface SystemRoleBadgeProps {
  isSystem: boolean;
  className?: string;
}

export const SystemRoleBadge: React.FC<SystemRoleBadgeProps> = ({ isSystem, className = '' }) => {
  return (
    <span className={`system-role-badge ${isSystem ? 'is-system' : 'is-custom'} ${className}`}>
      {isSystem ? (
        <>
          <LockIcon size={12} />
          <span>System Role</span>
        </>
      ) : (
        <>
          <ShieldIcon size={12} />
          <span>Custom Role</span>
        </>
      )}
    </span>
  );
};

interface PermissionActionBadgeProps {
  action: string;
  className?: string;
}

export const PermissionActionBadge: React.FC<PermissionActionBadgeProps> = ({ action, className = '' }) => {
  const norm = (action || '').toUpperCase();

  let styleClass = 'action-manage';
  if (norm === 'READ') styleClass = 'action-read';
  else if (norm === 'CREATE') styleClass = 'action-create';
  else if (norm === 'UPDATE') styleClass = 'action-update';
  else if (norm === 'DELETE') styleClass = 'action-delete';

  return (
    <span className={`perm-action-tag ${styleClass} ${className}`}>
      {norm}
    </span>
  );
};
