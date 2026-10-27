import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { Navbar } from '../../components/common/Navbar';
import { CreateWorkspaceModal } from '../../components/workspace/CreateWorkspaceModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import {
  BriefcaseIcon,
  SearchIcon,
  PlusIcon,
  CheckIcon,
  UsersIcon,
  SparklesIcon,
  GlobeIcon,
  XIcon,
} from '../../components/common/Icons';

export const WorkspaceSwitcherPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace, myWorkspaces, switchWorkspace, isSwitching, refreshCurrentWorkspace } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredWorkspaces = myWorkspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id || isSwitching) {
      navigate('/workspaces');
      return;
    }

    setSwitchingId(workspaceId);
    try {
      await switchWorkspace(workspaceId);
      navigate('/workspaces');
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    } finally {
      setSwitchingId(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'WS';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="workspace-switcher-page">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Workspace Switcher</h1>
            <p className="page-subtitle">
              Select or create an enterprise CRM workspace context
            </p>
          </div>

          <div className="page-actions-group">
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
              id="btn-create-workspace-top"
            >
              <PlusIcon size={16} />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>

        {/* Search & Count Bar */}
        <div className="switcher-toolbar">
          <div className="search-input-box">
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search workspaces by name, slug or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>

          <div className="workspaces-count-tag">
            Showing {filteredWorkspaces.length} of {myWorkspaces.length} workspaces
          </div>
        </div>

        {/* Workspaces Cards Grid */}
        <div className="workspaces-cards-grid">
          {filteredWorkspaces.map((ws) => {
            const isCurrent = ws.id === currentWorkspace?.id;
            const isTargetSwitching = switchingId === ws.id;

            return (
              <div
                key={ws.id}
                className={`workspace-card-item ${isCurrent ? 'is-active-workspace' : ''}`}
                id={`workspace-card-${ws.id}`}
              >
                <div className="card-top-row">
                  <div className="ws-card-avatar">
                    {getInitials(ws.name)}
                  </div>

                  <div className="card-badges-stack">
                    <span className={`plan-pill pill-${(ws.plan || 'free').toLowerCase()}`}>
                      <SparklesIcon size={11} />
                      <span>{ws.plan || 'FREE'}</span>
                    </span>
                    {isCurrent ? (
                      <span className="current-badge">
                        <CheckIcon size={12} />
                        <span>Active Context</span>
                      </span>
                    ) : (
                      <span className="inactive-badge">{ws.status || 'ACTIVE'}</span>
                    )}
                  </div>
                </div>

                <div className="card-content-body">
                  <h3 className="ws-card-title">{ws.name}</h3>
                  <span className="ws-card-slug font-mono">@{ws.slug}</span>
                  <p className="ws-card-description">
                    {ws.description || 'Enterprise CRM workspace with multi-tenant data governance.'}
                  </p>
                </div>

                <div className="card-meta-footer">
                  <div className="meta-tags-row">
                    <span className="meta-tag">
                      <UsersIcon size={13} />
                      <span>{ws._count?.members || 1} members</span>
                    </span>
                    {ws.timezone && (
                      <span className="meta-tag">
                        <GlobeIcon size={13} />
                        <span>{ws.currency || 'USD'}</span>
                      </span>
                    )}
                    {ws.myRole && (
                      <span className="meta-tag role-tag">Role: {ws.myRole}</span>
                    )}
                  </div>

                  <div className="card-action-wrap">
                    {isCurrent ? (
                      <button
                        type="button"
                        className="auth-btn btn-secondary btn-full-width"
                        onClick={() => navigate('/workspaces')}
                      >
                        <span>Open Workspace</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="auth-btn btn-primary btn-full-width"
                        onClick={() => handleSwitch(ws.id)}
                        disabled={isSwitching}
                      >
                        {isTargetSwitching ? (
                          <LoadingIndicator size="small" message="Switching..." inline />
                        ) : (
                          <span>Switch to Workspace</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredWorkspaces.length === 0 && (
            <div className="empty-state-card full-grid-span">
              <BriefcaseIcon size={40} className="empty-icon" />
              <h3>No Workspaces Found</h3>
              <p>No available workspaces match your search filter "{searchQuery}".</p>
              <button
                type="button"
                className="auth-btn btn-secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

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
