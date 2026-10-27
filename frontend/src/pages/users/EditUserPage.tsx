import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import type { User, Role, Organization, UserStatus } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from '../../components/users/UserHeader';
import { DeleteUserModal } from '../../components/users/DeleteUserModal';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  EditIcon,
  CheckCircleIcon,
  TrashIcon,
  ShieldIcon,
  SlidersIcon,
} from '../../components/common/Icons';

export const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [roleId, setRoleId] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  // UI / Async
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Check roles
  const currentUserRole = (currentUser?.role?.name || '').toUpperCase();
  const isAdmin = currentUserRole.includes('ADMIN') || currentUserRole === 'OWNER';
  const isManager = currentUserRole.includes('MANAGE');
  const canEditRole = isAdmin;
  const canEditStatus = isAdmin || isManager;

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const fetchUserData = async () => {
      try {
        const [userData, rolesData, orgsData] = await Promise.all([
          userService.getUserById(id),
          userService.getRoles(),
          userService.getOrganizations(),
        ]);

        if (!ignore) {
          setUser(userData);
          setName(userData.name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || '');
          setAvatar(userData.avatar || '');
          setStatus(userData.status || 'ACTIVE');
          setRoleId(userData.roleId || userData.role?.id || '');
          setOrganizationId(userData.organizationId || userData.organization?.id || '');

          setRoles(rolesData || []);
          setOrganizations(orgsData || []);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user information for editing');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!name.trim()) {
      setApiError('User name cannot be empty.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setApiError('Valid email address is required.');
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      const updated = await userService.updateUser(id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        avatar: avatar.trim() || undefined,
        status: canEditStatus ? status : undefined,
        roleId: canEditRole ? roleId || undefined : undefined,
        organizationId: organizationId || undefined,
      });

      setUser(updated);
      setApiSuccess('User information saved successfully!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update user profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <LoadingIndicator size="large" message="Loading user details for editing..." />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <ErrorMessage error={apiError || 'User profile could not be located.'} />
          <Link to="/users" className="auth-btn btn-secondary">
            Back to Users Directory
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="portal-authenticated-shell">
      <Navbar />

      <main className="authenticated-container" id="edit-user-page">
        <UserHeader user={user} canEdit={true} />

        <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
        <SuccessMessage message={apiSuccess} onDismiss={() => setApiSuccess(null)} />

        <div className="user-details-layout">
          {/* Main Edit Form */}
          <div className="user-card">
            <h3 className="user-card-title">
              <EditIcon size={18} />
              <span>Modify User Profile & Permissions</span>
            </h3>

            <form onSubmit={handleSave} className="portal-form" id="edit-user-form">
              <div className="form-grid-2col">
                <FormField
                  id="edit-name-input"
                  name="name"
                  label="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                  required
                />

                <FormField
                  id="edit-email-input"
                  name="email"
                  type="email"
                  label="Corporate Email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="form-grid-2col">
                <FormField
                  id="edit-phone-input"
                  name="phone"
                  type="tel"
                  label="Contact Phone"
                  placeholder="+1 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                />

                <FormField
                  id="edit-avatar-input"
                  name="avatar"
                  type="url"
                  label="Avatar Image URL"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-field-group">
                  <label htmlFor="edit-role-select" className="form-field-label">
                    Role Tier
                  </label>
                  <select
                    id="edit-role-select"
                    className="form-input"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    disabled={isSaving || !canEditRole}
                  >
                    <option value="">No Role Assigned</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {!canEditRole && (
                    <p className="form-field-helper">Only Administrators can modify role assignments.</p>
                  )}
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
                    disabled={isSaving || !canEditStatus}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {organizations.length > 0 && (
                <div className="form-field-group">
                  <label htmlFor="edit-org-select" className="form-field-label">
                    Assigned Organization / Division
                  </label>
                  <select
                    id="edit-org-select"
                    className="form-input"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="">No Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-action-row" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Link
                  to={`/users/${user.id}`}
                  className="auth-btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
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
                  Save Profile Changes
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Right Column: Status Tips & Danger Zone */}
          <div>
            <div className="user-card">
              <h4 className="user-card-title">
                <SlidersIcon size={16} />
                <span>Account Policies</span>
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                Changing a user's role or status immediately impacts their permissions across CRM contacts,
                deals, pipelines, and workspace settings.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.8rem' }}>
                <ShieldIcon size={14} />
                <span>Changes logged in security audit logs</span>
              </div>
            </div>

            {isAdmin && user.id !== currentUser?.id && (
              <div className="user-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <h4 className="user-card-title text-danger">
                  <TrashIcon size={16} />
                  <span>Danger Zone</span>
                </h4>

                <div className="danger-action-card" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                  <div className="danger-action-info">
                    <h4 style={{ fontSize: '0.9rem' }}>Delete this user account</h4>
                    <p style={{ fontSize: '0.75rem' }}>Dissociates ownership and permanently revokes access.</p>
                  </div>

                  <button
                    type="button"
                    className="auth-btn btn-danger"
                    onClick={() => setIsDeleteModalOpen(true)}
                    id="btn-open-delete-user-modal"
                  >
                    <TrashIcon size={14} />
                    <span>Delete User</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        user={user}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          navigate('/users');
        }}
      />
    </div>
  );
};
