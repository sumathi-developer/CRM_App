import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { ArrowLeftIcon, BriefcaseIcon } from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime } from '../../lead-generation/leadGenConstants';
import type { DocumentRecord } from '../../../types/document.types';
import {
  formatFileSize,
  getDocumentTypeBadgeInfo,
} from '../documentConstants';

interface NavGroup {
  label: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}

const DOCUMENTS_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Document Library',
    links: [
      { to: '/documents', label: 'All Documents', end: true },
      { to: '/documents/recent', label: 'Recent Documents' },
      { to: '/documents/shared', label: 'Shared Documents' },
      { to: '/documents/upload', label: 'Upload Document' },
    ],
  },
  {
    label: 'Workspace Tools',
    links: [
      { to: '/documents/preview', label: 'Document Preview' },
      { to: '/documents/editor', label: 'Document Editor' },
      { to: '/documents/sharing', label: 'Document Sharing' },
    ],
  },
];

interface DocumentsLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activeDocument?: DocumentRecord | null;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const DocumentsLayout: React.FC<DocumentsLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activeDocument,
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

  const badgeInfo = activeDocument
    ? getDocumentTypeBadgeInfo(activeDocument)
    : null;

  return (
    <div className="app-layout" id="documents-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Documents module navigation"
        >
          {DOCUMENTS_NAV_GROUPS.map((group) => (
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

        {/* Active Document Context Strip */}
        {activeDocument && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to="/documents" className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>All Documents</span>
              </Link>
              <div className="ld-context-info">
                <strong>
                  {activeDocument.displayTitle || activeDocument.originalName}
                </strong>
                <span className="lg-muted">
                  {formatFileSize(activeDocument.size)} · Uploaded{' '}
                  {formatDateTime(activeDocument.createdAt)} by{' '}
                  {activeDocument.uploadedBy?.name ||
                    activeDocument.uploadedBy?.email ||
                    'Team Member'}
                </span>
              </div>
              <div className="lg-badge-row">
                {badgeInfo && (
                  <Badge tone={badgeInfo.tone}>{badgeInfo.shortLabel}</Badge>
                )}
                {activeDocument.isShared && (
                  <Badge tone="green">Shared</Badge>
                )}
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/documents/${activeDocument.id}`}
                end
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Document Details
              </NavLink>
              <NavLink
                to={`/documents/${activeDocument.id}/preview`}
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Document Preview
              </NavLink>
              <NavLink
                to={`/documents/${activeDocument.id}/edit`}
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Document Editor
              </NavLink>
              <NavLink
                to={`/documents/${activeDocument.id}/sharing`}
                className={({ isActive }) =>
                  `ld-context-tab ${isActive ? 'is-active' : ''}`
                }
              >
                Document Sharing
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">
                {icon || <BriefcaseIcon size={22} />}
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

