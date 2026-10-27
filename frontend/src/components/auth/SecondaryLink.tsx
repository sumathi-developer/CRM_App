import React from 'react';
import { Link } from 'react-router-dom';

interface SecondaryLinkProps {
  to?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

export const SecondaryLink: React.FC<SecondaryLinkProps> = ({
  to,
  onClick,
  children,
  icon,
  iconPosition = 'left',
  className = '',
  id,
}) => {
  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="link-icon left" aria-hidden="true">{icon}</span>}
      <span className="link-label">{children}</span>
      {icon && iconPosition === 'right' && <span className="link-icon right" aria-hidden="true">{icon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} id={id} className={`auth-secondary-link ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`auth-secondary-link btn-link ${className}`}
    >
      {content}
    </button>
  );
};
