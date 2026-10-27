import React, { useState } from 'react';
import { useWorkspace } from '../../context/useWorkspace';
import {
  BriefcaseIcon,
  SearchIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
  UsersIcon,
  SparklesIcon,
} from '../common/Icons';
import { LoadingIndicator } from '../auth/LoadingIndicator';

interface WorkspaceSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate?: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  isOpen,
  onClose,
  onOpenCreate,
}) => {
  const { currentWorkspace, myWorkspaces, switchWorkspace, isSwitching } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredWorkspaces = myWorkspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (wsId: string) => {
    if (wsId === currentWorkspace?.id || isSwitching) return;
    setSwitchingId(wsId);
    try {
      await switchWorkspace(wsId);
      onClose();
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="switcher-modal-title">
      <div className="modal-container switcher-modal">
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <BriefcaseIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="switcher-modal-title" className="modal-title">Switch Workspace</h3>
            <p className="modal-subtitle">Select an enterprise workspace context</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close switcher"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="switcher-search-bar">
          <SearchIcon size={16} className="search-icon" />
          <input
            type="text"
            className="switcher-search-input"
            placeholder="Search workspaces by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        <div className="switcher-list">
          {filteredWorkspaces.map((ws) => {
            const isCurrent = ws.id === currentWorkspace?.id;
            const isTargetSwitching = switchingId === ws.id;

            return (
              <div
                key={ws.id}
                role="button"
                tabIndex={0}
                className={`switcher-item ${isCurrent ? 'is-active' : ''} ${isTargetSwitching ? 'is-switching' : ''}`}
                onClick={() => handleSelect(ws.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(ws.id);
                  }
                }}
              >
                <div className="switcher-item-avatar">
                  {getInitials(ws.name)}
                </div>

                <div className="switcher-item-details">
                  <div className="switcher-item-title-row">
                    <span className="switcher-item-name">{ws.name}</span>
                    <span className={`plan-pill pill-${(ws.plan || 'free').toLowerCase()}`}>
                      <SparklesIcon size={10} />
                      <span>{ws.plan || 'FREE'}</span>
                    </span>
                    {isCurrent && (
                      <span className="current-indicator-pill">Active</span>
                    )}
                  </div>
                  <div className="switcher-item-meta">
                    <span>@{ws.slug}</span>
                    <span className="meta-dot">&bull;</span>
                    <span className="switcher-member-count">
                      <UsersIcon size={12} />
                      <span>{ws._count?.members || 1} members</span>
                    </span>
                    {ws.myRole && (
                      <>
                        <span className="meta-dot">&bull;</span>
                        <span className="switcher-role-tag">{ws.myRole}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="switcher-item-status">
                  {isTargetSwitching ? (
                    <LoadingIndicator size="small" inline />
                  ) : isCurrent ? (
                    <div className="check-badge" aria-label="Currently active">
                      <CheckIcon size={16} />
                    </div>
                  ) : (
                    <span className="switch-to-label">Select</span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredWorkspaces.length === 0 && (
            <div className="switcher-empty">
              <p>No workspaces match "{searchQuery}"</p>
            </div>
          )}
        </div>

        <div className="modal-footer switcher-footer">
          {onOpenCreate && (
            <button
              type="button"
              className="btn-create-workspace-action"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              id="switcher-btn-create-workspace"
            >
              <PlusIcon size={16} />
              <span>Create New Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
