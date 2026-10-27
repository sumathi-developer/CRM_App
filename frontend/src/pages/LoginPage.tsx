import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { SecondaryLink } from '../components/auth/SecondaryLink';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { MailIcon, ArrowRightIcon, SparklesIcon } from '../components/common/Icons';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Form states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email format (e.g. name@company.com)';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
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
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setApiSuccess('Authentication successful! Loading your CRM workspace...');

      const destination = (location.state as any)?.from?.pathname || '/profile';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo accounts helper
  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
    setApiError(null);
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Enter your enterprise credentials to access your CRM workspace"
      footer={
        <div className="auth-footer-content">
          <span>Don't have an enterprise account?</span>{' '}
          <SecondaryLink to="/register" id="link-to-register">
            Create an account
          </SecondaryLink>
        </div>
      }
    >
      {/* Quick Demo Credentials Pill Bar */}
      <div className="demo-credentials-banner" aria-label="Demo login helpers">
        <div className="demo-banner-title">
          <SparklesIcon size={14} />
          <span>Quick Demo Fill:</span>
        </div>
        <div className="demo-pills-row">
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
            title="Auto-fill Administrator credentials"
          >
            Admin (admin@crm.com)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleQuickLogin('sarah.rep@crm.com', 'Rep@123')}
            title="Auto-fill Sales Representative credentials"
          >
            Sales Rep (sarah.rep@crm.com)
          </button>
        </div>
      </div>

      <ErrorMessage
        error={apiError}
        onDismiss={() => setApiError(null)}
        title="Authentication Error"
      />

      <SuccessMessage
        message={apiSuccess}
        onDismiss={() => setApiSuccess(null)}
        title="Signed In"
      />

      <form onSubmit={handleSubmit} noValidate className="auth-form" id="login-form">
        <FormField
          id="login-email"
          name="email"
          type="email"
          label="Work Email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          icon={<MailIcon size={18} />}
          required
          autoComplete="username email"
          disabled={isSubmitting}
        />

        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          required
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        <div className="form-options-row">
          <label className="checkbox-label" htmlFor="remember-me-checkbox">
            <input
              type="checkbox"
              id="remember-me-checkbox"
              name="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-text">Keep me logged in for 30 days</span>
          </label>

          <SecondaryLink
            to="/forgot-password"
            id="link-forgot-password"
            className="forgot-password-link"
          >
            Forgot password?
          </SecondaryLink>
        </div>

        <PrimaryButton
          id="login-submit-button"
          type="submit"
          isLoading={isSubmitting}
          loadingText="Authenticating..."
          icon={<ArrowRightIcon size={18} />}
          iconPosition="right"
        >
          Sign In to CRM
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
};
