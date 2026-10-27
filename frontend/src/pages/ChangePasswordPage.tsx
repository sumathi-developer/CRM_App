import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { Navbar } from '../components/common/Navbar';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { KeyRoundIcon, ShieldIcon, CheckCircleIcon } from '../components/common/Icons';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form states
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Enter your current password';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Enter your new password';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long';
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setApiError(null);
    setApiSuccess(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setApiSuccess(response.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err: any) {
      setApiError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="change-password-page">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Change Password</h1>
            <p className="page-subtitle">
              Manage your CRM security credentials and protect your workspace account
            </p>
          </div>
        </div>

        <div className="portal-grid">
          {/* Main Security Form */}
          <div className="portal-card form-portal-card">
            <div className="card-section-header">
              <div className="section-icon-badge" aria-hidden="true">
                <KeyRoundIcon size={20} />
              </div>
              <div>
                <h2 className="section-title">Update Your Password</h2>
                <p className="section-desc">
                  Choose a strong, unique password with letters, numbers, and symbols.
                </p>
              </div>
            </div>

            <ErrorMessage
              error={apiError}
              onDismiss={() => setApiError(null)}
              title="Password Update Failed"
            />

            <SuccessMessage
              message={apiSuccess}
              onDismiss={() => setApiSuccess(null)}
              title="Security Updated"
            />

            <form onSubmit={handleSubmit} noValidate className="portal-form" id="change-password-form">
              <PasswordField
                id="current-password"
                name="currentPassword"
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                error={errors.currentPassword}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />

              <PasswordField
                id="new-password"
                name="newPassword"
                label="New Password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                error={errors.newPassword}
                showStrength={true}
                required
                autoComplete="new-password"
                disabled={isSubmitting}
                helperText="Must be different from your current password."
              />

              <PasswordField
                id="confirm-new-password"
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                disabled={isSubmitting}
              />

              <div className="form-action-row">
                <PrimaryButton
                  id="change-password-submit-btn"
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Updating Password..."
                  icon={<CheckCircleIcon size={18} />}
                  iconPosition="left"
                  fullWidth={false}
                >
                  Save New Password
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Security Recommendations Sidebar */}
          <aside className="portal-sidebar">
            <div className="portal-card tips-card">
              <div className="tips-card-header">
                <ShieldIcon size={20} className="tips-icon" />
                <h3 className="tips-title">Password Security Tips</h3>
              </div>
              <ul className="tips-list">
                <li>
                  <strong>Length:</strong> Use at least 8 to 12 characters for elevated security.
                </li>
                <li>
                  <strong>Complexity:</strong> Combine uppercase letters, digits, and special symbols (e.g. @, #, $, !).
                </li>
                <li>
                  <strong>Uniqueness:</strong> Never reuse passwords across different business or personal services.
                </li>
                <li>
                  <strong>Sessions:</strong> Changing your password keeps your current session active while invalidating older unverified tokens.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
