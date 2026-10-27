import React, { useState } from 'react';
import type { WorkspaceRole } from '../../types/workspace.types';
import { workspaceService } from '../../services/workspace.service';
import { FormField } from '../auth/FormField';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { ShieldIcon, XIcon, PlusIcon, CheckCircleIcon } from '../common/Icons';

interface CreateRoleModalProps {
  isOpen: boolean;
  workspaceId: string;
  roleToEdit?: WorkspaceRole | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { group: 'Workspace', key: 'workspace:read', label: 'View workspace info & metadata' },
  { group: 'Workspace', key: 'workspace:write', label: 'Edit workspace profile & settings' },
  { group: 'Workspace', key: 'workspace:manage', label: 'Manage workspace lifecycle' },
  { group: 'Members', key: 'members:read', label: 'View member roster' },
  { group: 'Members', key: 'members:write', label: 'Invite & update members' },
  { group: 'Members', key: 'members:delete', label: 'Remove workspace members' },
  { group: 'Contacts', key: 'contacts:read', label: 'View customer contacts' },
  { group: 'Contacts', key: 'contacts:write', label: 'Create & edit contacts' },
  { group: 'Leads', key: 'leads:read', label: 'View lead pipeline' },
  { group: 'Leads', key: 'leads:write', label: 'Create & convert leads' },
  { group: 'Deals', key: 'deals:read', label: 'View sales opportunities' },
  { group: 'Deals', key: 'deals:write', label: 'Manage deal stages & revenue' },
  { group: 'Reports', key: 'reports:read', label: 'View business revenue analytics' },
  { group: 'Settings', key: 'settings:manage', label: 'Configure global settings' },
];

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  workspaceId,
  roleToEdit,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(roleToEdit?.name || '');
  const [description, setDescription] = useState(roleToEdit?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    roleToEdit?.permissions || ['workspace:read', 'members:read', 'contacts:read', 'leads:read']
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePermission = (permKey: string) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const selectAll = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map((p) => p.key));
  };

  const deselectAll = () => {
    setSelectedPermissions(['workspace:read']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setApiError('Role name is required');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      if (roleToEdit) {
        await workspaceService.updateRole(workspaceId, roleToEdit.id, {
          name: name.trim().toUpperCase(),
          description: description.trim() || undefined,
          permissions: selectedPermissions,
        });
      } else {
        await workspaceService.createRole(workspaceId, {
          name: name.trim().toUpperCase(),
          description: description.trim() || undefined,
          permissions: selectedPermissions,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to save workspace role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-role-title">
      <div className="modal-container modal-wide">
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <ShieldIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="create-role-title" className="modal-title">
              {roleToEdit ? `Edit Role: ${roleToEdit.name}` : 'Create Custom Role'}
            </h3>
            <p className="modal-subtitle">Define granular authorization policies for team members</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" id="create-role-form">
          <div className="modal-body">
            <ErrorMessage
              error={apiError}
              onDismiss={() => setApiError(null)}
              title="Role Error"
            />

            <FormField
              id="role-name-input"
              name="name"
              label="Role Name"
              placeholder="e.g. SALES_TEAM_LEAD"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              required
              disabled={isSubmitting || roleToEdit?.isSystem}
              helperText="Identifiers will be uppercase (e.g. OPERATIONS_DIRECTOR)"
            />

            <div className="form-field-group">
              <label htmlFor="role-desc-input" className="form-field-label">
                Description (Optional)
              </label>
              <textarea
                id="role-desc-input"
                name="description"
                className="form-textarea"
                rows={2}
                placeholder="What responsibilities does this role have..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="permissions-selector-box">
              <div className="permissions-header-row">
                <span className="permissions-label">
                  Granular Permissions ({selectedPermissions.length} selected)
                </span>
                <div className="permissions-quick-actions">
                  <button type="button" className="text-action-link" onClick={selectAll}>
                    Select All
                  </button>
                  <span className="meta-dot">&bull;</span>
                  <button type="button" className="text-action-link" onClick={deselectAll}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="permissions-grid">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`permission-checkbox-card ${isChecked ? 'is-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.key)}
                        disabled={isSubmitting}
                      />
                      <div className="permission-text-wrap">
                        <span className="permission-key">{perm.key}</span>
                        <span className="permission-desc">{perm.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Saving..."
              icon={roleToEdit ? <CheckCircleIcon size={16} /> : <PlusIcon size={16} />}
              fullWidth={false}
              id="btn-confirm-save-role"
            >
              {roleToEdit ? 'Save Changes' : 'Create Role'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
