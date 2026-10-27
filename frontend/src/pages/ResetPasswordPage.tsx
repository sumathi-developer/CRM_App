import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { SecondaryLink } from '../components/auth/SecondaryLink';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { KeyRoundIcon, ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from '../components/common/Icons';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(() => searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form states
  const [errors, setErrors] = useState<{ token?: string; newPassword?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: any;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate('/login');
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!token.trim()) {
      newErrors.token = 'Reset password token is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
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

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword({
        token: token.trim(),
        newPassword,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.message || 'Invalid or expired password reset token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter your security token and configure your new CRM password"
      footer={
        <div className="auth-footer-content">
          <SecondaryLink to="/login" id="link-reset-to-login" icon={<ArrowLeftIcon size={16} />}>
            Back to Sign In
          </SecondaryLink>
        </div>
      }
    >
      <ErrorMessage
        error={apiError}
        onDismiss={() => setApiError(null)}
        title="Reset Failed"
      />

      {isSuccess ? (
        <div className="reset-success-box" id="reset-success-container">
          <div className="success-icon-large" aria-hidden="true">
            <CheckCircleIcon size={48} />
          </div>
          <SuccessMessage
            title="Password Successfully Updated!"
            message="Your account credentials have been updated with the new password. You can now use your new password to sign in."
          />
          <p className="redirect-countdown-text">
            Redirecting to login in <strong>{countdown}</strong> seconds...
          </p>
          <PrimaryButton
            type="button"
            onClick={() => navigate('/login')}
            icon={<ArrowRightIcon size={18} />}
            iconPosition="right"
            id="btn-goto-login-now"
          >
            Sign In Now
          </PrimaryButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="auth-form" id="reset-password-form">
          <FormField
            id="reset-token"
            name="token"
            type="text"
            label="Password Reset Token"
            placeholder="Paste your reset token here"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              if (errors.token) setErrors((prev) => ({ ...prev, token: undefined }));
            }}
            error={errors.token}
            icon={<KeyRoundIcon size={18} />}
            required
            disabled={isSubmitting}
            helperText="Check your email or development banner for your unique token."
          />

          <PasswordField
            id="reset-new-password"
            name="newPassword"
            label="New Password"
            placeholder="At least 6 characters"
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
          />

          <PasswordField
            id="reset-confirm-password"
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

          <PrimaryButton
            id="reset-submit-button"
            type="submit"
            isLoading={isSubmitting}
            loadingText="Updating Password..."
            icon={<CheckCircleIcon size={18} />}
            iconPosition="left"
          >
            Update CRM Password
          </PrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
};
