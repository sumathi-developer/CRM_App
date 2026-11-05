import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import { Logo } from '../auth/Logo';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal';
import {
  ActivityIcon,
  BarChart2Icon,
  UserIcon,
  UsersIcon,
  LogOutIcon,
  ShieldIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  SettingsIcon,
  SlidersIcon,
  TagIcon,
  TargetIcon,
  LifeBuoyIcon,
  MenuIcon,
  XIcon,
  HomeIcon,
  BellIcon,
  DollarSignIcon,
  CalendarIcon,
  MailIcon,
  FileTextIcon,
  ZapIcon,
  CheckIcon,
  PlusIcon,
} from './Icons';

interface NavModuleItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  basePath: string;
  badge?: string | number;
}

interface NeatSettingsGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: string | number;
  }[];
}

/* 1. Main Navigation Modules in Main Left Column (Clean, Uncluttered) */
const MAIN_MODULES: NavModuleItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <HomeIcon size={18} />,
    basePath: '/dashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart2Icon size={18} />,
    basePath: '/analytics',
  },
  {
    id: 'workspaces',
    label: 'Workspace',
    icon: <BriefcaseIcon size={18} />,
    basePath: '/workspaces',
  },
  {
    id: 'users-teams',
    label: 'Users & Teams',
    icon: <UsersIcon size={18} />,
    basePath: '/users',
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: <TargetIcon size={18} />,
    basePath: '/leads',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: <UserIcon size={18} />,
    basePath: '/contacts',
  },
  {
    id: 'pipelines',
    label: 'Sales Pipeline',
    icon: <SlidersIcon size={18} />,
    basePath: '/pipelines',
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: <DollarSignIcon size={18} />,
    basePath: '/deals',
  },
  {
    id: 'lead-generation',
    label: 'Lead Generation',
    icon: <ZapIcon size={18} />,
    basePath: '/lead-generation',
  },
];

/* 2. Remaining Modules inside Right-Side Settings Flyout Panel (Neat & Categorized) */
const SETTINGS_FLYOUT_GROUPS: NeatSettingsGroup[] = [
  {
    title: 'Governance & Access',
    items: [
      { id: 'roles', label: 'Roles & RBAC', icon: <ShieldIcon size={16} />, path: '/roles' },
      { id: 'workspace-settings', label: 'Workspace Settings', icon: <BriefcaseIcon size={16} />, path: '/workspaces/settings' },
      { id: 'audit-logs', label: 'Audit Logs', icon: <FileTextIcon size={16} />, path: '/audit-logs' },
    ],
  },
  {
    title: 'Activities & Operations',
    items: [
      { id: 'activities', label: 'Activities & Tasks', icon: <ActivityIcon size={16} />, path: '/activities' },
      { id: 'calendar', label: 'Calendar & Scheduling', icon: <CalendarIcon size={16} />, path: '/calendar' },
      { id: 'communications', label: 'Communications & Inbox', icon: <MailIcon size={16} />, path: '/communications' },
    ],
  },
  {
    title: 'Fields & Customization',
    items: [
      { id: 'custom-fields', label: 'Custom Fields', icon: <SlidersIcon size={16} />, path: '/custom-fields' },
      { id: 'tags', label: 'Tags & Labels', icon: <TagIcon size={16} />, path: '/tags' },
    ],
  },
  {
    title: 'System & Preferences',
    items: [
      { id: 'general-settings', label: 'General Settings', icon: <SettingsIcon size={16} />, path: '/settings' },
      { id: 'notifications', label: 'Notifications', icon: <BellIcon size={16} />, path: '/settings/notifications', badge: '1' },
      { id: 'account', label: 'Profile & Security', icon: <UserIcon size={16} />, path: '/profile' },
      { id: 'help', label: 'Help & Support', icon: <LifeBuoyIcon size={16} />, path: '/help' },
    ],
  },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentWorkspace, myWorkspaces, switchWorkspace, isSwitching } = useWorkspace();
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<string | null>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');

  // Check if current route is part of settings
  const isCurrentRouteInSettings = (pathname: string): boolean => {
    return (
      pathname.startsWith('/settings') ||
      pathname.startsWith('/roles') ||
      pathname.startsWith('/activities') ||
      pathname.startsWith('/calendar') ||
      pathname.startsWith('/communications') ||
      pathname.startsWith('/custom-fields') ||
      pathname.startsWith('/tags') ||
      pathname.startsWith('/audit-logs') ||
      pathname.startsWith('/help') ||
      pathname === '/profile' ||
      pathname === '/change-password' ||
      pathname === '/sessions' ||
      pathname.startsWith('/workspaces/settings') ||
      pathname.startsWith('/workspaces/roles')
    );
  };

  // Right-side Settings flyout panel open state (opens to the right of sidebar!)
  const [isSettingsFlyoutOpen, setIsSettingsFlyoutOpen] = useState<boolean>(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  // Automatically close settings flyout whenever navigating to any module
  useEffect(() => {
    setIsSettingsFlyoutOpen(false);
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isWorkspaceDropdownOpen) return;
      const target = e.target as Node;
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(target)
      ) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isWorkspaceDropdownOpen]);

  // Close workspace dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWorkspaceDropdownOpen) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkspaceDropdownOpen]);

  // Close flyout on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isSettingsFlyoutOpen) return;
      const target = e.target as Node;
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(target) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(target)
      ) {
        setIsSettingsFlyoutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSettingsFlyoutOpen]);

  // Close flyout on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsFlyoutOpen) {
        setIsSettingsFlyoutOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsFlyoutOpen]);

  // Global Ctrl+K / Cmd+K listener to trigger quick search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getWorkspaceInitial = (name?: any) => {
    if (!name || typeof name !== 'string') return 'W';
    const trimmed = name.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : 'W';
  };

  const switchableWorkspaces = useMemo(() => {
    if (!Array.isArray(myWorkspaces)) return [];
    return myWorkspaces.filter((ws) => {
      if (!ws) return false;
      // Exclude currently active workspace so user only sees other workspaces to switch to
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
    if (wsId === currentWorkspace?.id || isSwitching) {
      setIsWorkspaceDropdownOpen(false);
      return;
    }
    try {
      setSwitchingWorkspaceId(wsId);
      await switchWorkspace(wsId);
      setIsWorkspaceDropdownOpen(false);
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    } finally {
      setSwitchingWorkspaceId(null);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OC';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const isModuleActive = (basePath: string) => {
    if (basePath === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(basePath);
  };

  // Filtered settings for Search in Settings flyout
  const filteredSettingsGroups = useMemo(() => {
    if (!settingsSearchQuery.trim()) return SETTINGS_FLYOUT_GROUPS;
    const query = settingsSearchQuery.toLowerCase();
    return SETTINGS_FLYOUT_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(query)
      ),
    })).filter((group) => group.items.length > 0);
  }, [settingsSearchQuery]);

  return (
    <>
      {/* 1. TOP NAVBAR (Clean, fixed, uncrowded header with search icon & quick actions) */}
      <header className="app-top-navbar" id="app-navbar" role="banner">
        <div className="navbar-container">
          <div className="navbar-brand-section">
            {/* Sidebar toggle button (for mobile or toggle) */}
            <button
              type="button"
              className="navbar-sidebar-toggle-btn"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
              id="navbar-sidebar-toggle-btn"
            >
              {isMobileSidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>

            <Logo size="small" linkTo="/dashboard" showTagline={false} />

            {/* Active Workspace Selector Pill + Anchored Popover Dropdown */}
            <div
              className="relative inline-flex items-center"
              style={{ marginLeft: '16px' }}
              ref={workspaceDropdownRef}
            >
              <button
                type="button"
                className={`navbar-workspace-pill ${isWorkspaceDropdownOpen ? 'is-active' : ''}`}
                style={{ marginLeft: 0 }}
                onClick={() => setIsWorkspaceDropdownOpen((prev) => !prev)}
                title="Workspace Options"
                id="navbar-workspace-switcher-trigger"
                aria-expanded={isWorkspaceDropdownOpen}
              >
                <div className="ws-pill-icon">
                  <BriefcaseIcon size={14} />
                </div>
                <div className="ws-pill-details">
                  <span className="ws-pill-label">WORKSPACE</span>
                  <span className="ws-pill-name">{currentWorkspace?.name || 'Onseclick Workspace'}</span>
                </div>
                <ChevronDownIcon
                  size={14}
                  className={`ws-pill-chevron transition-transform duration-200 ${
                    isWorkspaceDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isWorkspaceDropdownOpen && (
                <div
                  id="navbar-workspace-dropdown-menu"
                  className="absolute top-full left-0 mt-2 w-80 bg-white border border-emerald-500/30 rounded-2xl shadow-2xl p-4.5 z-50 flex flex-col font-sans text-left box-border"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.15)',
                    width: '330px',
                    padding: '18px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 1. Active Workspace Header with clear separation below logo */}
                  <div
                    className="ws-dropdown-header flex items-center gap-3.5"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0 select-none"
                      style={{
                        width: '44px',
                        height: '44px',
                        minWidth: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                      }}
                      aria-hidden="true"
                    >
                      {getWorkspaceInitial(currentWorkspace?.name)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center gap-1">
                      <span
                        className="text-sm font-bold text-slate-900 leading-tight truncate"
                        style={{ color: '#0F172A', fontSize: '15px', fontWeight: 700 }}
                      >
                        {currentWorkspace?.name || 'Onseclick Workspace'}
                      </span>
                      <span
                        className="text-xs text-slate-500 font-medium truncate"
                        style={{ color: '#64748B', fontSize: '12px' }}
                      >
                        {currentWorkspace?._count?.members || currentWorkspace?.memberCount || 1} member
                        {(currentWorkspace?._count?.members || currentWorkspace?.memberCount || 1) !== 1 ? 's' : ''} •{' '}
                        {currentWorkspace?.plan === 'ENTERPRISE' ? 'Enterprise' : 'Free Forever'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Side-by-side Settings and People Actions */}
                  <div
                    className="ws-dropdown-actions grid grid-cols-2 gap-2.5"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '10px',
                      marginBottom: '14px',
                    }}
                  >
                    <button
                      type="button"
                      id="ws-dropdown-settings-btn"
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        navigate('/workspaces/settings');
                      }}
                      className="h-10 flex items-center justify-center gap-2 px-3 rounded-lg border border-emerald-500 bg-[#F4FAF6] hover:bg-[#E6F5EC] text-slate-800 text-xs font-bold transition cursor-pointer select-none"
                      style={{
                        height: '38px',
                        backgroundColor: '#F4FAF6',
                        border: '1.5px solid #10B981',
                        color: '#0F172A',
                        borderRadius: '9px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      <SettingsIcon size={16} className="text-[#059669] shrink-0" />
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      id="ws-dropdown-people-btn"
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        navigate('/workspaces/members');
                      }}
                      className="h-10 flex items-center justify-center gap-2 px-3 rounded-lg border border-emerald-500 bg-[#F4FAF6] hover:bg-[#E6F5EC] text-slate-800 text-xs font-bold transition cursor-pointer select-none"
                      style={{
                        height: '38px',
                        backgroundColor: '#F4FAF6',
                        border: '1.5px solid #10B981',
                        color: '#0F172A',
                        borderRadius: '9px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      <UsersIcon size={16} className="text-[#059669] shrink-0" />
                      <span>People</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div
                    className="ws-dropdown-divider"
                    style={{
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                      marginBottom: '12px',
                    }}
                  />

                  {/* 3. Workspaces List (Only displays workspaces user is not already in) */}
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
                    Workspaces ({switchableWorkspaces.length})
                  </div>

                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-0.5">
                    {switchableWorkspaces.length === 0 ? (
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
                        No other workspaces
                      </div>
                    ) : (
                      switchableWorkspaces.map((ws: any) => {
                        const isSwitchingThis = isSwitching && switchingWorkspaceId === ws.id;
                        const memberCount = ws._count?.members || ws?.memberCount || 1;
                        const roleLabel =
                          ws.myRole ||
                          (ws.ownerId === currentWorkspace?.ownerId ? 'OWNER' : 'MEMBER');

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
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
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
                                }}
                              >
                                {getWorkspaceInitial(ws.name)}
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

                  {/* Divider before Create Workspace with clean vertical clearance */}
                  <div
                    className="ws-dropdown-divider"
                    style={{
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                      marginTop: '14px',
                      marginBottom: '12px',
                    }}
                  />

                  {/* 4. Bottom Action: + Create Workspace with visible border */}
                  <button
                    type="button"
                    id="ws-dropdown-create-btn"
                    onClick={() => {
                      setIsWorkspaceDropdownOpen(false);
                      setIsCreateWorkspaceOpen(true);
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
                      marginTop: '2px',
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

          {/* Right Header Section: Quick Search trigger + Notification Quick Trigger */}
          <div className="navbar-right-section">
            {/* Quick Search trigger button at top */}
            <button
              type="button"
              className="topbar-search-trigger"
              onClick={() => setIsSearchModalOpen(true)}
              title="Quick Search Modules & Records (Ctrl+K)"
              aria-label="Quick Search"
              id="topbar-global-search-btn"
            >
              <SearchIcon size={16} />
              <span className="topbar-search-text">Search...</span>
              <kbd className="topbar-search-kbd">Ctrl K</kbd>
            </button>

            {/* Topbar Notification Bell */}
            <Link
              to="/settings/notifications"
              className="topbar-icon-action-btn"
              title="Notifications"
              aria-label="View notifications"
            >
              <BellIcon size={17} />
              <span className="topbar-unread-badge" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN LEFT SIDEBAR (Light Mint color from before - NOT black) */}
      <aside
        className={`app-sidebar ${isMobileSidebarOpen ? 'is-mobile-open' : ''}`}
        id="app-sidebar"
        aria-label="Sidebar Navigation"
      >
        {/* A. Quick Search at top of sidebar */}
        <div className="sidebar-search-container">
          <button
            type="button"
            className="sidebar-search-bar"
            title="Quick Search Modules & Records (Ctrl+K)"
            id="sidebar-search-input-btn"
            onClick={() => {
              setIsSearchModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
          >
            <div className="search-bar-left">
              <SearchIcon size={15} className="search-bar-icon" />
              <span className="search-bar-placeholder">Search</span>
            </div>
            <kbd className="search-bar-kbd">Ctrl K</kbd>
          </button>
        </div>

        {/* B. Main 9 CRM Modules in First Column */}
        <nav className="sidebar-modules-list" aria-label="Main CRM Modules">
          {MAIN_MODULES.map((module) => {
            const active = isModuleActive(module.basePath);
            return (
              <Link
                key={module.id}
                to={module.basePath}
                className={`sidebar-module-link ${active ? 'is-active-module' : ''}`}
                id={`sidebar-module-${module.id}`}
                title={module.label}
                onClick={() => {
                  setIsSettingsFlyoutOpen(false);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="module-link-main">
                  <span className="module-link-icon">{module.icon}</span>
                  <span className="module-link-title">{module.label}</span>
                </div>
                {module.badge && (
                  <span className="module-badge">{module.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* C. Bottom Section: Settings Link, User Profile, Notifications & Sign Out (Pinned down!) */}
        <div className="sidebar-bottom-section">
          {/* Settings Trigger: opens neat menu on the RIGHT */}
          <button
            ref={settingsBtnRef}
            type="button"
            className={`sidebar-module-link sidebar-settings-trigger ${isSettingsFlyoutOpen || isCurrentRouteInSettings(location.pathname) ? 'is-active-module' : ''}`}
            onClick={() => setIsSettingsFlyoutOpen((prev) => !prev)}
            title="Open Settings Menu"
            id="sidebar-settings-menu-btn"
          >
            <div className="module-link-main">
              <span className="module-link-icon">
                <SettingsIcon size={18} />
              </span>
              <span className="module-link-title">Settings</span>
            </div>
            <ChevronRightIcon
              size={14}
              className={`settings-chevron ${isSettingsFlyoutOpen ? 'is-open' : ''}`}
            />
          </button>

          {/* User Profile Card with Avatar, Name, Notifications and Sign Out */}
          <div className="sidebar-profile-card">
            <Link
              to="/profile"
              className="sidebar-profile-info"
              title={`Logged in as ${user?.name || 'Onseclick User'}`}
              onClick={() => {
                setIsSettingsFlyoutOpen(false);
                setIsMobileSidebarOpen(false);
              }}
            >
              <div className="sidebar-avatar-pill" aria-hidden="true">
                <span>{getInitials(user?.name)}</span>
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user?.name || 'Onseclick Admin'}</span>
                <span className="sidebar-user-meta">
                  {user?.role?.name ? user.role.name.toLowerCase() : 'admin'}
                </span>
              </div>
            </Link>

            <div className="sidebar-profile-actions">
              {/* Notification Bell with Red Badge */}
              <Link
                to="/settings/notifications"
                className="sidebar-action-btn notif-btn"
                title="Notifications (1 new)"
                aria-label="Notifications"
                onClick={() => {
                  setIsSettingsFlyoutOpen(false);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <BellIcon size={16} />
                <span className="sidebar-notif-badge">1</span>
              </Link>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="sidebar-action-btn logout-btn"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. RIGHT-SIDE SETTINGS FLYOUT PANEL (Opens neatly on the RIGHT of the sidebar) */}
      {isSettingsFlyoutOpen && (
        <>
          <div
            ref={flyoutRef}
            className="sidebar-settings-flyout"
            role="region"
            aria-label="Settings Submenu"
            id="sidebar-settings-flyout-panel"
          >
            {/* Flyout Header with Close Button */}
            <div className="settings-flyout-header">
              <div className="settings-flyout-title">
                <SettingsIcon size={18} />
                <span>Settings</span>
              </div>
              <button
                type="button"
                className="settings-flyout-close-btn"
                onClick={() => setIsSettingsFlyoutOpen(false)}
                title="Close settings menu"
                aria-label="Close settings menu"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Neat Search input */}
            <div className="settings-flyout-search">
              <div className="settings-search-input-box">
                <SearchIcon size={14} className="settings-search-icon" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={settingsSearchQuery}
                  onChange={(e) => setSettingsSearchQuery(e.target.value)}
                  className="settings-search-input"
                  aria-label="Search settings modules"
                />
                {settingsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSettingsSearchQuery('')}
                    className="settings-search-clear-btn"
                    title="Clear search"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Neat, Categorized Settings Modules */}
            <div className="settings-flyout-body">
              {filteredSettingsGroups.map((group) => (
                <div key={group.title} className="neat-settings-group">
                  <div className="neat-group-label">
                    <span>{group.title}</span>
                  </div>
                  <div className="neat-group-items">
                    {group.items.map((item) => {
                      const active =
                        location.pathname === item.path ||
                        (item.path !== '/settings' && location.pathname.startsWith(item.path));
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          className={`neat-settings-item ${active ? 'is-active-module' : ''}`}
                          id={`settings-item-${item.id}`}
                          title={item.label}
                          onClick={() => {
                            setIsSettingsFlyoutOpen(false);
                            setIsMobileSidebarOpen(false);
                          }}
                        >
                          <div className="neat-item-icon-box">
                            {item.icon}
                          </div>
                          <span className="neat-item-title">{item.label}</span>
                          {item.badge && (
                            <span className="neat-item-badge">{item.badge}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backdrop for mobile or quick outside click */}
          <div
            className="settings-flyout-backdrop"
            onClick={() => setIsSettingsFlyoutOpen(false)}
            aria-hidden="true"
          />
        </>
      )}

      {/* Mobile Backdrop for main sidebar drawer */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Create Workspace Modal Popup */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
      />

      {/* Global Workspace Switcher Modal */}
      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />

      {/* Global Quick Search & Module Palette Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};
