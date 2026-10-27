import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService } from '../../services/user.service';
import type { User } from '../../types/auth.types';
import type { UserDealEntity, UserTaskEntity, UserActivityEntity } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from './UserHeader';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  TrendingUpIcon,
  DollarSignIcon,
  TargetIcon,
  AwardIcon,
  CheckCircleIcon,
  ActivityIcon,
} from '../../components/common/Icons';

export const UserPerformancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [deals, setDeals] = useState<UserDealEntity[]>([]);
  const [tasks, setTasks] = useState<UserTaskEntity[]>([]);
  const [activities, setActivities] = useState<UserActivityEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadPerformanceData = async () => {
      try {
        const [userData, dealsData, tasksData, activitiesData] = await Promise.all([
          userService.getUserById(id),
          userService.getUserDeals(id).catch(() => []),
          userService.getUserTasks(id).catch(() => []),
          userService.getUserActivities(id).catch(() => []),
        ]);

        if (!ignore) {
          setUser(userData);
          setDeals(dealsData);
          setTasks(tasksData);
          setActivities(activitiesData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user performance data');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadPerformanceData();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Deal Calculations
  const totalDeals = deals.length;
  const wonDeals = deals.filter((d) => d.status?.toUpperCase() === 'WON');
  const lostDeals = deals.filter((d) => d.status?.toUpperCase() === 'LOST');
  const openDeals = deals.filter((d) => d.status?.toUpperCase() !== 'WON' && d.status?.toUpperCase() !== 'LOST');

  const totalPipelineValue = deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
  const wonRevenue = wonDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;

  // Task Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status?.toUpperCase() === 'COMPLETED').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Activity Volume
  const totalActivities = activities.length;

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading performance metrics..." />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>User Not Found</h2>
            <Link to="/users" className="auth-btn btn-primary">
              Return to Users
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="user-performance-page">
      <Navbar />

      <main className="authenticated-container">
        {/* User Navigation Header */}
        <UserHeader user={user} />

        {apiError && <ErrorMessage error={apiError} />}

        {/* Performance KPI Cards Grid */}
        <div className="performance-kpi-grid">
          <div className="perf-metric-card revenue">
            <div className="metric-header-row">
              <span className="metric-title">Won Revenue</span>
              <div className="metric-icon-badge success">
                <DollarSignIcon size={18} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-primary-value">
                ${wonRevenue.toLocaleString()}
              </span>
            </div>
            <div className="metric-footer-note">
              <span>From {wonDeals.length} won deals</span>
            </div>
          </div>

          <div className="perf-metric-card pipeline">
            <div className="metric-header-row">
              <span className="metric-title">Total Pipeline Value</span>
              <div className="metric-icon-badge primary">
                <TrendingUpIcon size={18} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-primary-value">
                ${totalPipelineValue.toLocaleString()}
              </span>
            </div>
            <div className="metric-footer-note">
              <span>Across {totalDeals} registered deals</span>
            </div>
          </div>

          <div className="perf-metric-card winrate">
            <div className="metric-header-row">
              <span className="metric-title">Win Rate Percentage</span>
              <div className="metric-icon-badge accent">
                <TargetIcon size={18} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-primary-value">{winRate}%</span>
            </div>
            <div className="metric-footer-note">
              <span>{wonDeals.length} won / {lostDeals.length} lost</span>
            </div>
          </div>

          <div className="perf-metric-card tasks">
            <div className="metric-header-row">
              <span className="metric-title">Task Completion</span>
              <div className="metric-icon-badge warning">
                <CheckCircleIcon size={18} />
              </div>
            </div>
            <div className="metric-value-row">
              <span className="metric-primary-value">{taskCompletionRate}%</span>
            </div>
            <div className="metric-footer-note">
              <span>{completedTasks} of {totalTasks} finished</span>
            </div>
          </div>
        </div>

        {/* Visual Progress & Activity Touchpoints Row */}
        <div className="performance-breakdown-row">
          {/* Deals Breakdown Card */}
          <div className="breakdown-card">
            <div className="breakdown-card-header">
              <div className="section-icon-badge primary">
                <AwardIcon size={18} />
              </div>
              <div>
                <h3 className="section-title">Deal Conversion Breakdown</h3>
                <p className="section-desc">Pipeline status for deals owned by {user.name}</p>
              </div>
            </div>

            <div className="breakdown-bars-stack">
              <div className="progress-group">
                <div className="progress-labels-row">
                  <span>Won Deals ({wonDeals.length})</span>
                  <span className="progress-pct">
                    {totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill fill-won"
                    style={{
                      width: `${totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="progress-group">
                <div className="progress-labels-row">
                  <span>Open In-Flight Deals ({openDeals.length})</span>
                  <span className="progress-pct">
                    {totalDeals > 0 ? Math.round((openDeals.length / totalDeals) * 100) : 0}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill fill-open"
                    style={{
                      width: `${totalDeals > 0 ? (openDeals.length / totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="progress-group">
                <div className="progress-labels-row">
                  <span>Lost Deals ({lostDeals.length})</span>
                  <span className="progress-pct">
                    {totalDeals > 0 ? Math.round((lostDeals.length / totalDeals) * 100) : 0}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill fill-lost"
                    style={{
                      width: `${totalDeals > 0 ? (lostDeals.length / totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Productivity & Touchpoints Card */}
          <div className="breakdown-card">
            <div className="breakdown-card-header">
              <div className="section-icon-badge secondary">
                <ActivityIcon size={18} />
              </div>
              <div>
                <h3 className="section-title">Engagement Productivity</h3>
                <p className="section-desc">Client communications and CRM follow-ups</p>
              </div>
            </div>

            <div className="productivity-stat-grid">
              <div className="stat-tile">
                <span className="stat-number">{totalActivities}</span>
                <span className="stat-caption">Total Activities Logged</span>
              </div>

              <div className="stat-tile">
                <span className="stat-number">{completedTasks}</span>
                <span className="stat-caption">Tasks Executed</span>
              </div>

              <div className="stat-tile">
                <span className="stat-number">{wonDeals.length}</span>
                <span className="stat-caption">Deals Closed</span>
              </div>
            </div>

            <div className="productivity-action-hint">
              <p>
                Consistent client touchpoints correlate with an increased win rate across deals.
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Deals Roster */}
        <div className="deals-roster-card">
          <div className="card-section-header">
            <div className="section-icon-badge success">
              <TrendingUpIcon size={18} />
            </div>
            <div>
              <h3 className="section-title">Owned Deals Pipeline ({deals.length})</h3>
              <p className="section-desc">All deals currently assigned to {user.name}</p>
            </div>
          </div>

          {deals.length === 0 ? (
            <div className="empty-subtext-box">
              <p>No deals are currently assigned to this user.</p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="user-deals-table">
                <thead>
                  <tr>
                    <th>Deal Title</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Stage</th>
                    <th>Organization</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong className="deal-title-text">{d.title}</strong>
                      </td>
                      <td>
                        <span className="deal-value-text">
                          ${(d.value || 0).toLocaleString()} {d.currency || 'USD'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`deal-status-pill pill-${(d.status || 'open').toLowerCase()}`}
                        >
                          {d.status || 'OPEN'}
                        </span>
                      </td>
                      <td>
                        <span className="deal-stage-badge">
                          {d.stage?.name || 'In Pipeline'}
                        </span>
                      </td>
                      <td>
                        <span className="deal-org-name">
                          {d.organization?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="deal-date-cell">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
