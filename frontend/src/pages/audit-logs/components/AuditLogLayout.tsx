import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import {
  AUDIT_NAV_ITEMS,
  AUDIT_SCREENS_META,
} from '../auditLogConstants';
import type {
  AuditLogSummary,
  AuditScreenSlug,
} from '../../../types/audit-log.types';
import { AuditLogSummaryCards } from './AuditLogSummaryCards';
import { LockIcon, ShieldIcon } from '../../../components/common/Icons';

interface AuditLogLayoutProps {
  screen: AuditScreenSlug;
  summary: AuditLogSummary | null;
  isLoadingSummary: boolean;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const AuditLogLayout: React.FC<AuditLogLayoutProps> = ({
  screen,
  summary,
  isLoadingSummary,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const currentMeta = AUDIT_SCREENS_META[screen] || AUDIT_SCREENS_META.all;

  return (
    <div className="app-layout" id="audit-logs-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Subnav Bar */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Audit Logs navigation tabs"
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Audit Logs</span>
            <div className="lg-subnav-links">
              {AUDIT_NAV_ITEMS.map((item) => {
                const isRootAll =
                  item.slug === 'all' &&
                  (location.pathname === '/audit-logs' ||
                    location.pathname === '/audit-logs/');
                return (
                  <NavLink
                    key={item.slug}
                    to={item.path}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive || isRootAll ? 'is-active' : ''}`
                    }
                  >
                    <span>{item.shortLabel}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Page Header */}
        <header className="lg-header" style={{ marginBottom: '20px' }}>
          <div className="lg-header-text">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="lg-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span className="lg-title-icon" style={{ display: 'flex', alignItems: 'center', color: '#10B981' }}>
                  <ShieldIcon size={22} />
                </span>
                <span>{currentMeta.label}</span>
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  backgroundColor: '#EAF4ED',
                  padding: '3px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#062E03',
                }}
              >
                <LockIcon size={11} style={{ color: '#10B981' }} />
                <span>Read-Only Compliance</span>
              </span>
            </div>
            <p className="lg-subtitle" style={{ marginTop: '6px', color: '#475569' }}>
              {currentMeta.description}
            </p>
          </div>
        </header>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4">
            <ErrorMessage
              error={error}
              onDismiss={onDismissError}
            />
          </div>
        )}

        {success && (
          <div className="mb-4">
            <SuccessMessage message={success} onDismiss={onDismissSuccess} />
          </div>
        )}

        {/* High-Level Statistical KPI Summary Cards */}
        <AuditLogSummaryCards
          summary={summary}
          isLoading={isLoadingSummary}
        />

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
      </main>
    </div>
  );
};
