import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import { Logo } from '../auth/Logo';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import {
  ActivityIcon,
  UserIcon,
  UsersIcon,
  LogOutIcon,
  ShieldIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LockIcon,
  SearchIcon,
  SlidersIcon,
  TagIcon,
  TargetIcon,
  TrendingUpIcon,
  MenuIcon,
  XIcon,
} from './Icons';

interface SubNavOption {
  label: string;
  path: string;
}

interface ModuleNavConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  basePath: string;
  subItems: SubNavOption[];
}

const CRM_MODULES: ModuleNavConfig[] = [
  {
    id: 'search',
    label: 'Global Search',
    icon: <SearchIcon size={18} />,
    basePath: '/search',
    subItems: [
      { label: 'Search All', path: '/search' },
      { label: 'Leads', path: '/search/leads' },
      { label: 'Contacts', path: '/search/contacts' },
      { label: 'Companies', path: '/search/companies' },
      { label: 'Deals', path: '/search/deals' },
      { label: 'Activities', path: '/search/activities' },
      { label: 'Documents', path: '/search/documents' },
      { label: 'Notes', path: '/search/notes' },
      { label: 'Users', path: '/search/users' },
    ],
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    icon: <BriefcaseIcon size={18} />,
    basePath: '/workspaces',
    subItems: [
      { label: 'Overview', path: '/workspaces' },
      { label: 'Switch Workspace', path: '/workspaces/switcher' },
      { label: 'Workspace Members', path: '/workspaces/members' },
      { label: 'Workspace Roles', path: '/workspaces/roles' },
      { label: 'Workspace Settings', path: '/workspaces/settings' },
    ],
  },
  {
    id: 'users-teams',
    label: 'Users & Teams',
    icon: <UsersIcon size={18} />,
    basePath: '/users',
    subItems: [
      { label: 'All Users', path: '/users' },
      { label: 'Invite User', path: '/users/invite' },
      { label: 'All Teams', path: '/teams' },
      { label: 'Create Team', path: '/teams/create' },
    ],
  },
  {
    id: 'roles',
    label: 'Roles & RBAC',
    icon: <LockIcon size={18} />,
    basePath: '/roles',
    subItems: [
      { label: 'All Roles', path: '/roles' },
      { label: 'Create Role', path: '/roles/create' },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: <TargetIcon size={18} />,
    basePath: '/leads',
    subItems: [
      { label: 'All Leads', path: '/leads' },
      { label: 'My Leads', path: '/leads/my' },
      { label: 'Lead List', path: '/leads/list' },
      { label: 'Lead Board', path: '/leads/board' },
      { label: 'Lead Table', path: '/leads/table' },
      { label: 'Create Lead', path: '/leads/create' },
      { label: 'Lead Assignment', path: '/leads/assignment' },
      { label: 'Lead Qualification', path: '/leads/qualification' },
      { label: 'Lead Scoring', path: '/leads/scoring' },
      { label: 'Lead Activities', path: '/leads/activities' },
      { label: 'Lead Notes', path: '/leads/notes' },
      { label: 'Lead Documents', path: '/leads/documents' },
      { label: 'Lead Import', path: '/leads/import' },
      { label: 'Lead Export', path: '/leads/export' },
      { label: 'Lead Conversion', path: '/leads/conversion' },
      { label: 'Lead Settings', path: '/leads/settings' },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: <UsersIcon size={18} />,
    basePath: '/contacts',
    subItems: [
      { label: 'All Contacts', path: '/contacts' },
      { label: 'My Contacts', path: '/contacts/my' },
      { label: 'Contact List', path: '/contacts/list' },
      { label: 'Contact Table', path: '/contacts/table' },
      { label: 'Create Contact', path: '/contacts/create' },
      { label: 'Contact Activities', path: '/contacts/activities' },
      { label: 'Contact Notes', path: '/contacts/notes' },
      { label: 'Contact Documents', path: '/contacts/documents' },
      { label: 'Contact Import', path: '/contacts/import' },
      { label: 'Contact Export', path: '/contacts/export' },
    ],
  },
  {
    id: 'pipelines',
    label: 'Sales Pipeline',
    icon: <TrendingUpIcon size={18} />,
    basePath: '/pipelines',
    subItems: [
      { label: 'Pipeline Overview', path: '/pipelines' },
      { label: 'Pipeline Board', path: '/pipelines/board' },
      { label: 'Pipeline List', path: '/pipelines/list' },
      { label: 'Pipeline Table', path: '/pipelines/table' },
      { label: 'Pipeline Selector', path: '/pipelines/selector' },
      { label: 'Pipeline Stages', path: '/pipelines/stages' },
      { label: 'Create Pipeline', path: '/pipelines/create' },
      { label: 'Stage Management', path: '/pipelines/stage-management' },
      { label: 'Stage Probability', path: '/pipelines/probability' },
      { label: 'Pipeline Settings', path: '/pipelines/settings' },
    ],
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: <BriefcaseIcon size={18} />,
    basePath: '/deals',
    subItems: [
      { label: 'All Deals', path: '/deals' },
      { label: 'My Deals', path: '/deals/my' },
      { label: 'Deal List', path: '/deals/list' },
      { label: 'Deal Board', path: '/deals/board' },
      { label: 'Deal Table', path: '/deals/table' },
      { label: 'Create Deal', path: '/deals/create' },
      { label: 'Won Deals', path: '/deals/won' },
      { label: 'Lost Deals', path: '/deals/lost' },
      { label: 'Deal Activities', path: '/deals/activities' },
      { label: 'Deal Notes', path: '/deals/notes' },
      { label: 'Deal Documents', path: '/deals/documents' },
      { label: 'Deal Settings', path: '/deals/settings' },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: <ActivityIcon size={18} />,
    basePath: '/activities',
    subItems: [
      { label: 'All Activities', path: '/activities' },
      { label: 'My Activities', path: '/activities/my' },
      { label: 'Tasks', path: '/activities/tasks' },
      { label: 'Calls', path: '/activities/calls' },
      { label: 'Meetings', path: '/activities/meetings' },
      { label: 'Follow-ups', path: '/activities/follow-ups' },
      { label: 'Emails', path: '/activities/emails' },
      { label: 'Completed Activities', path: '/activities/completed' },
      { label: 'Overdue Activities', path: '/activities/overdue' },
      { label: 'Create Activity', path: '/activities/create' },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <ActivityIcon size={18} />,
    basePath: '/calendar',
    subItems: [
      { label: 'Calendar', path: '/calendar' },
      { label: 'Day View', path: '/calendar/day' },
      { label: 'Week View', path: '/calendar/week' },
      { label: 'Month View', path: '/calendar/month' },
      { label: 'Schedule View', path: '/calendar/schedule' },
      { label: 'Create Event', path: '/calendar/create' },
      { label: 'Meeting Scheduling', path: '/calendar/meeting-scheduling' },
      { label: 'Reminders', path: '/calendar/reminders' },
    ],
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: <ActivityIcon size={18} />,
    basePath: '/communications',
    subItems: [
      { label: 'Communication Center', path: '/communications' },
      { label: 'Emails', path: '/communications/emails' },
      { label: 'Email Inbox', path: '/communications/inbox' },
      { label: 'Sent Emails', path: '/communications/sent' },
      { label: 'Compose Email', path: '/communications/compose' },
      { label: 'Internal Comments', path: '/communications/comments' },
      { label: 'Mentions', path: '/communications/mentions' },
      { label: 'Communication History', path: '/communications/history' },
      { label: 'Templates', path: '/communications/templates' },
    ],
  },
  {
    id: 'lead-generation',
    label: 'Lead Generation',
    icon: <TargetIcon size={18} />,
    basePath: '/lead-generation',
    subItems: [
      { label: 'Overview', path: '/lead-generation' },
      { label: 'Lead Sources', path: '/lead-generation/sources' },
      { label: 'Web Forms', path: '/lead-generation/forms' },
      { label: 'Form Builder', path: '/lead-generation/forms/create' },
      { label: 'Capture Forms', path: '/lead-generation/capture-forms' },
      { label: 'Manual Capture', path: '/lead-generation/manual-capture' },
      { label: 'Landing Page Leads', path: '/lead-generation/leads/landing-page' },
      { label: 'Campaign Leads', path: '/lead-generation/leads/campaign' },
      { label: 'Social Media Leads', path: '/lead-generation/leads/social' },
      { label: 'Website Leads', path: '/lead-generation/leads/website' },
      { label: 'Email Leads', path: '/lead-generation/leads/email' },
      { label: 'Referral Leads', path: '/lead-generation/leads/referral' },
      { label: 'Lead Scoring', path: '/lead-generation/scoring' },
      { label: 'Lead Qualification', path: '/lead-generation/qualification' },
      { label: 'Lead Routing', path: '/lead-generation/routing' },
      { label: 'Assignment Rules', path: '/lead-generation/assignment-rules' },
      { label: 'Generation Analytics', path: '/lead-generation/analytics' },
      { label: 'Source Analytics', path: '/lead-generation/analytics/sources' },
    ],
  },
  {
    id: 'custom-fields',
    label: 'Custom Fields',
    icon: <SlidersIcon size={18} />,
    basePath: '/custom-fields',
    subItems: [
      { label: 'All Fields', path: '/custom-fields' },
      { label: 'Create Custom Field', path: '/custom-fields/create' },
    ],
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: <TagIcon size={18} />,
    basePath: '/tags',
    subItems: [
      { label: 'All Tags', path: '/tags' },
      { label: 'Create Tag', path: '/tags/create' },
      { label: 'Tag Usage', path: '/tags/usage' },
    ],
  },
  {
    id: 'account',
    label: 'Account & Security',
    icon: <UserIcon size={18} />,
    basePath: '/profile',
    subItems: [
      { label: 'Profile Settings', path: '/profile' },
      { label: 'Change Password', path: '/change-password' },
      { label: 'Active Sessions', path: '/sessions' },
    ],
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

  // Determine active module based on current path
  const getActiveModuleId = (path: string): string => {
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/workspaces')) return 'workspaces';
    if (path.startsWith('/users') || path.startsWith('/teams')) return 'users-teams';
    if (path.startsWith('/roles')) return 'roles';
    if (path.startsWith('/leads')) return 'leads';
    if (path.startsWith('/contacts')) return 'contacts';
    if (path.startsWith('/pipelines')) return 'pipelines';
    if (path.startsWith('/deals')) return 'deals';
    if (path.startsWith('/activities')) return 'activities';
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/communications')) return 'communications';
    if (path.startsWith('/lead-generation')) return 'lead-generation';
    if (path.startsWith('/custom-fields')) return 'custom-fields';
    if (path.startsWith('/tags')) return 'tags';
    if (path === '/profile' || path === '/change-password' || path === '/sessions') return 'account';
    return '';
  };

  const currentModuleId = getActiveModuleId(location.pathname);

  // Open modules state
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const initialId = getActiveModuleId(location.pathname);
    return initialId ? { [initialId]: true } : { workspaces: true };
  });

  // Automatically keep current module open on route change
  useEffect(() => {
    if (currentModuleId) {
      setOpenModules((prev) => ({
        ...prev,
        [currentModuleId]: true,
      }));
    }
    // Close mobile drawer on route change
    setIsMobileSidebarOpen(false);
  }, [location.pathname, currentModuleId]);

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
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
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* 1. TOP NAVBAR (Clean, fixed, uncrowded header) */}
      <header className="app-top-navbar" id="app-navbar">
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

            <Logo size="small" linkTo="/workspaces" showTagline={false} />

            {/* Active Workspace Selector Pill in Navbar */}
            <button
              type="button"
              className="navbar-workspace-pill"
              onClick={() => setIsSwitcherOpen(true)}
              title="Click to switch workspace context"
              id="navbar-workspace-switcher-trigger"
            >
              <div className="ws-pill-icon">
                <BriefcaseIcon size={14} />
              </div>
              <div className="ws-pill-details">
                <span className="ws-pill-label">WORKSPACE</span>
                <span className="ws-pill-name">{currentWorkspace?.name || 'Acme Workspace'}</span>
              </div>
              <ChevronDownIcon size={14} className="ws-pill-chevron" />
            </button>
          </div>

          <div className="navbar-user-section">
            <div className="user-profile-badge" title={user?.email || 'User'}>
              <div className="user-avatar-circle" aria-hidden="true">
                {getInitials(user?.name)}
              </div>
              <div className="user-meta-info">
                <span className="user-display-name">{user?.name || 'Authenticated User'}</span>
                <div className="user-role-row">
                  <span className="user-role-badge">
                    <ShieldIcon size={10} />
                    <span>{user?.role?.name || 'SALES_REP'}</span>
                  </span>
                  {user?.organization?.name && (
                    <span className="user-org-badge">{user.organization.name}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="navbar-logout-btn"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOutIcon size={16} />
              <span className="logout-btn-text">
                {isLoggingOut ? 'Logging out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. LEFT VERTICAL SIDEBAR WITH MODULE DROPDOWNS */}
      <aside
        className={`app-sidebar ${isMobileSidebarOpen ? 'is-mobile-open' : ''}`}
        id="app-sidebar"
        aria-label="Sidebar Navigation"
      >
        <div className="sidebar-header-label">
          <span>CRM Modules</span>
        </div>

        <nav className="sidebar-modules-list" aria-label="Modules Accordion">
          {CRM_MODULES.map((module) => {
            const isOpen = Boolean(openModules[module.id]);
            const isModuleActive = currentModuleId === module.id;

            return (
              <div
                key={module.id}
                className={`sidebar-module-card ${isModuleActive ? 'is-active-module' : ''} ${isOpen ? 'is-open' : ''}`}
              >
                {/* Module Header / Dropdown Trigger */}
                <button
                  type="button"
                  className="sidebar-module-trigger"
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isOpen}
                  id={`sidebar-module-${module.id}`}
                >
                  <div className="module-trigger-main">
                    <span className="module-trigger-icon">{module.icon}</span>
                    <span className="module-trigger-title">{module.label}</span>
                  </div>
                  <span className="module-trigger-chevron">
                    {isOpen ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                  </span>
                </button>

                {/* Subheadings Dropdown Menu */}
                {isOpen && (
                  <div className="sidebar-module-dropdown">
                    {module.subItems.map((sub) => {
                      const isSubActive =
                        sub.path === '/search' ||
                        sub.path === '/workspaces' ||
                        sub.path === '/leads' ||
                        sub.path === '/contacts' ||
                        sub.path === '/pipelines' ||
                        sub.path === '/deals' ||
                        sub.path === '/activities' ||
                        sub.path === '/calendar' ||
                        sub.path === '/communications' ||
                        sub.path === '/communications/emails' ||
                        sub.path === '/lead-generation' ||
                        sub.path === '/users' ||
                        sub.path === '/teams' ||
                        sub.path === '/roles' ||
                        sub.path === '/custom-fields' ||
                        sub.path === '/tags'
                          ? location.pathname === sub.path
                          : location.pathname.startsWith(sub.path);

                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`sidebar-subitem-link ${isSubActive ? 'is-active' : ''}`}
                          id={`sidebar-link-${sub.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        >
                          <span className="subitem-dot" aria-hidden="true" />
                          <span className="subitem-label">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Backdrop for sidebar drawer */}
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
