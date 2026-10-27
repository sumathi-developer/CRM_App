import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { roleService } from '../../services/role.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { RoleEntity, SystemPermission } from '../../types/role.types';
import { Navbar } from '../../components/common/Navbar';
import { SystemRoleBadge } from './RoleBadges';
import { PermissionsMatrix } from './PermissionsMatrix';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  LockIcon,
  ShieldIcon,
  EditIcon,
  ArrowLeftIcon,
  SearchIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

export const EditRolePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [role, setRole] = useState<RoleEntity | null>(null);
  const [allPermissions, setAllPermissions] = useState<SystemPermission[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const canManageRoles =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [roleData, permsData] = await Promise.all([
          roleService.getRoleById(id),
          roleService.getPermissions(),
        ]);

        if (!ignore) {
          setRole(roleData);
          setAllPermissions(permsData);
          setName(roleData.name || '');
          setDescription(roleData.description || '');

          const initialPermIds = (roleData.permissions || [])
            .map((rp) => rp.permissionId || rp.permission?.id)
            .filter(Boolean);
          setSelectedPermissionIds(initialPermIds);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load role for editing');
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
    if (!id || !role) return;

    const formattedName = name.trim().toUpperCase().replace(/\s+/g, '_');
    if (!formattedName) {
      setApiError('Role name is required.');
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      // 1. Update metadata if changed (system roles cannot be renamed)
      if (!role.isSystem && formattedName !== role.name) {
        await roleService.updateRole(id, {
          name: formattedName,
          description: description.trim() || undefined,
        });
      } else if (description.trim() !== (role.description || '')) {
        await roleService.updateRole(id, {
          description: description.trim() || undefined,
        });
      }

      // 2. Update permissions
      await roleService.updateRolePermissions(id, {
        permissionIds: selectedPermissionIds,
      });

      setApiSuccess(`Role "${role.name}" permissions successfully updated! Redirecting...`);
      setTimeout(() => {
        navigate(`/roles/${id}`);
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save role changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading role and permissions configuration..." />
          </div>
        </main>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>Role Not Found</h2>
            <Link to="/roles" className="auth-btn btn-primary">
              Return to Roles Roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="permission-denied-box">
            <LockIcon size={40} className="text-warning" />
            <h2>Access Denied</h2>
            <p>You need administrator permissions to configure role authorization.</p>
            <Link to={`/roles/${id}`} className="auth-btn btn-primary">
              Return to Role Details
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="edit-role-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-nav">
          <Link to={`/roles/${id}`} className="breadcrumb-link">
            <ArrowLeftIcon size={14} />
            <span>Back to {role.name} Details</span>
          </Link>
        </div>

        {/* Module Header */}
        <div className="module-header-strip">
          <div className="module-title-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="module-main-heading">Configure {role.name}</h1>
              <SystemRoleBadge isSystem={role.isSystem} />
            </div>
            <p className="module-sub-heading">
              Update role designation and reconfigure the granular permissions granted to this role.
            </p>
          </div>
        </div>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        <form onSubmit={handleSubmit} id="form-edit-role">
          <div className="team-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            {/* Metadata Card */}
            <div className="form-main-card">
              <div className="card-section-header">
                <div className="section-icon-badge primary">
                  <EditIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Role Profile</h3>
                  <p className="section-desc">Manage designation and purpose</p>
                </div>
              </div>

              <div className="form-fields-stack">
                <div className="form-row-duo">
                  <FormField
                    id="edit-role-name"
                    label="Role Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={role.isSystem}
                    helperText={
                      role.isSystem
                        ? 'System roles are core to CRM architecture and cannot be renamed.'
                        : 'Custom role designation.'
                    }
                    required
                  />

                  <div className="form-group">
                    <label htmlFor="edit-role-desc" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="edit-role-desc"
                      className="form-textarea"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Matrix Card */}
            <div className="form-main-card">
              <div className="card-section-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="section-icon-badge warning">
                    <ShieldIcon size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Reconfigure Permissions Matrix</h3>
                    <p className="section-desc">
                      Select permissions granted to this role ({selectedPermissionIds.length} of {allPermissions.length} granted)
                    </p>
                  </div>
                </div>

                <div className="filter-search-box" style={{ maxWidth: '300px' }}>
                  <SearchIcon size={14} className="search-box-icon" />
                  <input
                    type="text"
                    placeholder="Filter permissions..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="search-input-field"
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <PermissionsMatrix
                  permissions={allPermissions}
                  selectedPermissionIds={selectedPermissionIds}
                  onChange={setSelectedPermissionIds}
                  search={permSearch}
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="form-action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Link to={`/roles/${id}`} className="auth-btn btn-ghost">
                Cancel
              </Link>
              <PrimaryButton
                type="submit"
                isLoading={isSaving}
                loadingText="Saving Changes..."
                icon={<CheckCircleIcon size={16} />}
              >
                Save Role Configuration ({selectedPermissionIds.length} permissions)
              </PrimaryButton>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
