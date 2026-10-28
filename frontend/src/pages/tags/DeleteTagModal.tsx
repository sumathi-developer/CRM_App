import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TagEntity } from '../../types/tag.types';
import { TagBadge } from './TagBadge';
import {
  TrashIcon,
  XIcon,
  AlertCircleIcon,
  ShieldIcon,
  LockIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

interface DeleteTagModalProps {
  isOpen: boolean;
  tag: TagEntity | null;
  onClose: () => void;
  onConfirm: (tagId: string, hardDelete: boolean, force: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const DeleteTagModal: React.FC<DeleteTagModalProps> = ({
  isOpen,
  tag,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [deleteMode, setDeleteMode] = useState<'ARCHIVE' | 'HARD'>('ARCHIVE');
  const [confirmForceDetach, setConfirmForceDetach] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen || !tag) return null;

  const isProtected = tag.isProtected;
  const hasUsage = (tag.usageCount || 0) > 0;

  const handleConfirm = async () => {
    if (isProtected) {
      setLocalError('Protected tags cannot be deleted. Please uncheck "Protected" first.');
      return;
    }

    if (deleteMode === 'HARD' && hasUsage && !confirmForceDetach) {
      setLocalError('You must confirm force detachment to permanently delete an assigned tag.');
      return;
    }

    setLocalError(null);
    try {
      await onConfirm(tag.id, deleteMode === 'HARD', confirmForceDetach);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to delete tag. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-tag-title">
      <div className="modal-container modal-danger tag-delete-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className={`modal-header-icon ${isProtected ? 'warning' : 'danger'}`}>
            {isProtected ? <LockIcon size={22} /> : <TrashIcon size={22} />}
          </div>
          <div className="modal-header-text">
            <h3 id="delete-tag-title" className="modal-title">
              {isProtected
                ? 'Tag is Protected'
                : deleteMode === 'ARCHIVE'
                ? 'Archive Tag'
                : 'Permanently Delete Tag'}
            </h3>
            <p className="modal-subtitle">
              {isProtected
                ? 'Protected tags cannot be deleted directly'
                : 'Choose how to remove this tag from your workspace'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {localError && (
            <div className="tag-modal-alert tag-modal-alert-danger" role="alert">
              <AlertCircleIcon size={16} />
              <span>{localError}</span>
            </div>
          )}

          {/* Target Tag Pill */}
          <div className="tag-delete-target-preview">
            <div className="tag-target-badge-wrap">
              <TagBadge
                name={tag.name}
                color={tag.color}
                status={tag.status}
                isProtected={tag.isProtected}
                size="md"
              />
            </div>
            <div className="tag-target-meta">
              <span className="tag-target-usage">
                {hasUsage ? (
                  <strong>{tag.usageCount} CRM {tag.usageCount === 1 ? 'entity' : 'entities'} attached</strong>
                ) : (
                  <span>No active entity assignments</span>
                )}
              </span>
              <span className="tag-target-status">Status: {tag.status}</span>
            </div>
          </div>

          {/* Protected Tag Alert */}
          {isProtected ? (
            <div className="tag-modal-alert tag-modal-alert-warning">
              <ShieldIcon size={18} />
              <div>
                <strong>Deletion Blocked by Protection Policy</strong>
                <p>
                  Tag <strong>&quot;{tag.name}&quot;</strong> has protection turned on to prevent
                  accidental deletion in core workflows. You must unprotect this tag before you can
                  archive or permanently delete it.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Deletion Mode Selector */}
              <div className="tag-delete-mode-selector">
                <label
                  className={`tag-mode-option ${deleteMode === 'ARCHIVE' ? 'is-selected' : ''}`}
                  onClick={() => setDeleteMode('ARCHIVE')}
                >
                  <input
                    type="radio"
                    name="tagDeleteMode"
                    value="ARCHIVE"
                    checked={deleteMode === 'ARCHIVE'}
                    onChange={() => setDeleteMode('ARCHIVE')}
                    disabled={isLoading}
                  />
                  <div className="tag-mode-details">
                    <span className="tag-mode-title">
                      Safe Archive <span className="tag-mode-pill-recommended">Recommended</span>
                    </span>
                    <span className="tag-mode-desc">
                      Marks tag as ARCHIVED. Preserves all existing CRM entity tags and analytics safely,
                      while hiding it from active tag selection lists.
                    </span>
                  </div>
                </label>

                <label
                  className={`tag-mode-option ${deleteMode === 'HARD' ? 'is-selected danger' : ''}`}
                  onClick={() => setDeleteMode('HARD')}
                >
                  <input
                    type="radio"
                    name="tagDeleteMode"
                    value="HARD"
                    checked={deleteMode === 'HARD'}
                    onChange={() => setDeleteMode('HARD')}
                    disabled={isLoading}
                  />
                  <div className="tag-mode-details">
                    <span className="tag-mode-title">Permanent Hard Delete</span>
                    <span className="tag-mode-desc">
                      Completely removes the tag definition from the workspace database.
                      {hasUsage && ' Requires force detaching all existing assignments.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Force Detachment Warning for Hard Delete */}
              {deleteMode === 'HARD' && hasUsage && (
                <div className="tag-force-detach-warning">
                  <div className="tag-warning-icon">
                    <AlertCircleIcon size={18} />
                  </div>
                  <div className="tag-warning-content">
                    <strong>Entity Associations Will Be Removed</strong>
                    <p>
                      Permanently deleting this tag will automatically detach it from{' '}
                      <strong>{tag.usageCount} CRM entities</strong>. This action is irreversible.
                    </p>
                    <label className="tag-force-detach-checkbox">
                      <input
                        type="checkbox"
                        checked={confirmForceDetach}
                        onChange={(e) => setConfirmForceDetach(e.target.checked)}
                        disabled={isLoading}
                      />
                      <span>
                        I understand and want to permanently delete this tag and detach its associations.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="auth-btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>

          {isProtected ? (
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => {
                onClose();
                navigate(`/tags/${tag.id}/edit`);
              }}
            >
              Edit Tag to Unprotect
            </button>
          ) : (
            <button
              type="button"
              className={`auth-btn ${deleteMode === 'HARD' ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
              disabled={isLoading || (deleteMode === 'HARD' && hasUsage && !confirmForceDetach)}
            >
              {isLoading ? (
                'Processing...'
              ) : deleteMode === 'ARCHIVE' ? (
                <>
                  <CheckCircleIcon size={16} />
                  <span>Archive Tag</span>
                </>
              ) : (
                <>
                  <TrashIcon size={16} />
                  <span>Permanently Delete</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
