import React, { useState, useEffect } from 'react';
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
  GlobeIcon,
  SparklesIcon,
  BuildingIcon,
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
    if (!currentWorkspace?.id) {
      setMetrics({
        members: currentWorkspace?._count?.members || 1,
        contacts: 0,
        leads: 0,
        deals: 0,
        wonRevenue: 0,
        tasks: 0,
      });
      setMetricsLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        const m = await workspaceService.getMetrics(currentWorkspace.id);
        if (!ignore) {
          setMetrics(m);
        }
      } catch {
        if (!ignore) {
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
            {/* KPI Cards Combined */}
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
