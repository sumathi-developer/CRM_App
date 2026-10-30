import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LockIcon,
  RefreshCwIcon,
  SettingsIcon,
  XIcon,
} from '../../../components/common/Icons';
import {
  SETTINGS_NAV_LIST,
  SETTINGS_SCREEN_META,
} from '../settingsConstants';
import type { SettingsScreenSlug } from '../../../types/settings.types';

interface SettingsLayoutProps {
  screen: SettingsScreenSlug;
  isDirty: boolean;
  canEdit: boolean;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onResetDefaults: () => void;
  isSaving?: boolean;
  children: React.ReactNode;
}

const GROUPS: Array<
  'Personal & Workspace' | 'CRM Modules' | 'Communications & Security'
> = ['Personal & Workspace', 'CRM Modules', 'Communications & Security'];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  screen,
  isDirty,
  canEdit,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  onSave,
  onDiscard,
  onResetDefaults,
  isSaving = false,
  children,
}) => {
  const location = useLocation();
  const meta = SETTINGS_SCREEN_META[screen] || SETTINGS_SCREEN_META.account;

  return (
    <div className="app-layout" id="settings-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Sub-Navigation Bar */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="CRM Settings top navigation"
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Settings</span>
            <div className="lg-subnav-links">
              {SETTINGS_NAV_LIST.map((item) => {
                const isRootAccount =
                  item.slug === 'account' && location.pathname === '/settings';
                return (
                  <NavLink
                    key={item.slug}
                    to={item.path}
                    className={({ isActive }) =>
                      `lg-subnav-link ${isActive || isRootAccount ? 'is-active' : ''}`
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
            <h1 className="lg-title">
              <span className="lg-title-icon">
                <SettingsIcon size={22} />
              </span>
              <span>{meta.label}</span>
              {isDirty && (
                <span className="ml-2 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  Unsaved Changes
                </span>
              )}
            </h1>
            <p className="lg-subtitle">{meta.subtitle}</p>
          </div>

          <div className="lg-header-actions">
            {canEdit ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onResetDefaults}
                  disabled={isSaving}
                  className="lg-btn lg-btn-secondary"
                >
                  <RefreshCwIcon size={14} />
                  <span>Reset Defaults</span>
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={onDiscard}
                    disabled={isSaving}
                    className="lg-btn lg-btn-secondary"
                  >
                    <XIcon size={14} />
                    <span>Cancel</span>
                  </button>
                )}
                <PrimaryButton
                  type="button"
                  fullWidth={false}
                  isLoading={isSaving}
                  loadingText="Saving..."
                  onClick={onSave}
                >
                  <CheckCircleIcon size={15} />
                  <span>Save Changes</span>
                </PrimaryButton>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <LockIcon size={13} />
                <span>Read-Only (Admin/Manager Required)</span>
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

        {/* Unsaved Changes Banner */}
        {isDirty && canEdit && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-xs text-amber-900"
            role="status"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircleIcon size={16} />
              <span>
                You have unsaved changes in <strong>{meta.label}</strong>. Save
                or discard before leaving.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDiscard}
                disabled={isSaving}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700"
              >
                {isSaving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Layout: Left Category Sidebar + Main Settings Form */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Settings Category Navigation (3 cols on lg) */}
          <aside
            className="space-y-4 lg:col-span-3"
            aria-label="Settings section directory"
          >
            {GROUPS.map((groupName) => {
              const groupItems = SETTINGS_NAV_LIST.filter(
                (item) => item.group === groupName,
              );
              return (
                <div
                  key={groupName}
                  className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs"
                >
                  <h3 className="mb-2 px-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                    {groupName}
                  </h3>
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const isActiveItem = item.slug === screen;
                      return (
                        <NavLink
                          key={item.slug}
                          to={item.path}
                          className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                            isActiveItem
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isActiveItem && isDirty && (
                            <span
                              className="h-2 w-2 rounded-full bg-amber-300"
                              title="Unsaved changes"
                            />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Right Form Content Area (9 cols on lg) */}
          <div className="space-y-6 lg:col-span-9">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canEdit) onSave();
              }}
              noValidate
              className="space-y-6"
            >
              <fieldset
                disabled={!canEdit || isSaving}
                className="space-y-6 border-0 p-0 m-0"
              >
                {children}
              </fieldset>

              {/* Reusable Form Action Footer */}
              {canEdit && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    disabled={isSaving}
                    className="lg-btn lg-btn-secondary"
                  >
                    <RefreshCwIcon size={14} />
                    <span>Restore Default {meta.shortLabel} Settings</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onDiscard}
                      disabled={!isDirty || isSaving}
                      className="lg-btn lg-btn-secondary disabled:opacity-50"
                    >
                      Cancel / Discard
                    </button>
                    <PrimaryButton
                      type="submit"
                      fullWidth={false}
                      isLoading={isSaving}
                      loadingText="Saving..."
                    >
                      Save {meta.shortLabel} Settings
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

