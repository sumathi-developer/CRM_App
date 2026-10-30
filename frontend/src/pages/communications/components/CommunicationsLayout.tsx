import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { ArrowLeftIcon, MailIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime } from '../../lead-generation/leadGenConstants';
import type { EmailMessageItem } from '../../../types/communication.types';
import { emailStatusTone } from '../communicationConstants';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const COMMUNICATIONS_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Email & Folders',
    links: [
      { to: '/communications', label: 'Communication Center', end: true },
      { to: '/communications/emails', label: 'Emails', end: true },
      { to: '/communications/inbox', label: 'Email Inbox' },
      { to: '/communications/sent', label: 'Sent Emails' },
      { to: '/communications/compose', label: 'Compose Email' },
    ],
  },
  {
    label: 'Collaboration & Templates',
    links: [
      { to: '/communications/comments', label: 'Internal Comments' },
      { to: '/communications/mentions', label: 'Mentions' },
      { to: '/communications/history', label: 'Communication History' },
      { to: '/communications/templates', label: 'Templates' },
    ],
  },
];

interface CommunicationsLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeEmail?: EmailMessageItem | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const CommunicationsLayout: React.FC<CommunicationsLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeEmail,
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

  return (
    <div className="app-layout" id="communications-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Communications module navigation"
        >
          {COMMUNICATIONS_NAV_GROUPS.map((group) => (
            <div key={group.label} className="lg-subnav-group">
              <span className="lg-subnav-label">{group.label}</span>
              <div className="lg-subnav-links">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive ? 'is-active' : ''}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Active Email Context Strip */}
        {activeEmail && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to="/communications/emails" className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>All Emails</span>
              </Link>
              <div className="ld-context-info">
                <strong>{activeEmail.subject}</strong>
                <span className="lg-muted">
                  From: {activeEmail.senderName || activeEmail.sender} ·{' '}
                  {formatDateTime(activeEmail.createdAt)}
                </span>
              </div>
              <div className="lg-badge-row">
                <Badge tone="slate">{activeEmail.folder}</Badge>
                <Badge tone={emailStatusTone(activeEmail.status)}>
                  {activeEmail.status}
                </Badge>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/communications/emails/${activeEmail.id}`}
                end
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Email Details & Thread
              </NavLink>
              {activeEmail.isDraft && (
                <NavLink
                  to={`/communications/compose?draftId=${activeEmail.id}`}
                  className={({ isActive }) =>
                    `ld-context-tab ${isActive ? 'is-active' : ''}`
                  }
                >
                  Edit Draft
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">
                {icon || <MailIcon size={22} />}
              </span>
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

