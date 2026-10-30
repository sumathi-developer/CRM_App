import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { HELP_NAV_ITEMS, HELP_SCREENS_META } from '../helpSupportConstants';
import type { HelpScreenSlug } from '../../../types/help-support.types';
import { HelpCircleIcon, LifeBuoyIcon } from '../helpIcons';

interface HelpLayoutProps {
  screen: HelpScreenSlug;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const HelpLayout: React.FC<HelpLayoutProps> = ({
  screen,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const currentMeta = HELP_SCREENS_META[screen] || HELP_SCREENS_META.center;

  return (
    <div className="app-layout" id="help-support-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Subnav Bar */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Help and Support navigation tabs"
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Help & Support</span>
            <div className="lg-subnav-links">
              {HELP_NAV_ITEMS.map((item) => {
                const isRootCenter =
                  item.slug === 'center' &&
                  (location.pathname === '/help' ||
                    location.pathname === '/help/');
                return (
                  <NavLink
                    key={item.slug}
                    to={item.path}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive || isRootCenter ? 'is-active' : ''}`
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
        <header className="lg-header">
          <div className="lg-header-text">
            <div className="flex items-center gap-2">
              <h1 className="lg-title">
                <span className="lg-title-icon text-purple-600">
                  <LifeBuoyIcon size={22} />
                </span>
                <span>{currentMeta.label}</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                <HelpCircleIcon size={12} />
                <span>Knowledge Base</span>
              </span>
            </div>
            <p className="lg-subtitle">{currentMeta.description}</p>
          </div>
        </header>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4">
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}

        {success && (
          <div className="mb-4">
            <SuccessMessage message={success} onDismiss={onDismissSuccess} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
};

