import React, { useState } from 'react';
import type { Role, Organization, User } from '../../types/user.types';
import { userService } from '../../services/user.service';
import { FormField } from '../auth/FormField';
import { PasswordField } from '../auth/PasswordField';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { UserPlusIcon, XIcon, CheckCircleIcon } from '../common/Icons';

interface InviteUserModalProps {
  isOpen: boolean;
  roles: Role[];
  organizations: Organization[];
  onClose: () => void;
  onSuccess: (createdUser: User) => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  roles,
  organizations,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Welcome@CRM123');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState<string>(roles[0]?.id || '');
  const [organizationId, setOrganizationId] = useState<string>(organizations[0]?.id || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setApiError('Full name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setApiError('Valid email address is required.');
      return;
    }

    if (password.length < 6) {
      setApiError('Temporary password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const newUser = await userService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        roleId: roleId || undefined,
        organizationId: organizationId || undefined,
        status,
      });

      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
      <div className="modal-container" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <UserPlusIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="invite-modal-title" className="modal-title">Invite / Create User</h3>
            <p className="modal-subtitle">Provision access for a new team member</p>
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

        <form onSubmit={handleSubmit} className="modal-form" id="invite-user-form">
          <div className="modal-body">
            <ErrorMessage error={apiError} />

            <FormField
              id="invite-name-input"
              name="name"
              label="Full Name *"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />

            <FormField
              id="invite-email-input"
              name="email"
              type="email"
              label="Corporate Email *"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-field-group">
                <label htmlFor="invite-role-select" className="form-field-label">
                  Assigned Role *
                </label>
                <select
                  id="invite-role-select"
                  className="form-input"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Standard User</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label htmlFor="invite-status-select" className="form-field-label">
                  Initial Status
                </label>
                <select
                  id="invite-status-select"
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  disabled={isSubmitting}
                >
                  <option value="ACTIVE">Active (Immediate Access)</option>
                  <option value="INACTIVE">Inactive (Pending Onboarding)</option>
                </select>
              </div>
            </div>

            <FormField
              id="invite-phone-input"
              name="phone"
              type="tel"
              label="Phone Number"
              placeholder="+1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />

            {organizations.length > 0 && (
              <div className="form-field-group">
                <label htmlFor="invite-org-select" className="form-field-label">
                  Organization / Department
                </label>
                <select
                  id="invite-org-select"
                  className="form-input"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  disabled={isSubmitting}
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

            <PasswordField
              id="invite-password-input"
              name="password"
              label="Temporary Password *"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              helperText="The user will be prompted to reset their password upon initial sign-in."
            />

            <label className="settings-toggle-card" style={{ marginTop: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                disabled={isSubmitting}
              />
              <div>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>Send Welcome Invitation Email</span>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Delivers sign-in instructions and temporary credentials to the user's inbox.
                </p>
              </div>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Provisioning..."
              icon={<CheckCircleIcon size={16} />}
              fullWidth={false}
              id="btn-submit-invite-user"
            >
              Provision User
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
