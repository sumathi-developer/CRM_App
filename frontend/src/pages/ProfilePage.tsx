import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { FormField } from '../components/auth/FormField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { api } from '../services/api';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  ShieldIcon,
  KeyRoundIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  PaletteIcon,
  GlobeIcon,
  ClockIcon,
} from '../components/common/Icons';
import type { ThemeMode } from '../utils/theme';
import {
  COMMON_TIMEZONES,
  applyTheme,
  getStoredTheme,
  getStoredTimezone,
  setStoredTimezone,
  formatDateWithTimezone,
  getCurrentTimeInTimezone,
} from '../utils/theme';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState<string>(() => getStoredTimezone());
  const [liveTime, setLiveTime] = useState<string>(() => getCurrentTimeInTimezone(getStoredTimezone()));

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Keep live time clock synchronized with the selected timezone
  useEffect(() => {
    setLiveTime(getCurrentTimeInTimezone(timezone));
    const interval = setInterval(() => {
      setLiveTime(getCurrentTimeInTimezone(timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  // Load user data and backend preferences
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }

    const loadPreferences = async () => {
      try {
        const res = await api.get('/settings/profile');
        const pref = (res as any)?.data || res;
        if (pref) {
          if (pref.theme && (pref.theme === 'light' || pref.theme === 'dark' || pref.theme === 'system')) {
            setTheme(pref.theme);
            applyTheme(pref.theme);
          }
          if (pref.language) {
            setLanguage(pref.language);
          }
          if (pref.timezone) {
            setTimezone(pref.timezone);
            setStoredTimezone(pref.timezone);
          }
        }
      } catch {
        // Fallback to local default state
      }
    };

    void loadPreferences();
  }, [user]);

  // Instant Theme Switcher Handler: switches whole app immediately and saves to backend
  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);

    try {
      await api.patch('/settings/profile', { theme: newTheme });
    } catch {
      // Preference is saved in localStorage regardless of network state
    }

    const themeLabel =
      newTheme === 'dark'
        ? 'Dark Theme'
        : newTheme === 'light'
        ? 'Light Theme'
        : 'System Default Settings';

    setApiSuccess(`Applied ${themeLabel} across the application.`);
    setTimeout(() => setApiSuccess(null), 3500);
  };

  // Instant Timezone Switcher Handler: applies timezone and saves to backend
  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    setStoredTimezone(newTimezone);

    try {
      await api.patch('/settings/profile', { timezone: newTimezone });
    } catch {
      // Preference is saved in localStorage regardless of network state
    }

    const matched = COMMON_TIMEZONES.find((tz) => tz.value === newTimezone);
    const tzLabel = matched ? matched.label : newTimezone;

    setApiSuccess(`Timezone set to ${tzLabel}.`);
    setTimeout(() => setApiSuccess(null), 3500);
  };

  const handleStartEditing = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setAvatar(user?.avatar || '');
    setIsEditing(true);
    setApiError(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      setApiSuccess('Profile data refreshed from server.');
      setTimeout(() => setApiSuccess(null), 3000);
    } catch {
      setApiError('Failed to refresh profile.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setApiError('Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      // 1. Update user profile information
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });

      // 2. Apply theme & timezone immediately
      applyTheme(theme);
      setStoredTimezone(timezone);

      // 3. Update preference settings on backend
      await api.patch('/settings/profile', {
        theme,
        language,
        timezone,
      }).catch(() => null);

      setApiSuccess('Your profile details and preferences have been successfully updated!');
      setIsEditing(false);
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (userName?: string) => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="profile-page">
        {/* Top Account & Security Sub-Navigation */}
        <nav
          className="lg-subnav ld-subnav"
          aria-label="Account and Security sub-navigation"
          style={{ marginBottom: '1.5rem' }}
        >
          <div className="lg-subnav-group">
            <span className="lg-subnav-label">Account & Security</span>
            <div className="lg-subnav-links">
              <NavLink
                to="/profile"
                className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}
              >
                Profile Settings
              </NavLink>
              <NavLink
                to="/change-password"
                className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}
              >
                Change Password
              </NavLink>
              <NavLink
                to="/sessions"
                className={({ isActive }) => `lg-subnav-link ${isActive ? 'is-active' : ''}`}
              >
                Active Sessions
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">User Account &amp; Profile</h1>
            <p className="page-subtitle">
              Manage personal identity, contact information, theme, and timezone preferences
            </p>
          </div>

          <div className="page-actions-group">
            <button
              type="button"
              className="refresh-btn-secondary"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh latest data from backend"
            >
              <RefreshCwIcon size={16} className={isRefreshing ? 'icon-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        <ErrorMessage
          error={apiError}
          onDismiss={() => setApiError(null)}
          title="Profile Error"
        />

        <SuccessMessage
          message={apiSuccess}
          onDismiss={() => setApiSuccess(null)}
          title="Updated Successfully"
        />

        {/* Profile Identity Banner Card */}
        <div className="profile-identity-card">
          <div className="identity-avatar-large" aria-hidden="true" style={{ overflow: 'hidden' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'User avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>

          <div className="identity-text-details">
            <div className="identity-name-row">
              <h2 className="identity-full-name">{user?.name || 'Onseclick User'}</h2>
              <span className={`status-pill pill-${(user?.status || 'active').toLowerCase()}`}>
                <span className="status-indicator-dot" />
                <span>{user?.status || 'ACTIVE'}</span>
              </span>
            </div>

            <p className="identity-email">
              <MailIcon size={16} />
              <span>{user?.email}</span>
            </p>

            <div className="identity-badges-row">
              <span className="role-pill">
                <ShieldIcon size={14} />
                <span>Role: {user?.role?.name || 'SALES_REP'}</span>
              </span>

              {user?.organization && (
                <span className="org-pill">
                  <BuildingIcon size={14} />
                  <span>{user.organization.name}</span>
                </span>
              )}

              <span className="member-since-pill">
                <span>
                  Member since {formatDateWithTimezone(user?.createdAt, timezone)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="portal-grid">
          {/* Main Account Details / Edit Form */}
          <div className="portal-card form-portal-card">
            <div className="card-section-header-split">
              <div className="header-left">
                <div className="section-icon-badge" aria-hidden="true">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="section-title">Personal Details &amp; Identity</h3>
                  <p className="section-desc">Keep your contact information and preferences up-to-date across teams.</p>
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="btn-edit-toggle"
                  onClick={handleStartEditing}
                  id="btn-edit-profile"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="portal-form" id="profile-edit-form">
                <FormField
                  id="profile-name-input"
                  name="name"
                  type="text"
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<UserIcon size={18} />}
                  required
                  disabled={isSaving}
                  placeholder="Enter your full name"
                />

                <FormField
                  id="profile-email-readonly"
                  name="email"
                  type="email"
                  label="Email Address"
                  value={user?.email || ''}
                  icon={<MailIcon size={18} />}
                  disabled={true}
                  helperText="Email cannot be changed directly for enterprise security."
                />

                <FormField
                  id="profile-phone-input"
                  name="phone"
                  type="tel"
                  label="Phone Number"
                  value={phone}
                  placeholder="+1 (555) 012-3456"
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<PhoneIcon size={18} />}
                  disabled={isSaving}
                />

                <FormField
                  id="profile-avatar-input"
                  name="avatar"
                  type="url"
                  label="Avatar Image URL (optional)"
                  value={avatar}
                  placeholder="https://example.com/my-photo.jpg"
                  onChange={(e) => setAvatar(e.target.value)}
                  icon={<UserIcon size={18} />}
                  disabled={isSaving}
                  helperText="Enter a direct link to an avatar image, or leave empty for letter initials."
                />

                {/* Regional & Interface Preferences inside Form */}
                <div className="profile-preferences-section">
                  <h4 className="preferences-section-title">
                    Preferences &amp; Localization
                  </h4>
                  <div className="preferences-grid">
                    <div className="preference-field-group">
                      <label htmlFor="pref-theme" className="preference-field-label">
                        <PaletteIcon size={14} className="text-emerald-500" />
                        <span>Theme</span>
                      </label>
                      <select
                        id="pref-theme"
                        value={theme}
                        onChange={(e) => {
                          const val = e.target.value as ThemeMode;
                          setTheme(val);
                          applyTheme(val);
                        }}
                        disabled={isSaving}
                        className="preference-select-control"
                      >
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    <div className="preference-field-group">
                      <label htmlFor="pref-lang" className="preference-field-label">
                        <GlobeIcon size={14} className="text-emerald-500" />
                        <span>Language</span>
                      </label>
                      <select
                        id="pref-lang"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={isSaving}
                        className="preference-select-control"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Español (ES)</option>
                        <option value="fr">Français (FR)</option>
                        <option value="de">Deutsch (DE)</option>
                        <option value="ja">日本語 (JA)</option>
                      </select>
                    </div>

                    <div className="preference-field-group">
                      <label htmlFor="pref-tz" className="preference-field-label">
                        <ClockIcon size={14} className="text-emerald-500" />
                        <span>Timezone</span>
                      </label>
                      <select
                        id="pref-tz"
                        value={timezone}
                        onChange={(e) => {
                          setTimezone(e.target.value);
                          setStoredTimezone(e.target.value);
                        }}
                        disabled={isSaving}
                        className="preference-select-control"
                      >
                        {COMMON_TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label} ({tz.offset})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-action-buttons-row">
                  <PrimaryButton
                    type="submit"
                    isLoading={isSaving}
                    loadingText="Saving Details..."
                    icon={<CheckCircleIcon size={18} />}
                    iconPosition="left"
                    fullWidth={false}
                    id="btn-save-profile-changes"
                  >
                    Save Changes
                  </PrimaryButton>

                  <button
                    type="button"
                    className="auth-btn btn-ghost"
                    onClick={() => {
                      setName(user?.name || '');
                      setPhone(user?.phone || '');
                      setAvatar(user?.avatar || '');
                      setIsEditing(false);
                      setApiError(null);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value" id="profile-display-name">{user?.name}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value" id="profile-display-email">{user?.email}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{user?.phone || 'Not configured'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Avatar Status</span>
                  <span className="detail-value text-xs truncate">
                    {user?.avatar ? 'Custom profile photo' : 'Default initials'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Current Interface Theme</span>
                  <span className="detail-value capitalize font-bold" id="profile-display-theme">
                    {theme === 'dark' ? 'Dark Theme' : theme === 'light' ? 'Light Theme' : 'System Default'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Active Timezone</span>
                  <span className="detail-value text-xs font-semibold" id="profile-display-timezone">
                    {timezone}
                  </span>
                </div>

                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">User Identifier</span>
                  <span className="detail-value font-mono text-sm">{user?.id}</span>
                </div>
              </div>
            )}

            {/* Interactive Theme Switcher Section (Always accessible for instant one-click switching) */}
            <div className="theme-selector-section" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-section-header" style={{ marginBottom: '16px' }}>
                <div className="section-icon-badge" aria-hidden="true">
                  <PaletteIcon size={20} />
                </div>
                <div>
                  <h4 className="section-title">Interface Appearance &amp; Theme</h4>
                  <p className="section-desc">
                    Click any theme to apply immediately across the entire CRM application.
                  </p>
                </div>
              </div>

              <div className="theme-options-grid" role="radiogroup" aria-label="Select application theme">
                {/* Light Theme Card */}
                <button
                  type="button"
                  className={`theme-option-card ${theme === 'light' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                  role="radio"
                  aria-checked={theme === 'light'}
                  id="theme-card-light"
                >
                  <div className="theme-active-indicator" aria-hidden="true">
                    {theme === 'light' && <CheckCircleIcon size={12} />}
                  </div>
                  <div className="theme-option-icon-box">
                    <SunIcon size={20} />
                  </div>
                  <span className="theme-option-name">Light Theme</span>
                  <span className="theme-option-desc">
                    Clean mint and crisp bright appearance for well-lit environments.
                  </span>
                </button>

                {/* Dark Theme Card */}
                <button
                  type="button"
                  className={`theme-option-card ${theme === 'dark' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                  role="radio"
                  aria-checked={theme === 'dark'}
                  id="theme-card-dark"
                >
                  <div className="theme-active-indicator" aria-hidden="true">
                    {theme === 'dark' && <CheckCircleIcon size={12} />}
                  </div>
                  <div className="theme-option-icon-box">
                    <MoonIcon size={20} />
                  </div>
                  <span className="theme-option-name">Dark Theme</span>
                  <span className="theme-option-desc">
                    Deep obsidian and emerald dark mode that is gentle on your eyes.
                  </span>
                </button>

                {/* System Default Card */}
                <button
                  type="button"
                  className={`theme-option-card ${theme === 'system' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                  role="radio"
                  aria-checked={theme === 'system'}
                  id="theme-card-system"
                >
                  <div className="theme-active-indicator" aria-hidden="true">
                    {theme === 'system' && <CheckCircleIcon size={12} />}
                  </div>
                  <div className="theme-option-icon-box">
                    <MonitorIcon size={20} />
                  </div>
                  <span className="theme-option-name">System Default</span>
                  <span className="theme-option-desc">
                    Automatically synchronize with your operating system preference.
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive Timezone & Regional Localization Card */}
            <div className="theme-selector-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-section-header" style={{ marginBottom: '16px' }}>
                <div className="section-icon-badge" aria-hidden="true">
                  <ClockIcon size={20} />
                </div>
                <div>
                  <h4 className="section-title">Timezone &amp; Regional Localization</h4>
                  <p className="section-desc">
                    Set your timezone to schedule activities, log timestamps, and display local time.
                  </p>
                </div>
              </div>

              <div className="timezone-card-wrapper">
                <div className="preference-field-group">
                  <label htmlFor="standalone-timezone-select" className="preference-field-label">
                    <span>Active Timezone</span>
                  </label>
                  <select
                    id="standalone-timezone-select"
                    value={timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="preference-select-control"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="timezone-live-clock-badge" id="timezone-live-clock">
                  <span className="timezone-clock-dot" aria-hidden="true" />
                  <span>Current local time: <strong>{liveTime}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Quick Shortcuts */}
          <aside className="portal-sidebar">
            {/* Organization Info */}
            <div className="portal-card sidebar-org-card">
              <div className="card-section-header">
                <div className="section-icon-badge" aria-hidden="true">
                  <BuildingIcon size={20} />
                </div>
                <div>
                  <h4 className="section-title">Organization</h4>
                  <p className="section-desc">Primary enterprise tenant</p>
                </div>
              </div>

              <div className="org-details-content">
                <div className="org-name-large">
                  {user?.organization?.name || 'Default CRM Workspace'}
                </div>
                {user?.organization?.domain && (
                  <div className="org-meta-line">Domain: {user.organization.domain}</div>
                )}
                {user?.organization?.industry && (
                  <div className="org-meta-line">Industry: {user.organization.industry}</div>
                )}
              </div>
            </div>

            {/* Quick Security Links */}
            <div className="portal-card shortcuts-card">
              <h4 className="shortcuts-title">Security &amp; Device Quick Links</h4>
              <div className="shortcuts-list">
                <Link to="/change-password" className="shortcut-nav-item">
                  <div className="shortcut-icon-badge">
                    <KeyRoundIcon size={18} />
                  </div>
                  <div className="shortcut-text">
                    <span className="shortcut-title">Change Password</span>
                    <span className="shortcut-sub">Update authentication secret</span>
                  </div>
                </Link>

                <Link to="/sessions" className="shortcut-nav-item">
                  <div className="shortcut-icon-badge">
                    <MonitorIcon size={18} />
                  </div>
                  <div className="shortcut-text">
                    <span className="shortcut-title">Active Sessions</span>
                    <span className="shortcut-sub">Manage connected devices</span>
                  </div>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
