import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { workspaceService } from '../../services/workspace.service';
import type { WorkspaceMetrics } from '../../types/workspace.types';
import { Navbar } from '../../components/common/Navbar';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { WorkspaceSwitcher } from '../../components/workspace/WorkspaceSwitcher';
import { CreateWorkspaceModal } from '../../components/workspace/CreateWorkspaceModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  GlobeIcon,
  SparklesIcon,
  ExternalLinkIcon,
  BuildingIcon,
  UserPlusIcon,
} from '../../components/common/Icons';

export const WorkspacePage: React.FC = () => {
  const { currentWorkspace, isLoading, refreshCurrentWorkspace } = useWorkspace();

  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!currentWorkspace?.id) return;

    const fetchMetrics = async () => {
      try {
        const m = await workspaceService.getMetrics(currentWorkspace.id);
        if (!ignore) {
          setMetrics(m);
        }
      } catch {
        if (!ignore) {
          // Gracefully default if metrics endpoint is empty
          setMetrics({
            members: currentWorkspace._count?.members || 1,
            contacts: 0,
            leads: 0,
            deals: 0,
            wonRevenue: 0,
            tasks: 0,
          });
        }
      } finally {
        if (!ignore) {
          setMetricsLoading(false);
        }
      }
    };

    fetchMetrics();
    return () => {
      ignore = true;
    };
  }, [currentWorkspace?.id, currentWorkspace?._count?.members]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, curr = 'USD') => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: curr,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${amount}`;
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="workspace-overview-page">
        {/* Workspace Header with Tabs & Switcher Button */}
        <WorkspaceHeader onOpenSwitcher={() => setIsSwitcherOpen(true)} />

        <ErrorMessage
          error={apiError}
          onDismiss={() => setApiError(null)}
          title="Workspace Notice"
        />

        {isLoading ? (
          <div className="workspace-loading-state" role="status">
            <LoadingIndicator size="large" message="Loading workspace overview..." />
          </div>
        ) : !currentWorkspace ? (
          <div className="empty-state-card">
            <BuildingIcon size={40} className="empty-icon" />
            <h3>No Active Workspace Selected</h3>
            <p>Please select a workspace context or create your first CRM workspace.</p>
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="workspace-overview-grid">
            {/* Left Main Column: KPI Metrics & Information */}
            <div className="overview-main-col">
              {/* KPI Cards */}
              <div className="metrics-cards-grid">
                <div className="metric-kpi-card">
                  <div className="metric-icon-box users">
                    <UsersIcon size={20} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-number">
                      {metricsLoading ? '...' : metrics?.members ?? (currentWorkspace._count?.members || 1)}
                    </span>
                    <span className="metric-label">Team Members</span>
                  </div>
                </div>

                <div className="metric-kpi-card">
                  <div className="metric-icon-box contacts">
                    <GlobeIcon size={20} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-number">
                      {metricsLoading ? '...' : metrics?.contacts ?? 0}
                    </span>
                    <span className="metric-label">CRM Contacts</span>
                  </div>
                </div>

                <div className="metric-kpi-card">
                  <div className="metric-icon-box deals">
                    <SparklesIcon size={20} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-number">
                      {metricsLoading ? '...' : metrics?.deals ?? 0}
                    </span>
                    <span className="metric-label">Active Deals</span>
                  </div>
                </div>

                <div className="metric-kpi-card highlight-revenue">
                  <div className="metric-icon-box revenue">
                    <BuildingIcon size={20} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-number">
                      {metricsLoading ? '...' : formatCurrency(metrics?.wonRevenue || 0, currentWorkspace.currency)}
                    </span>
                    <span className="metric-label">Won Pipeline Revenue</span>
                  </div>
                </div>
              </div>

              {/* Workspace Detailed Information Card */}
              <div className="portal-card ws-info-card">
                <div className="card-section-header-split">
                  <div className="header-left">
                    <div className="section-icon-badge" aria-hidden="true">
                      <BuildingIcon size={20} />
                    </div>
                    <div>
                      <h3 className="section-title">Workspace Information</h3>
                      <p className="section-desc">Tenant identity, localization & operational metadata</p>
                    </div>
                  </div>

                  <Link to="/workspaces/settings" className="btn-edit-toggle">
                    Edit Settings
                  </Link>
                </div>

                <div className="ws-info-fields-grid">
                  <div className="detail-item">
                    <span className="detail-label">Display Name</span>
                    <span className="detail-value">{currentWorkspace.name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Routing Slug</span>
                    <span className="detail-value font-mono">@{currentWorkspace.slug}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Workspace Owner</span>
                    <span className="detail-value">
                      {currentWorkspace.owner?.name || 'Workspace Administrator'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Operational Plan</span>
                    <span className="detail-value">
                      <span className={`plan-pill pill-${(currentWorkspace.plan || 'free').toLowerCase()}`}>
                        {currentWorkspace.plan || 'FREE'}
                      </span>
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Timezone & Locale</span>
                    <span className="detail-value">
                      {currentWorkspace.timezone || 'UTC'} ({currentWorkspace.currency || 'USD'})
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Created Date</span>
                    <span className="detail-value">
                      {formatDate(currentWorkspace.createdAt)}
                    </span>
                  </div>

                  <div className="detail-item full-span">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">
                      {currentWorkspace.description || 'No description configured for this workspace.'}
                    </span>
                  </div>

                  {currentWorkspace.website && (
                    <div className="detail-item full-span">
                      <span className="detail-label">Corporate Website</span>
                      <a
                        href={currentWorkspace.website}
                        target="_blank"
                        rel="noreferrer"
                        className="detail-link"
                      >
                        <span>{currentWorkspace.website}</span>
                        <ExternalLinkIcon size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Quick Navigation & Short cuts */}
            <aside className="overview-sidebar-col">
              {/* Quick Actions Card */}
              <div className="portal-card">
                <h4 className="shortcuts-title">Workspace Management</h4>
                <div className="shortcuts-list">
                  <Link to="/workspaces/members" className="shortcut-nav-item">
                    <div className="shortcut-icon-badge">
                      <UserPlusIcon size={18} />
                    </div>
                    <div className="shortcut-text">
                      <span className="shortcut-title">Manage Members</span>
                      <span className="shortcut-sub">Add or invite team members</span>
                    </div>
                  </Link>

                  <Link to="/workspaces/roles" className="shortcut-nav-item">
                    <div className="shortcut-icon-badge">
                      <ShieldIcon size={18} />
                    </div>
                    <div className="shortcut-text">
                      <span className="shortcut-title">Roles & Policies</span>
                      <span className="shortcut-sub">Configure RBAC authorization</span>
                    </div>
                  </Link>

                  <Link to="/workspaces/settings" className="shortcut-nav-item">
                    <div className="shortcut-icon-badge">
                      <SettingsIcon size={18} />
                    </div>
                    <div className="shortcut-text">
                      <span className="shortcut-title">Workspace Settings</span>
                      <span className="shortcut-sub">Branding, security & preferences</span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Multi-Tenant Security Highlights */}
              <div className="portal-card security-overview-card">
                <div className="tips-card-header">
                  <ShieldIcon size={20} className="tips-icon" />
                  <h4 className="tips-title">Tenant Isolation</h4>
                </div>
                <p className="security-card-desc">
                  Customer records, lead stages, contacts, and custom fields in <strong>{currentWorkspace.name}</strong> are strictly isolated from other workspaces.
                </p>
                <div className="security-pills-stack">
                  <span className="sec-tag">Role-Based Access Control</span>
                  <span className="sec-tag">Scoped Audit Logging</span>
                  <span className="sec-tag">256-bit Token Verification</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Switcher & Create Modals */}
      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          refreshCurrentWorkspace();
        }}
      />
    </div>
  );
};
