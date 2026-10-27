import React from 'react';
import type { TeamStatus, TeamMemberRole } from '../../types/team.types';
import { CrownIcon, UserIcon } from '../../components/common/Icons';

interface TeamStatusBadgeProps {
  status: TeamStatus | string;
  className?: string;
}

export const TeamStatusBadge: React.FC<TeamStatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || 'ACTIVE').toUpperCase();

  let styleClass = 'status-active';
  let label = 'Active';

  if (norm === 'INACTIVE') {
    styleClass = 'status-inactive';
    label = 'Inactive';
  } else if (norm === 'ARCHIVED') {
    styleClass = 'status-archived';
    label = 'Archived';
  }

  return (
    <span className={`team-status-badge ${styleClass} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
};

interface TeamMemberRoleBadgeProps {
  role: TeamMemberRole | string;
  className?: string;
}

export const TeamMemberRoleBadge: React.FC<TeamMemberRoleBadgeProps> = ({ role, className = '' }) => {
  const isLeader = (role || '').toUpperCase() === 'LEADER';

  return (
    <span className={`member-role-badge ${isLeader ? 'role-leader' : 'role-member'} ${className}`}>
      {isLeader ? (
        <>
          <CrownIcon size={12} />
          <span>Team Leader</span>
        </>
      ) : (
        <>
          <UserIcon size={12} />
          <span>Member</span>
        </>
      )}
    </span>
  );
};
