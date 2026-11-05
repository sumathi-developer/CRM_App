import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { useAuth } from '../../context/AuthContext';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import {
  BriefcaseIcon,
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  ChevronDownIcon,
  GlobeIcon,
  SparklesIcon,
  PlusIcon,
} from '../common/Icons';

interface WorkspaceHeaderProps {
  onOpenSwitcher?: () => void;
  onOpenCreate?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ onOpenCreate }) => {
  const { currentWorkspace, myWorkspaces, userRoleInWorkspace, switchWorkspace, isSwitching } = useWorkspace();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isDropdownOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  const getInitials = (name?: string) => {
    if (!name) return 'OW';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Only list workspaces the user is an owner or member of, EXCEPT the current active workspace
  const otherWorkspaces = useMemo(() => {
    if (!Array.isArray(myWorkspaces)) return [];
    return myWorkspaces.filter((ws) => {
      if (!ws) return false;
      if (currentWorkspace?.id && ws.id === currentWorkspace.id) return false;
      if (
        currentWorkspace?.name &&
        ws.name &&
        ws.name.trim().toLowerCase() === currentWorkspace.name.trim().toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [myWorkspaces, currentWorkspace]);

  const handleSelectWorkspace = async (wsId: string) => {
    if (wsId === currentWorkspace?.id) {
      setIsDropdownOpen(false);
      return;
    }
    // Immediately close dropdown for instant feedback
    setIsDropdownOpen(false);
    try {
      setSwitchingId(wsId);
      await switchWorkspace(wsId);
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <>
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
                <h1 className="workspace-name">{currentWorkspace?.name || 'Onseclick Workspace'}</h1>
                <span className={`plan-pill pill-${(currentWorkspace?.plan || 'free').toLowerCase()}`}>
                  <SparklesIcon size={12} />
                  <span>{currentWorkspace?.plan || 'FREE'}</span>
                </span>
                <span className="status-pill-small">
                  {currentWorkspace?.status || 'ACTIVE'}
                </span>
              </div>

              <div className="workspace-meta-row">
                <span className="workspace-slug">@{currentWorkspace?.slug || 'onseclick'}</span>
                <span className="meta-dot">&bull;</span>
                <span className="workspace-role-pill">
                  <ShieldIcon size={12} />
                  <span>Your Role: {userRoleInWorkspace || 'OWNER'}</span>
                </span>
                {currentWorkspace?.timezone && (
                  <>
                    <span className="meta-dot">&bull;</span>
                    <span className="workspace-tz">
                      <GlobeIcon size={13} />
                      <span>{currentWorkspace.timezone} ({currentWorkspace.currency || 'USD'})</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className="workspace-header-actions"
            ref={dropdownRef}
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              className={`workspace-switcher-btn ${isDropdownOpen ? 'is-active' : ''}`}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              disabled={isSwitching}
              id="header-switch-workspace-btn"
              aria-expanded={isDropdownOpen}
            >
              <BriefcaseIcon size={16} />
              <span>{isSwitching ? 'Switching...' : 'Switch Workspace'}</span>
              <ChevronDownIcon
                size={14}
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div
                id="workspace-header-dropdown-menu"
                className="absolute right-0 bg-white border border-emerald-500/30 rounded-2xl shadow-2xl p-4.5 z-50 flex flex-col font-sans text-left box-border"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  marginTop: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid rgba(16, 185, 129, 0.35)',
                  boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.15)',
                  width: '330px',
                  padding: '16px',
                  boxSizing: 'border-box',
                  zIndex: 100,
                }}
              >
                <div
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2.5 select-none"
                  style={{
                    color: '#64748B',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                    marginBottom: '10px',
                  }}
                >
                  Workspaces ({otherWorkspaces.length})
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
                  {otherWorkspaces.length === 0 ? (
                    <div
                      className="text-xs text-slate-400 py-3 px-3 text-center rounded-xl bg-slate-50/60 border border-slate-100 select-none font-medium"
                      style={{
                        color: '#94A3B8',
                        fontSize: '12px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        textAlign: 'center',
                      }}
                    >
                      No other workspaces available
                    </div>
                  ) : (
                    otherWorkspaces.map((ws) => {
                      const isSwitchingThis = isSwitching && switchingId === ws.id;
                      const memberCount = ws._count?.members ?? ws.memberCount ?? 1;
                      const roleLabel =
                        ws.myRole ||
                        (ws.ownerId === user?.id ? 'OWNER' : 'MEMBER');

                      return (
                        <button
                          key={ws.id || ws.name}
                          type="button"
                          onClick={() => handleSelectWorkspace(ws.id)}
                          disabled={isSwitching}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-left select-none hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid rgba(0, 0, 0, 0.09)',
                            color: '#0F172A',
                            borderRadius: '11px',
                            minHeight: '50px',
                            padding: '10px 12px',
                            cursor: isSwitching ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                backgroundColor: '#E6F5EC',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#059669',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {getInitials(ws.name)}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 justify-center gap-1">
                              <span
                                className="text-xs font-bold text-slate-900 truncate leading-tight"
                                style={{ color: '#0F172A', fontSize: '13px', fontWeight: 700 }}
                              >
                                {ws.name || 'Workspace'}
                              </span>
                              <span
                                className="text-[11px] text-slate-500 truncate"
                                style={{ color: '#64748B', fontSize: '11px', fontWeight: 500 }}
                              >
                                {memberCount} member{memberCount !== 1 ? 's' : ''} • {roleLabel}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2.5 flex items-center">
                            {isSwitchingThis && (
                              <span
                                className="text-xs text-emerald-600 font-bold animate-pulse"
                                style={{ color: '#059669', fontSize: '11px' }}
                              >
                                Switching...
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Divider before Create Workspace */}
                <div
                  style={{
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    marginTop: '14px',
                    marginBottom: '12px',
                  }}
                />

                {/* + Create Workspace Button */}
                <button
                  type="button"
                  id="ws-header-dropdown-create-btn"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onOpenCreate) {
                      onOpenCreate();
                    } else {
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 rounded-lg border border-dashed border-emerald-500 hover:border-emerald-600 bg-[#F4FAF6] hover:bg-[#E6F5EC] text-emerald-700 text-xs font-bold transition cursor-pointer select-none"
                  style={{
                    height: '40px',
                    backgroundColor: '#F4FAF6',
                    border: '1.5px dashed #059669',
                    color: '#059669',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon size={16} className="text-[#059669] shrink-0" />
                  <span>Create Workspace</span>
                </button>
              </div>
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

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
