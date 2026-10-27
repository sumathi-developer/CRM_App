import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { SecondaryLink } from '../components/auth/SecondaryLink';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { MailIcon, CheckCircleIcon, RefreshCwIcon, ArrowRightIcon, ArrowLeftIcon, SparklesIcon } from '../components/common/Icons';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(() => searchParams.get('token') || '');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const verifyToken = useCallback(async (tokenToVerify: string) => {
    setIsVerifying(true);
    setApiError(null);
    try {
      await authService.verifyEmail(tokenToVerify);
      setIsVerified(true);
    } catch (err: any) {
      setApiError(err.message || 'Verification token is invalid or has expired.');
    } finally {
      setIsVerifying(false);
    }
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [searchParams, verifyToken]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your verification token or code');
      return;
    }
    setError(null);
    verifyToken(token.trim());
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    setResendSuccess('A new verification email has been sent to your registered address.');
    setTimeout(() => setResendSuccess(null), 5000);
  };

  return (
    <AuthLayout
      title="Verify Your Work Email"
      subtitle="Ensure email security and activate your enterprise workspace features"
      heroHeadline="Enterprise Domain & Identity Verification"
      heroSubtext="Verifying your business email unlocks team workspaces, shared deal pipelines, and automated customer communication sync."
      footer={
        <div className="auth-footer-content">
          <SecondaryLink to="/login" id="link-verify-to-login" icon={<ArrowLeftIcon size={16} />}>
            Back to Sign In
          </SecondaryLink>
        </div>
      }
    >
      <ErrorMessage
        error={apiError}
        onDismiss={() => setApiError(null)}
        title="Verification Failed"
      />

      <SuccessMessage
        message={resendSuccess}
        onDismiss={() => setResendSuccess(null)}
        title="Verification Dispatched"
      />

      {isVerified ? (
        <div className="verification-success-box" id="verification-success-card">
          <div className="success-icon-large" aria-hidden="true">
            <CheckCircleIcon size={52} />
          </div>

          <SuccessMessage
            title="Email Verified Successfully!"
            message="Your email address has been confirmed and your enterprise account is now fully active."
          />

          <PrimaryButton
            type="button"
            onClick={() => navigate('/profile')}
            icon={<ArrowRightIcon size={18} />}
            iconPosition="right"
            id="btn-goto-portal-after-verify"
          >
            Go to CRM Workspace
          </PrimaryButton>
        </div>
      ) : (
        <div className="verification-card-content">
          <div className="verification-mail-header">
            <div className="mail-icon-badge" aria-hidden="true">
              <MailIcon size={32} />
            </div>
            <p className="verification-instructions">
              Please enter the verification code or token sent to your email inbox to verify your account.
            </p>
          </div>

          {/* Demo helper pill */}
          <div className="demo-token-helper">
            <button
              type="button"
              className="demo-pill"
              onClick={() => {
                setToken('CRM-VERIFY-789456');
                setError(null);
              }}
            >
              <SparklesIcon size={14} />
              <span>Use Test Code: CRM-VERIFY-789456</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="auth-form" id="email-verification-form">
            <FormField
              id="verify-token-input"
              name="token"
              type="text"
              label="Verification Code / Token"
              placeholder="e.g. CRM-VERIFY-789456"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (error) setError(null);
              }}
              error={error || undefined}
              icon={<MailIcon size={18} />}
              required
              disabled={isVerifying}
            />

            <PrimaryButton
              id="verify-submit-button"
              type="submit"
              isLoading={isVerifying}
              loadingText="Verifying Token..."
              icon={<CheckCircleIcon size={18} />}
              iconPosition="left"
            >
              Confirm Email Verification
            </PrimaryButton>
          </form>

          <div className="resend-verification-row">
            <span>Didn't receive the email?</span>
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isVerifying}
            >
              <RefreshCwIcon size={14} className={resendCooldown > 0 ? 'icon-spin' : ''} />
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </span>
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
