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
  DealsIcon,
  CalendarIcon,
  MailIcon,
  FileTextIcon,
  ZapIcon,
  PlusIcon,
  KeyRoundIcon,
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
    icon: <DealsIcon size={18} />,
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


interface SearchableModuleItem {
  id: string;
  title: string;
  category: string;
  path: string;
  keywords: string[];
  description: string;
  icon: React.ReactNode;
}

const SEARCHABLE_ITEMS: SearchableModuleItem[] = [
  // 1. Core Modules
  {
    id: 'home',
    title: 'Home',
    category: 'Core Module',
    path: '/dashboard',
    keywords: ['home', 'dashboard', 'overview', 'summary', 'main'],
    description: 'Executive KPI metrics, activity stream, and business overview',
    icon: <HomeIcon size={16} />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    category: 'Core Module',
    path: '/analytics',
    keywords: ['analytics', 'metrics', 'kpi', 'reports', 'charts', 'performance', 'insights', 'explorer'],
    description: 'Visual analytics, trends, and conversion funnels',
    icon: <BarChart2Icon size={16} />,
  },
  {
    id: 'workspaces',
    title: 'Workspace',
    category: 'Core Module',
    path: '/workspaces',
    keywords: ['workspace', 'workspaces', 'organization', 'tenant', 'enterprise'],
    description: 'Switch and manage enterprise workspaces and contexts',
    icon: <BriefcaseIcon size={16} />,
  },
  {
    id: 'users',
    title: 'Users & Teams',
    category: 'Core Module',
    path: '/users',
    keywords: ['users', 'teams', 'members', 'staff', 'employees', 'people', 'collaborators'],
    description: 'Manage team directory, invitations, and assigned groups',
    icon: <UsersIcon size={16} />,
  },
  {
    id: 'leads',
    title: 'Leads',
    category: 'Core Module',
    path: '/leads',
    keywords: ['leads', 'prospects', 'inquiries', 'sales leads', 'qualification'],
    description: 'Track, score, qualify, and convert new inbound prospects',
    icon: <TargetIcon size={16} />,
  },
  {
    id: 'contacts',
    title: 'Contacts',
    category: 'Core Module',
    path: '/contacts',
    keywords: ['contacts', 'clients', 'customers', 'people', 'directory', 'accounts'],
    description: 'Centralized directory of client relationships and stakeholders',
    icon: <UserIcon size={16} />,
  },
  {
    id: 'pipelines',
    title: 'Sales Pipeline',
    category: 'Core Module',
    path: '/pipelines',
    keywords: ['pipeline', 'sales pipeline', 'funnel', 'stages', 'kanban', 'sales stages'],
    description: 'Visual deal stages, probability forecasting, and opportunities',
    icon: <SlidersIcon size={16} />,
  },
  {
    id: 'deals',
    title: 'Deals',
    category: 'Core Module',
    path: '/deals',
    keywords: ['deals', 'revenue', 'won', 'lost', 'opportunities', 'sales value'],
    description: 'Manage active sales opportunities, contracts, and revenue',
    icon: <DealsIcon size={16} />,
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation',
    category: 'Core Module',
    path: '/lead-generation',
    keywords: ['lead generation', 'capture', 'forms', 'generation', 'inbound', 'automation'],
    description: 'Automated capture workflows, routing rules, and inbound engines',
    icon: <ZapIcon size={16} />,
  },

  // 2. Settings & Operations
  {
    id: 'roles',
    title: 'Roles & RBAC',
    category: 'Settings',
    path: '/roles',
    keywords: ['roles', 'rbac', 'permissions', 'access control', 'privileges', 'admin rights'],
    description: 'Define role-based granular permissions and access policies',
    icon: <ShieldIcon size={16} />,
  },
  {
    id: 'workspace-settings',
    title: 'Workspace Settings',
    category: 'Settings',
    path: '/workspaces/settings',
    keywords: ['workspace settings', 'company profile', 'domain', 'tenant config'],
    description: 'Configure workspace profile, branding, and domain configuration',
    icon: <BriefcaseIcon size={16} />,
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    category: 'Settings',
    path: '/audit-logs',
    keywords: ['audit logs', 'compliance', 'history', 'security log', 'system events'],
    description: 'Immutable record of security events, changes, and user actions',
    icon: <FileTextIcon size={16} />,
  },
  {
    id: 'activities',
    title: 'Activities & Tasks',
    category: 'Settings',
    path: '/activities',
    keywords: ['activities', 'tasks', 'to-do', 'follow-ups', 'events', 'calls', 'meetings'],
    description: 'Operational task assignments, call logs, and customer follow-ups',
    icon: <ActivityIcon size={16} />,
  },
  {
    id: 'calendar',
    title: 'Calendar & Scheduling',
    category: 'Settings',
    path: '/calendar',
    keywords: ['calendar', 'scheduling', 'agenda', 'meetings', 'appointments'],
    description: 'Schedule team appointments, customer demos, and timeline events',
    icon: <CalendarIcon size={16} />,
  },
  {
    id: 'communications',
    title: 'Communications & Inbox',
    category: 'Settings',
    path: '/communications',
    keywords: ['communications', 'email', 'inbox', 'messages', 'outreach', 'chat'],
    description: 'Unified customer correspondence, emails, and conversation threads',
    icon: <MailIcon size={16} />,
  },
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    category: 'Settings',
    path: '/custom-fields',
    keywords: ['custom fields', 'fields', 'attributes', 'schema', 'properties'],
    description: 'Extend entity models with custom fields, validations, and options',
    icon: <SlidersIcon size={16} />,
  },
  {
    id: 'tags',
    title: 'Tags & Labels',
    category: 'Settings',
    path: '/tags',
    keywords: ['tags', 'labels', 'categorization', 'tagging', 'badges'],
    description: 'Organize and segment records with custom color-coded labels',
    icon: <TagIcon size={16} />,
  },
  {
    id: 'general-settings',
    title: 'General Settings',
    category: 'Settings',
    path: '/settings',
    keywords: ['general settings', 'system preferences', 'configuration', 'defaults'],
    description: 'Manage system-wide defaults, localization, and preferences',
    icon: <SettingsIcon size={16} />,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'Preferences',
    path: '/settings/notifications',
    keywords: ['notifications', 'alerts', 'email alerts', 'bell', 'push notices'],
    description: 'Configure notification preferences and subscription triggers',
    icon: <BellIcon size={16} />,
  },
  {
    id: 'profile',
    title: 'Profile & Account',
    category: 'Preferences',
    path: '/profile',
    keywords: ['profile', 'account', 'my profile', 'me', 'personal information'],
    description: 'Update your display name, contact email, and avatar info',
    icon: <UserIcon size={16} />,
  },
  {
    id: 'change-password',
    title: 'Change Password',
    category: 'Preferences',
    path: '/change-password',
    keywords: ['change password', 'password', 'security', 'credentials', 'reset password'],
    description: 'Update security password with multi-factor verification',
    icon: <KeyRoundIcon size={16} />,
  },
  {
    id: 'sessions',
    title: 'Active Sessions',
    category: 'Preferences',
    path: '/sessions',
    keywords: ['sessions', 'devices', 'active logins', 'security tokens', 'ip address'],
    description: 'Review active browser sessions and connected devices',
    icon: <ShieldIcon size={16} />,
  },
  {
    id: 'help',
    title: 'Help & Support',
    category: 'Preferences',
    path: '/help',
    keywords: ['help', 'support', 'documentation', 'tickets', 'faqs', 'knowledgebase'],
    description: 'Get support assistance, view guides, and submit tickets',
    icon: <LifeBuoyIcon size={16} />,
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
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Automatically close settings flyout & search dropdown whenever navigating to any module
  useEffect(() => {
    setIsSettingsFlyoutOpen(false);
    setIsMobileSidebarOpen(false);
    setIsSearchDropdownOpen(false);
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

  // Close flyout & search dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchDropdownOpen) {
          setIsSearchDropdownOpen(false);
          searchInputRef.current?.blur();
        }
        if (isSettingsFlyoutOpen) {
          setIsSettingsFlyoutOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchDropdownOpen, isSettingsFlyoutOpen]);

  // Global Ctrl+K / Cmd+K focuses the inline search input directly in the search area
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMobileSidebarOpen(true);
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchFocused(true);
        if (sidebarSearchQuery.trim()) {
          setIsSearchDropdownOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarSearchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isSearchDropdownOpen) return;
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSearchDropdownOpen]);

  // Filtered search results when typing directly into search area
  const filteredSearchResults = useMemo(() => {
    const query = sidebarSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return SEARCHABLE_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    });
  }, [sidebarSearchQuery]);

  const handleSelectSearchResult = (item: SearchableModuleItem) => {
    navigate(item.path);
    setSidebarSearchQuery('');
    setIsSearchDropdownOpen(false);
    setIsMobileSidebarOpen(false);
    setIsSettingsFlyoutOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isSearchDropdownOpen && sidebarSearchQuery.trim()) {
        setIsSearchDropdownOpen(true);
        return;
      }
      setSelectedSearchIndex((prev) =>
        prev < filteredSearchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(filteredSearchResults.length - 1, 0)
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        isSearchDropdownOpen &&
        filteredSearchResults.length > 0 &&
        filteredSearchResults[selectedSearchIndex]
      ) {
        handleSelectSearchResult(filteredSearchResults[selectedSearchIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchDropdownOpen(false);
      searchInputRef.current?.blur();
    }
  };

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
    if (wsId === currentWorkspace?.id) {
      setIsWorkspaceDropdownOpen(false);
      return;
    }
    // Immediately close dropdown for instant feedback
    setIsWorkspaceDropdownOpen(false);
    try {
      setSwitchingWorkspaceId(wsId);
      await switchWorkspace(wsId);
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
                <div
                  className="ws-pill-icon"
                  style={
                    currentWorkspace?.avatar && currentWorkspace.avatar.startsWith('#')
                      ? { backgroundColor: currentWorkspace.avatar, background: currentWorkspace.avatar }
                      : { backgroundColor: '#30a46c', background: '#30a46c' }
                  }
                >
                  {currentWorkspace?.avatar && !currentWorkspace.avatar.startsWith('#') ? (
                    <img
                      src={currentWorkspace.avatar}
                      alt={currentWorkspace.name}
                    />
                  ) : (
                    <span>
                      {(currentWorkspace?.name || 'O').trim().charAt(0).toUpperCase()}
                    </span>
                  )}
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
                  className="absolute left-0 w-80 bg-white border border-emerald-500/30 rounded-2xl shadow-2xl p-4.5 z-50 flex flex-col font-sans text-left box-border"
                  style={{
                    top: 'calc(100% + 8px)',
                    marginTop: 0,
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
                        {currentWorkspace?._count?.members ?? currentWorkspace?.memberCount ?? 1} member
                        {(currentWorkspace?._count?.members ?? currentWorkspace?.memberCount ?? 1) !== 1 ? 's' : ''} •{' '}
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
            {/* Quick Search trigger button at top (focuses inline search area) */}
            <button
              type="button"
              className="topbar-search-trigger"
              onClick={() => {
                setIsMobileSidebarOpen(true);
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                if (sidebarSearchQuery.trim()) {
                  setIsSearchDropdownOpen(true);
                }
              }}
              title="Search modules (Ctrl+K)"
              aria-label="Search"
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
        {/* A. Quick Search directly typed in search area (No separate box/modal) */}
        <div className="sidebar-search-container" ref={searchContainerRef}>
          <div
            className={`sidebar-search-bar ${isSearchFocused ? 'is-focused' : ''}`}
            onClick={() => searchInputRef.current?.focus()}
            role="search"
          >
            <div className="search-bar-left">
              <SearchIcon size={15} className="search-bar-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="sidebar-search-inline-input"
                placeholder="Search"
                value={sidebarSearchQuery}
                onChange={(e) => {
                  setSidebarSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                  setSelectedSearchIndex(0);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (sidebarSearchQuery.trim()) {
                    setIsSearchDropdownOpen(true);
                  }
                }}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search modules"
                id="sidebar-search-input"
              />
            </div>
            {sidebarSearchQuery ? (
              <button
                type="button"
                className="sidebar-search-clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarSearchQuery('');
                  setIsSearchDropdownOpen(false);
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <XIcon size={12} />
              </button>
            ) : (
              <kbd className="search-bar-kbd">Ctrl K</kbd>
            )}
          </div>

          {/* Attached Dropdown Menu directly below Search Input */}
          {isSearchDropdownOpen && sidebarSearchQuery.trim().length > 0 && (
            <div className="sidebar-search-dropdown" role="listbox" id="sidebar-search-results-dropdown">
              {filteredSearchResults.length > 0 ? (
                <div className="sidebar-search-results-list">
                  {filteredSearchResults.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-search-result-item ${
                        selectedSearchIndex === index ? 'is-selected' : ''
                      }`}
                      onClick={() => handleSelectSearchResult(item)}
                      onMouseEnter={() => setSelectedSearchIndex(index)}
                      id={`search-result-${item.id}`}
                    >
                      <div className="result-item-icon-box">
                        {item.icon}
                      </div>
                      <div className="result-item-content">
                        <div className="result-item-title-row">
                          <span className="result-item-title">{item.title}</span>
                          <span className="result-item-category-pill">{item.category}</span>
                        </div>
                        {item.description && (
                          <span className="result-item-desc">{item.description}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="sidebar-search-not-found" id="sidebar-search-not-found">
                  <div className="not-found-icon-wrap">
                    <SearchIcon size={20} />
                  </div>
                  <span className="not-found-title">Not found</span>
                  <span className="not-found-subtitle">
                    No results match "{sidebarSearchQuery}"
                  </span>
                </div>
              )}
            </div>
          )}
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

      
    </>
  );
};

