import React from 'react';
import { TagIcon, LockIcon } from '../../components/common/Icons';
import type { TagStatus } from '../../types/tag.types';

interface TagBadgeProps {
  name: string;
  color?: string | null;
  status?: TagStatus | string;
  isProtected?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

function hexToRgba(hex?: string | null, alpha = 0.15): string {
  if (!hex || typeof hex !== 'string') {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (clean.length !== 6) {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  name,
  color = '#3b82f6',
  status,
  isProtected = false,
  size = 'md',
  showDot = true,
  showIcon = false,
  className = '',
  onClick,
}) => {
  const baseColor = color || '#3b82f6';
  const isArchived = status === 'ARCHIVED';

  const badgeStyle: React.CSSProperties = {
    backgroundColor: isArchived ? 'rgba(100, 116, 139, 0.15)' : hexToRgba(baseColor, 0.14),
    borderColor: isArchived ? 'rgba(100, 116, 139, 0.35)' : hexToRgba(baseColor, 0.4),
    color: isArchived ? '#94a3b8' : '#f8fafc',
  };

  const dotStyle: React.CSSProperties = {
    backgroundColor: isArchived ? '#94a3b8' : baseColor,
    boxShadow: isArchived ? 'none' : `0 0 6px ${hexToRgba(baseColor, 0.6)}`,
  };

  return (
    <span
      className={`tag-badge tag-badge-${size} ${isArchived ? 'is-archived' : ''} ${
        onClick ? 'is-interactive' : ''
      } ${className}`}
      style={badgeStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`${name}${isProtected ? ' (Protected)' : ''}${status ? ` • ${status}` : ''}`}
    >
      {showIcon && (
        <TagIcon
          size={size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'lg' ? 16 : 13}
          style={{ color: isArchived ? '#94a3b8' : baseColor }}
        />
      )}
      {showDot && !showIcon && <span className="tag-badge-dot" style={dotStyle} />}
      <span className="tag-badge-text">{name}</span>
      {isProtected && (
        <span className="tag-badge-protected-icon" title="Protected tag (cannot be deleted)">
          <LockIcon size={size === 'xs' ? 9 : 11} />
        </span>
      )}
    </span>
  );
};
