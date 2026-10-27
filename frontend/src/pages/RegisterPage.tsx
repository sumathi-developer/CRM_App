import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';
import { PasswordField } from '../components/auth/PasswordField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { SecondaryLink } from '../components/auth/SecondaryLink';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { MailIcon, UserIcon, PhoneIcon, ArrowRightIcon } from '../components/common/Icons';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Validation & status states
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid work email format';
    }

    if (phone.trim() && !/^[+0-9\s\-()]{7,20}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must accept the terms of service';
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
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      });

      setApiSuccess('Account created successfully! Setting up your workspace...');

      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 700);
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please check the entered data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your CRM Account"
      subtitle="Start managing sales pipelines and customer relationships with ease"
      heroHeadline="Join Thousands of High-Performance Sales Teams"
      heroSubtext="Experience an intelligent CRM built with role-based governance, customizable lead pipelines, and enterprise security."
      footer={
        <div className="auth-footer-content">
          <span>Already registered with an organization?</span>{' '}
          <SecondaryLink to="/login" id="link-to-login">
            Sign in to existing account
          </SecondaryLink>
        </div>
      }
    >
      <ErrorMessage
        error={apiError}
        onDismiss={() => setApiError(null)}
        title="Registration Failed"
      />

      <SuccessMessage
        message={apiSuccess}
        onDismiss={() => setApiSuccess(null)}
        title="Welcome Aboard"
      />

      <form onSubmit={handleSubmit} noValidate className="auth-form" id="register-form">
        <FormField
          id="register-name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="e.g. Eleanor Vance"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          icon={<UserIcon size={18} />}
          required
          autoComplete="name"
          disabled={isSubmitting}
        />

        <FormField
          id="register-email"
          name="email"
          type="email"
          label="Work Email Address"
          placeholder="eleanor@company.com"
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

        <FormField
          id="register-phone"
          name="phone"
          type="tel"
          label="Phone Number (Optional)"
          placeholder="+1 (555) 012-3456"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          error={errors.phone}
          icon={<PhoneIcon size={18} />}
          autoComplete="tel"
          disabled={isSubmitting}
        />

        <PasswordField
          id="register-password"
          name="password"
          label="Create Password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          showStrength={true}
          required
          autoComplete="new-password"
          disabled={isSubmitting}
        />

        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter your password"
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

        <div className="form-terms-group">
          <label className="checkbox-label" htmlFor="register-terms-checkbox">
            <input
              type="checkbox"
              id="register-terms-checkbox"
              name="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
              }}
              disabled={isSubmitting}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-text">
              I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="form-field-error-text">{errors.agreeTerms}</p>
          )}
        </div>

        <PrimaryButton
          id="register-submit-button"
          type="submit"
          isLoading={isSubmitting}
          loadingText="Creating Account..."
          icon={<ArrowRightIcon size={18} />}
          iconPosition="right"
        >
          Create Enterprise Account
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
};
