import React from 'react';
import { Logo } from './Logo';
import { ShieldIcon, SparklesIcon, CheckCircleIcon } from '../common/Icons';

const CURRENT_YEAR = new Date().getFullYear();

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  footer?: React.ReactNode;
  heroHeadline?: string;
  heroSubtext?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  badge = 'Enterprise CRM Suite',
  footer,
  heroHeadline = 'Accelerate Pipeline Growth with Unified CRM Intelligence',
  heroSubtext = 'Seamlessly manage leads, automate sales pipelines, coordinate multi-tenant teams, and gain deep business revenue insights.',
}) => {
  return (
    <div className="auth-page-wrapper">
      {/* Background ambient lighting effects */}
      <div className="ambient-glow glow-top-left" aria-hidden="true" />
      <div className="ambient-glow glow-bottom-right" aria-hidden="true" />

      <div className="auth-page-grid">
        {/* Left Showcase Hero Panel (Desktop & Large Tablets) */}
        <div className="auth-hero-panel">
          <div className="auth-hero-header">
            <Logo size="large" showTagline={true} />
          </div>

          <div className="auth-hero-content">
            <div className="auth-hero-badge">
              <SparklesIcon size={16} />
              <span>{badge}</span>
            </div>

            <h1 className="auth-hero-headline">{heroHeadline}</h1>
            <p className="auth-hero-description">{heroSubtext}</p>

            {/* Feature highlights pill grid */}
            <div className="auth-feature-pills">
              <div className="feature-pill">
                <CheckCircleIcon size={16} className="pill-icon" />
                <span>End-to-End Pipeline Automation</span>
              </div>
              <div className="feature-pill">
                <ShieldIcon size={16} className="pill-icon" />
                <span>RBAC & Workspace Multi-Tenancy</span>
              </div>
              <div className="feature-pill">
                <CheckCircleIcon size={16} className="pill-icon" />
                <span>Real-Time Audit Trail & Analytics</span>
              </div>
            </div>

            {/* Enterprise Trust Card */}
            <div className="auth-trust-card">
              <div className="trust-card-header">
                <div className="trust-avatar-stack">
                  <div className="trust-avatar" style={{ backgroundColor: '#3b82f6' }}>AP</div>
                  <div className="trust-avatar" style={{ backgroundColor: '#10b981' }}>SC</div>
                  <div className="trust-avatar" style={{ backgroundColor: '#8b5cf6' }}>MK</div>
                  <div className="trust-count">+1.2k</div>
                </div>
                <div className="trust-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">4.9 / 5 Rating</span>
                </div>
              </div>
              <p className="trust-quote">
                "Nexus CRM transformed our deal velocity by 40% in just two quarters. The security and workspace isolation are world-class."
              </p>
              <div className="trust-author">
                <strong>Alexander Pierce</strong> &bull; VP of Revenue Operations
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <span>&copy; {CURRENT_YEAR} Nexus CRM Inc. All rights reserved.</span>
            <div className="auth-legal-links">
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <span>&bull;</span>
              <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              <span>&bull;</span>
              <a href="#security" onClick={(e) => e.preventDefault()}>Security</a>
            </div>
          </div>
        </div>

        {/* Right Form Card Panel */}
        <div className="auth-form-panel">
          <div className="auth-mobile-logo">
            <Logo size="medium" />
          </div>

          <div className="auth-card-box">
            <div className="auth-card-header">
              <h2 className="auth-card-title">{title}</h2>
              {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
            </div>

            <div className="auth-card-body">
              {children}
            </div>

            {footer && (
              <div className="auth-card-footer">
                {footer}
              </div>
            )}
          </div>

          <div className="auth-mobile-footer">
            <span>Protected by 256-bit SSL encryption &bull; Nexus CRM v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
