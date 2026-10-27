import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingIndicator } from '../auth/LoadingIndicator';

interface PublicRouteProps {
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading-screen" role="status" aria-label="Loading authentication state">
        <LoadingIndicator size="large" message="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    const origin = (location.state as any)?.from?.pathname || '/profile';
    return <Navigate to={origin} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
