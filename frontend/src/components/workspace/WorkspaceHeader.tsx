import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import {
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
} from '../common/Icons';

interface WorkspaceHeaderProps {
  onOpenSwitcher?: () => void;
  onOpenCreate?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = () => {
  const { currentWorkspace } = useWorkspace();

  return (
    <div className="workspace-header-wrapper" id="workspace-header">
      {/* Workspace Navigation Subtabs */}
      <nav className="workspace-subnav" aria-label="Workspace Sections">
        <NavLink
          to="/workspaces/members"
          className={({ isActive }) => `workspace-subnav-link ${isActive ? 'is-active' : ''}`}
          id="tab-workspace-members"
        >
          <UsersIcon size={16} />
          <span>Members & Invites</span>
          {currentWorkspace?._count?.members !== undefined && (
            <span className="subnav-badge">{currentWorkspace._count.members}</span>
          )}
        </NavLink>

        <NavLink
          to="/workspaces/roles"
          className={({ isActive }) => `workspace-subnav-link ${isActive ? 'is-active' : ''}`}
          id="tab-workspace-roles"
        >
          <ShieldIcon size={16} />
          <span>Roles & Permissions</span>
          {currentWorkspace?._count?.roles !== undefined && (
            <span className="subnav-badge">{currentWorkspace._count.roles}</span>
          )}
        </NavLink>

        <NavLink
          to="/workspaces/settings"
          className={({ isActive }) => `workspace-subnav-link ${isActive ? 'is-active' : ''}`}
          id="tab-workspace-settings"
        >
          <SettingsIcon size={16} />
          <span>Workspace Settings</span>
        </NavLink>
      </nav>
    </div>
  );
};
