import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../types/auth.types';
import { UserStatusBadge, UserRoleBadge } from './UserBadges';
import {
  ArrowLeftIcon,
  UserIcon,
  ActivityIcon,
  TrendingUpIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  CalendarIcon,
} from '../../components/common/Icons';

interface UserHeaderProps {
  user: User;
  canEdit?: boolean;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ user, canEdit = true }) => {
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const navTabs = [
    {
      label: 'Overview & Details',
      path: `/users/${user.id}`,
      icon: <UserIcon size={16} />,
      exact: true,
    },
    {
      label: 'Activities',
      path: `/users/${user.id}/activities`,
      icon: <ActivityIcon size={16} />,
    },
    {
      label: 'Performance',
      path: `/users/${user.id}/performance`,
      icon: <TrendingUpIcon size={16} />,
    },
    ...(canEdit
      ? [
          {
            label: 'Edit User',
            path: `/users/${user.id}/edit`,
            icon: <EditIcon size={16} />,
          },
        ]
      : []),
  ];

  return (
    <div className="user-profile-header-card" id="user-profile-header">
      <div className="user-header-top-row">
        <Link to="/users" className="btn-back-link" id="btn-back-to-users">
          <ArrowLeftIcon size={16} />
          <span>Back to All Users</span>
        </Link>
      </div>

      <div className="user-hero-section">
        <div className="user-avatar-container">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="user-hero-avatar-img" />
          ) : (
            <div className="user-hero-avatar-fallback">
              {getInitials(user.name)}
            </div>
          )}
        </div>

        <div className="user-hero-details">
          <div className="user-name-title-row">
            <h1 className="user-hero-name">{user.name}</h1>
            <div className="user-badges-cluster">
              <UserStatusBadge status={user.status} size="medium" />
              <UserRoleBadge roleName={user.role?.name} size="medium" />
            </div>
          </div>

          <div className="user-hero-meta-grid">
            <div className="user-meta-field">
              <MailIcon size={14} className="meta-icon" />
              <a href={`mailto:${user.email}`} className="meta-link">
                {user.email}
              </a>
            </div>

            {user.phone && (
              <div className="user-meta-field">
                <PhoneIcon size={14} className="meta-icon" />
                <a href={`tel:${user.phone}`} className="meta-link">
                  {user.phone}
                </a>
              </div>
            )}

            {user.organization?.name && (
              <div className="user-meta-field">
                <BuildingIcon size={14} className="meta-icon" />
                <span>{user.organization.name}</span>
              </div>
            )}

            <div className="user-meta-field">
              <CalendarIcon size={14} className="meta-icon" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <nav className="user-subnav-tabs" aria-label="User Sections Navigation">
        {navTabs.map((tab) => {
          const isActive = tab.exact
            ? location.pathname === tab.path
            : location.pathname.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`user-subnav-link ${isActive ? 'is-active' : ''}`}
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
