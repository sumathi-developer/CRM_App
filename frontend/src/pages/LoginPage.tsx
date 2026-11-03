import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GlobeIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  MailIcon,
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
      <linearGradient id="igBrandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path
      fill="url(#igBrandGrad)"
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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form feedback states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered email on mount if available
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('crm_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage read issues
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Please enter your password';
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
      if (rememberMe) {
        localStorage.setItem('crm_remember_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('crm_remember_email');
      }

      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setApiSuccess('Authentication successful! Opening workspace...');

      const destination = (location.state as any)?.from?.pathname || '/workspaces';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
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
    setApiSuccess(`Filled credentials for ${demoEmail}`);
    setTimeout(() => setApiSuccess(null), 2500);
  };

  return (
    <div className="agent-login-page-root" id="agent-login-screen">
      {/* 1. DYNAMIC FLUID SILK 3D WAVE BACKGROUND LAYER (INSPIRED BY REFERENCE IMAGE) */}
      <div className="agent-fluid-wave-bg" aria-hidden="true">
        <svg
          className="agent-fluid-wave-svg"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Base Background Gradient with Primary Forest #062E03 */}
            <linearGradient id="fluidBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#041E02" />
              <stop offset="40%" stopColor="#062E03" />
              <stop offset="75%" stopColor="#0A3C07" />
              <stop offset="100%" stopColor="#041802" />
            </linearGradient>

            {/* Accent Purple Atmospheric Glow (#7C3AED) */}
            <radialGradient id="purpleAtmosphere" cx="85%" cy="20%" r="65%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#7C3AED" stopOpacity="0.1" />
              <stop offset="85%" stopColor="#7C3AED" stopOpacity="0" />
            </radialGradient>

            {/* Secondary Emerald Atmosphere Glow (#10B981) */}
            <radialGradient id="emeraldAtmosphere" cx="20%" cy="80%" r="65%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.36" />
              <stop offset="50%" stopColor="#062E03" stopOpacity="0.12" />
              <stop offset="90%" stopColor="#062E03" stopOpacity="0" />
            </radialGradient>

            {/* Wave 1 - Deep Background Silk Swell */}
            <linearGradient id="wave1Grad" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#062E03" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#0C4F0A" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#041E02" stopOpacity="0.9" />
            </linearGradient>

            {/* Wave 2 - Iconic S-Curve Silk Wave (Foreground Prominent Ribbon) */}
            <linearGradient id="wave2Grad" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#052802" />
              <stop offset="25%" stopColor="#094406" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="72%" stopColor="#34D399" />
              <stop offset="88%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#062E03" />
            </linearGradient>

            {/* Wave 3 - Luminous Crest Highlight Ribbons */}
            <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#34D399" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#A7F3D0" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#A7F3D0" stopOpacity="0.75" />
              <stop offset="92%" stopColor="#7C3AED" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>

            {/* Wave 4 - Lower Foreground Rolling Silk Dune */}
            <linearGradient id="wave4Grad" x1="0%" y1="100%" x2="100%" y2="20%">
              <stop offset="0%" stopColor="#031601" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#062E03" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#0F5A0C" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#10B981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.3" />
            </linearGradient>

            {/* Soft Silk Diffusion Filters */}
            <filter id="silkBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="30" />
            </filter>
            <filter id="gentleSilkBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>

          {/* Base Backdrop Canvas */}
          <rect width="100%" height="100%" fill="url(#fluidBg)" />
          <rect width="100%" height="100%" fill="url(#purpleAtmosphere)" />
          <rect width="100%" height="100%" fill="url(#emeraldAtmosphere)" />

          {/* Wave Layer 1: Ambient Deep Background Curve */}
          <path
            d="M-100 240 C 260 80, 520 380, 880 220 C 1180 80, 1420 280, 1600 200 L 1600 950 L -100 950 Z"
            fill="url(#wave1Grad)"
            filter="url(#silkBlur)"
            opacity="0.85"
          />

          {/* Wave Layer 2: Main Flowing Liquid Silk S-Curve Wave */}
          <path
            d="M -80 380 C 220 180, 480 520, 840 340 C 1120 200, 1360 380, 1550 260 L 1550 950 L -80 950 Z"
            fill="url(#wave2Grad)"
            opacity="0.9"
          />

          {/* Wave Layer 3: Highlight Silk Crest on the Ridge */}
          <path
            d="M -80 380 C 220 180, 480 520, 840 340 C 1120 200, 1360 380, 1550 260"
            fill="none"
            stroke="url(#crestGrad)"
            strokeWidth="38"
            strokeLinecap="round"
            filter="url(#gentleSilkBlur)"
            opacity="0.85"
          />
          <path
            d="M -80 380 C 220 180, 480 520, 840 340 C 1120 200, 1360 380, 1550 260"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#gentleSilkBlur)"
            opacity="0.55"
          />

          {/* Wave Layer 4: Upper Violet Accent Ribbon Flow (#7C3AED) */}
          <path
            d="M 480 80 C 820 20, 1140 180, 1550 110"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="32"
            strokeLinecap="round"
            filter="url(#silkBlur)"
            opacity="0.4"
          />

          {/* Wave Layer 5: Lower Foreground Silky Dune */}
          <path
            d="M -100 680 C 280 480, 680 720, 1080 540 C 1320 440, 1480 620, 1600 560 L 1600 950 L -100 950 Z"
            fill="url(#wave4Grad)"
            opacity="0.88"
          />

          {/* Wave Layer 6: Lower Dune Crest Glow */}
          <path
            d="M -100 680 C 280 480, 680 720, 1080 540 C 1320 440, 1480 620, 1600 560"
            fill="none"
            stroke="url(#crestGrad)"
            strokeWidth="24"
            strokeLinecap="round"
            filter="url(#gentleSilkBlur)"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* 2. TOP COMPACT HEADER */}
      <header className="agent-top-navbar" role="banner">
        <div className="agent-brand-group">
          <Link to="/login" className="agent-brand-logo" title="Nexus CRM Home">
            <span className="agent-brand-logo-mark" aria-hidden="true">N</span>
            <span className="agent-brand-name">Nexus<span className="agent-brand-accent">CRM</span></span>
          </Link>
          <a
            href="mailto:Sales@nexuscrm.com"
            className="agent-brand-contact-link"
            title="Contact Enterprise Sales"
          >
            <span>Sales@nexuscrm.com</span>
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

          <Link to="/register" className="agent-nav-signup-link">
            Sign Up
          </Link>

          <button
            type="button"
            className="agent-request-demo-btn"
            onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
            title="Pre-fill Admin demo credentials"
          >
            Request Demo
          </button>
        </div>
      </header>

      {/* 3. CENTRAL HERO STAGE WITH FLOATING CARD */}
      <div className="agent-stage-viewport">
        {/* Central White Login Card */}
        <div className="agent-login-card" role="region" aria-labelledby="agent-login-title">
          {/* Heading & Supporting Text */}
          <h1 className="agent-card-title" id="agent-login-title">
            Welcome Back
          </h1>
          <p className="agent-card-subtitle">
            Enter your details to access your CRM account.
          </p>

          {/* Alerts */}
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="agent-login-form"
            id="agent-login-form"
          >
            {/* Email Address Input */}
            <div className="agent-field-wrap">
              <label htmlFor="agent-email-input" className="agent-field-label">
                Email Address
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

            {/* Password Input */}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  autoComplete="current-password"
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

            {/* Remember Me and Forgot Password */}
            <div className="agent-remember-forgot-row">
              <label className="agent-remember-label">
                <input
                  type="checkbox"
                  id="agent-remember-me-checkbox"
                  className="agent-remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
              <Link to="/forgot-password" className="agent-trouble-link">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="agent-signin-btn"
              disabled={isSubmitting}
              id="agent-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="agent-btn-spinner" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Social Login Section (Google, Instagram, Facebook in 1 horizontal row) */}
            <div className="agent-or-divider">
              <span>Or continue with</span>
            </div>

            <div className="agent-social-buttons-grid">
              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
                title="Sign in with Google (Demo Admin)"
              >
                <GoogleIcon size={16} />
                <span>Google</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => {
                  setApiSuccess('Instagram login ready for OAuth API integration');
                  setTimeout(() => setApiSuccess(null), 3000);
                }}
                title="Sign in with Instagram"
              >
                <InstagramIcon size={16} />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleQuickLogin('sarah.rep@crm.com', 'Rep@123')}
                title="Sign in with Facebook (Demo Sales Rep)"
              >
                <FacebookIcon size={16} />
                <span>Facebook</span>
              </button>
            </div>

            {/* Compact Quick Demo Helper */}
            <div className="agent-quick-demo-box">
              <span className="agent-quick-demo-title">Demo Accounts:</span>
              <div className="agent-quick-demo-pills">
                <button
                  type="button"
                  className="agent-demo-click-pill"
                  onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
                  title="Auto-fill Admin credentials"
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="agent-demo-click-pill"
                  onClick={() => handleQuickLogin('sarah.rep@crm.com', 'Rep@123')}
                  title="Auto-fill Sales Rep credentials"
                >
                  Sales Rep
                </button>
              </div>
            </div>

            {/* Registration Link */}
            <div className="agent-request-now-row">
              <span>Don't have an account?</span>
              <Link to="/register" className="agent-request-now-link">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* 4. PAGE FOOTER */}
      <footer className="agent-page-footer" role="contentinfo">
        <span>© 2026 Nexus CRM. All rights reserved.</span>
        <span className="agent-footer-divider">•</span>
        <Link to="/privacy" className="agent-footer-link">
          Privacy Policy
        </Link>
        <span className="agent-footer-divider">•</span>
        <Link to="/terms" className="agent-footer-link">
          Terms & Conditions
        </Link>
      </footer>
    </div>
  );
};
