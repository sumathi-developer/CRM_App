import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { UsersIcon, ArrowLeftIcon, ChevronDownIcon, CheckIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { humanize } from '../../lead-generation/leadGenConstants';
import { contactFullName, contactStageTone } from '../contactConstants';
import type { Contact } from '../../../types/contact.types';

interface NavLinkItem {
  to: string;
  label: string;
  end?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  links: NavLinkItem[];
}

const CONTACTS_NAV_GROUPS: NavGroup[] = [
  {
    id: 'view',
    label: 'View',
    links: [
      { to: '/contacts', label: 'All Contacts', end: true },
      { to: '/contacts/my', label: 'My Contacts' },
      { to: '/contacts/list', label: 'Contact List' },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    links: [{ to: '/contacts/create', label: 'Create Contact' }],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    links: [
      { to: '/contacts/activities', label: 'Activities' },
      { to: '/contacts/notes', label: 'Notes' },
      { to: '/contacts/documents', label: 'Documents' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    links: [
      { to: '/contacts/import', label: 'Import' },
      { to: '/contacts/export', label: 'Export' },
    ],
  },
];

interface ContactsLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeContact?: Contact | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const ContactsLayout: React.FC<ContactsLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeContact,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [flashDismissed, setFlashDismissed] = useState(false);
  const successMessage = success || (flashDismissed ? null : flash) || null;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  const isLinkActive = (to: string, end?: boolean) => {
    if (end) {
      return location.pathname === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="app-layout" id="contacts-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation: Horizontal Dropdown Navigation */}
        <nav
          ref={navRef}
          className="lg-subnav ld-subnav ld-dropdown-nav"
          aria-label="Contacts module navigation"
        >
          {CONTACTS_NAV_GROUPS.map((group) => {
            const activeItem = group.links.find((l) => isLinkActive(l.to, l.end));
            const isGroupActive = Boolean(activeItem);
            const isOpen = openDropdown === group.id;

            return (
              <div key={group.id} className="ld-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`ld-nav-dropdown-trigger ${isGroupActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span className="ld-nav-dropdown-label">{group.label}</span>
                  {activeItem && (
                    <span className="ld-nav-dropdown-active-badge">
                      {activeItem.label}
                    </span>
                  )}
                  <ChevronDownIcon
                    size={14}
                    className={`ld-nav-dropdown-chevron ${isOpen ? 'is-open' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="ld-nav-dropdown-menu" role="menu">
                    {group.links.map((link) => {
                      const isActive = isLinkActive(link.to, link.end);
                      return (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          end={link.end}
                          className={`ld-nav-dropdown-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => setOpenDropdown(null)}
                          role="menuitem"
                        >
                          <span className="ld-nav-dropdown-item-label">{link.label}</span>
                          {isActive && (
                            <CheckIcon size={14} className="ld-nav-dropdown-check" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Active Contact Context Strip when inspecting a specific contact's sub-screen */}
        {activeContact && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to={`/contacts/${activeContact.id}`} className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>Contact Profile</span>
              </Link>
              <div className="ld-context-info">
                <strong>{contactFullName(activeContact)}</strong>
                <span className="lg-muted">
                  {activeContact.jobTitle
                    ? `${activeContact.jobTitle}${
                        activeContact.organization?.name
                          ? ` · ${activeContact.organization.name}`
                          : ''
                      }`
                    : activeContact.organization?.name || activeContact.email}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone={contactStageTone(activeContact.stage)}>
                  {humanize(activeContact.stage)}
                </Badge>
                {activeContact.department && (
                  <Badge tone="slate">{activeContact.department}</Badge>
                )}
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/contacts/${activeContact.id}`}
                end
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Details
              </NavLink>
              <NavLink
                to={`/contacts/${activeContact.id}/edit`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Edit
              </NavLink>
              <NavLink
                to={`/contacts/${activeContact.id}/activities`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Activities
              </NavLink>
              <NavLink
                to={`/contacts/${activeContact.id}/notes`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Notes
              </NavLink>
              <NavLink
                to={`/contacts/${activeContact.id}/documents`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Documents
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">{icon || <UsersIcon size={22} />}</span>
              <span>{title}</span>
            </h1>
            {subtitle && <p className="lg-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="lg-header-actions">{actions}</div>}
        </header>

        {/* Alert Banners */}
        {error && (
          <div className="lg-alert-wrap">
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}
        {successMessage && (
          <div className="lg-alert-wrap">
            <SuccessMessage
              message={successMessage}
              onDismiss={() => {
                setFlashDismissed(true);
                onDismissSuccess?.();
              }}
            />
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

