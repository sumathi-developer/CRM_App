import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import type { TeamEntity, TeamPerformanceEntity } from '../../types/team.types';
import { Navbar } from '../../components/common/Navbar';
import { TeamHeader } from './TeamHeader';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  TrendingUpIcon,
  DollarSignIcon,
  TargetIcon,
  AwardIcon,
  CalendarIcon,
  BuildingIcon,
} from '../../components/common/Icons';

export const TeamPerformancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [team, setTeam] = useState<TeamEntity | null>(null);
  const [performance, setPerformance] = useState<TeamPerformanceEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [teamData, perfData] = await Promise.all([
          teamService.getTeamById(id),
          teamService.getTeamPerformance(id, {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
        ]);

        if (!ignore) {
          setTeam(teamData);
          setPerformance(perfData);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load team performance analytics');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [id, startDate, endDate]);

  if (isLoading && !team) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Calculating team performance and quota metrics..." />
          </div>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>Team Not Found</h2>
            <Link to="/teams" className="auth-btn btn-primary">
              Return to Teams Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const targetRev = performance?.targetRevenue ?? team.targetRevenue ?? 0;
  const wonRev = performance?.wonRevenue ?? team.wonRevenue ?? 0;
  const attainment = performance?.quotaAttainmentPercentage ?? (targetRev > 0 ? Math.round((wonRev / targetRev) * 100) : 0);
  const pipelineVal = performance?.activePipelineValue ?? 0;

  const getRankClass = (idx: number) => {
    if (idx === 0) return 'rank-1';
    if (idx === 1) return 'rank-2';
    if (idx === 2) return 'rank-3';
    return 'rank-default';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="authenticated-shell" id="team-performance-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Contextual Header with Tabs */}
        <TeamHeader team={team} canEdit />

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}

        {/* Date Filter Toolbar */}
        <div className="users-filter-bar" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={16} className="text-primary" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #f8fafc)', fontSize: '0.875rem' }}>
              Performance Reporting Window
            </span>
          </div>

          <div className="filter-controls-group">
            <div className="filter-select-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-select-field"
                title="Start Date"
                aria-label="Reporting Start Date"
              />
            </div>
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>to</span>
            <div className="filter-select-wrap">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-select-field"
                title="End Date"
                aria-label="Reporting End Date"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                className="filter-reset-btn"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Top KPI Metrics Strip */}
        <div className="teams-metrics-strip">
          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap warning">
              <TargetIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">${targetRev.toLocaleString()}</span>
              <span className="kpi-label">Revenue Target</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <DollarSignIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">${wonRev.toLocaleString()}</span>
              <span className="kpi-label">Won Revenue</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <TrendingUpIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{attainment}%</span>
              <span className="kpi-label">Quota Attainment</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap primary">
              <BuildingIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">${pipelineVal.toLocaleString()}</span>
              <span className="kpi-label">Active Pipeline</span>
            </div>
          </div>

          <div className="kpi-mini-card">
            <div className="kpi-icon-wrap success">
              <AwardIcon size={20} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{performance?.dealWinRate || '0%'}</span>
              <span className="kpi-label">Deal Win Rate</span>
            </div>
          </div>
        </div>

        {/* Conversion & Deals Summary Cards */}
        <div className="user-details-grid" style={{ marginBottom: '1.5rem' }}>
          {/* Quota & Pipeline Card */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="section-icon-badge warning">
                <TargetIcon size={18} />
              </div>
              <div>
                <h3 className="section-title">Revenue & Quota Attainment</h3>
                <p className="section-desc">Progress toward revenue target milestone</p>
              </div>
            </div>

            <div className="quota-detailed-metrics" style={{ marginTop: '1.25rem' }}>
              <div className="team-quota-box">
                <div className="quota-meta-row">
                  <span className="quota-label">Current Revenue Progress</span>
                  <span className="quota-values">
                    ${wonRev.toLocaleString()} / ${targetRev.toLocaleString()} ({attainment}%)
                  </span>
                </div>
                <div className="quota-bar-track" style={{ height: '12px' }}>
                  <div
                    className="quota-bar-fill"
                    style={{
                      width: `${Math.min(100, attainment)}%`,
                      backgroundColor: attainment >= 100 ? '#10b981' : team.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>

              <div className="team-stats-strip" style={{ marginTop: '1rem', border: 'none' }}>
                <div className="stat-item-col">
                  <span className="stat-val">${wonRev.toLocaleString()}</span>
                  <span className="stat-lbl">Won Revenue</span>
                </div>
                <div className="stat-item-col">
                  <span className="stat-val">${pipelineVal.toLocaleString()}</span>
                  <span className="stat-lbl">Open Pipeline</span>
                </div>
                <div className="stat-item-col">
                  <span className="stat-val">
                    ${(wonRev + pipelineVal).toLocaleString()}
                  </span>
                  <span className="stat-lbl">Weighted Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Funnel & Conversion Rates Card */}
          <div className="profile-section-card">
            <div className="section-card-header">
              <div className="section-icon-badge success">
                <TrendingUpIcon size={18} />
              </div>
              <div>
                <h3 className="section-title">Conversion & Activity Efficiency</h3>
                <p className="section-desc">Lead qualification, deal closing, and activity throughput</p>
              </div>
            </div>

            <div className="profile-info-grid" style={{ marginTop: '1rem' }}>
              <div className="info-item">
                <span className="info-label">Lead Conversion Rate</span>
                <span className="info-value" style={{ color: '#10b981', fontWeight: 700 }}>
                  {performance?.leadConversionRate || '0%'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {performance?.convertedLeads ?? 0} converted of {performance?.totalLeads ?? 0} total
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Deal Win Rate</span>
                <span className="info-value" style={{ color: '#3b82f6', fontWeight: 700 }}>
                  {performance?.dealWinRate || '0%'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {performance?.wonDealsCount ?? 0} won / {performance?.lostDealsCount ?? 0} lost
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Completed Activities</span>
                <span className="info-value" style={{ color: '#a855f7', fontWeight: 700 }}>
                  {performance?.completedActivities ?? 0}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {performance?.pendingActivities ?? 0} pending follow-ups
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Total Pipeline Deals</span>
                <span className="info-value" style={{ fontWeight: 700 }}>
                  {performance?.totalDeals ?? 0}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {performance?.openDealsCount ?? 0} active in sales stages
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="section-icon-badge warning">
              <AwardIcon size={18} />
            </div>
            <div>
              <h3 className="section-title">Team Leaderboard & Top Performers</h3>
              <p className="section-desc">Individual revenue contributions and closing efficiency</p>
            </div>
          </div>

          {(!performance?.topPerformers || performance.topPerformers.length === 0) ? (
            <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
              No individual performer records available for this reporting period.
            </p>
          ) : (
            <div className="users-table-container" style={{ marginTop: '1rem' }}>
              <table className="users-table" id="team-leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Performer</th>
                    <th>Won Revenue</th>
                    <th>Won Deals</th>
                    <th>Open Deals</th>
                    <th>Activities Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.topPerformers.map((performer, idx) => (
                    <tr key={performer.userId} id={`performer-row-${performer.userId}`}>
                      <td>
                        <span className={`leaderboard-rank-badge ${getRankClass(idx)}`}>
                          {idx + 1}
                        </span>
                      </td>

                      <td>
                        <div className="table-member-user-cell">
                          <div className="table-user-avatar">
                            {getInitials(performer.name)}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                              {performer.name}
                            </strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                              {performer.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                          ${(Number(performer.wonRevenue) || 0).toLocaleString()}
                        </strong>
                      </td>

                      <td>
                        <span className="count-pill">{performer.wonDealsCount || 0} won</span>
                      </td>

                      <td>
                        <span style={{ color: 'var(--text-secondary, #cbd5e1)' }}>
                          {performer.openDealsCount || 0} active
                        </span>
                      </td>

                      <td>
                        <span style={{ color: 'var(--text-secondary, #cbd5e1)' }}>
                          {performer.completedActivitiesCount || 0} completed
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
