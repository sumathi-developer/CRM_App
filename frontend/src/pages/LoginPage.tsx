import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlobeIcon, AlertCircleIcon, CheckCircleIcon } from '../components/common/Icons';

/* Google Icon SVG (strictly styled with user palette #10B981, #7C3AED, #062E03) */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#7C3AED"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
    />
    <path
      fill="#10B981"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.35 24 12 24z"
    />
    <path
      fill="#10B981"
      opacity="0.85"
      d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.1z"
    />
    <path
      fill="#062E03"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
    />
  </svg>
);

/* Facebook Icon SVG (replaces Apple ID, styled with Accent color #7C3AED) */
const FacebookIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#7C3AED" aria-hidden="true">
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

  // Form feedback states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | string[] | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email or phone number';
    }

    if (!password) {
      newErrors.password = 'Please enter your passcode';
    } else if (password.length < 6) {
      newErrors.password = 'Passcode must be at least 6 characters long';
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
      {/* Background Horizon Line */}
      <div className="agent-ground-horizon" aria-hidden="true" />

      {/* 1. TOP NAVBAR HEADER */}
      <header className="agent-top-navbar" role="banner">
        <div className="agent-brand-group">
          <Link to="/login" className="agent-brand-logo" title="Razor CRM">
            <span>Razor</span>
          </Link>
          <a
            href="mailto:Sales@Razor.uk"
            className="agent-brand-contact-link"
            title="Contact Enterprise Sales"
          >
            <span>Sales@Razor.uk</span>
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
              setApiSuccess('Region: English (Global)');
              setTimeout(() => setApiSuccess(null), 2000);
            }}
          >
            <GlobeIcon size={18} />
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

      {/* 2. CENTRAL HERO STAGE WITH ILLUSTRATIONS & FLOATING CARD */}
      <div className="agent-stage-viewport">
        {/* Left Memphis-Style Background Illustration */}
        <svg
          className="agent-illustration-left"
          viewBox="0 0 320 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="dotPatternLeft"
              x="0"
              y="0"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="7" cy="7" r="2.2" fill="#062E03" />
            </pattern>
          </defs>

          {/* Squiggly line top left */}
          <path
            d="M30 140 C 60 90, 80 160, 110 110 C 140 70, 170 120, 200 95"
            stroke="#10B981"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Small circle accent */}
          <circle cx="160" cy="190" r="3.5" fill="none" stroke="#7C3AED" strokeWidth="1.8" />

          {/* Document outline box */}
          <rect
            x="45"
            y="155"
            width="105"
            height="75"
            rx="4"
            fill="#FFFFFF"
            stroke="#10B981"
            strokeWidth="1.5"
          />
          <line
            x1="65"
            y1="185"
            x2="115"
            y2="185"
            stroke="#062E03"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="65"
            y1="200"
            x2="100"
            y2="200"
            stroke="#062E03"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Curly doodle right of box */}
          <path
            d="M165 260 C 185 285, 195 255, 210 270"
            stroke="#7C3AED"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Polka-dot pillar left (Secondary emerald #10B981 with primary #062E03 dots) */}
          <rect
            x="20"
            y="275"
            width="68"
            height="145"
            fill="#10B981"
            stroke="#10B981"
            strokeWidth="1.5"
          />
          <rect x="20" y="275" width="68" height="145" fill="url(#dotPatternLeft)" />

          {/* Isometric Cube with arrow next to pillar */}
          <rect
            x="95"
            y="315"
            width="65"
            height="105"
            fill="#FFFFFF"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
          <path
            d="M112 375 L 140 335 M 140 335 L 122 335 M 140 335 L 140 352"
            stroke="#7C3AED"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Central Agent Login Card */}
        <div className="agent-login-card" role="region" aria-labelledby="agent-login-title">
          <h1 className="agent-card-title" id="agent-login-title">
            Agent Login
          </h1>
          <p className="agent-card-subtitle">
            Hey, Enter your details to get sign in to your account
          </p>

          {/* Alerts */}
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
            {/* Input 1: Email or Phone */}
            <div className="agent-field-wrap">
              <div className="agent-input-container">
                <input
                  id="agent-email-input"
                  name="email"
                  type="text"
                  className="agent-form-input"
                  placeholder="Enter Email / Phone No"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoComplete="username email"
                  disabled={isSubmitting}
                />
                <div className="agent-input-trailing-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </div>
              {errors.email && (
                <span className="agent-field-error-text" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Input 2: Passcode with Hide/Show toggle */}
            <div className="agent-field-wrap">
              <div className="agent-input-container">
                <input
                  id="agent-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="agent-form-input"
                  placeholder="Passcode"
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
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <span className="agent-field-error-text" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Having trouble in sign in? */}
            <div className="agent-trouble-wrap">
              <Link to="/forgot-password" className="agent-trouble-link">
                Having trouble in sign in?
              </Link>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              className="agent-signin-btn"
              disabled={isSubmitting}
              id="agent-submit-btn"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="agent-or-divider">
              <span>— Or Sign in with —</span>
            </div>

            {/* Social Logins: Google & Facebook (Apple ID removed as requested) */}
            <div className="agent-social-buttons-grid">
              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleQuickLogin('admin@crm.com', 'Admin@123')}
                title="Sign in with Google (Demo Admin)"
              >
                <GoogleIcon size={18} />
                <span>Google</span>
              </button>

              <button
                type="button"
                className="agent-social-pill"
                onClick={() => handleQuickLogin('sarah.rep@crm.com', 'Rep@123')}
                title="Sign in with Facebook (Demo Sales Rep)"
              >
                <FacebookIcon size={18} />
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

            {/* Request Now */}
            <div className="agent-request-now-row">
              <span>Don't have an account?</span>
              <Link to="/register" className="agent-request-now-link">
                Request Now
              </Link>
            </div>
          </form>
        </div>

        {/* Right Memphis-Style Background Illustration (Agent working on laptop) */}
        <svg
          className="agent-illustration-right"
          viewBox="0 0 380 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="dotPatternRight"
              x="0"
              y="0"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="7" cy="7" r="2.2" fill="#062E03" />
            </pattern>
            <pattern
              id="shirtPattern"
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 8 L8 0 M0 0 L8 8" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
            </pattern>
          </defs>

          {/* Floating curly hair loop / doodle at top */}
          <path
            d="M170 70 C 195 50, 200 95, 215 70"
            stroke="#10B981"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Speech card box above agent */}
          <rect
            x="220"
            y="135"
            width="55"
            height="38"
            rx="4"
            fill="#FFFFFF"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
          <line
            x1="232"
            y1="149"
            x2="262"
            y2="149"
            stroke="#7C3AED"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="232"
            y1="159"
            x2="252"
            y2="159"
            stroke="#7C3AED"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Squiggle behind agent */}
          <path
            d="M290 145 C 320 135, 330 175, 350 155"
            stroke="#10B981"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Small circle accent */}
          <circle cx="218" cy="265" r="3" fill="none" stroke="#7C3AED" strokeWidth="1.8" />

          {/* Pedestal Box agent sits on */}
          <rect
            x="240"
            y="275"
            width="75"
            height="145"
            fill="#FFFFFF"
            stroke="#10B981"
            strokeWidth="1.5"
          />

          {/* Polka-dot pillar on far right (Accent purple #7C3AED with primary #062E03 dots) */}
          <rect
            x="320"
            y="300"
            width="55"
            height="120"
            fill="#7C3AED"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
          <rect x="320" y="300" width="55" height="120" fill="url(#dotPatternRight)" />

          {/* AGENT CHARACTER */}
          {/* Left leg (crossed/dangling) */}
          <path
            d="M250 255 L 220 315 L 235 325 L 265 255 Z"
            fill="#FFFFFF"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right leg */}
          <path
            d="M260 255 L 245 325 L 260 333 L 280 255 Z"
            fill="#FFFFFF"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left shoe */}
          <path
            d="M212 337 L 225 315 L 235 325 L 225 343 Z"
            fill="#10B981"
            stroke="#10B981"
            strokeWidth="1"
          />
          {/* Right shoe */}
          <path
            d="M245 325 L 255 347 L 265 347 L 260 331 Z"
            fill="#10B981"
            stroke="#10B981"
            strokeWidth="1"
          />

          {/* Torso & patterned top */}
          <path
            d="M260 200 C 255 215, 250 240, 255 260 L 285 260 C 288 240, 288 215, 280 200 Z"
            fill="#7C3AED"
          />
          <path
            d="M260 200 C 255 215, 250 240, 255 260 L 285 260 C 288 240, 288 215, 280 200 Z"
            fill="url(#shirtPattern)"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />

          {/* Neck */}
          <rect
            x="265"
            y="190"
            width="8"
            height="12"
            fill="#FFFFFF"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
          {/* Head */}
          <circle cx="269" cy="183" r="10" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="1.5" />
          {/* Hair / Topknot Bun */}
          <path
            d="M265 175 C 260 165, 278 160, 278 173 C 285 173, 288 183, 285 193 C 282 203, 272 203, 270 195 Z"
            fill="#10B981"
          />
          <circle cx="276" cy="163" r="5" fill="#10B981" />

          {/* Laptop on lap */}
          <path
            d="M222 200 L 234 255 L 262 255 L 250 200 Z"
            fill="#10B981"
            fillOpacity="0.2"
            stroke="#10B981"
            strokeWidth="1.5"
          />
          <line
            x1="234"
            y1="255"
            x2="268"
            y2="255"
            stroke="#7C3AED"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Arms typing on laptop */}
          <path
            d="M262 210 C 250 225, 235 230, 242 240"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 3. PAGE FOOTER */}
      <footer className="agent-page-footer" role="contentinfo">
        <span>Copyright @Nexus CRM 2026 | Privacy Policy</span>
      </footer>
    </div>
  );
};
