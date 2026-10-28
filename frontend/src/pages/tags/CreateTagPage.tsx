import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tagService } from '../../services/tag.service';
import { useWorkspace } from '../../context/useWorkspace';
import type { CreateTagPayload } from '../../types/tag.types';
import { Navbar } from '../../components/common/Navbar';
import { TagForm } from './TagForm';
import {
  TagIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '../../components/common/Icons';

export const CreateTagPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async (payload: CreateTagPayload) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await tagService.createTag({
        ...payload,
        workspaceId: currentWorkspace?.id,
      });

      navigate('/tags');
    } catch (err: any) {
      if (err.statusCode === 409) {
        setErrorMessage(
          `A tag named "${payload.name}" already exists in this workspace. Please use a different name.`
        );
      } else {
        setErrorMessage(err.message || 'Failed to create tag. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main-content tag-editor-page-container">
        {/* Breadcrumbs & Navigation Header */}
        <div className="page-header-row">
          <div className="page-header-text">
            <div className="page-breadcrumbs">
              <Link to="/tags" className="breadcrumb-link">
                Tags
              </Link>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" />
              <span className="breadcrumb-current">Create Tag</span>
            </div>
            <h1 className="page-title">
              <span className="title-icon-wrap">
                <TagIcon size={24} />
              </span>
              <span>Create New Tag</span>
            </h1>
            <p className="page-subtitle">
              Define a new tag badge, color, and usage guidelines for your CRM workspace.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={() => navigate('/tags')}
              disabled={isLoading}
            >
              <ArrowLeftIcon size={16} />
              <span>Back to Tags</span>
            </button>
          </div>
        </div>

        {/* Tag Form */}
        <div className="tag-form-wrapper">
          <TagForm
            onSubmit={handleCreate}
            isLoading={isLoading}
            error={errorMessage}
            submitLabel="Create Tag"
            cancelPath="/tags"
          />
        </div>
      </main>
    </div>
  );
};
