import React, { useState } from 'react';
import { useWorkspace } from '../../context/useWorkspace';
import { FormField } from '../auth/FormField';
import { PrimaryButton } from '../auth/PrimaryButton';
import { ErrorMessage } from '../auth/ErrorMessage';
import { BriefcaseIcon, XIcon, PlusIcon, GlobeIcon } from '../common/Icons';

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
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [website, setWebsite] = useState('');
  const [plan, setPlan] = useState('FREE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
        description: description.trim() || undefined,
        timezone,
        currency,
        website: website.trim() || undefined,
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

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-ws-modal-title">
      <div className="modal-container">
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
              <label htmlFor="ws-desc-input" className="form-field-label">
                Description (Optional)
              </label>
              <textarea
                id="ws-desc-input"
                name="description"
                className="form-textarea"
                rows={2}
                placeholder="Brief purpose of this CRM workspace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <FormField
              id="ws-website-input"
              name="website"
              label="Corporate Website (Optional)"
              placeholder="https://company.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="form-row-two-col">
              <div className="form-field-group">
                <label htmlFor="ws-tz-select" className="form-field-label">
                  Timezone
                </label>
                <div className="form-input-wrapper has-left-icon">
                  <div className="form-input-icon left">
                    <GlobeIcon size={18} />
                  </div>
                  <select
                    id="ws-tz-select"
                    className="form-select"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="UTC">UTC (Universal)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  </select>
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="ws-currency-select" className="form-field-label">
                  Base Currency
                </label>
                <select
                  id="ws-currency-select"
                  className="form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

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
              icon={<PlusIcon size={16} />}
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
};
