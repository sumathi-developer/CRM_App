import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { SecondaryLink } from '../components/auth/SecondaryLink';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { MailIcon, ArrowLeftIcon, ArrowRightIcon, KeyRoundIcon, SparklesIcon } from '../components/common/Icons';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setApiError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please provide your registered work email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please provide a valid email format');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword({ email: trimmed });
      setSubmittedEmail(trimmed);
      if (response.resetToken) {
        setGeneratedToken(response.resetToken);
      }
    } catch (err: any) {
      setApiError(err.message || 'Unable to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your work email address and we'll send you recovery instructions"
      heroHeadline="Enterprise Security First & Single Sign-On Ready"
      heroSubtext="Nexus CRM enforces end-to-end encryption and cryptographic password hash verification across your entire workspace."
      footer={
        <div className="auth-footer-content">
          <SecondaryLink to="/login" id="link-back-login" icon={<ArrowLeftIcon size={16} />}>
            Back to Sign In
          </SecondaryLink>
        </div>
      }
    >
      <ErrorMessage
        error={apiError}
        onDismiss={() => setApiError(null)}
        title="Recovery Request Failed"
      />

      {submittedEmail ? (
        <div className="recovery-success-box">
          <SuccessMessage
            title="Recovery Instructions Dispatched"
            message={`If an account is associated with ${submittedEmail}, a password reset token has been generated.`}
          />

          {/* Dev convenience card when token is returned in response */}
          {generatedToken && (
            <div className="dev-token-notice" id="dev-token-box">
              <div className="token-notice-header">
                <SparklesIcon size={16} />
                <span>Development Reset Token</span>
              </div>
              <p className="token-notice-desc">
                For convenience in this testing environment, your generated reset token is ready:
              </p>
              <div className="token-badge-display">
                <code>{generatedToken}</code>
              </div>
              <PrimaryButton
                type="button"
                variant="primary"
                onClick={() => navigate(`/reset-password?token=${generatedToken}`)}
                icon={<ArrowRightIcon size={16} />}
                iconPosition="right"
                id="btn-goto-reset-with-token"
              >
                Proceed to Reset Password
              </PrimaryButton>
            </div>
          )}

          <div className="recovery-help-text">
            <p>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                type="button"
                className="link-btn-text"
                onClick={() => {
                  setSubmittedEmail(null);
                  setGeneratedToken(null);
                }}
              >
                try another email address
              </button>
              .
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="auth-form" id="forgot-password-form">
          <FormField
            id="forgot-email"
            name="email"
            type="email"
            label="Registered Work Email"
            placeholder="admin@crm.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            error={error || undefined}
            icon={<MailIcon size={18} />}
            required
            autoComplete="email"
            disabled={isSubmitting}
            helperText="We will send a secure one-time reset token to this address."
          />

          <PrimaryButton
            id="forgot-submit-button"
            type="submit"
            isLoading={isSubmitting}
            loadingText="Sending Recovery Link..."
            icon={<KeyRoundIcon size={18} />}
            iconPosition="left"
          >
            Send Recovery Instructions
          </PrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
};
