import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import type { Role, Organization } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { FormField } from '../../components/auth/FormField';
import { PasswordField } from '../../components/auth/PasswordField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  UserPlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldIcon,
  SparklesIcon,
} from '../../components/common/Icons';

export const InviteUserPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Welcome@CRM2026!');
  const [roleId, setRoleId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [sendInvitationEmail, setSendInvitationEmail] = useState(true);
  const [customMessage, setCustomMessage] = useState(
    'Welcome to our CRM system! Please sign in using your temporary credentials and update your password.'
  );

  // Metadata
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notifications
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchMeta = async () => {
      try {
        const [rolesData, orgsData] = await Promise.all([
          userService.getRoles(),
          userService.getOrganizations(),
        ]);

        if (!ignore) {
          setRoles(rolesData || []);
          setOrganizations(orgsData || []);
          if (rolesData && rolesData.length > 0) {
            setRoleId(rolesData[0].id);
          }
          if (orgsData && orgsData.length > 0) {
            setOrganizationId(orgsData[0].id);
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load roles and organizations');
        }
      } finally {
        if (!ignore) {
          setIsLoadingMeta(false);
        }
      }
    };

    fetchMeta();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setApiError('Please provide the user\'s full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setApiError('Please enter a valid corporate email address.');
      return;
    }

    if (password.length < 6) {
      setApiError('Temporary password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      await userService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        roleId: roleId || undefined,
        organizationId: organizationId || undefined,
        status,
      });

      setApiSuccess(`User ${name} has been successfully provisioned! Redirecting...`);
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create user account');
      setIsSubmitting(false);
    }
  };

  const selectedRoleObj = roles.find((r) => r.id === roleId);

  return (
    <div className="portal-authenticated-shell">
      <Navbar />

      <main className="authenticated-container" id="invite-user-page">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/users" className="detail-link" style={{ fontSize: '0.875rem' }}>
            <ArrowLeftIcon size={14} />
            <span>Back to Users Directory</span>
          </Link>
        </div>

        <div className="users-page-header">
          <div className="users-title-group">
            <h1>
              <UserPlusIcon size={28} />
              <span>Invite New Team Member</span>
            </h1>
            <p>Provision credentials, define access privileges, and send onboarding instructions</p>
          </div>
        </div>

        <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
        <SuccessMessage message={apiSuccess} onDismiss={() => setApiSuccess(null)} />

        <div className="user-details-layout">
          {/* Main Invitation Form */}
          <div className="user-card">
            <h3 className="user-card-title">
              <UserPlusIcon size={18} />
              <span>User Credentials & Role Assignment</span>
            </h3>

            <form onSubmit={handleSubmit} className="portal-form" id="page-invite-user-form">
              <div className="form-grid-2col">
                <FormField
                  id="user-name-input"
                  name="name"
                  label="Full Name *"
                  placeholder="e.g. Jordan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting || isLoadingMeta}
                  required
                />

                <FormField
                  id="user-email-input"
                  name="email"
                  type="email"
                  label="Corporate Email Address *"
                  placeholder="jordan.smith@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isLoadingMeta}
                  required
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label htmlFor="user-role-select" className="form-field-label">
                    Role & Permissions *
                  </label>
                  <select
                    id="user-role-select"
                    className="form-input"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    disabled={isSubmitting || isLoadingMeta}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.description ? `— ${r.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field-group">
                  <label htmlFor="user-status-select" className="form-field-label">
                    Account Status
                  </label>
                  <select
                    id="user-status-select"
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    disabled={isSubmitting || isLoadingMeta}
                  >
                    <option value="ACTIVE">Active (Immediate Login Granted)</option>
                    <option value="INACTIVE">Inactive (Pending Account Activation)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2col">
                <FormField
                  id="user-phone-input"
                  name="phone"
                  type="tel"
                  label="Contact Phone"
                  placeholder="+1 555-0144"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting || isLoadingMeta}
                />

                {organizations.length > 0 && (
                  <div className="form-field-group">
                    <label htmlFor="user-org-select" className="form-field-label">
                      Organization / Division
                    </label>
                    <select
                      id="user-org-select"
                      className="form-input"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      disabled={isSubmitting || isLoadingMeta}
                    >
                      <option value="">No Organization Assigned</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <PasswordField
                id="user-password-input"
                name="password"
                label="Initial Temporary Password *"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isLoadingMeta}
                helperText="Share this password with the user or deliver it via the automated invitation email."
              />

              <div className="form-field-group">
                <label htmlFor="user-welcome-message" className="form-field-label">
                  Custom Welcome Message
                </label>
                <textarea
                  id="user-welcome-message"
                  className="form-input"
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  disabled={isSubmitting || isLoadingMeta}
                />
              </div>

              <label className="settings-toggle-card" style={{ cursor: 'pointer', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={sendInvitationEmail}
                  onChange={(e) => setSendInvitationEmail(e.target.checked)}
                  disabled={isSubmitting}
                />
                <div>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                    Deliver Sign-in Invitation via Email
                  </span>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Sends an invitation email with credentials and a secure direct login link.
                  </p>
                </div>
              </label>

              <div className="form-action-row" style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  to="/users"
                  className="auth-btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  Cancel
                </Link>

                <PrimaryButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Creating Account..."
                  icon={<CheckCircleIcon size={16} />}
                  fullWidth={false}
                  id="btn-submit-invite-page"
                >
                  Invite Team Member
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Right Guidance Sidebar */}
          <div className="user-sidebar-column">
            <div className="invite-guide-card">
              <h4>
                <SparklesIcon size={16} />
                <span>Onboarding Best Practices</span>
              </h4>
              <p>
                Assigning the proper role ensures team members only view and modify leads, deals, and
                contacts within their scope of responsibility.
              </p>
            </div>

            <div className="user-card">
              <h4 className="user-card-title">
                <ShieldIcon size={16} />
                <span>Selected Role Details</span>
              </h4>

              {selectedRoleObj ? (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                      {selectedRoleObj.name}
                    </span>
                    {selectedRoleObj.isSystem && (
                      <span className="permission-pill" style={{ marginLeft: '0.5rem', color: '#a78bfa' }}>
                        System Tier
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                    {selectedRoleObj.description ||
                      'Standard operational role with full pipeline and contact management privileges.'}
                  </p>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Select a role on the left to review configured permission capabilities.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
