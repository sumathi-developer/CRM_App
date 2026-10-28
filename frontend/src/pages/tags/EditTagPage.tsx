import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tagService } from '../../services/tag.service';
import type { TagEntity, UpdateTagPayload } from '../../types/tag.types';
import { Navbar } from '../../components/common/Navbar';
import { TagForm } from './TagForm';
import { DeleteTagModal } from './DeleteTagModal';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  TagIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  BarChart2Icon,
  TrashIcon,
  LockIcon,
} from '../../components/common/Icons';

export const EditTagPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tag, setTag] = useState<TagEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load tag data
  useEffect(() => {
    if (!id) return;

    let ignore = false;
    const loadTag = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await tagService.getTagById(id);
        if (!ignore) {
          setTag(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Tag not found or failed to load.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadTag();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleUpdate = async (payload: UpdateTagPayload) => {
    if (!id) return;

    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const updated = await tagService.updateTag(id, payload);
      setTag(updated);
      setApiSuccess(`Tag "${updated.name}" updated successfully.`);
    } catch (err: any) {
      if (err.statusCode === 409) {
        setApiError(
          `A tag named "${payload.name}" already exists in this workspace. Please choose a different name.`
        );
      } else {
        setApiError(err.message || 'Failed to update tag.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async (tagId: string, hardDelete: boolean, force: boolean) => {
    setIsDeleting(true);
    setApiError(null);
    try {
      await tagService.deleteTag(tagId, hardDelete, force);
      setIsDeleteModalOpen(false);
      navigate('/tags');
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete tag.');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main-content tag-editor-page-container">
        {/* Header Row */}
        <div className="page-header-row">
          <div className="page-header-text">
            <div className="page-breadcrumbs">
              <Link to="/tags" className="breadcrumb-link">
                Tags
              </Link>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" />
              <span className="breadcrumb-item-name">{tag?.name || 'Loading...'}</span>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" />
              <span className="breadcrumb-current">Edit</span>
            </div>
            <h1 className="page-title">
              <span className="title-icon-wrap">
                <TagIcon size={24} />
              </span>
              <span>Edit Tag</span>
            </h1>
            <p className="page-subtitle">
              Modify tag name, color, guidelines, protection rules, or CRM availability status.
            </p>
          </div>

          <div className="page-header-actions">
            {tag && (
              <>
                <Link
                  to={`/tags/${tag.id}/usage`}
                  className="auth-btn btn-secondary"
                  title="View usage breakdown across CRM entities"
                >
                  <BarChart2Icon size={16} />
                  <span>Usage ({tag.usageCount})</span>
                </Link>

                <button
                  type="button"
                  className="auth-btn btn-danger-outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  title="Archive or Delete Tag"
                >
                  <TrashIcon size={16} />
                  <span>Delete</span>
                </button>
              </>
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

        {/* Protection Banner */}
        {tag?.isProtected && (
          <div className="tag-edit-protection-banner" role="status">
            <div className="banner-icon">
              <LockIcon size={20} />
            </div>
            <div className="banner-text">
              <strong>Workflow Protection Enabled</strong>
              <p>
                This tag is protected from accidental deletion. You can still safely rename,
                recolor, or change descriptions. To delete or archive this tag, uncheck &quot;Workflow Protection&quot; below.
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {apiError && (
          <div className="page-alert-wrap">
            <ErrorMessage error={apiError} onDismiss={() => setApiError(null)} />
          </div>
        )}

        {apiSuccess && (
          <div className="page-alert-wrap">
            <SuccessMessage message={apiSuccess} onDismiss={() => setApiSuccess(null)} />
          </div>
        )}

        {/* Loading or Form */}
        {isLoading ? (
          <div className="tags-loading-state">
            <LoadingIndicator size="medium" />
            <p className="loading-state-text">Loading tag details...</p>
          </div>
        ) : !tag ? (
          <div className="tags-empty-container">
            <p>Tag not found or has been removed.</p>
            <button
              type="button"
              className="auth-btn btn-primary"
              onClick={() => navigate('/tags')}
            >
              Return to Tags List
            </button>
          </div>
        ) : (
          <div className="tag-form-wrapper">
            <TagForm
              initialValues={{
                name: tag.name,
                color: tag.color,
                description: tag.description || '',
                status: tag.status,
                isProtected: tag.isProtected,
              }}
              onSubmit={handleUpdate}
              isEdit={true}
              isLoading={isSaving}
              error={apiError}
              submitLabel="Save Changes"
              cancelPath="/tags"
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {tag && (
          <DeleteTagModal
            isOpen={isDeleteModalOpen}
            tag={tag}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            isLoading={isDeleting}
          />
        )}
      </main>
    </div>
  );
};
