import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tagService } from '../../services/tag.service';
import { useWorkspace } from '../../context/useWorkspace';
import type {
  TagUsageDetail,
  TagUsageSummary,
  TagEntityType,
} from '../../types/tag.types';
import { Navbar } from '../../components/common/Navbar';
import { TagBadge } from './TagBadge';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  TagIcon,
  BarChart2Icon,
  ChevronRightIcon,
  ArrowLeftIcon,
  EditIcon,
  LockIcon,
  BuildingIcon,
  UserIcon,
  UsersIcon,
  DollarSignIcon,
  RefreshCwIcon,
} from '../../components/common/Icons';

const ENTITY_CONFIG: Record<
  TagEntityType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LEAD: { label: 'Leads', icon: <UserIcon size={16} />, color: '#3b82f6' },
  CONTACT: { label: 'Contacts', icon: <UsersIcon size={16} />, color: '#10b981' },
  COMPANY: { label: 'Companies', icon: <BuildingIcon size={16} />, color: '#8b5cf6' },
  DEAL: { label: 'Deals', icon: <DollarSignIcon size={16} />, color: '#f59e0b' },
  ACTIVITY: { label: 'Activities', icon: <RefreshCwIcon size={16} />, color: '#ec4899' },
  DOCUMENT: { label: 'Documents', icon: <TagIcon size={16} />, color: '#06b6d4' },
};

export const TagUsagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  const isSingleTagMode = Boolean(id);

  const [singleUsage, setSingleUsage] = useState<TagUsageDetail | null>(null);
  const [globalUsage, setGlobalUsage] = useState<TagUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);

      try {
        if (id) {
          const detail = await tagService.getTagUsage(id);
          if (!ignore) {
            setSingleUsage(detail);
          }
        } else {
          const summary = await tagService.getGlobalUsageSummary(currentWorkspace?.id);
          if (!ignore) {
            setGlobalUsage(summary);
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load usage statistics.');
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
  }, [id, currentWorkspace?.id]);

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main-content tag-usage-page-container">
        {/* Breadcrumb Header */}
        <div className="page-header-row">
          <div className="page-header-text">
            <div className="page-breadcrumbs">
              <Link to="/tags" className="breadcrumb-link">
                Tags
              </Link>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" />
              {isSingleTagMode ? (
                <>
                  <span className="breadcrumb-item-name">
                    {singleUsage?.name || 'Tag Usage'}
                  </span>
                  <ChevronRightIcon size={12} className="breadcrumb-arrow" />
                  <span className="breadcrumb-current">Usage Statistics</span>
                </>
              ) : (
                <span className="breadcrumb-current">Workspace Usage Analytics</span>
              )}
            </div>
            <h1 className="page-title">
              <span className="title-icon-wrap">
                <BarChart2Icon size={24} />
              </span>
              <span>
                {isSingleTagMode
                  ? `Tag Usage: ${singleUsage?.name || '...'}`
                  : 'Workspace Tag Analytics'}
              </span>
            </h1>
            <p className="page-subtitle">
              {isSingleTagMode
                ? 'Detailed breakdown of CRM entities and recent assignments associated with this tag.'
                : 'Global metrics, assignment distribution, and top utilized tags in your workspace.'}
            </p>
          </div>

          <div className="page-header-actions">
            {isSingleTagMode && singleUsage && (
              <>
                <Link
                  to={`/tags/${singleUsage.tagId}/edit`}
                  className="auth-btn btn-secondary"
                  id="tag-usage-edit-btn"
                >
                  <EditIcon size={16} />
                  <span>Edit Tag</span>
                </Link>

                <Link to="/tags/usage" className="auth-btn btn-ghost">
                  <BarChart2Icon size={16} />
                  <span>Global Analytics</span>
                </Link>
              </>
            )}

            {!isSingleTagMode && (
              <Link to="/tags" className="auth-btn btn-primary">
                <TagIcon size={16} />
                <span>All Tags</span>
              </Link>
            )}

            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={() => navigate('/tags')}
            >
              <ArrowLeftIcon size={16} />
              <span>Back to Tags</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="page-alert-wrap">
            <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
          </div>
        )}

        {isLoading ? (
          <div className="tags-loading-state">
            <LoadingIndicator size="medium" />
            <p className="loading-state-text">Calculating CRM tag usage metrics...</p>
          </div>
        ) : isSingleTagMode ? (
          /* ===================================================
             SINGLE TAG USAGE BREAKDOWN
             =================================================== */
          singleUsage ? (
            <div className="tag-usage-content-grid">
              {/* Tag Details Card */}
              <div className="tag-usage-overview-card">
                <div className="overview-header-row">
                  <div className="overview-badge-col">
                    <TagBadge
                      name={singleUsage.name}
                      color={singleUsage.color}
                      status={singleUsage.status}
                      isProtected={singleUsage.isProtected}
                      size="lg"
                    />
                    {singleUsage.description && (
                      <p className="overview-desc-text">{singleUsage.description}</p>
                    )}
                  </div>

                  <div className="overview-counter-col">
                    <span className="counter-super-number">{singleUsage.totalUsage}</span>
                    <span className="counter-super-label">
                      Total CRM {singleUsage.totalUsage === 1 ? 'Assignment' : 'Assignments'}
                    </span>
                  </div>
                </div>

                <div className="overview-status-strip">
                  <div className="strip-item">
                    <span className="strip-label">Status:</span>
                    <span
                      className={`tag-status-pill status-${singleUsage.status.toLowerCase()}`}
                    >
                      <span className="status-dot" />
                      <span>{singleUsage.status}</span>
                    </span>
                  </div>

                  <div className="strip-item">
                    <span className="strip-label">Protection:</span>
                    <span className="strip-val">
                      {singleUsage.isProtected ? (
                        <span className="tag-protected-chip">
                          <LockIcon size={11} />
                          <span>Protected</span>
                        </span>
                      ) : (
                        <span>Standard</span>
                      )}
                    </span>
                  </div>

                  <div className="strip-item">
                    <span className="strip-label">Color Hex:</span>
                    <code>{singleUsage.color || '#3b82f6'}</code>
                  </div>
                </div>
              </div>

              {/* Entity Distribution Grid */}
              <div className="tag-entity-breakdown-card">
                <h3 className="section-card-title">Entity Distribution Breakdown</h3>
                <p className="section-card-subtitle">
                  Number and proportion of entities tagged with &quot;{singleUsage.name}&quot;.
                </p>

                <div className="entity-bars-grid">
                  {(Object.keys(ENTITY_CONFIG) as TagEntityType[]).map((entityKey) => {
                    const count = singleUsage.breakdown[entityKey] || 0;
                    const percent =
                      singleUsage.totalUsage > 0
                        ? Math.round((count / singleUsage.totalUsage) * 100)
                        : 0;
                    const config = ENTITY_CONFIG[entityKey];

                    return (
                      <div key={entityKey} className="entity-bar-item">
                        <div className="bar-header">
                          <div className="bar-title">
                            <span className="bar-icon" style={{ color: config.color }}>
                              {config.icon}
                            </span>
                            <span className="bar-label">{config.label}</span>
                          </div>
                          <div className="bar-counts">
                            <strong className="bar-count-num">{count}</strong>
                            <span className="bar-count-pct">({percent}%)</span>
                          </div>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: config.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Entity Assignments */}
              <div className="tag-recent-assignments-card">
                <h3 className="section-card-title">Recent Entity Assignments</h3>
                <p className="section-card-subtitle">
                  Most recent CRM leads, contacts, deals, and records attached to this tag.
                </p>

                {singleUsage.recentEntities.length === 0 ? (
                  <div className="tag-no-entities-box">
                    <p>No CRM entities currently attached to this tag.</p>
                  </div>
                ) : (
                  <div className="recent-entities-table-responsive">
                    <table className="recent-entities-table">
                      <thead>
                        <tr>
                          <th>Entity Type</th>
                          <th>Entity Name</th>
                          <th>Entity ID</th>
                          <th>Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {singleUsage.recentEntities.map((item) => {
                          const config = ENTITY_CONFIG[item.entityType] || {
                            label: item.entityType,
                            color: '#64748b',
                            icon: <TagIcon size={14} />,
                          };

                          return (
                            <tr key={item.assignmentId}>
                              <td>
                                <span
                                  className="entity-type-badge-mini"
                                  style={{
                                    borderColor: config.color,
                                    color: config.color,
                                  }}
                                >
                                  {config.icon}
                                  <span>{config.label}</span>
                                </span>
                              </td>
                              <td className="entity-name-cell">
                                <strong>{item.entityName || 'Unnamed Record'}</strong>
                              </td>
                              <td className="entity-id-cell">
                                <code className="mini-id-code">{item.entityId.slice(0, 8)}...</code>
                              </td>
                              <td className="entity-date-cell">
                                {new Date(item.assignedAt).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="tags-empty-container">
              <p>Tag usage statistics not available.</p>
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => navigate('/tags')}
              >
                Return to Tags List
              </button>
            </div>
          )
        ) : (
          /* ===================================================
             GLOBAL WORKSPACE USAGE ANALYTICS
             =================================================== */
          globalUsage && (
            <div className="tag-usage-content-grid">
              {/* Summary KPIs */}
              <div className="global-kpis-grid">
                <div className="kpi-card blue">
                  <span className="kpi-label">Total Tags Defined</span>
                  <span className="kpi-val">{globalUsage.totalTags}</span>
                  <span className="kpi-sub">{globalUsage.unusedTagsCount} tags currently unused</span>
                </div>

                <div className="kpi-card emerald">
                  <span className="kpi-label">Active Tags</span>
                  <span className="kpi-val">{globalUsage.activeTags}</span>
                  <span className="kpi-sub">Available for attachment</span>
                </div>

                <div className="kpi-card amber">
                  <span className="kpi-label">Archived Tags</span>
                  <span className="kpi-val">{globalUsage.archivedTags}</span>
                  <span className="kpi-sub">Preserved for historical reporting</span>
                </div>

                <div className="kpi-card purple">
                  <span className="kpi-label">Total Entity Assignments</span>
                  <span className="kpi-val">{globalUsage.totalAssignments}</span>
                  <span className="kpi-sub">Across all workspace entities</span>
                </div>
              </div>

              {/* Entity Type Distribution Across Workspace */}
              <div className="tag-entity-breakdown-card">
                <h3 className="section-card-title">Entity Type Assignment Distribution</h3>
                <p className="section-card-subtitle">
                  How tags are distributed across Leads, Contacts, Companies, Deals, and Activities.
                </p>

                <div className="entity-bars-grid">
                  {(Object.keys(ENTITY_CONFIG) as TagEntityType[]).map((entityKey) => {
                    const count = globalUsage.assignmentsByEntityType[entityKey] || 0;
                    const percent =
                      globalUsage.totalAssignments > 0
                        ? Math.round((count / globalUsage.totalAssignments) * 100)
                        : 0;
                    const config = ENTITY_CONFIG[entityKey];

                    return (
                      <div key={entityKey} className="entity-bar-item">
                        <div className="bar-header">
                          <div className="bar-title">
                            <span className="bar-icon" style={{ color: config.color }}>
                              {config.icon}
                            </span>
                            <span className="bar-label">{config.label}</span>
                          </div>
                          <div className="bar-counts">
                            <strong className="bar-count-num">{count}</strong>
                            <span className="bar-count-pct">({percent}%)</span>
                          </div>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: config.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 10 Most Used Tags Leaderboard */}
              <div className="tag-recent-assignments-card">
                <div className="card-header-flex">
                  <div>
                    <h3 className="section-card-title">Top 10 Most Utilized Tags</h3>
                    <p className="section-card-subtitle">
                      Tags with the highest number of CRM entity attachments.
                    </p>
                  </div>
                  <Link to="/tags" className="auth-btn btn-ghost">
                    <span>Manage All Tags</span>
                    <ChevronRightIcon size={14} />
                  </Link>
                </div>

                {globalUsage.topTags.length === 0 ? (
                  <div className="tag-no-entities-box">
                    <p>No tag assignments recorded yet.</p>
                  </div>
                ) : (
                  <div className="recent-entities-table-responsive">
                    <table className="recent-entities-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Tag</th>
                          <th>Status</th>
                          <th>Protection</th>
                          <th>Usage Count</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {globalUsage.topTags.map((topTag, index) => (
                          <tr key={topTag.id}>
                            <td className="rank-cell">
                              <span className={`rank-badge ${index < 3 ? 'top-three' : ''}`}>
                                #{index + 1}
                              </span>
                            </td>
                            <td>
                              <TagBadge
                                name={topTag.name}
                                color={topTag.color}
                                status={topTag.status}
                                isProtected={topTag.isProtected}
                                size="md"
                              />
                            </td>
                            <td>
                              <span
                                className={`tag-status-pill status-${topTag.status.toLowerCase()}`}
                              >
                                <span className="status-dot" />
                                <span>{topTag.status}</span>
                              </span>
                            </td>
                            <td>
                              {topTag.isProtected ? (
                                <span className="tag-protected-chip">
                                  <LockIcon size={11} />
                                  <span>Protected</span>
                                </span>
                              ) : (
                                <span className="text-muted-dash">—</span>
                              )}
                            </td>
                            <td>
                              <strong className="usage-count-num">{topTag.usageCount}</strong>
                              <span className="usage-count-label"> assignments</span>
                            </td>
                            <td>
                              <div className="tag-actions-group">
                                <Link
                                  to={`/tags/${topTag.id}/usage`}
                                  className="tag-action-icon-btn usage"
                                  title="View Detailed Usage"
                                >
                                  <BarChart2Icon size={14} />
                                </Link>
                                <Link
                                  to={`/tags/${topTag.id}/edit`}
                                  className="tag-action-icon-btn edit"
                                  title="Edit Tag"
                                >
                                  <EditIcon size={14} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
};
