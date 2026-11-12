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
  DealsIcon,
  RefreshCwIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

const ENTITY_CONFIG: Record<
  TagEntityType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LEAD: { label: 'Leads', icon: <UserIcon size={16} />, color: '#3b82f6' },
  CONTACT: { label: 'Contacts', icon: <UsersIcon size={16} />, color: '#10b981' },
  COMPANY: { label: 'Companies', icon: <BuildingIcon size={16} />, color: '#8b5cf6' },
  DEAL: { label: 'Deals', icon: <DealsIcon size={16} />, color: '#f59e0b' },
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
        <style>{`
          .tag-usage-page-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 0 3.5rem;
            width: 100%;
          }

          /* Headers & Breadcrumbs */
          .tag-usage-page-container .page-breadcrumbs {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            margin-bottom: 6px;
          }
          .tag-usage-page-container .breadcrumb-link {
            color: #10B981 !important;
            text-decoration: none;
            font-weight: 600;
          }
          .tag-usage-page-container .breadcrumb-arrow {
            color: #94A3B8 !important;
          }
          .tag-usage-page-container .breadcrumb-item-name {
            color: #64748B !important;
            font-size: 13px;
            font-weight: 500;
          }
          .tag-usage-page-container .breadcrumb-current {
            color: #64748B !important;
            font-size: 13px;
            font-weight: 500;
          }
          .tag-usage-page-container .page-title {
            color: #062E03 !important;
            font-size: 24px !important;
            font-weight: 700 !important;
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 4px 0 6px !important;
          }
          .tag-usage-page-container .title-icon-wrap {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
            background-color: #EAF4ED !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
            color: #10B981 !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .tag-usage-page-container .page-subtitle {
            color: #64748B !important;
            font-size: 13.5px !important;
            margin: 0 !important;
          }

          /* Content Grid Layout */
          .tag-usage-page-container .tag-usage-content-grid {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          /* KPI Cards */
          .tag-usage-page-container .global-kpis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 0.25rem;
          }
          .tag-usage-page-container .kpi-card {
            background-color: #FFFFFF !important;
            border: 1px solid rgba(16, 185, 129, 0.22) !important;
            border-radius: 14px !important;
            padding: 20px 22px !important;
            box-shadow: 0 1px 3px rgba(6, 46, 3, 0.04) !important;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }
          .tag-usage-page-container .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.1) !important;
            border-color: rgba(16, 185, 129, 0.4) !important;
          }
          .tag-usage-page-container .kpi-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .tag-usage-page-container .kpi-label {
            font-size: 11.5px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            color: #64748B !important;
            letter-spacing: 0.05em !important;
          }
          .tag-usage-page-container .kpi-icon-pill {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .tag-usage-page-container .kpi-icon-pill.blue {
            background-color: #EFF6FF;
            color: #2563EB;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          .tag-usage-page-container .kpi-icon-pill.emerald {
            background-color: #EAF4ED;
            color: #10B981;
            border: 1px solid rgba(16, 185, 129, 0.25);
          }
          .tag-usage-page-container .kpi-icon-pill.amber {
            background-color: #FEF3C7;
            color: #D97706;
            border: 1px solid rgba(245, 158, 11, 0.25);
          }
          .tag-usage-page-container .kpi-icon-pill.purple {
            background-color: #F5F3FF;
            color: #7C3AED;
            border: 1px solid rgba(139, 92, 246, 0.25);
          }
          .tag-usage-page-container .kpi-val {
            font-size: 28px !important;
            font-weight: 800 !important;
            color: #062E03 !important;
            line-height: 1.15 !important;
            margin: 4px 0 2px !important;
          }
          .tag-usage-page-container .kpi-sub {
            font-size: 12px !important;
            color: #64748B !important;
            font-weight: 500 !important;
          }

          /* Section Cards */
          .tag-usage-page-container .tag-entity-breakdown-card,
          .tag-usage-page-container .tag-recent-assignments-card,
          .tag-usage-page-container .tag-usage-overview-card {
            background-color: #FFFFFF !important;
            border: 1px solid rgba(16, 185, 129, 0.22) !important;
            border-radius: 16px !important;
            padding: 24px 28px !important;
            box-shadow: 0 1px 3px rgba(6, 46, 3, 0.04) !important;
          }
          .tag-usage-page-container .section-card-title {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #062E03 !important;
            margin-bottom: 4px !important;
          }
          .tag-usage-page-container .section-card-subtitle {
            font-size: 13px !important;
            color: #64748B !important;
            margin-bottom: 1.5rem !important;
          }

          /* Entity Distribution Grid */
          .tag-usage-page-container .entity-bars-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
            gap: 1rem !important;
          }
          .tag-usage-page-container .entity-bar-item {
            background-color: #F8FCF9 !important;
            border: 1px solid rgba(16, 185, 129, 0.18) !important;
            border-radius: 12px !important;
            padding: 14px 18px !important;
            transition: all 0.2s ease !important;
          }
          .tag-usage-page-container .entity-bar-item:hover {
            border-color: rgba(16, 185, 129, 0.35) !important;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.06);
          }
          .tag-usage-page-container .bar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .tag-usage-page-container .bar-title {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .tag-usage-page-container .bar-icon-wrap {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .tag-usage-page-container .bar-label {
            font-size: 13.5px !important;
            font-weight: 600 !important;
            color: #062E03 !important;
          }
          .tag-usage-page-container .bar-counts {
            display: flex;
            align-items: baseline;
            gap: 4px;
          }
          .tag-usage-page-container .bar-count-num {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #062E03 !important;
          }
          .tag-usage-page-container .bar-count-pct {
            font-size: 12px !important;
            color: #64748B !important;
            font-weight: 500 !important;
          }
          .tag-usage-page-container .progress-track {
            width: 100% !important;
            height: 7px !important;
            background-color: #E2E8F0 !important;
            border-radius: 9999px !important;
            overflow: hidden !important;
          }
          .tag-usage-page-container .progress-fill {
            height: 100% !important;
            border-radius: 9999px !important;
            transition: width 0.4s ease !important;
          }

          /* Table styling */
          .tag-usage-page-container .recent-entities-table-responsive {
            width: 100%;
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid rgba(16, 185, 129, 0.15);
          }
          .tag-usage-page-container .recent-entities-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .tag-usage-page-container .recent-entities-table thead th {
            padding: 12px 16px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            color: #64748B !important;
            letter-spacing: 0.04em !important;
            background-color: #F8FCF9 !important;
            border-bottom: 1px solid rgba(16, 185, 129, 0.15) !important;
            text-align: left;
          }
          .tag-usage-page-container .recent-entities-table tbody tr {
            border-bottom: 1px solid rgba(16, 185, 129, 0.1) !important;
            transition: background-color 0.15s ease !important;
          }
          .tag-usage-page-container .recent-entities-table tbody tr:last-child {
            border-bottom: none !important;
          }
          .tag-usage-page-container .recent-entities-table tbody tr:hover {
            background-color: #F8FCF9 !important;
          }
          .tag-usage-page-container .recent-entities-table td {
            padding: 12px 16px !important;
            font-size: 13px !important;
            color: #062E03 !important;
            vertical-align: middle !important;
          }
          .tag-usage-page-container .rank-badge {
            width: 26px !important;
            height: 26px !important;
            border-radius: 50% !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            background-color: #F1F5F9 !important;
            color: #64748B !important;
          }
          .tag-usage-page-container .rank-badge.top-three {
            background-color: #EAF4ED !important;
            color: #10B981 !important;
            border: 1px solid rgba(16, 185, 129, 0.35) !important;
          }
          .tag-usage-page-container .usage-count-num {
            font-weight: 700 !important;
            color: #062E03 !important;
          }
          .tag-usage-page-container .usage-count-label {
            color: #64748B !important;
            font-size: 12px !important;
          }
          .tag-usage-page-container .tag-action-icon-btn {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: #FFFFFF !important;
            border: 1px solid rgba(16, 185, 129, 0.25) !important;
            color: #10B981 !important;
            cursor: pointer !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
          }
          .tag-usage-page-container .tag-action-icon-btn:hover {
            background-color: #EAF4ED !important;
            border-color: #10B981 !important;
            color: #059669 !important;
          }
          .tag-usage-page-container .tag-actions-group {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .tag-usage-page-container .tag-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 9999px;
            font-size: 11.5px;
            font-weight: 600;
          }
          .tag-usage-page-container .tag-status-pill.status-active {
            background-color: #EAF4ED !important;
            color: #10B981 !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
          }
          .tag-usage-page-container .tag-status-pill.status-active .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #10B981;
          }
          .tag-usage-page-container .tag-status-pill.status-inactive {
            background-color: #F1F5F9 !important;
            color: #64748B !important;
            border: 1px solid #CBD5E1 !important;
          }
          .tag-usage-page-container .tag-status-pill.status-inactive .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #64748B;
          }
          .tag-usage-page-container .tag-status-pill.status-archived {
            background-color: #FEF3C7 !important;
            color: #D97706 !important;
            border: 1px solid rgba(245, 158, 11, 0.35) !important;
          }
          .tag-usage-page-container .tag-status-pill.status-archived .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #D97706;
          }
          .tag-usage-page-container .tag-protected-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            background-color: #FEF3C7 !important;
            color: #D97706 !important;
            border: 1px solid rgba(245, 158, 11, 0.35) !important;
          }

          /* Single Tag Mode Overview */
          .tag-usage-page-container .overview-header-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1.5rem;
            margin-bottom: 1.25rem;
            flex-wrap: wrap;
          }
          .tag-usage-page-container .overview-desc-text {
            color: #64748B !important;
            font-size: 13px !important;
            margin-top: 8px !important;
            line-height: 1.45;
          }
          .tag-usage-page-container .overview-counter-col {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .tag-usage-page-container .counter-super-number {
            font-size: 36px !important;
            font-weight: 800 !important;
            color: #062E03 !important;
            line-height: 1 !important;
          }
          .tag-usage-page-container .counter-super-label {
            font-size: 12.5px !important;
            color: #64748B !important;
            margin-top: 4px;
          }
          .tag-usage-page-container .overview-status-strip {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(16, 185, 129, 0.15) !important;
            flex-wrap: wrap;
          }
          .tag-usage-page-container .strip-label {
            color: #64748B !important;
            font-size: 12.5px;
            font-weight: 500;
          }
          .tag-usage-page-container .strip-val {
            color: #062E03 !important;
            font-weight: 600;
          }
          .tag-usage-page-container .overview-status-strip code {
            background-color: #F8FCF9 !important;
            color: #062E03 !important;
            border: 1px solid rgba(16, 185, 129, 0.25) !important;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 12px;
          }
          .tag-usage-page-container .mini-id-code {
            background-color: #F8FCF9 !important;
            color: #062E03 !important;
            border: 1px solid rgba(16, 185, 129, 0.18) !important;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
          }
          .tag-usage-page-container .entity-type-badge-mini {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11.5px;
            font-weight: 600;
          }
          .tag-usage-page-container .tag-no-entities-box {
            padding: 2.5rem;
            text-align: center;
            color: #64748B !important;
            font-size: 13.5px;
            background-color: #F8FCF9;
            border-radius: 10px;
            border: 1px dashed rgba(16, 185, 129, 0.25);
          }
          .tag-usage-page-container .tags-empty-container {
            background-color: #FFFFFF;
            border: 1px solid rgba(16, 185, 129, 0.22);
            border-radius: 16px;
            padding: 3rem 2rem;
            text-align: center;
            box-shadow: 0 1px 3px rgba(6, 46, 3, 0.04);
          }
          .tag-usage-page-container .tags-loading-state {
            padding: 3.5rem 2rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .tag-usage-page-container .loading-state-text {
            color: #64748B !important;
            font-size: 14px;
            font-weight: 500;
          }
        `}</style>

        {/* Breadcrumb Header */}
        <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
          <div className="page-header-text">
            <div className="page-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '6px' }}>
              <Link to="/tags" className="breadcrumb-link" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>
                Tags
              </Link>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" style={{ color: '#94A3B8' }} />
              {isSingleTagMode ? (
                <>
                  <span className="breadcrumb-item-name" style={{ color: '#64748B', fontWeight: 500 }}>
                    {singleUsage?.name || 'Tag Usage'}
                  </span>
                  <ChevronRightIcon size={12} className="breadcrumb-arrow" style={{ color: '#94A3B8' }} />
                  <span className="breadcrumb-current" style={{ color: '#64748B', fontWeight: 500 }}>Usage Statistics</span>
                </>
              ) : (
                <span className="breadcrumb-current" style={{ color: '#64748B', fontWeight: 500 }}>Workspace Usage Analytics</span>
              )}
            </div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#062E03', fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>
              <span
                className="title-icon-wrap"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EAF4ED',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart2Icon size={22} />
              </span>
              <span>
                {isSingleTagMode
                  ? `Tag Usage: ${singleUsage?.name || '...'}`
                  : 'Workspace Tag Analytics'}
              </span>
            </h1>
            <p className="page-subtitle" style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              {isSingleTagMode
                ? 'Detailed breakdown of CRM entities and recent assignments associated with this tag.'
                : 'Global metrics, assignment distribution, and top utilized tags in your workspace.'}
            </p>
          </div>

          <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isSingleTagMode && singleUsage && (
              <>
                <Link
                  to={`/tags/${singleUsage.tagId}/edit`}
                  className="auth-btn btn-secondary"
                  id="tag-usage-edit-btn"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.borderColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                >
                  <EditIcon size={16} />
                  <span>Edit Tag</span>
                </Link>

                <Link
                  to="/tags/usage"
                  className="auth-btn btn-ghost"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#062E03',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EAF4ED';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                  }}
                >
                  <BarChart2Icon size={16} />
                  <span>Global Analytics</span>
                </Link>
              </>
            )}

            {!isSingleTagMode && (
              <Link
                to="/tags"
                className="auth-btn btn-primary"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.borderColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.borderColor = '#10B981';
                }}
              >
                <TagIcon size={16} />
                <span>All Tags</span>
              </Link>
            )}

            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={() => navigate('/tags')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#062E03',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EAF4ED';
                e.currentTarget.style.borderColor = '#10B981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
              }}
            >
              <ArrowLeftIcon size={16} />
              <span>Back to Tags</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="page-alert-wrap" style={{ marginBottom: '1.25rem' }}>
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
                        <span style={{ color: '#062E03', fontWeight: 500 }}>Standard</span>
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
                            <span
                              className="bar-icon-wrap"
                              style={{
                                color: config.color,
                                backgroundColor: `${config.color}15`,
                                border: `1px solid ${config.color}30`,
                              }}
                            >
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
                    <p style={{ margin: 0 }}>No CRM entities currently attached to this tag.</p>
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
                                    border: `1px solid ${config.color}35`,
                                    color: config.color,
                                    backgroundColor: `${config.color}12`,
                                  }}
                                >
                                  {config.icon}
                                  <span>{config.label}</span>
                                </span>
                              </td>
                              <td className="entity-name-cell">
                                <strong style={{ color: '#062E03' }}>{item.entityName || 'Unnamed Record'}</strong>
                              </td>
                              <td className="entity-id-cell">
                                <code className="mini-id-code">{item.entityId.slice(0, 8)}...</code>
                              </td>
                              <td className="entity-date-cell" style={{ color: '#64748B' }}>
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
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '1.25rem' }}>Tag usage statistics not available.</p>
              <button
                type="button"
                className="auth-btn btn-primary"
                onClick={() => navigate('/tags')}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
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
                  <div className="kpi-card-header">
                    <span className="kpi-label">Total Tags Defined</span>
                    <span className="kpi-icon-pill blue">
                      <TagIcon size={16} />
                    </span>
                  </div>
                  <span className="kpi-val">{globalUsage.totalTags}</span>
                  <span className="kpi-sub">{globalUsage.unusedTagsCount} tags currently unused</span>
                </div>

                <div className="kpi-card emerald">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Active Tags</span>
                    <span className="kpi-icon-pill emerald">
                      <CheckCircleIcon size={16} />
                    </span>
                  </div>
                  <span className="kpi-val">{globalUsage.activeTags}</span>
                  <span className="kpi-sub">Available for attachment</span>
                </div>

                <div className="kpi-card amber">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Archived Tags</span>
                    <span className="kpi-icon-pill amber">
                      <LockIcon size={16} />
                    </span>
                  </div>
                  <span className="kpi-val">{globalUsage.archivedTags}</span>
                  <span className="kpi-sub">Preserved for historical reporting</span>
                </div>

                <div className="kpi-card purple">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Total Entity Assignments</span>
                    <span className="kpi-icon-pill purple">
                      <BarChart2Icon size={16} />
                    </span>
                  </div>
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
                            <span
                              className="bar-icon-wrap"
                              style={{
                                color: config.color,
                                backgroundColor: `${config.color}15`,
                                border: `1px solid ${config.color}30`,
                              }}
                            >
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
                <div className="card-header-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 className="section-card-title">Top 10 Most Utilized Tags</h3>
                    <p className="section-card-subtitle" style={{ marginBottom: 0 }}>
                      Tags with the highest number of CRM entity attachments.
                    </p>
                  </div>
                  <Link
                    to="/tags"
                    className="auth-btn btn-ghost"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#062E03',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#EAF4ED';
                      e.currentTarget.style.borderColor = '#10B981';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                    }}
                  >
                    <span>Manage All Tags</span>
                    <ChevronRightIcon size={14} />
                  </Link>
                </div>

                {globalUsage.topTags.length === 0 ? (
                  <div className="tag-no-entities-box">
                    <p style={{ margin: 0 }}>No tag assignments recorded yet.</p>
                  </div>
                ) : (
                  <div className="recent-entities-table-responsive">
                    <table className="recent-entities-table">
                      <thead>
                        <tr>
                          <th style={{ width: '70px' }}>Rank</th>
                          <th>Tag</th>
                          <th>Status</th>
                          <th>Protection</th>
                          <th>Usage Count</th>
                          <th style={{ textAlign: 'right', width: '100px' }}>Actions</th>
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
                                <span style={{ color: '#94A3B8' }}>—</span>
                              )}
                            </td>
                            <td>
                              <strong className="usage-count-num">{topTag.usageCount}</strong>
                              <span className="usage-count-label"> {topTag.usageCount === 1 ? 'assignment' : 'assignments'}</span>
                            </td>
                            <td>
                              <div className="tag-actions-group" style={{ justifyContent: 'flex-end' }}>
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
