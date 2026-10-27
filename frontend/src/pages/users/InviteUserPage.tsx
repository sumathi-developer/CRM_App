import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { UserRole, CreateUserPayload } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import {
  UserPlusIcon,
  ArrowLeftIcon,
  ShieldIcon,
  SparklesIcon,
  CheckCircleIcon,
  MailIcon,
  LockIcon,
} from '../../components/common/Icons';

export const InviteUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Check permissions
  const isSuperAdmin = currentUser?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER';
  const canManage = isSuperAdmin || currentUser?.role?.name === 'MANAGER' || userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;

    const fetchRoles = async () => {
      try {
        const fetchedRoles = await userService.getRoles();
        if (!ignore) {
          setRoles(fetchedRoles);
          if (fetchedRoles.length > 0) {
            // Default to Member or first role
            const defaultRole = fetchedRoles.find((r) => r.name.toUpperCase() === 'MEMBER') || fetchedRoles[0];
            setRoleId(defaultRole.id);
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load system roles');
        }
      } finally {
        if (!ignore) {
          setIsRolesLoading(false);
        }
      }
    };

    fetchRoles();
    return () => {
      ignore = true;
    };
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = 'P@ss';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const selectedRole = roles.find((r) => r.id === roleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setApiError('Name and Email are mandatory fields.');
      return;
    }

    const effectivePassword = password.trim() || 'Welcome@2026!';

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: CreateUserPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: effectivePassword,
        phone: phone.trim() || undefined,
        roleId: roleId || undefined,
        status,
      };

      const newUser = await userService.createUser(payload);
      setApiSuccess(`User "${newUser.name}" has been created successfully! Redirecting...`);

      setTimeout(() => {
        navigate(`/users/${newUser.id}`);
      }, 1500);
    } catch (err: any) {
      setApiError(err.message || 'Failed to onboard user. Please check email uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="permission-denied-box">
            <ShieldIcon size={40} className="text-warning" />
            <h2>Access Restricted</h2>
            <p>You do not have administrative permissions to invite or create new users.</p>
            <Link to="/users" className="auth-btn btn-primary">
              Return to Users
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="invite-user-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Navigation Breadcrumb */}
        <div className="breadcrumb-nav-row">
          <Link to="/users" className="breadcrumb-back-link">
            <ArrowLeftIcon size={16} />
            <span>All Users</span>
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Invite & Onboard New User</span>
        </div>

        <div className="page-intro-header">
          <div className="intro-icon-badge">
            <UserPlusIcon size={24} />
          </div>
          <div>
            <h1 className="page-main-heading">Invite User</h1>
            <p className="page-sub-heading">
              Provision account credentials, assign RBAC access tiers, and grant CRM permissions
            </p>
          </div>
        </div>

        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {isRolesLoading ? (
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading configuration..." />
          </div>
        ) : (
          <div className="user-form-layout-grid">
            {/* Form Column */}
            <div className="form-main-card">
              <form onSubmit={handleSubmit} className="portal-form" id="form-invite-user-page">
                <div className="card-section-header">
                  <div className="section-icon-badge primary">
                    <MailIcon size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Identity & Access Details</h3>
                    <p className="section-desc">Required credentials for login and notification delivery</p>
                  </div>
                </div>

                <div className="form-fields-stack">
                  <FormField
                    id="invite-name"
                    name="name"
                    label="Full Name"
                    placeholder="e.g. Marcus Aurelius"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />

                  <FormField
                    id="invite-email"
                    name="email"
                    type="email"
                    label="Work Email Address"
                    placeholder="e.g. marcus@crmportal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    helperText="This email will be used as the primary login credential."
                  />

                  <FormField
                    id="invite-phone"
                    name="phone"
                    type="tel"
                    label="Phone Number (Optional)"
                    placeholder="+1 (555) 789-0123"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />

                  <div className="form-field-group">
                    <label htmlFor="invite-role-select" className="form-field-label">
                      Assigned Role Tier
                    </label>
                    <div className="select-with-icon-container">
                      <ShieldIcon size={16} className="select-icon" />
                      <select
                        id="invite-role-select"
                        className="form-input form-select-padded"
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        disabled={isSubmitting}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-field-group">
                    <div className="password-header-row">
                      <label htmlFor="invite-password-input" className="form-field-label">
                        Initial Account Password
                      </label>
                      <button
                        type="button"
                        className="btn-text-link"
                        onClick={generatePassword}
                        disabled={isSubmitting}
                      >
                        <SparklesIcon size={14} />
                        <span>Generate Random Password</span>
                      </button>
                    </div>
                    <div className="select-with-icon-container">
                      <LockIcon size={16} className="select-icon" />
                      <input
                        id="invite-password-input"
                        type="text"
                        className="form-input form-select-padded font-mono"
                        placeholder="Leave blank to use 'Welcome@2026!'"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="form-field-helper">
                      Minimum 6 characters. The user can change this anytime under Security settings.
                    </p>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="invite-status-select" className="form-field-label">
                      Initial Account Status
                    </label>
                    <select
                      id="invite-status-select"
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                      disabled={isSubmitting}
                    >
                      <option value="ACTIVE">ACTIVE (Immediate Access)</option>
                      <option value="INACTIVE">INACTIVE (Staged, Awaiting Activation)</option>
                    </select>
                  </div>
                </div>

                <div className="form-action-row">
                  <Link to="/users" className="auth-btn btn-secondary">
                    Cancel
                  </Link>

                  <PrimaryButton
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Onboarding User..."
                    icon={<CheckCircleIcon size={16} />}
                    fullWidth={false}
                    id="btn-submit-invite-page"
                  >
                    Complete Invitation & Provision Account
                  </PrimaryButton>
                </div>
              </form>
            </div>

            {/* Sidebar Column: Selected Role Overview */}
            <div className="form-sidebar-card">
              <div className="role-preview-header">
                <ShieldIcon size={20} className="text-primary" />
                <h4 className="preview-title">Role Preview: {selectedRole?.name || 'Standard'}</h4>
              </div>

              <p className="preview-desc">
                {selectedRole?.description ||
                  'Standard workspace member with access to assigned deals, contacts, leads, and operational activities.'}
              </p>

              <div className="permissions-preview-box">
                <span className="preview-label">Role Category</span>
                <span className="role-tag">
                  {selectedRole?.isSystem ? 'System Core' : 'Custom Configured'}
                </span>

                <div className="preview-highlights">
                  <span className="preview-label">Access Highlights:</span>
                  <ul className="preview-checklist">
                    <li>Authentication & Session creation</li>
                    <li>CRM Pipeline & Deal access according to assignments</li>
                    <li>Personal tasks and communications logging</li>
                    {selectedRole?.name.toUpperCase().includes('ADMIN') && (
                      <li className="text-warning">Global Tenant & User administration</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="security-notice-box">
                <span className="notice-title">Security & Audit</span>
                <p className="notice-text">
                  All invitation actions and initial logins are recorded in the central CRM Audit Trail.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
