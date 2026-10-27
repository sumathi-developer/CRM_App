import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { roleService } from '../../services/role.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { SystemPermission, CreateRolePayload } from '../../types/role.types';
import { Navbar } from '../../components/common/Navbar';
import { PermissionsMatrix } from './PermissionsMatrix';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  LockIcon,
  ShieldIcon,
  PlusIcon,
  ArrowLeftIcon,
  SearchIcon,
} from '../../components/common/Icons';

export const CreateRolePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<SystemPermission[]>([]);
  const [permSearch, setPermSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const canManageRoles =
    currentUser?.role?.name === 'ADMIN' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;

    const loadPermissions = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const perms = await roleService.getPermissions();
        if (!ignore) {
          setAllPermissions(perms);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load system permissions catalog');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadPermissions();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const roleName = name.trim().toUpperCase().replace(/\s+/g, '_');
    if (!roleName) {
      setApiError('Role name is required.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: CreateRolePayload = {
        name: roleName,
        description: description.trim() || undefined,
        permissionIds: selectedPermissionIds,
      };

      const created = await roleService.createRole(payload);
      setApiSuccess(`Role "${created.name}" created successfully with ${selectedPermissionIds.length} permissions! Redirecting...`);
      setTimeout(() => {
        navigate(`/roles/${created.id}`);
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageRoles) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="permission-denied-box">
            <LockIcon size={40} className="text-warning" />
            <h2>Access Denied</h2>
            <p>You need administrator permissions to create and configure custom roles.</p>
            <Link to="/roles" className="auth-btn btn-primary">
              Return to Roles Roster
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="create-role-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-nav">
          <Link to="/roles" className="breadcrumb-link">
            <ArrowLeftIcon size={14} />
            <span>Back to Roles & Permissions</span>
          </Link>
        </div>

        {/* Module Header */}
        <div className="module-header-strip">
          <div className="module-title-area">
            <h1 className="module-main-heading">Create Custom Role</h1>
            <p className="module-sub-heading">
              Define a new access role and select granular permissions to authorize CRM operations.
            </p>
          </div>
        </div>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        {isLoading ? (
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading permissions catalog..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="form-create-role">
            <div className="team-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              {/* Role Metadata Card */}
              <div className="form-main-card">
                <div className="card-section-header">
                  <div className="section-icon-badge primary">
                    <ShieldIcon size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Role Designation</h3>
                    <p className="section-desc">Set the unique role identifier and purpose</p>
                  </div>
                </div>

                <div className="form-fields-stack">
                  <div className="form-row-duo">
                    <FormField
                      id="role-name-input"
                      label="Role Name"
                      type="text"
                      placeholder="e.g. SUPPORT_LEAD or REGIONAL_SALES_REP"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      helperText="Standard uppercase identifier (auto-formatted on save)."
                    />

                    <div className="form-group">
                      <label htmlFor="role-description-input" className="form-label">
                        Description
                      </label>
                      <textarea
                        id="role-description-input"
                        className="form-textarea"
                        rows={2}
                        placeholder="Describe the operational scope and intended responsibilities for this role..."
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
                      <LockIcon size={18} />
                    </div>
                    <div>
                      <h3 className="section-title">Granted Permissions Matrix</h3>
                      <p className="section-desc">
                        Select which resources and actions users with this role can execute ({selectedPermissionIds.length} of {allPermissions.length} selected)
                      </p>
                    </div>
                  </div>

                  <div className="filter-search-box" style={{ maxWidth: '300px' }}>
                    <SearchIcon size={14} className="search-box-icon" />
                    <input
                      type="text"
                      placeholder="Filter matrix permissions..."
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

              {/* Form Action Controls */}
              <div className="form-action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Link to="/roles" className="auth-btn btn-ghost">
                  Cancel
                </Link>
                <PrimaryButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Creating Role..."
                  icon={<PlusIcon size={16} />}
                >
                  Create Role ({selectedPermissionIds.length} permissions)
                </PrimaryButton>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
