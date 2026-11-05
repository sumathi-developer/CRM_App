import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import { Logo } from '../auth/Logo';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { searchService } from '../../services/search.service';
import type { SearchResultItem } from '../../types/search.types';
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

interface SearchableModuleItem {
  id: string;
  title: string;
  category: string;
  path: string;
  keywords: string[];
  description: string;
  icon: React.ReactNode;
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

/* 3. Comprehensive Searchable Items Catalog (Modules & Other Items) */
const SEARCHABLE_ITEMS: SearchableModuleItem[] = [
  // 1. Core Modules
  {
    id: 'home',
    title: 'Home',
    category: 'Core Module',
    path: '/dashboard',
    keywords: ['home', 'dashboard', 'overview', 'summary', 'main'],
    description: 'Executive dashboard & business KPIs',
    icon: <HomeIcon size={16} />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    category: 'Core Module',
    path: '/analytics',
    keywords: ['analytics', 'metrics', 'kpi', 'reports', 'charts', 'performance', 'insights', 'explorer'],
    description: 'Cross-functional visual analytics and reports',
    icon: <BarChart2Icon size={16} />,
  },
  {
    id: 'workspace',
    title: 'Workspace',
    category: 'Core Module',
    path: '/workspaces',
    keywords: ['workspace', 'workspaces', 'organization', 'tenant', 'enterprise'],
    description: 'Switch and manage enterprise workspaces',
    icon: <BriefcaseIcon size={16} />,
  },
  {
    id: 'users',
    title: 'Users & Teams',
    category: 'Core Module',
    path: '/users',
    keywords: ['users', 'teams', 'members', 'staff', 'employees', 'people'],
    description: 'Team member directory & invitations',
    icon: <UsersIcon size={16} />,
  },
  {
    id: 'leads',
    title: 'Leads',
    category: 'Core Module',
    path: '/leads',
    keywords: ['leads', 'prospects', 'inquiries', 'sales leads', 'qualification'],
    description: 'Track, score, and qualify sales prospects',
    icon: <TargetIcon size={16} />,
  },
  {
    id: 'contacts',
    title: 'Contacts',
    category: 'Core Module',
    path: '/contacts',
    keywords: ['contacts', 'clients', 'customers', 'people', 'directory', 'accounts'],
    description: 'Directory of client relationships and stakeholders',
    icon: <UserIcon size={16} />,
  },
  {
    id: 'pipelines',
    title: 'Sales Pipeline',
    category: 'Core Module',
    path: '/pipelines',
    keywords: ['pipeline', 'sales pipeline', 'funnel', 'stages', 'kanban'],
    description: 'Visual deal stages and opportunity pipelines',
    icon: <SlidersIcon size={16} />,
  },
  {
    id: 'deals',
    title: 'Deals',
    category: 'Core Module',
    path: '/deals',
    keywords: ['deals', 'revenue', 'won', 'lost', 'opportunities', 'sales value'],
    description: 'Manage sales opportunities and revenue targets',
    icon: <DollarSignIcon size={16} />,
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation',
    category: 'Core Module',
    path: '/lead-generation',
    keywords: ['lead generation', 'capture', 'forms', 'generation', 'inbound', 'automation'],
    description: 'Automated capture workflows and routing rules',
    icon: <ZapIcon size={16} />,
  },

  // 2. Settings & Admin Sub-Modules
  {
    id: 'roles',
    title: 'Roles & RBAC',
    category: 'Settings & Admin',
    path: '/roles',
    keywords: ['roles', 'rbac', 'permissions', 'access control', 'privileges'],
    description: 'Granular permissions and access policies',
    icon: <ShieldIcon size={16} />,
  },
  {
    id: 'workspace-settings',
    title: 'Workspace Settings',
    category: 'Settings & Admin',
    path: '/workspaces/settings',
    keywords: ['workspace settings', 'company profile', 'domain', 'tenant config'],
    description: 'Configure workspace profile and domains',
    icon: <BriefcaseIcon size={16} />,
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    category: 'Settings & Admin',
    path: '/audit-logs',
    keywords: ['audit logs', 'compliance', 'history', 'security log', 'system events'],
    description: 'Immutable security log of user actions',
    icon: <FileTextIcon size={16} />,
  },
  {
    id: 'activities',
    title: 'Activities & Tasks',
    category: 'Settings & Admin',
    path: '/activities',
    keywords: ['activities', 'tasks', 'to-do', 'follow-ups', 'events', 'calls', 'meetings'],
    description: 'Task assignments and customer follow-ups',
    icon: <ActivityIcon size={16} />,
  },
  {
    id: 'calendar',
    title: 'Calendar & Scheduling',
    category: 'Settings & Admin',
    path: '/calendar',
    keywords: ['calendar', 'scheduling', 'agenda', 'meetings', 'appointments'],
    description: 'Schedule team appointments and timeline events',
    icon: <CalendarIcon size={16} />,
  },
  {
    id: 'communications',
    title: 'Communications & Inbox',
    category: 'Settings & Admin',
    path: '/communications',
    keywords: ['communications', 'email', 'inbox', 'messages', 'outreach', 'chat'],
    description: 'Unified customer emails and conversation threads',
    icon: <MailIcon size={16} />,
  },
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    category: 'Settings & Admin',
    path: '/custom-fields',
    keywords: ['custom fields', 'fields', 'attributes', 'schema', 'properties'],
    description: 'Extend entity models with custom fields',
    icon: <SlidersIcon size={16} />,
  },
  {
    id: 'tags',
    title: 'Tags & Labels',
    category: 'Settings & Admin',
    path: '/tags',
    keywords: ['tags', 'labels', 'categorization', 'tagging', 'badges'],
    description: 'Organize records with color-coded labels',
    icon: <TagIcon size={16} />,
  },
  {
    id: 'general-settings',
    title: 'General Settings',
    category: 'Settings & Admin',
    path: '/settings',
    keywords: ['general settings', 'system preferences', 'configuration', 'defaults', 'settings'],
    description: 'Manage system-wide defaults and preferences',
    icon: <SettingsIcon size={16} />,
  },

  // 3. Preferences & Security
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'Security & Preferences',
    path: '/settings/notifications',
    keywords: ['notifications', 'alerts', 'email alerts', 'bell', 'push notices'],
    description: 'Notification preferences and triggers',
    icon: <BellIcon size={16} />,
  },
  {
    id: 'profile',
    title: 'Profile & Account',
    category: 'Security & Preferences',
    path: '/profile',
    keywords: ['profile', 'account', 'my profile', 'me', 'personal information'],
    description: 'Update display name, email, and avatar',
    icon: <UserIcon size={16} />,
  },
  {
    id: 'change-password',
    title: 'Change Password',
    category: 'Security & Preferences',
    path: '/change-password',
    keywords: ['change password', 'password', 'security', 'credential'],
    description: 'Update password credentials',
    icon: <ShieldIcon size={16} />,
  },
  {
    id: 'sessions',
    title: 'Active Sessions',
    category: 'Security & Preferences',
    path: '/sessions',
    keywords: ['sessions', 'active sessions', 'devices', 'login history', 'security'],
    description: 'Review active devices and sessions',
    icon: <FileTextIcon size={16} />,
  },
  {
    id: 'help',
    title: 'Help & Support',
    category: 'Settings & Admin',
    path: '/help',
    keywords: ['help', 'support', 'docs', 'faqs', 'documentation', 'guide'],
    description: 'Knowledge base and support resources',
    icon: <LifeBuoyIcon size={16} />,
  },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');

  // Inline search state - type directly in the search area itself!
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [liveRecordResults, setLiveRecordResults] = useState<SearchResultItem[]>([]);
  const [isSearchingRecords, setIsSearchingRecords] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Filter modules based on search query typed directly in the search area
  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCHABLE_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Debounced search for live CRM records
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLiveRecordResults([]);
      setIsSearchingRecords(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingRecords(true);
        const res = await searchService.globalSearch({ q, limit: 4 });
        const items = Array.isArray(res?.results) ? res.results : [];
        setLiveRecordResults(items);
      } catch {
        setLiveRecordResults([]);
      } finally {
        setIsSearchingRecords(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalResultsCount = filteredModules.length + liveRecordResults.length;

  const handleSelectResult = (path: string) => {
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
    setIsSearchFocused(false);
    setIsMobileSidebarOpen(false);
    navigate(path);
  };

  // Keyboard navigation inside search results
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < totalResultsCount ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const allResults = [
        ...filteredModules.map((m) => m.path),
        ...liveRecordResults.map((r) =>
          r.url ||
          (r.entityType === 'LEADS'
            ? '/leads'
            : r.entityType === 'CONTACTS'
              ? '/contacts'
              : '/deals'),
        ),
      ];
      if (allResults.length > 0 && allResults[selectedIndex]) {
        handleSelectResult(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchDropdownOpen(false);
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Automatically close settings flyout and search on route change
  useEffect(() => {
    setIsSettingsFlyoutOpen(false);
    setIsMobileSidebarOpen(false);
    setIsSearchDropdownOpen(false);
  }, [location.pathname]);

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

  // Global Ctrl+K / Cmd+K listener to focus search area directly
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMobileSidebarOpen(true);
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchFocused(true);
        if (searchQuery.trim()) {
          setIsSearchDropdownOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchQuery]);

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
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(basePath);
  };

  // Filter settings groups based on search inside flyout
  const filteredSettingsGroups = useMemo(() => {
    if (!settingsSearchQuery.trim()) return SETTINGS_FLYOUT_GROUPS;
    const q = settingsSearchQuery.toLowerCase();
    return SETTINGS_FLYOUT_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [settingsSearchQuery]);

  return (
    <>
      {/* 1. TOP HORIZONTAL NAVIGATION BAR */}
      <header className="app-navbar" id="app-topbar">
        <div className="navbar-container">
          {/* Left section: Mobile menu toggle + Logo + Workspace Selector */}
          <div className="navbar-left-section">
            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              aria-label="Toggle Navigation Sidebar"
              id="sidebar-toggle-btn"
            >
              {isMobileSidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>

            <Link
              to="/dashboard"
              className="navbar-brand-link"
              title="Onseclick CRM - Go to Dashboard"
            >
              <Logo size="sm" showText={true} />
            </Link>

            {/* Workspace Selector Pill in Topbar */}
            <button
              type="button"
              className="workspace-pill-button"
              onClick={() => setIsSwitcherOpen(true)}
              title="Switch Workspace"
              id="topbar-workspace-switcher-btn"
            >
              <div className="ws-pill-icon">
                <BriefcaseIcon size={14} />
              </div>
              <div className="ws-pill-details">
                <span className="ws-pill-label">WORKSPACE</span>
                <span className="ws-pill-name">{currentWorkspace?.name || 'Onseclick Workspace'}</span>
              </div>
              <ChevronDownIcon size={14} className="ws-pill-chevron" />
            </button>
          </div>

          {/* Right Header Section: Quick Search Icon + Notification Bell */}
          <div className="navbar-right-section">
            {/* Topbar Search Icon button (Clicking focuses the search area) */}
            <button
              type="button"
              className="topbar-icon-action-btn"
              onClick={() => {
                setIsMobileSidebarOpen(true);
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                setIsSearchFocused(true);
                if (searchQuery.trim()) {
                  setIsSearchDropdownOpen(true);
                }
              }}
              title="Search Modules & Records (Ctrl+K)"
              aria-label="Search"
              id="topbar-global-search-btn"
            >
              <SearchIcon size={17} />
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
        {/* A. Search area in Sidebar: user types directly in the search area itself */}
        <div className="sidebar-search-container" ref={searchContainerRef}>
          <div
            className={`sidebar-search-bar ${isSearchFocused || searchQuery ? 'is-focused' : ''}`}
            onClick={() => searchInputRef.current?.focus()}
          >
            <div className="search-bar-left">
              <SearchIcon size={15} className="search-bar-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="sidebar-search-inline-input"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                  setSelectedIndex(0);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.trim()) {
                    setIsSearchDropdownOpen(true);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search modules and other items"
                autoComplete="off"
                id="sidebar-search-input"
              />
            </div>

            {searchQuery ? (
              <button
                type="button"
                className="sidebar-search-clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setIsSearchDropdownOpen(false);
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <XIcon size={13} />
              </button>
            ) : (
              <kbd className="search-bar-kbd">Ctrl K</kbd>
            )}
          </div>

          {/* Search Results Dropdown anchored directly below the search input */}
          {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
            <div
              className="sidebar-search-dropdown"
              id="sidebar-search-dropdown-menu"
              role="listbox"
            >
              {totalResultsCount > 0 ? (
                <div className="sidebar-search-results-list">
                  {/* Modules & Settings results */}
                  {filteredModules.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`sidebar-search-result-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectResult(item.path)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="result-item-icon-box">{item.icon}</div>
                        <div className="result-item-content">
                          <div className="result-item-title-row">
                            <span className="result-item-title">{item.title}</span>
                            <span className="result-item-category-pill">{item.category}</span>
                          </div>
                          <span className="result-item-desc">{item.description}</span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Live Records results (if any found) */}
                  {liveRecordResults.map((rec, rIdx) => {
                    const itemIdx = filteredModules.length + rIdx;
                    const isSelected = selectedIndex === itemIdx;
                    const targetUrl =
                      rec.url ||
                      (rec.entityType === 'LEADS'
                        ? '/leads'
                        : rec.entityType === 'CONTACTS'
                          ? '/contacts'
                          : '/deals');
                    return (
                      <button
                        key={rec.id || rIdx}
                        type="button"
                        className={`sidebar-search-result-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectResult(targetUrl)}
                        onMouseEnter={() => setSelectedIndex(itemIdx)}
                      >
                        <div className="result-item-icon-box">
                          <TargetIcon size={16} />
                        </div>
                        <div className="result-item-content">
                          <div className="result-item-title-row">
                            <span className="result-item-title">{rec.title}</span>
                            <span className="result-item-category-pill">Record</span>
                          </div>
                          {rec.subtitle && <span className="result-item-desc">{rec.subtitle}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : isSearchingRecords ? (
                <div className="sidebar-search-loading">
                  <div className="search-loading-spinner" />
                  <span>Searching...</span>
                </div>
              ) : (
                /* Not found view */
                <div className="sidebar-search-not-found" id="sidebar-search-not-found-state">
                  <div className="not-found-icon-wrap">
                    <SearchIcon size={20} />
                  </div>
                  <span className="not-found-title">Not found</span>
                  <span className="not-found-subtitle">
                    No modules or items matching &ldquo;{searchQuery}&rdquo;
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

      {/* Global Workspace Switcher Modal */}
      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </>
  );
};
