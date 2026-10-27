import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { TeamEntity } from '../../types/team.types';
import { TeamStatusBadge } from './TeamBadges';
import {
  ArrowLeftIcon,
  ShieldIcon,
  UsersIcon,
  ActivityIcon,
  TrendingUpIcon,
  EditIcon,
  DollarSignIcon,
  CrownIcon,
} from '../../components/common/Icons';

interface TeamHeaderProps {
  team: TeamEntity;
  canEdit?: boolean;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({ team, canEdit = true }) => {
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TM';
  };

  const teamColor = team.color || '#3b82f6';
  const membersCount = team._count?.members ?? team.members?.length ?? 0;
  const targetRev = team.targetRevenue || 0;
  const wonRev = team.wonRevenue || 0;
  const attainment = targetRev > 0 ? Math.round((wonRev / targetRev) * 100) : 0;

  const basePath = `/teams/${team.id}`;

  const navTabs = [
    { label: 'Overview', path: basePath, icon: <ShieldIcon size={15} /> },
    { label: `Members (${membersCount})`, path: `${basePath}/members`, icon: <UsersIcon size={15} /> },
    { label: 'Activities', path: `${basePath}/activities`, icon: <ActivityIcon size={15} /> },
    { label: 'Performance', path: `${basePath}/performance`, icon: <TrendingUpIcon size={15} /> },
    ...(canEdit ? [{ label: 'Edit Team', path: `${basePath}/edit`, icon: <EditIcon size={15} /> }] : []),
  ];

  return (
    <div className="team-detail-header-card" id="team-header">
      {/* Accent Top Stripe */}
      <div
        className="team-header-accent-stripe"
        style={{ backgroundColor: teamColor }}
        aria-hidden="true"
      />

      <div className="team-header-main-content">
        <div className="team-header-identity">
          <Link to="/teams" className="header-back-link" title="Return to All Teams">
            <ArrowLeftIcon size={18} />
          </Link>

          <div
            className="team-header-avatar"
            style={{ backgroundColor: teamColor }}
            aria-label={`${team.name} avatar`}
          >
            {team.avatar ? (
              <img src={team.avatar} alt={team.name} className="avatar-img-fit" />
            ) : (
              <span>{getInitials(team.name)}</span>
            )}
          </div>

          <div className="team-header-titles">
            <h1>
              <span>{team.name}</span>
              <TeamStatusBadge status={team.status} />
            </h1>

            <div className="team-header-subinfo">
              {team.slug && (
                <span className="info-chip" title="Team slug identifier">
                  <span className="text-muted">slug:</span>
                  <code>{team.slug}</code>
                </span>
              )}

              {team.owner && (
                <span className="info-chip" title="Team Leader">
                  <CrownIcon size={14} className="text-warning" />
                  <span className="text-muted">Leader:</span>
                  <strong>{team.owner.name}</strong>
                </span>
              )}

              <span className="info-chip" title="Enrolled Members">
                <UsersIcon size={14} className="text-primary" />
                <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
              </span>

              {targetRev > 0 && (
                <span className="info-chip" title="Quota Attainment">
                  <DollarSignIcon size={14} className="text-success" />
                  <span>
                    ${wonRev.toLocaleString()} / ${targetRev.toLocaleString()} ({attainment}%)
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="team-header-actions">
          {canEdit && (
            <Link to={`${basePath}/edit`} className="auth-btn btn-secondary">
              <EditIcon size={16} />
              <span>Edit Team</span>
            </Link>
          )}
          <Link to={`${basePath}/members`} className="auth-btn btn-primary">
            <UsersIcon size={16} />
            <span>Manage Members</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <nav className="team-nav-tabs-bar" aria-label="Team Navigation">
        {navTabs.map((tab) => {
          const isSelected =
            tab.path === basePath
              ? location.pathname === basePath
              : location.pathname.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`team-tab-btn ${isSelected ? 'is-active' : ''}`}
              id={`tab-${tab.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
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
