import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LockIcon,
  RefreshCwIcon,
  SettingsIcon,
  XIcon,
  MoreVerticalIcon,
  SearchIcon,
  ChevronRightIcon,
  UserIcon,
  PaletteIcon,
  BuildingIcon,
  SlidersIcon,
  TargetIcon,
  UsersIcon,
  TrophyIcon,
  TrendingUpIcon,
  CalendarIcon,
  BellIcon,
  MailIcon,
  ZapIcon,
  ShieldIcon,
  BriefcaseIcon,
} from '../../../components/common/Icons';
import {
  SETTINGS_NAV_LIST,
  SETTINGS_SCREEN_META,
} from '../settingsConstants';
import type { SettingsScreenSlug } from '../../../types/settings.types';

interface SettingsLayoutProps {
  screen: SettingsScreenSlug;
  isDirty?: boolean;
  canEdit: boolean;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  onSave?: () => void;
  onDiscard?: () => void;
  onResetDefaults?: () => void;
  isSaving?: boolean;
  children: React.ReactNode;
}

const GROUPS: Array<
  'Personal & Workspace' | 'CRM Modules' | 'Communications & Security'
> = ['Personal & Workspace', 'CRM Modules', 'Communications & Security'];

const SETTINGS_ICONS: Record<
  SettingsScreenSlug,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  account: UserIcon,
  profile: PaletteIcon,
  workspace: BuildingIcon,
  general: SlidersIcon,
  leads: TargetIcon,
  contacts: UsersIcon,
  companies: BuildingIcon,
  deals: TrophyIcon, // CRITICAL: Trophy icon for Deals!
  pipelines: TrendingUpIcon,
  activities: CalendarIcon,
  notifications: BellIcon,
  email: MailIcon,
  integrations: ZapIcon,
  security: ShieldIcon,
};

const GROUP_ICONS: Record<
  'Personal & Workspace' | 'CRM Modules' | 'Communications & Security',
  React.ComponentType<{ size?: number; className?: string }>
> = {
  'Personal & Workspace': BuildingIcon,
  'CRM Modules': BriefcaseIcon,
  'Communications & Security': ShieldIcon,
};

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  screen,
  canEdit,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  onResetDefaults,
  isSaving = false,
  children,
}) => {
  const meta = SETTINGS_SCREEN_META[screen] || SETTINGS_SCREEN_META.account;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const threeDotsBtnRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; right: number }>({
    top: 150,
    right: 24,
  });

  const updateDropdownPosition = () => {
    if (threeDotsBtnRef.current) {
      const rect = threeDotsBtnRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: Math.round(rect.bottom + 8),
        right: Math.max(16, Math.round(window.innerWidth - rect.right)),
      });
    }
  };

  useEffect(() => {
    if (!isSidebarOpen) return;
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isSidebarOpen]);

  // Lock body scroll and listen for Escape key when drawer is open
  useEffect(() => {
    if (!isSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  // Filter groups and items based on search input inside the drawer
  const filteredGroups = GROUPS.map((groupName) => {
    const items = SETTINGS_NAV_LIST.filter((item) => {
      if (item.group !== groupName) return false;
      if (!drawerSearch.trim()) return true;
      const q = drawerSearch.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
    return { groupName, items };
  }).filter((g) => g.items.length > 0);

  return (
    <div className="app-layout" id="settings-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            <h1 className="lg-title">
              <span className="lg-title-icon">
                <SettingsIcon size={22} />
              </span>
              <span>{meta.label}</span>
            </h1>
            <p className="lg-subtitle">{meta.subtitle}</p>
          </div>

          <div className="lg-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Auto-Save Realtime Status Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                background: isSaving
                  ? 'rgba(16, 185, 129, 0.08)'
                  : success
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(241, 245, 249, 0.9)',
                border: isSaving || success
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : '1px solid rgba(226, 232, 240, 0.9)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isSaving ? '#059669' : success ? '#10b981' : '#64748b',
                transition: 'all 0.2s ease',
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCwIcon size={13} className="animate-spin" style={{ color: '#10b981' }} />
                  <span>Saving...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircleIcon size={14} style={{ color: '#10b981' }} />
                  <span>Saved automatically</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon size={13} style={{ color: '#10b981' }} />
                  <span>Auto-save enabled</span>
                </>
              )}
            </div>

            {canEdit && onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                disabled={isSaving}
                className="lg-btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  height: '38px',
                  padding: '0 1rem',
                  borderRadius: '10px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCwIcon size={14} />
                <span>Reset Defaults</span>
              </button>
            )}

            {/* Three-Dot Menu Button to open Settings Directory Sidebar below it */}
            <button
              ref={threeDotsBtnRef}
              type="button"
              onClick={() => {
                updateDropdownPosition();
                setIsSidebarOpen((prev) => !prev);
              }}
              title="Open All Settings Directory"
              aria-label="Open settings directory menu"
              aria-expanded={isSidebarOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isSidebarOpen ? 'rgba(16, 185, 129, 0.18)' : '#ffffff',
                border: isSidebarOpen ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.28)',
                color: isSidebarOpen ? '#059669' : '#062e03',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <MoreVerticalIcon size={18} />
            </button>

            {!canEdit && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <LockIcon size={13} />
                <span>Read-Only</span>
              </span>
            )}
          </div>
        </header>

        {/* Alert Banners */}
        {error && (
          <div className="lg-alert-wrap">
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}
        {success && (
          <div className="lg-alert-wrap">
            <SuccessMessage message={success} onDismiss={onDismissSuccess} />
          </div>
        )}

        {/* Main Settings Form Container (Centered, spacious, auto-saved) */}
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <fieldset
              disabled={!canEdit || isSaving}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                border: 0,
                padding: 0,
                margin: 0,
              }}
            >
              {children}
            </fieldset>

            {/* Reusable Form Action Footer */}
            {canEdit && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  background: '#ffffff',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  borderRadius: '14px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                {onResetDefaults && (
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    disabled={isSaving}
                    className="lg-btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      height: '38px',
                      padding: '0 1.15rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <RefreshCwIcon size={14} />
                    <span>Restore Default {meta.shortLabel} Settings</span>
                  </button>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: '#059669',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircleIcon size={15} style={{ color: '#10b981' }} />
                  <span>Changes in {meta.label} are saved automatically in real-time</span>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Settings Drawer Sidebar Box (Opens below the Three-Dot button) */}
      {isSidebarOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="settings-drawer-backdrop"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside
              className="settings-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="All Settings Directory"
              style={{
                top: `${dropdownCoords.top}px`,
                right: `${dropdownCoords.right}px`,
                maxHeight: `calc(100vh - ${dropdownCoords.top}px - 24px)`,
              }}
            >
              <div className="settings-drawer-header">
                <div className="settings-drawer-title-box">
                  <div className="settings-drawer-icon">
                    <SettingsIcon size={20} />
                  </div>
                  <div>
                    <h3 className="settings-drawer-title">Settings Directory</h3>
                    <p className="settings-drawer-subtitle">
                      All Personal, CRM &amp; Security modules
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="settings-drawer-close-btn"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close settings directory"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <div className="settings-drawer-search">
                <div className="settings-drawer-search-box">
                  <SearchIcon
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#10b981',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search all settings modules..."
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    className="settings-drawer-search-input"
                    style={{
                      paddingLeft: '40px',
                      paddingRight: drawerSearch ? '34px' : '14px',
                    }}
                  />
                  {drawerSearch && (
                    <button
                      type="button"
                      onClick={() => setDrawerSearch('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                      title="Clear search"
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-drawer-body">
                {filteredGroups.map(({ groupName, items }) => {
                  const GroupIcon = GROUP_ICONS[groupName] || BuildingIcon;

                  return (
                    <div key={groupName} className="settings-nav-card" style={{ marginBottom: 0 }}>
                      <div className="settings-nav-group-header">
                        <GroupIcon size={14} style={{ color: '#10b981' }} />
                        <span>{groupName}</span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            color: '#065f46',
                            background: 'rgba(16, 185, 129, 0.12)',
                            padding: '1px 6px',
                            borderRadius: '9999px',
                          }}
                        >
                          {items.length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {items.map((item) => {
                          const isActiveItem = item.slug === screen;
                          const ItemIcon = SETTINGS_ICONS[item.slug] || SettingsIcon;

                          return (
                            <NavLink
                              key={item.slug}
                              to={item.path}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`settings-nav-item-link ${isActiveItem ? 'is-active-setting' : ''}`}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.65rem',
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                <div className="settings-nav-icon-box">
                                  <ItemIcon size={14} />
                                </div>
                                <span
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.label}
                                </span>
                              </div>

                              <ChevronRightIcon
                                size={14}
                                style={{
                                  opacity: isActiveItem ? 0.95 : 0.35,
                                  color: isActiveItem ? '#ffffff' : '#9ca3af',
                                  transition: 'all 0.15s ease',
                                }}
                              />
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="settings-drawer-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircleIcon size={13} style={{ color: '#10b981' }} />
                  <span>Auto-save enabled</span>
                </span>
                <button
                  type="button"
                  className="auth-btn btn-secondary btn-size-small"
                  onClick={() => setIsSidebarOpen(false)}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: '28px' }}
                >
                  Close
                </button>
              </div>
            </aside>
          </>,
          document.body,
        )}
    </div>
  );
};

