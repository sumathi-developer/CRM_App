import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import type { User, UserDeal, UserPerformanceMetrics } from '../../types/user.types';
import { Navbar } from '../../components/common/Navbar';
import { UserHeader } from '../../components/users/UserHeader';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  TrendingUpIcon,
  AwardIcon,
  DollarSignIcon,
  ActivityIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  MailIcon,
  UsersIcon,
} from '../../components/common/Icons';

export const UserPerformancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [deals, setDeals] = useState<UserDeal[]>([]);
  const [metrics, setMetrics] = useState<UserPerformanceMetrics | null>(null);

  const [dealFilter, setDealFilter] = useState<'ALL' | 'WON' | 'OPEN' | 'LOST'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Permission check
  const currentUserRole = (currentUser?.role?.name || '').toUpperCase();
  const canEdit =
    currentUserRole.includes('ADMIN') ||
    currentUserRole.includes('MANAGE') ||
    currentUserRole === 'OWNER' ||
    currentUser?.id === id;

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const fetchPerformanceData = async () => {
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
          const computed = userService.calculatePerformance(dealsData, tasksData, activitiesData);
          setMetrics(computed);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load user performance analytics');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchPerformanceData();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <LoadingIndicator size="large" message="Calculating performance analytics..." />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="portal-authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <ErrorMessage error={apiError || 'User profile not found.'} />
          <Link to="/users" className="auth-btn btn-secondary">
            Back to Users Directory
          </Link>
        </main>
      </div>
    );
  }

  const filteredDeals = deals.filter((d) => {
    if (dealFilter === 'ALL') return true;
    if (dealFilter === 'OPEN') return d.status === 'OPEN' || !d.status;
    return d.status === dealFilter;
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="portal-authenticated-shell">
      <Navbar />

      <main className="authenticated-container" id="user-performance-page">
        <UserHeader user={user} canEdit={canEdit} />

        <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />

        {/* Primary KPI Cards Grid */}
        <div className="performance-kpi-grid">
          {/* 1. Won Revenue */}
          <div className="performance-kpi-card kpi-revenue">
            <div className="kpi-header">
              <span className="kpi-title">Closed Won Revenue</span>
              <AwardIcon size={20} color="#10b981" />
            </div>
            <div className="kpi-value">${(metrics?.wonRevenue || 0).toLocaleString()}</div>
            <div className="kpi-subtitle">
              {metrics?.wonDeals || 0} Deals Won of {metrics?.totalDeals || 0} Total
            </div>
          </div>

          {/* 2. Open Pipeline */}
          <div className="performance-kpi-card kpi-pipeline">
            <div className="kpi-header">
              <span className="kpi-title">Active Pipeline Value</span>
              <DollarSignIcon size={20} color="#3b82f6" />
            </div>
            <div className="kpi-value">${(metrics?.totalPipelineValue || 0).toLocaleString()}</div>
            <div className="kpi-subtitle">
              {metrics?.openDeals || 0} Open Active Deals
            </div>
          </div>

          {/* 3. Win Rate % */}
          <div className="performance-kpi-card kpi-winrate">
            <div className="kpi-header">
              <span className="kpi-title">Sales Win Rate</span>
              <TrendingUpIcon size={20} color="#8b5cf6" />
            </div>
            <div className="kpi-value">{metrics?.winRate || 0}%</div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill purple"
                style={{ width: `${Math.min(100, metrics?.winRate || 0)}%` }}
              />
            </div>
          </div>

          {/* 4. Task Completion Rate */}
          <div className="performance-kpi-card kpi-deals">
            <div className="kpi-header">
              <span className="kpi-title">Task Velocity</span>
              <CheckCircleIcon size={20} color="#f59e0b" />
            </div>
            <div className="kpi-value">{metrics?.taskCompletionRate || 0}%</div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill emerald"
                style={{ width: `${Math.min(100, metrics?.taskCompletionRate || 0)}%` }}
              />
            </div>
            <div className="kpi-subtitle" style={{ marginTop: '0.4rem' }}>
              {metrics?.completedTasks || 0} Completed of {metrics?.totalTasks || 0} Tasks
            </div>
          </div>
        </div>

        {/* Secondary Analytical Row */}
        <div className="user-details-layout" style={{ marginBottom: '1.5rem' }}>
          {/* Activity Breakdown */}
          <div className="user-card">
            <h3 className="user-card-title">
              <ActivityIcon size={18} />
              <span>Engagement & Activity Distribution</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.25rem' }}>
                  <PhoneIcon size={15} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Calls</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                  {metrics?.activityBreakdown.calls || 0}
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', marginBottom: '0.25rem' }}>
                  <MailIcon size={15} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Emails</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                  {metrics?.activityBreakdown.emails || 0}
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', marginBottom: '0.25rem' }}>
                  <UsersIcon size={15} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Meetings</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                  {metrics?.activityBreakdown.meetings || 0}
                </div>
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', marginBottom: '0.25rem' }}>
                  <ClockIcon size={15} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Follow-ups</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                  {metrics?.activityBreakdown.followUps || 0}
                </div>
              </div>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Total of <strong>{metrics?.totalActivities || 0}</strong> client interactions logged.
              Regular follow-ups drive a higher win probability.
            </p>
          </div>

          {/* Deal Size & Average Value */}
          <div className="user-card">
            <h3 className="user-card-title">
              <DollarSignIcon size={18} />
              <span>Deal Metrics & Value</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span className="user-info-label">Average Deal Size</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.25rem' }}>
                  ${(metrics?.avgDealSize || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
                <span className="user-info-label">Deals Outcome Breakdown</span>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{metrics?.wonDeals || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.25rem' }}>Won</span>
                  </div>
                  <div>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>{metrics?.openDeals || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.25rem' }}>Open</span>
                  </div>
                  <div>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>{metrics?.lostDeals || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '0.25rem' }}>Lost</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Owned Deals List */}
        <div className="user-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 className="user-card-title" style={{ margin: 0 }}>
              <BriefcaseIcon size={18} />
              <span>Owned Deals Portfolio ({filteredDeals.length})</span>
            </h3>

            <div className="activity-filters-row" style={{ margin: 0, padding: 0 }}>
              {(['ALL', 'OPEN', 'WON', 'LOST'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`activity-filter-chip ${dealFilter === filter ? 'is-active' : ''}`}
                  onClick={() => setDealFilter(filter)}
                  id={`deal-filter-${filter.toLowerCase()}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredDeals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <BriefcaseIcon size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No deals found in category: {dealFilter}</p>
            </div>
          ) : (
            <div className="users-table-container" style={{ background: '#0f172a' }}>
              <table className="users-data-table">
                <thead>
                  <tr>
                    <th>Deal Name</th>
                    <th>Value</th>
                    <th>Pipeline Stage</th>
                    <th>Probability</th>
                    <th>Status</th>
                    <th>Expected Close</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>{d.title}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: d.status === 'WON' ? '#34d399' : '#60a5fa' }}>
                          ${Number(d.value).toLocaleString()} {d.currency || 'USD'}
                        </span>
                      </td>
                      <td>
                        <span className="permission-pill">
                          {d.stage?.name || 'In Progress'}
                        </span>
                      </td>
                      <td>{d.probability}%</td>
                      <td>
                        <span
                          className="permission-pill"
                          style={{
                            color:
                              d.status === 'WON'
                                ? '#34d399'
                                : d.status === 'LOST'
                                ? '#f87171'
                                : '#60a5fa',
                          }}
                        >
                          {d.status || 'OPEN'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {formatDate(d.expectedCloseDate)}
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
