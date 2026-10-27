import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import {
  BriefcaseIcon,
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  ChevronDownIcon,
  GlobeIcon,
  SparklesIcon,
} from '../common/Icons';

interface WorkspaceHeaderProps {
  onOpenSwitcher?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ onOpenSwitcher }) => {
  const { currentWorkspace, userRoleInWorkspace, isSwitching } = useWorkspace();

  const getInitials = (name?: string) => {
    if (!name) return 'WS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="workspace-header-wrapper" id="workspace-header">
      <div className="workspace-header-top">
        <div className="workspace-identity">
          <div className="workspace-avatar-box" aria-hidden="true">
            {currentWorkspace?.avatar ? (
              <img src={currentWorkspace.avatar} alt={currentWorkspace.name} className="workspace-avatar-img" />
            ) : (
              <span className="workspace-avatar-text">{getInitials(currentWorkspace?.name)}</span>
            )}
          </div>

          <div className="workspace-info">
            <div className="workspace-title-row">
              <h1 className="workspace-name">{currentWorkspace?.name || 'Loading Workspace...'}</h1>
              <span className={`plan-pill pill-${(currentWorkspace?.plan || 'free').toLowerCase()}`}>
                <SparklesIcon size={12} />
                <span>{currentWorkspace?.plan || 'FREE'}</span>
              </span>
              <span className="status-pill-small">
                {currentWorkspace?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="workspace-meta-row">
              <span className="workspace-slug">@{currentWorkspace?.slug || 'slug'}</span>
              <span className="meta-dot">&bull;</span>
              <span className="workspace-role-pill">
                <ShieldIcon size={12} />
                <span>Your Role: {userRoleInWorkspace}</span>
              </span>
              {currentWorkspace?.timezone && (
                <>
                  <span className="meta-dot">&bull;</span>
                  <span className="workspace-tz">
                    <GlobeIcon size={13} />
                    <span>{currentWorkspace.timezone} ({currentWorkspace.currency || 'USD'})</span>
                  </span >
                </>
              )}
            </div>
          </div>
        </div>

        <div className="workspace-header-actions">
          {onOpenSwitcher ? (
            <button
              type="button"
              className="workspace-switcher-btn"
              onClick={onOpenSwitcher}
              disabled={isSwitching}
              id="header-switch-workspace-btn"
            >
              <BriefcaseIcon size={16} />
              <span>{isSwitching ? 'Switching...' : 'Switch Workspace'}</span>
              <ChevronDownIcon size={14} />
            </button>
          ) : (
            <Link to="/workspaces/switcher" className="workspace-switcher-btn" id="header-switch-workspace-link">
              <BriefcaseIcon size={16} />
              <span>Switch Workspace</span>
              <ChevronDownIcon size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Workspace Navigation Subtabs */}
      <nav className="workspace-subnav" aria-label="Workspace Sections">
        <NavLink
          to="/workspaces"
          end
          className={({ isActive }) => `workspace-subnav-link ${isActive ? 'is-active' : ''}`}
          id="tab-workspace-overview"
        >
          <BriefcaseIcon size={16} />
          <span>Overview</span>
        </NavLink>

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
