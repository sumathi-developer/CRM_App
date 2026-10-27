import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import { Logo } from '../auth/Logo';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import {
  UserIcon,
  UsersIcon,
  KeyRoundIcon,
  MonitorIcon,
  LogOutIcon,
  ShieldIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  LockIcon,
} from './Icons';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

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

  const navLinks = [
    { label: 'Workspace', path: '/workspaces', icon: <BriefcaseIcon size={16} /> },
    { label: 'Users', path: '/users', icon: <UsersIcon size={16} /> },
    { label: 'Teams', path: '/teams', icon: <ShieldIcon size={16} /> },
    { label: 'Roles', path: '/roles', icon: <LockIcon size={16} /> },
    { label: 'Profile', path: '/profile', icon: <UserIcon size={16} /> },
    { label: 'Security', path: '/change-password', icon: <KeyRoundIcon size={16} /> },
    { label: 'Sessions', path: '/sessions', icon: <MonitorIcon size={16} /> },
  ];

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
      <header className="app-top-navbar" id="app-navbar">
        <div className="navbar-container">
          <div className="navbar-brand-section">
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

          <nav className="navbar-links" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/workspaces'
                  ? location.pathname.startsWith('/workspaces')
                  : item.path === '/users'
                  ? location.pathname.startsWith('/users')
                  : item.path === '/teams'
                  ? location.pathname.startsWith('/teams')
                  : item.path === '/roles'
                  ? location.pathname.startsWith('/roles')
                  : location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item-link ${isActive ? 'is-active' : ''}`}
                  id={`nav-link-${item.label.toLowerCase()}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

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

      {/* Global Workspace Switcher Modal */}
      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </>
  );
};
