import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  linkTo?: string;
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  linkTo = '/login',
  showTagline = true,
  className = '',
}) => {
  const content = (
    <div className={`auth-brand-logo size-${size} ${className}`} id="app-logo">
      <div className="auth-logo-icon-wrap" aria-hidden="true">
        <svg
          viewBox="0 0 40 40"
          className="auth-logo-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
          {/* Geometric CRM nodes & connections */}
          <circle cx="20" cy="13" r="3.5" fill="#ffffff" />
          <circle cx="12" cy="27" r="3" fill="#ffffff" />
          <circle cx="28" cy="27" r="3" fill="#ffffff" />
          <line x1="20" y1="13" x2="12" y2="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="20" y1="13" x2="28" y2="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="12" y1="27" x2="28" y2="27" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
          <circle cx="20" cy="22" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      <div className="auth-logo-text">
        <div className="auth-logo-title">
          <span className="brand-name">NEXUS</span>
          <span className="brand-badge">CRM</span>
        </div>
        {showTagline && (
          <span className="auth-logo-tagline">Enterprise Platform</span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="auth-logo-link" aria-label="Nexus CRM Home">
        {content}
      </Link>
    );
  }

  return content;
};
