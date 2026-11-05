import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchIcon,
  XIcon,
  HomeIcon,
  BarChart2Icon,
  BriefcaseIcon,
  UsersIcon,
  TargetIcon,
  UserIcon,
  SlidersIcon,
  DollarSignIcon,
  ZapIcon,
  ShieldIcon,
  FileTextIcon,
  ActivityIcon,
  CalendarIcon,
  MailIcon,
  TagIcon,
  SettingsIcon,
  BellIcon,
  LifeBuoyIcon,
  KeyRoundIcon,
  MonitorIcon,
  SparklesIcon,
} from './Icons';
import { searchService } from '../../services/search.service';

interface SearchableItem {
  id: string;
  title: string;
  category: 'Core Module' | 'Settings & Admin' | 'Security & Preferences' | 'CRM Record';
  path: string;
  keywords: string[];
  description: string;
  icon: React.ReactNode;
}

const STATIC_SEARCHABLE_MODULES: SearchableItem[] = [
  // 1. Core CRM Modules
  {
    id: 'home',
    title: 'Home',
    category: 'Core Module',
    path: '/dashboard',
    keywords: ['home', 'dashboard', 'overview', 'summary', 'main'],
    description: 'Executive KPI metrics, activity stream, and business overview',
    icon: <HomeIcon size={18} />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    category: 'Core Module',
    path: '/analytics',
    keywords: ['analytics', 'metrics', 'kpi', 'reports', 'charts', 'performance', 'insights', 'explorer'],
    description: 'Cross-functional visual analytics, trends, and conversion funnels',
    icon: <BarChart2Icon size={18} />,
  },
  {
    id: 'workspace',
    title: 'Workspace',
    category: 'Core Module',
    path: '/workspaces',
    keywords: ['workspace', 'workspaces', 'organization', 'tenant', 'enterprise'],
    description: 'Switch and manage enterprise workspaces and contexts',
    icon: <BriefcaseIcon size={18} />,
  },
  {
    id: 'users',
    title: 'Users & Teams',
    category: 'Core Module',
    path: '/users',
    keywords: ['users', 'teams', 'members', 'staff', 'employees', 'people', 'collaborators'],
    description: 'Manage team member directory, invitations, and assigned groups',
    icon: <UsersIcon size={18} />,
  },
  {
    id: 'leads',
    title: 'Leads',
    category: 'Core Module',
    path: '/leads',
    keywords: ['leads', 'prospects', 'inquiries', 'sales leads', 'qualification'],
    description: 'Track, score, qualify, and convert new inbound prospects',
    icon: <TargetIcon size={18} />,
  },
  {
    id: 'contacts',
    title: 'Contacts',
    category: 'Core Module',
    path: '/contacts',
    keywords: ['contacts', 'clients', 'customers', 'people', 'directory', 'accounts'],
    description: 'Centralized directory of client relationships and stakeholders',
    icon: <UserIcon size={18} />,
  },
  {
    id: 'pipelines',
    title: 'Sales Pipeline',
    category: 'Core Module',
    path: '/pipelines',
    keywords: ['pipeline', 'sales pipeline', 'funnel', 'stages', 'kanban', 'sales stages'],
    description: 'Visual deal stages, probability forecasting, and opportunity tracking',
    icon: <SlidersIcon size={18} />,
  },
  {
    id: 'deals',
    title: 'Deals',
    category: 'Core Module',
    path: '/deals',
    keywords: ['deals', 'revenue', 'won', 'lost', 'opportunities', 'sales value'],
    description: 'Manage active sales opportunities, contracts, and revenue targets',
    icon: <DollarSignIcon size={18} />,
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation',
    category: 'Core Module',
    path: '/lead-generation',
    keywords: ['lead generation', 'capture', 'forms', 'generation', 'inbound', 'automation'],
    description: 'Automated capture workflows, routing rules, and inbound engines',
    icon: <ZapIcon size={18} />,
  },

  // 2. Settings & Admin Sub-Modules
  {
    id: 'roles',
    title: 'Roles & RBAC',
    category: 'Settings & Admin',
    path: '/roles',
    keywords: ['roles', 'rbac', 'permissions', 'access control', 'privileges', 'admin rights'],
    description: 'Define role-based granular permissions and access policies',
    icon: <ShieldIcon size={18} />,
  },
  {
    id: 'workspace-settings',
    title: 'Workspace Settings',
    category: 'Settings & Admin',
    path: '/workspaces/settings',
    keywords: ['workspace settings', 'company profile', 'domain', 'tenant config'],
    description: 'Configure workspace profile, branding, and domain configuration',
    icon: <BriefcaseIcon size={18} />,
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    category: 'Settings & Admin',
    path: '/audit-logs',
    keywords: ['audit logs', 'compliance', 'history', 'security log', 'system events'],
    description: 'Immutable record of security events, changes, and user actions',
    icon: <FileTextIcon size={18} />,
  },
  {
    id: 'activities',
    title: 'Activities & Tasks',
    category: 'Settings & Admin',
    path: '/activities',
    keywords: ['activities', 'tasks', 'to-do', 'follow-ups', 'events', 'calls', 'meetings'],
    description: 'Operational task assignments, call logs, and customer follow-ups',
    icon: <ActivityIcon size={18} />,
  },
  {
    id: 'calendar',
    title: 'Calendar & Scheduling',
    category: 'Settings & Admin',
    path: '/calendar',
    keywords: ['calendar', 'scheduling', 'agenda', 'meetings', 'appointments'],
    description: 'Schedule team appointments, customer demos, and timeline events',
    icon: <CalendarIcon size={18} />,
  },
  {
    id: 'communications',
    title: 'Communications & Inbox',
    category: 'Settings & Admin',
    path: '/communications',
    keywords: ['communications', 'email', 'inbox', 'messages', 'outreach', 'chat'],
    description: 'Unified customer correspondence, emails, and conversation threads',
    icon: <MailIcon size={18} />,
  },
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    category: 'Settings & Admin',
    path: '/custom-fields',
    keywords: ['custom fields', 'fields', 'attributes', 'schema', 'properties'],
    description: 'Extend entity models with custom fields, validations, and options',
    icon: <SlidersIcon size={18} />,
  },
  {
    id: 'tags',
    title: 'Tags & Labels',
    category: 'Settings & Admin',
    path: '/tags',
    keywords: ['tags', 'labels', 'categorization', 'tagging', 'badges'],
    description: 'Organize and segment records with custom color-coded labels',
    icon: <TagIcon size={18} />,
  },
  {
    id: 'general-settings',
    title: 'General Settings',
    category: 'Settings & Admin',
    path: '/settings',
    keywords: ['general settings', 'system preferences', 'configuration', 'defaults'],
    description: 'Manage system-wide defaults, localization, and preferences',
    icon: <SettingsIcon size={18} />,
  },

  // 3. Security & Preferences
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'Security & Preferences',
    path: '/settings/notifications',
    keywords: ['notifications', 'alerts', 'email alerts', 'bell', 'push notices'],
    description: 'Configure notification preferences and subscription triggers',
    icon: <BellIcon size={18} />,
  },
  {
    id: 'profile',
    title: 'Profile & Account',
    category: 'Security & Preferences',
    path: '/profile',
    keywords: ['profile', 'account', 'my profile', 'me', 'personal information'],
    description: 'Update your display name, contact email, and avatar info',
    icon: <UserIcon size={18} />,
  },
  {
    id: 'change-password',
    title: 'Change Password',
    category: 'Security & Preferences',
    path: '/change-password',
    keywords: ['change password', 'password', 'security', 'credentials', 'reset password'],
    description: 'Update security password with multi-factor verification',
    icon: <KeyRoundIcon size={18} />,
  },
  {
    id: 'sessions',
    title: 'Active Sessions',
    category: 'Security & Preferences',
    path: '/sessions',
    keywords: ['sessions', 'devices', 'active logins', 'security tokens', 'ip address'],
    description: 'Review signed-in devices, active browser sessions, and revoke access',
    icon: <MonitorIcon size={18} />,
  },
  {
    id: 'help',
    title: 'Help & Support',
    category: 'Security & Preferences',
    path: '/help',
    keywords: ['help', 'support', 'docs', 'documentation', 'faq', 'knowledge base'],
    description: 'User guides, onboarding documentation, and technical support',
    icon: <LifeBuoyIcon size={18} />,
  },
];

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveResults, setLiveResults] = useState<SearchableItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setLiveResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced live search across CRM records for "other stuffs"
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLiveResults([]);
      setIsLoadingLive(false);
      return;
    }

    let isMounted = true;
    setIsLoadingLive(true);

    const timer = setTimeout(async () => {
      try {
        const response = await searchService.globalSearch({
          q: trimmed,
          limit: 5,
        });

        if (!isMounted) return;

        const mapped: SearchableItem[] = (response.results || []).map((res) => ({
          id: `crm-${res.id}`,
          title: res.title || 'Untitled Record',
          category: 'CRM Record',
          path: res.url || '/workspaces',
          keywords: [res.title?.toLowerCase() || '', res.subtitle?.toLowerCase() || ''],
          description: res.subtitle || res.description || `${res.entityType} record`,
          icon: <SparklesIcon size={18} />,
        }));

        setLiveResults(mapped);
      } catch {
        // Silently ignore network/search errors so module navigation is uninterrupted
        if (isMounted) setLiveResults([]);
      } finally {
        if (isMounted) setIsLoadingLive(false);
      }
    }, 220);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Filter static modules & combine with live results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // When empty: show suggested core modules
      return STATIC_SEARCHABLE_MODULES.slice(0, 8);
    }

    const matchedStatic = STATIC_SEARCHABLE_MODULES.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
      );
    });

    // Combine matched modules with any live CRM records
    return [...matchedStatic, ...liveResults];
  }, [query, liveResults]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  // Keep highlighted item in view when using arrow keys
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('.is-highlighted-search-item');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchableItem) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="quick-search-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-search-input"
      onClick={onClose}
    >
      <div
        className="quick-search-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="quick-search-header">
          <div className="quick-search-icon-box">
            <SearchIcon size={18} className="quick-search-icon" />
          </div>
          <input
            ref={inputRef}
            id="quick-search-input"
            type="text"
            className="quick-search-input"
            placeholder="Type a module or search term (e.g. Leads, Analytics, Roles)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              className="quick-search-clear-btn"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              title="Clear search"
              aria-label="Clear search input"
            >
              <XIcon size={14} />
            </button>
          ) : (
            <kbd className="quick-search-kbd-pill">ESC</kbd>
          )}
          <button
            type="button"
            className="quick-search-close-btn"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close search"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Results Container */}
        <div className="quick-search-body" ref={listRef}>
          {filteredItems.length > 0 ? (
            <div className="quick-search-list" role="listbox">
              <div className="quick-search-section-label">
                {query.trim() ? (
                  <span>
                    Matching Results ({filteredItems.length})
                    {isLoadingLive && <span className="quick-search-loading-hint">Searching records...</span>}
                  </span>
                ) : (
                  <span>Suggested Modules & Navigation</span>
                )}
              </div>

              {filteredItems.map((item, idx) => {
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    className={`quick-search-item ${isHighlighted ? 'is-highlighted-search-item' : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="quick-search-item-left">
                      <div className="quick-search-item-icon-box">
                        {item.icon}
                      </div>
                      <div className="quick-search-item-text">
                        <div className="quick-search-item-title-row">
                          <span className="quick-search-item-title">{item.title}</span>
                          <span className={`quick-search-badge badge-${item.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                            {item.category}
                          </span>
                        </div>
                        <span className="quick-search-item-desc">{item.description}</span>
                      </div>
                    </div>
                    <div className="quick-search-item-right">
                      <span className="quick-search-item-enter-hint">↵ Jump</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* "Not Found" Clean State */
            <div className="quick-search-not-found" role="status">
              <div className="not-found-icon-wrap">
                <SearchIcon size={26} className="not-found-icon" />
              </div>
              <h4 className="not-found-title">Not found</h4>
              <p className="not-found-desc">
                No matching modules or records found for &ldquo;<strong>{query}</strong>&rdquo;
              </p>
              <div className="not-found-suggestions">
                <span className="not-found-hint-label">Try searching for:</span>
                <div className="not-found-tags">
                  {['Home', 'Leads', 'Contacts', 'Deals', 'Analytics', 'Settings', 'Users'].map((suggest) => (
                    <button
                      key={suggest}
                      type="button"
                      className="not-found-suggest-tag"
                      onClick={() => {
                        setQuery(suggest);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Footer Shortcuts */}
        <div className="quick-search-footer">
          <div className="quick-search-shortcuts">
            <span className="shortcut-item">
              <kbd>↑</kbd> <kbd>↓</kbd> to navigate
            </span>
            <span className="shortcut-item">
              <kbd>↵</kbd> to select
            </span>
            <span className="shortcut-item">
              <kbd>esc</kbd> to close
            </span>
          </div>
          <span className="quick-search-footer-brand">Onseclick CRM Quick Search</span>
        </div>
      </div>
    </div>
  );
};
