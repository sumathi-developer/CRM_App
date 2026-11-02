import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  CheckCircleIcon,
  RefreshCwIcon,
  PaletteIcon,
  GlobeIcon,
  ClockIcon,
} from '../components/common/Icons';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }

    // Load user preference settings from backend
    const loadPreferences = async () => {
      try {
        const pref = await api.get('/settings/profile');
        if (pref) {
          if (pref.theme) setTheme(pref.theme);
          if (pref.language) setLanguage(pref.language);
          if (pref.timezone) setTimezone(pref.timezone);
        }
      } catch {
        // Fallback to local default state
      }
    };

    void loadPreferences();
  }, [user]);

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
      // 1. Update user profile information (own user access)
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });

      // 2. Update preference settings (theme, language, timezone)
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="profile-page">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">User Account &amp; Profile</h1>
            <p className="page-subtitle">
              Manage personal identity, contact information, and regional preferences
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
          title="Changes Saved"
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
              <h2 className="identity-full-name">{user?.name || 'Nexus User'}</h2>
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
                <span>Member since {formatDate(user?.createdAt)}</span>
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

                {/* Regional & Interface Preferences */}
                <div className="pt-2 border-t border-slate-700/60 mt-1">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Preferences &amp; Localization
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="pref-theme" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <PaletteIcon size={14} className="text-indigo-400" />
                        <span>Theme</span>
                      </label>
                      <select
                        id="pref-theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                        disabled={isSaving}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="pref-lang" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <GlobeIcon size={14} className="text-indigo-400" />
                        <span>Language</span>
                      </label>
                      <select
                        id="pref-lang"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={isSaving}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Español (ES)</option>
                        <option value="fr">Français (FR)</option>
                        <option value="de">Deutsch (DE)</option>
                        <option value="ja">日本語 (JA)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="pref-tz" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <ClockIcon size={14} className="text-indigo-400" />
                        <span>Timezone</span>
                      </label>
                      <select
                        id="pref-tz"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        disabled={isSaving}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">Eastern Time (US / Canada)</option>
                        <option value="America/Chicago">Central Time (US / Canada)</option>
                        <option value="America/Los_Angeles">Pacific Time (US / Canada)</option>
                        <option value="Europe/London">London (GMT / BST)</option>
                        <option value="Europe/Paris">Paris / Berlin (CET / CEST)</option>
                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                        <option value="Asia/Tokyo">Tokyo / Japan (JST)</option>
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
                  <span className="detail-label">Interface Theme</span>
                  <span className="detail-value capitalize">{theme}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Active Timezone</span>
                  <span className="detail-value text-xs">{timezone}</span>
                </div>

                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">User Identifier</span>
                  <span className="detail-value font-mono text-sm">{user?.id}</span>
                </div>
              </div>
            )}
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
