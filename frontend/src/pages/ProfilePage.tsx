import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { FormField } from '../components/auth/FormField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
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
} from '../components/common/Icons';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const handleStartEditing = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setIsEditing(true);
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
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      setApiSuccess('Profile updated successfully!');
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
            <h1 className="page-title">User Account & Profile</h1>
            <p className="page-subtitle">
              Manage personal identity, corporate assignment, and security privileges
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
          <div className="identity-avatar-large" aria-hidden="true">
            {getInitials(user?.name)}
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
                  <h3 className="section-title">Personal Details</h3>
                  <p className="section-desc">Keep your contact information up-to-date across teams.</p>
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
              <h4 className="shortcuts-title">Security & Device Quick Links</h4>
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
