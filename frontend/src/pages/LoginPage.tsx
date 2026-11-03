import React, { useState, useEffect } from 'react';
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

/* Google Icon SVG (Standard Multi-color Brand Glyph) */
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

/* Instagram Icon SVG (Replaces Apple ID with Official Camera Gradient) */
const InstagramIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="igLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEE411" />
        <stop offset="20%" stopColor="#FEDB16" />
        <stop offset="40%" stopColor="#F35339" />
        <stop offset="60%" stopColor="#E02D69" />
        <stop offset="80%" stopColor="#B322B2" />
        <stop offset="100%" stopColor="#515BD4" />
      </linearGradient>
    </defs>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#igLogoGrad)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.2" stroke="url(#igLogoGrad)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.3" fill="url(#igLogoGrad)" />
  </svg>
);

/* Facebook Icon SVG (Official Blue Brand Glyph) */
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form feedback states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remember me preference if stored
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('nexus_crm_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Non-blocking storage fallback
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
        localStorage.setItem('nexus_crm_remember_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('nexus_crm_remember_email');
      }

      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setApiSuccess('Authentication successful! Accessing CRM workspace...');

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

  // Social notice (honest notification for Instagram / social demo)
  const handleSocialNotice = (provider: string) => {
    setApiSuccess(`${provider} sign-in is currently in sandbox testing. Please use demo credentials.`);
    setTimeout(() => setApiSuccess(null), 3000);
  };

  return (
    <div className="agent-login-page-root" id="agent-login-screen">
      {/* Background Horizon Line */}
      <div className="agent-ground-horizon" aria-hidden="true" />

      {/* 1. COMPACT TOP HEADER */}
      <header className="agent-top-navbar" role="banner">
        <div className="agent-brand-group">
          <Link to="/login" className="agent-brand-logo" title="Nexus CRM">
            <span className="agent-brand-logo-mark" aria-hidden="true">N</span>
            <span>Nexus CRM</span>
          </Link>
          <a
            href="mailto:Sales@Nexus.crm"
            className="agent-brand-contact-link"
            title="Contact Enterprise Sales"
          >
            <span>Sales@Nexus.crm</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="agent-navbar-actions">
          <button
            type="button"
            className="agent-globe-btn"
            title="Language & Regional Settings"
            aria-label="Language and regional selector"
            onClick={() => {
              setApiSuccess('Language: English (US)');
              setTimeout(() => setApiSuccess(null), 2000);
            }}
          >
            <GlobeIcon size={16} />
          </button>

          <Link to="/register" className="agent-nav-signup-link">
            Sign up
          </Link>

          <button
            type="button"
            className="agent-request-demo-btn"
            onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
            title="Click to pre-fill Admin demo credentials"
          >
            Request Demo
          </button>
        </div>
      </header>

      {/* 2. CENTRAL HERO STAGE: CENTERED LOGIN CARD & SUPPORTING VISUALS */}
      <main className="agent-stage-viewport" role="main">
        {/* Left Decorative Minimalist Line-Art Graphics */}
        <svg
          className="agent-illustration-left"
          viewBox="0 0 280 440"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="leftDotGrid"
              x="0"
              y="0"
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="6" cy="6" r="1.6" fill="#10B981" opacity="0.35" />
            </pattern>
          </defs>

          {/* Thin curved line-art graphic top left */}
          <path
            d="M20 120 C 50 80, 75 140, 105 95 C 135 65, 165 110, 195 85"
            stroke="#10B981"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.65"
            fill="none"
          />

          {/* Subtle purple accent ring */}
          <circle cx="150" cy="165" r="4" fill="none" stroke="#7C3AED" strokeWidth="1.8" opacity="0.6" />

          {/* Minimalist floating document card outline */}
          <rect
            x="35"
            y="145"
            width="95"
            height="68"
            rx="6"
            fill="#FFFFFF"
            stroke="#E5E5DF"
            strokeWidth="1.5"
          />
          <line
            x1="50"
            y1="172"
            x2="100"
            y2="172"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <line
            x1="50"
            y1="186"
            x2="85"
            y2="186"
            stroke="#737373"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* Minimalist curved connector doodle */}
          <path
            d="M155 240 C 175 260, 185 235, 205 250"
            stroke="#737373"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
            fill="none"
          />

          {/* Architectural pillar with delicate emerald polka dots */}
          <rect
            x="20"
            y="260"
            width="60"
            height="130"
            rx="4"
            fill="#F4F4EE"
            stroke="#E5E5DF"
            strokeWidth="1.2"
          />
          <rect x="20" y="260" width="60" height="130" rx="4" fill="url(#leftDotGrid)" />

          {/* Minimalist cube with upward growth arrow */}
          <rect
            x="90"
            y="295"
            width="62"
            height="95"
            rx="4"
            fill="#FFFFFF"
            stroke="#E5E5DF"
            strokeWidth="1.5"
          />
          <path
            d="M106 355 L 132 318 M 132 318 L 116 318 M 132 318 L 132 334"
            stroke="#062E03"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Small purple accent dot */}
          <circle cx="170" cy="275" r="3" fill="#7C3AED" opacity="0.65" />
        </svg>

        {/* 3. CENTERED MAIN LOGIN CARD – PRIMARY VISUAL FOCUS */}
        <section className="agent-login-card" aria-labelledby="agent-login-title">
          <h1 className="agent-card-title" id="agent-login-title">
            Welcome Back
          </h1>
          <p className="agent-card-subtitle">
            Enter your details to access your CRM account.
          </p>

          {/* Feedback alerts */}
          {apiError && (
            <div className="agent-alert-box error" role="alert">
              <AlertCircleIcon size={16} />
              <span>{Array.isArray(apiError) ? apiError.join(', ') : apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="agent-alert-box success" role="status">
              <CheckCircleIcon size={16} />
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
            {/* Input 1: Email Address */}
            <div className="agent-field-wrap">
              <div className="agent-input-container">
                <div className="agent-input-leading-icon" aria-hidden="true">
                  <MailIcon size={18} />
                </div>
                <input
                  id="agent-email-input"
                  name="email"
                  type="email"
                  className="agent-form-input"
                  placeholder="Email Address"
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

            {/* Input 2: Password with Eye/EyeOff toggle */}
            <div className="agent-field-wrap">
              <div className="agent-input-container">
                <div className="agent-input-leading-icon" aria-hidden="true">
                  <LockIcon size={18} />
                </div>
                <input
                  id="agent-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="agent-form-input"
                  placeholder="Password"
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
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="agent-field-error-text" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="agent-form-options-row">
              <label className="agent-remember-label">
                <input
                  type="checkbox"
                  id="agent-remember-me-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Remember Me</span>
              </label>

              <Link to="/forgot-password" className="agent-forgot-link">
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
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Social Separator */}
            <div className="agent-social-divider" aria-hidden="true">
              <span>Or continue with</span>
            </div>

            {/* Social Buttons: Google, Instagram, Facebook */}
            <div className="agent-social-buttons-grid">
              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
                title="Sign in with Google (Demo Admin)"
              >
                <GoogleIcon size={17} />
                <span>Google</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleSocialNotice('Instagram')}
                title="Sign in with Instagram"
              >
                <InstagramIcon size={17} />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleQuickLogin('sarah.rep@crm.com', 'Rep@123')}
                title="Sign in with Facebook (Demo Sales Rep)"
              >
                <FacebookIcon size={17} />
                <span>Facebook</span>
              </button>
            </div>

            {/* Quick Demo Credentials Switcher */}
            <div className="agent-quick-demo-box">
              <span className="agent-quick-demo-title">Quick Demo Login:</span>
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

            {/* Registration Text */}
            <div className="agent-request-now-row">
              <span>Don't have an account?</span>
              <Link to="/register" className="agent-request-now-link">
                Sign Up
              </Link>
            </div>
          </form>
        </section>

        {/* 4. PROFESSIONAL HUMAN AVATAR ILLUSTRATION – RIGHT SIDE */}
        <svg
          className="agent-illustration-right"
          viewBox="0 0 380 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="rightDotGrid"
              x="0"
              y="0"
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="6" cy="6" r="1.6" fill="#062E03" opacity="0.22" />
            </pattern>
            <linearGradient id="laptopScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#062E03" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Floating line-art squiggle top right */}
          <path
            d="M285 130 C 315 115, 325 155, 345 135"
            stroke="#10B981"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />

          {/* Minimalist floating notification / speech card above agent */}
          <rect
            x="220"
            y="115"
            width="60"
            height="40"
            rx="8"
            fill="#FFFFFF"
            stroke="#E5E5DF"
            strokeWidth="1.5"
          />
          <line
            x1="234"
            y1="129"
            x2="266"
            y2="129"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="234"
            y1="140"
            x2="254"
            y2="140"
            stroke="#7C3AED"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Small purple accent dot */}
          <circle cx="212" cy="245" r="3.5" fill="#7C3AED" opacity="0.7" />

          {/* Minimalist architectural pedestal cube the professional sits on */}
          <rect
            x="235"
            y="265"
            width="80"
            height="145"
            rx="4"
            fill="#FFFFFF"
            stroke="#E5E5DF"
            strokeWidth="1.5"
          />
          <rect x="235" y="265" width="80" height="145" rx="4" fill="rgba(6, 46, 3, 0.02)" />

          {/* Architectural pillar on far right with subtle dark green polka dots */}
          <rect
            x="325"
            y="290"
            width="50"
            height="120"
            rx="3"
            fill="#F4F4EE"
            stroke="#E5E5DF"
            strokeWidth="1.2"
          />
          <rect x="325" y="290" width="50" height="120" rx="3" fill="url(#rightDotGrid)" />

          {/* PROFESSIONAL HUMAN AVATAR */}
          {/* Left leg (crossed comfortably forward) */}
          <path
            d="M245 255 C 235 275, 215 315, 210 325 C 218 332, 230 330, 238 322 C 248 305, 258 275, 262 255 Z"
            fill="#FFFFFF"
            stroke="#D4D4CE"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Right leg (resting naturally downwards) */}
          <path
            d="M258 255 C 252 285, 245 325, 245 338 C 255 342, 265 338, 270 330 C 275 305, 280 275, 280 255 Z"
            fill="#FFFFFF"
            stroke="#D4D4CE"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Loafer shoes in deep forest green (#062E03) */}
          <path
            d="M205 324 L 198 335 C 196 342, 204 345, 215 343 L 222 328 Z"
            fill="#062E03"
            stroke="#062E03"
            strokeWidth="1"
          />
          <path
            d="M242 336 L 244 348 C 245 354, 254 354, 262 350 L 260 334 Z"
            fill="#062E03"
            stroke="#062E03"
            strokeWidth="1"
          />

          {/* Corporate blazer in deep forest green (#062E03) */}
          <path
            d="M258 195 C 248 210, 242 235, 248 260 L 285 260 C 290 235, 288 210, 278 195 Z"
            fill="#062E03"
          />

          {/* Inner blouse with emerald collar accent */}
          <path d="M264 195 L 268 215 L 272 195 Z" fill="#FFFFFF" />
          <line x1="264" y1="198" x2="268" y2="214" stroke="#10B981" strokeWidth="1.5" />
          <path
            d="M258 195 L 268 225 L 278 195"
            fill="none"
            stroke="#10B981"
            strokeWidth="1.2"
            opacity="0.6"
          />

          {/* Neck */}
          <rect x="265" y="184" width="7" height="13" rx="2" fill="#F6D6C2" />

          {/* Head & Natural Profile */}
          <ellipse cx="268" cy="175" rx="8" ry="9.5" fill="#F6D6C2" />
          <circle cx="274" cy="176" r="2.2" fill="#E8BFA8" />
          <path
            d="M263 176 Q 265 178 267 177"
            stroke="#9A6B53"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />

          {/* Chic modern topknot bun in rich dark espresso with purple accessory pin */}
          <path
            d="M263 172 C 258 162, 274 158, 276 169 C 283 169, 285 178, 282 186 C 278 192, 269 191, 267 184 Z"
            fill="#261C14"
          />
          <circle cx="274" cy="159" r="5" fill="#261C14" />
          <circle cx="278" cy="162" r="2" fill="#7C3AED" />

          {/* Slim metallic laptop on lap with emerald glow */}
          <polygon
            points="214,196 226,250 258,250 248,196"
            fill="#F1F5F9"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          <polygon
            points="216,199 227,247 256,247 246,199"
            fill="url(#laptopScreenGrad)"
          />
          {/* Subtle dashboard lines on screen */}
          <line
            x1="223"
            y1="212"
            x2="242"
            y2="212"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="225"
            y1="222"
            x2="238"
            y2="222"
            stroke="#7C3AED"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Laptop keyboard base */}
          <line
            x1="224"
            y1="250"
            x2="265"
            y2="250"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Arms typing naturally on laptop */}
          <path
            d="M260 205 C 248 218, 236 226, 240 242"
            fill="none"
            stroke="#062E03"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M240 242 C 242 245, 246 247, 250 248"
            fill="none"
            stroke="#F6D6C2"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </main>

      {/* 5. COMPACT FOOTER */}
      <footer className="agent-page-footer" role="contentinfo">
        <span>&copy; 2026 Nexus CRM. All rights reserved.</span>
        <div className="agent-footer-links">
          <Link to="/privacy-policy" className="agent-footer-link">
            Privacy Policy
          </Link>
          <span aria-hidden="true">&bull;</span>
          <Link to="/terms" className="agent-footer-link">
            Terms and Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};
