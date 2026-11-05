import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/auth/Logo';
import {
  GlobeIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/common/Icons';

/* Google Official Brand Icon */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
    />
  </svg>
);

/* Instagram Official Brand Icon */
const InstagramIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="igRegisterGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path
      fill="url(#igRegisterGrad)"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

/* Facebook Official Brand Icon */
const FacebookIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleQuickDemo = () => {
    setName('Jane Doe');
    setEmail('jane.doe@company.com');
    setPhone('+1 (555) 019-2834');
    setPassword('DemoPass123!');
    setConfirmPassword('DemoPass123!');
    setAgreeTerms(true);
    setErrors({});
    setApiSuccess('Pre-filled sample registration data');
    setTimeout(() => setApiSuccess(null), 2500);
  };

  return (
    <div className="agent-login-page-root agent-signup-page-root" id="agent-signup-screen">
      {/* 3D Fluid Wave Ribbon Background (Identical to Login Page) */}
      <div className="agent-fluid-backdrop" aria-hidden="true">
        <svg
          className="agent-fluid-canvas"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgBaseGradReg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EAF4ED" />
              <stop offset="45%" stopColor="#E1F0E5" />
              <stop offset="100%" stopColor="#E8F4EC" />
            </linearGradient>

            <linearGradient id="waveRibbonDeepReg" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#D9EDE0" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#C4E7CE" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#A9D7B7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#CCE9D6" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="waveRibbonMainReg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5FCF8" />
              <stop offset="25%" stopColor="#D8F1E2" />
              <stop offset="55%" stopColor="#B3E1C2" />
              <stop offset="85%" stopColor="#8CCDA1" />
              <stop offset="100%" stopColor="#C5E8D2" />
            </linearGradient>

            <linearGradient id="waveFoldShadowReg" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#062E03" stopOpacity="0.14" />
              <stop offset="45%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="80%" stopColor="#062E03" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="waveForeGradReg" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EDF7F1" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#D5EFE0" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#BCE3CB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E6F5EC" stopOpacity="0.95" />
            </linearGradient>

            <radialGradient id="purpleAuraReg" cx="78%" cy="28%" r="48%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="emeraldLusterReg" cx="35%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.20" />
              <stop offset="60%" stopColor="#10B981" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>

            <filter id="crestGlowBlurReg" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#bgBaseGradReg)" />
          <rect width="100%" height="100%" fill="url(#purpleAuraReg)" />
          <rect width="100%" height="100%" fill="url(#emeraldLusterReg)" />

          <path
            d="M -100, 220
               C 320, 110 520, 560 920, 480
               C 1200, 420 1350, 180 1550, 260
               L 1550, 950 L -100, 950 Z"
            fill="url(#waveRibbonDeepReg)"
            opacity="0.88"
          />

          <path
            d="M -50, 290
               C 340, 210 560, 620 960, 520
               C 1240, 450 1380, 240 1520, 310
               L 1520, 920 L -50, 920 Z"
            fill="url(#waveFoldShadowReg)"
          />

          <path
            d="M -80, 160
               C 300, 60 500, 490 890, 430
               C 1180, 380 1310, 120 1550, 190
               L 1550, 950 L -80, 950 Z"
            fill="url(#waveRibbonMainReg)"
            opacity="0.95"
          />

          <path
            d="M 120, 80
               C 420, 180 560, 470 870, 400
               C 1150, 330 1260, 160 1480, 215"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeLinecap="round"
            opacity="0.65"
            filter="url(#crestGlowBlurReg)"
            fill="none"
          />

          <path
            d="M -100, 480
               C 260, 540 450, 760 820, 690
               C 1150, 620 1320, 780 1550, 700
               L 1550, 980 L -100, 980 Z"
            fill="url(#waveForeGradReg)"
            opacity="0.92"
          />
        </svg>
      </div>

      {/* 1. TOP COMPACT HEADER */}
      <header className="agent-top-navbar" role="banner">
        <div className="agent-brand-group">
          <Logo size="medium" linkTo="/login" showTagline={false} />
          <a
            href="mailto:Sales@onseclick.com"
            className="agent-brand-contact-link"
            title="Contact Enterprise Sales"
          >
            <span>Sales@onseclick.com</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="agent-navbar-actions">
          <button
            type="button"
            className="agent-globe-btn"
            title="Language & Region"
            aria-label="Language and regional selector"
            onClick={() => {
              setApiSuccess('Language: English (US)');
              setTimeout(() => setApiSuccess(null), 2000);
            }}
          >
            <GlobeIcon size={16} />
          </button>

          <Link to="/login" className="agent-nav-signup-link">
            Sign In
          </Link>

          <button
            type="button"
            className="agent-request-demo-btn"
            onClick={handleQuickDemo}
            title="Pre-fill sample sign up information"
          >
            Request Demo
          </button>
        </div>
      </header>

      {/* 2. CENTRAL HERO STAGE WITH FLOATING CARD */}
      <div className="agent-stage-viewport">
        {/* Left Mascot Character Flank */}
        <aside className="agent-mascot-flank mascot-left" aria-label="Onseclick Mascot Guide Left">
          <div className="agent-mascot-card">
            <div className="agent-mascot-img-wrap">
              <img
                src="/assets/mascot.png"
                alt="Onseclick CRM Mascot"
                className="agent-mascot-img"
              />
            </div>
          </div>
        </aside>

        {/* Central White Sign Up Card (Matching Login Box) */}
        <div className="agent-login-card agent-signup-card" role="region" aria-labelledby="agent-signup-title">
          <h1 className="agent-card-title" id="agent-signup-title">
            Create Your Account
          </h1>
          <p className="agent-card-subtitle">
            Enter your details to register your Onseclick CRM workspace.
          </p>

          {/* Feedback alerts */}
          {apiError && (
            <div className="agent-alert-box error" role="alert">
              <AlertCircleIcon size={15} />
              <span>{Array.isArray(apiError) ? apiError.join(', ') : apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="agent-alert-box success" role="status">
              <CheckCircleIcon size={15} />
              <span>{apiSuccess}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="agent-login-form"
            id="agent-register-form"
          >
            {/* 1. Full Name */}
            <div className="agent-field-wrap">
              <label htmlFor="agent-name-input" className="agent-field-label">
                Full Name
              </label>
              <div className="agent-input-container">
                <span className="agent-input-leading-icon" aria-hidden="true">
                  <UserIcon size={16} strokeWidth={1.8} />
                </span>
                <input
                  id="agent-name-input"
                  name="name"
                  type="text"
                  className="agent-form-input with-leading-icon"
                  placeholder="e.g. Eleanor Vance"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <span className="agent-field-error-text" role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            {/* 2. Work Email Address */}
            <div className="agent-field-wrap">
              <label htmlFor="agent-email-input" className="agent-field-label">
                Work Email Address
              </label>
              <div className="agent-input-container">
                <span className="agent-input-leading-icon" aria-hidden="true">
                  <MailIcon size={16} strokeWidth={1.8} />
                </span>
                <input
                  id="agent-email-input"
                  name="email"
                  type="email"
                  className="agent-form-input with-leading-icon"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoComplete="username email"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <span className="agent-field-error-text" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* 3. Phone Number (Optional) */}
            <div className="agent-field-wrap">
              <label htmlFor="agent-phone-input" className="agent-field-label">
                Phone Number <span style={{ opacity: 0.65, fontWeight: 400 }}>(Optional)</span>
              </label>
              <div className="agent-input-container">
                <span className="agent-input-leading-icon" aria-hidden="true">
                  <PhoneIcon size={16} strokeWidth={1.8} />
                </span>
                <input
                  id="agent-phone-input"
                  name="phone"
                  type="tel"
                  className="agent-form-input with-leading-icon"
                  placeholder="+1 (555) 012-3456"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  autoComplete="tel"
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && (
                <span className="agent-field-error-text" role="alert">
                  {errors.phone}
                </span>
              )}
            </div>

            {/* 4. Password */}
            <div className="agent-field-wrap">
              <label htmlFor="agent-password-input" className="agent-field-label">
                Password
              </label>
              <div className="agent-input-container">
                <span className="agent-input-leading-icon" aria-hidden="true">
                  <LockIcon size={16} strokeWidth={1.8} />
                </span>
                <input
                  id="agent-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="agent-form-input with-leading-icon with-trailing-icon"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="agent-pw-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="agent-field-error-text" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* 5. Confirm Password */}
            <div className="agent-field-wrap">
              <label htmlFor="agent-confirm-password-input" className="agent-field-label">
                Confirm Password
              </label>
              <div className="agent-input-container">
                <span className="agent-input-leading-icon" aria-hidden="true">
                  <LockIcon size={16} strokeWidth={1.8} />
                </span>
                <input
                  id="agent-confirm-password-input"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="agent-form-input with-leading-icon with-trailing-icon"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="agent-pw-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="agent-field-error-text" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="agent-remember-forgot-row" style={{ marginTop: '4px', marginBottom: '4px' }}>
              <label className="agent-remember-label" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                <input
                  type="checkbox"
                  id="agent-terms-checkbox"
                  className="agent-remember-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                  }}
                  disabled={isSubmitting}
                />
                <span>
                  I accept the{' '}
                  <Link to="/terms" className="agent-trouble-link">
                    Terms of Service
                  </Link>{' '}
                  &{' '}
                  <Link to="/privacy" className="agent-trouble-link">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>
            {errors.agreeTerms && (
              <span className="agent-field-error-text" role="alert">
                {errors.agreeTerms}
              </span>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="agent-signin-btn"
              disabled={isSubmitting}
              id="agent-signup-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="agent-btn-spinner" aria-hidden="true" />
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Social Divider */}
            <div className="agent-or-divider">
              <span>Or sign up with</span>
            </div>

            {/* Social Buttons */}
            <div className="agent-social-buttons-grid">
              <button
                type="button"
                className="agent-social-pill"
                onClick={() => {
                  setApiSuccess('Google SSO ready for OAuth API integration');
                  setTimeout(() => setApiSuccess(null), 3000);
                }}
                title="Sign up with Google"
              >
                <GoogleIcon size={16} />
                <span>Google</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => {
                  setApiSuccess('Instagram sign up ready for OAuth API integration');
                  setTimeout(() => setApiSuccess(null), 3000);
                }}
                title="Sign up with Instagram"
              >
                <InstagramIcon size={16} />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => {
                  setApiSuccess('Facebook SSO ready for OAuth API integration');
                  setTimeout(() => setApiSuccess(null), 3000);
                }}
                title="Sign up with Facebook"
              >
                <FacebookIcon size={16} />
                <span>Facebook</span>
              </button>
            </div>

            {/* Bottom Row */}
            <div className="agent-card-bottom-row">
              <span className="agent-bottom-prompt">Already have an account?</span>{' '}
              <Link to="/login" className="agent-request-now-link">
                Sign In
              </Link>
            </div>
          </form>
        </div>

        {/* Right Mascot Character Flank */}
        <aside className="agent-mascot-flank mascot-right" aria-label="Onseclick Mascot Guide Right">
          <div className="agent-mascot-card">
            <div className="agent-mascot-img-wrap">
              <img
                src="/assets/mascot.png"
                alt="Onseclick CRM Mascot"
                className="agent-mascot-img flipped"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* 3. PAGE FOOTER */}
      <footer className="agent-page-footer" role="contentinfo">
        <div className="agent-footer-inner">
          <span className="agent-footer-copyright">© 2026 Onseclick CRM. All rights reserved.</span>
          <span className="agent-footer-divider" aria-hidden="true">•</span>
          <Link to="/privacy" className="agent-footer-link">
            Privacy Policy
          </Link>
          <span className="agent-footer-divider" aria-hidden="true">•</span>
          <Link to="/terms" className="agent-footer-link">
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};
