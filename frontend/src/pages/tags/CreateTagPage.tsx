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
        <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
          <div className="page-header-text">
            <div className="page-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '4px' }}>
              <Link to="/tags" className="breadcrumb-link" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>
                Tags
              </Link>
              <ChevronRightIcon size={12} className="breadcrumb-arrow" style={{ color: '#94A3B8' }} />
              <span className="breadcrumb-current" style={{ color: '#64748B', fontWeight: 500 }}>Create Tag</span>
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
                <TagIcon size={22} />
              </span>
              <span>Create New Tag</span>
            </h1>
            <p className="page-subtitle" style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              Define a new tag badge, color, and usage guidelines for your CRM workspace.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={() => navigate('/tags')}
              disabled={isLoading}
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
