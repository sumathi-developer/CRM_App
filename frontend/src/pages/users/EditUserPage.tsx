import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { User } from '../../types/auth.types';
import type { UserRole, UserStatus, UpdateUserPayload } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from './UserHeader';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  EditIcon,
  ShieldIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

export const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [roleId, setRoleId] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER';
  const canManage = isSuperAdmin || currentUser?.role?.name === 'MANAGER' || userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      try {
        const [userData, rolesData] = await Promise.all([
          userService.getUserById(id),
          userService.getRoles(),
        ]);

        if (!ignore) {
          setUser(userData);
          setRoles(rolesData);

          // Populate fields
          setName(userData.name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || '');
          setAvatar(userData.avatar || '');
          setStatus(userData.status || 'ACTIVE');
          setRoleId(userData.roleId || userData.role?.id || '');
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user for editing');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!name.trim() || !email.trim()) {
      setApiError('Name and Email are mandatory fields.');
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      const payload: UpdateUserPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        avatar: avatar.trim() || undefined,
        status,
        roleId: roleId || undefined,
      };

      const updated = await userService.updateUser(id, payload);

      // If role was updated separately by admin
      if (roleId && roleId !== user?.roleId && isSuperAdmin) {
        await userService.updateUserRole(id, roleId).catch(() => {});
      }

      setUser(updated);
      setApiSuccess('User information updated successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/users/${id}`);
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="permission-denied-box">
            <ShieldIcon size={40} className="text-warning" />
            <h2>Access Denied</h2>
            <p>You do not have administrative privileges to edit user profiles.</p>
            <Link to="/users" className="auth-btn btn-primary">
              Return to Users Roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading user details..." />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>User Not Found</h2>
            <Link to="/users" className="auth-btn btn-primary">
              Return to Users Roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="edit-user-page">
      <Navbar />

      <main className="authenticated-container">
        {/* User Navigation Header */}
        <UserHeader user={user} canEdit={canManage} />

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        <div className="user-form-layout-grid">
          {/* Main Edit Form */}
          <div className="form-main-card">
            <form onSubmit={handleSubmit} className="portal-form" id="form-edit-user">
              <div className="card-section-header">
                <div className="section-icon-badge primary">
                  <EditIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Edit Account Profile</h3>
                  <p className="section-desc">Update contact details, role assignment, and access state</p>
                </div>
              </div>

              <div className="form-fields-stack">
                <FormField
                  id="edit-name"
                  name="name"
                  label="Full Name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSaving}
                />

                <FormField
                  id="edit-email"
                  name="email"
                  type="email"
                  label="Primary Email Address"
                  placeholder="e.g. john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSaving}
                  helperText="Updating email will modify the user's primary login identifier."
                />

                <FormField
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  label="Contact Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                />

                <FormField
                  id="edit-avatar"
                  name="avatar"
                  type="url"
                  label="Avatar Image URL (Optional)"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  disabled={isSaving}
                  helperText="Direct image URL for user profile picture."
                />

                <div className="form-field-group">
                  <label htmlFor="edit-role-select" className="form-field-label">
                    Assigned Role Tier
                  </label>
                  <div className="select-with-icon-container">
                    <ShieldIcon size={16} className="select-icon" />
                    <select
                      id="edit-role-select"
                      className="form-input form-select-padded"
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                      disabled={isSaving || !canManage}
                    >
                      <option value="">Default Member Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field-group">
                  <label htmlFor="edit-status-select" className="form-field-label">
                    Account Status
                  </label>
                  <select
                    id="edit-status-select"
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    disabled={isSaving || !canManage}
                  >
                    <option value="ACTIVE">ACTIVE (Full access)</option>
                    <option value="INACTIVE">INACTIVE (Access disabled)</option>
                    <option value="SUSPENDED">SUSPENDED (Locked by admin)</option>
                  </select>
                </div>
              </div>

              <div className="form-action-row">
                <Link to={`/users/${user.id}`} className="auth-btn btn-secondary">
                  Cancel
                </Link>

                <PrimaryButton
                  type="submit"
                  isLoading={isSaving}
                  loadingText="Saving Changes..."
                  icon={<CheckCircleIcon size={16} />}
                  fullWidth={false}
                  id="btn-save-user-changes"
                >
                  Save User Changes
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="form-sidebar-card">
            <h4 className="sidebar-card-title">Editing Guidelines</h4>
            <div className="security-notice-box">
              <span className="notice-title">Role Modifications</span>
              <p className="notice-text">
                Changing a user&apos;s role immediately affects their RBAC permissions on subsequent API requests.
              </p>
            </div>

            <div className="security-notice-box">
              <span className="notice-title">Account Suspension</span>
              <p className="notice-text">
                Setting a user status to SUSPENDED invalidates active sessions and prevents future logins until reactivated by an administrator.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
