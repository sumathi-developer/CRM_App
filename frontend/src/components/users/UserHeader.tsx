import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../types/user.types';
import { UserStatusBadge } from './UserStatusBadge';
import { UserRoleBadge } from './UserRoleBadge';
import {
  ArrowLeftIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  CalendarIcon,
  ActivityIcon,
  TrendingUpIcon,
  UserIcon,
  EditIcon,
  SlidersIcon,
} from '../common/Icons';

interface UserHeaderProps {
  user: User;
  canEdit?: boolean;
  onOpenStatusModal?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  user,
  canEdit = false,
  onOpenStatusModal,
}) => {
  const location = useLocation();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const navTabs = [
    { label: 'Overview', path: `/users/${user.id}`, icon: <UserIcon size={16} />, exact: true },
    { label: 'Activities', path: `/users/${user.id}/activities`, icon: <ActivityIcon size={16} /> },
    { label: 'Performance', path: `/users/${user.id}/performance`, icon: <TrendingUpIcon size={16} /> },
    ...(canEdit
      ? [{ label: 'Edit User', path: `/users/${user.id}/edit`, icon: <EditIcon size={16} /> }]
      : []),
  ];

  return (
    <div className="user-hero-header" id="user-header">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/users" className="detail-link" style={{ fontSize: '0.875rem' }}>
          <ArrowLeftIcon size={14} />
          <span>Back to Users Directory</span>
        </Link>
      </div>

      <div className="user-hero-top">
        <div className="user-hero-identity">
          <div className="user-hero-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
          </div>

          <div className="user-hero-title-group">
            <h2>{user.name}</h2>
            <div className="user-hero-badges">
              <UserStatusBadge status={user.status} />
              <UserRoleBadge roleName={user.role?.name || 'User'} />
            </div>

            <div className="user-hero-contact-row">
              <div className="user-hero-contact-item">
                <MailIcon size={14} />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="user-hero-contact-item">
                  <PhoneIcon size={14} />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.organization?.name && (
                <div className="user-hero-contact-item">
                  <BuildingIcon size={14} />
                  <span>{user.organization.name}</span>
                </div>
              )}
              <div className="user-hero-contact-item">
                <CalendarIcon size={14} />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="user-hero-actions">
            {onOpenStatusModal && (
              <button
                type="button"
                className="btn-filter-reset"
                onClick={onOpenStatusModal}
                id="btn-trigger-change-status"
              >
                <SlidersIcon size={14} style={{ marginRight: '0.35rem' }} />
                <span>Change Status</span>
              </button>
            )}
            <Link
              to={`/users/${user.id}/edit`}
              className="auth-btn btn-primary"
              style={{ textDecoration: 'none' }}
              id="btn-header-edit-user"
            >
              <EditIcon size={15} />
              <span>Edit Profile</span>
            </Link>
          </div>
        )}
      </div>

      <nav className="user-subnav-tabs" aria-label="User Sections">
        {navTabs.map((tab) => {
          const isActive = tab.exact
            ? location.pathname === tab.path
            : location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`user-tab-btn ${isActive ? 'is-active' : ''}`}
              id={`tab-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
