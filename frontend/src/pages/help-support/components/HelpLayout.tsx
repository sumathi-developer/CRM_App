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
        <style>{`
          #help-support-module-shell .app-main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 0 3.5rem;
            width: 100%;
          }

          /* Subnav Bar */
          #help-support-module-shell .lg-subnav {
            background-color: #FFFFFF !important;
            border: 1px solid rgba(16, 185, 129, 0.22) !important;
            border-radius: 14px !important;
            padding: 8px 14px !important;
            margin-bottom: 1.5rem !important;
            box-shadow: 0 1px 3px rgba(6, 46, 3, 0.04) !important;
            display: flex !important;
            align-items: center !important;
          }
          #help-support-module-shell .lg-subnav-group {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            flex-wrap: wrap !important;
          }
          #help-support-module-shell .lg-subnav-label {
            font-size: 11.5px !important;
            font-weight: 700 !important;
            color: #062E03 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            padding-right: 12px !important;
            border-right: 1px solid rgba(16, 185, 129, 0.25) !important;
          }
          #help-support-module-shell .lg-subnav-links {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: wrap !important;
          }
          #help-support-module-shell .lg-subnav-link {
            color: #062E03 !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            padding: 6px 14px !important;
            border-radius: 8px !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
            border: 1px solid transparent !important;
          }
          #help-support-module-shell .lg-subnav-link:hover {
            background-color: #EAF4ED !important;
            color: #10B981 !important;
            border-color: rgba(16, 185, 129, 0.2) !important;
          }
          #help-support-module-shell .lg-subnav-link.is-active {
            background-color: #10B981 !important;
            color: #FFFFFF !important;
            font-weight: 600 !important;
            border-color: #10B981 !important;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25) !important;
          }

          /* Header */
          #help-support-module-shell .lg-header {
            margin-bottom: 1.5rem !important;
          }
          #help-support-module-shell .lg-title {
            color: #062E03 !important;
            font-size: 24px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin: 0 0 4px !important;
          }
          #help-support-module-shell .lg-title-icon {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
            background-color: #EAF4ED !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
            color: #10B981 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #help-support-module-shell .help-knowledge-badge {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            border-radius: 9999px !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
            background-color: #EAF4ED !important;
            padding: 3px 10px !important;
            font-size: 11.5px !important;
            font-weight: 600 !important;
            color: #10B981 !important;
          }
          #help-support-module-shell .lg-subtitle {
            color: #64748B !important;
            font-size: 13px !important;
            margin: 0 !important;
          }
        `}</style>

        {/* Top Module Subnav Bar */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Help and Support navigation tabs"
        >
          <div className="lg-subnav-group">
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
            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="lg-title">
                <span className="lg-title-icon">
                  <LifeBuoyIcon size={20} />
                </span>
                <span>{currentMeta.label}</span>
              </h1>
              <span className="help-knowledge-badge">
                <HelpCircleIcon size={12} />
                <span>Knowledge Base</span>
              </span>
            </div>
            <p className="lg-subtitle">{currentMeta.description}</p>
          </div>
        </header>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}

        {success && (
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <SuccessMessage message={success} onDismiss={onDismissSuccess} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
};
