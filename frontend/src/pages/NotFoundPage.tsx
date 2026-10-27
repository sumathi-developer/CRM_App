import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/auth/Logo';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ArrowLeftIcon } from '../components/common/Icons';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page-wrapper">
      <div className="not-found-card">
        <Logo size="large" />
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The requested page or authentication route does not exist in this CRM workspace.
        </p>
        <div className="not-found-actions">
          <PrimaryButton
            type="button"
            onClick={() => navigate('/login')}
            icon={<ArrowLeftIcon size={18} />}
            iconPosition="left"
            fullWidth={false}
          >
            Return to Sign In
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
