import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { FormField } from '../auth/FormField';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { BriefcaseIcon, XIcon } from '../common/Icons';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createWorkspace } = useWorkspace();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('FREE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setApiError('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      await createWorkspace({
        name: name.trim(),
        slug: slug.trim() || undefined,
        plan,
      });

      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      setApiError(err.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ws-modal-title"
      >
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <BriefcaseIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 id="create-ws-modal-title" className="modal-title">Create Workspace</h3>
            <p className="modal-subtitle">Set up a new isolated multi-tenant CRM workspace</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" id="create-workspace-form">
          <div className="modal-body">
            <ErrorMessage
              error={apiError}
              onDismiss={() => setApiError(null)}
              title="Creation Error"
            />

            <FormField
              id="ws-name-input"
              name="name"
              label="Workspace Name"
              placeholder="e.g. EMEA Sales Division"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              icon={<BriefcaseIcon size={18} />}
              required
              disabled={isSubmitting}
            />

            <FormField
              id="ws-slug-input"
              name="slug"
              label="URL Slug"
              placeholder="e.g. emea-sales"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isSubmitting}
              helperText="Unique identifier for workspace URL routing."
            />

            <div className="form-field-group">
              <label htmlFor="ws-plan-select" className="form-field-label">
                Initial Plan
              </label>
              <select
                id="ws-plan-select"
                className="form-select"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="FREE">Free (Up to 5 members)</option>
                <option value="STARTER">Starter ($29/mo)</option>
                <option value="PRO">Pro ($99/mo)</option>
                <option value="ENTERPRISE">Enterprise (Custom)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Creating..."
              fullWidth={false}
              id="btn-confirm-create-workspace"
            >
              Create Workspace
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
