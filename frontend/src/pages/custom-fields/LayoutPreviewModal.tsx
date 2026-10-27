import React, { useState, useEffect } from 'react';
import { customFieldService } from '../../services/custom-field.service';
import type {
  CustomFieldEntityType,
  EntityLayoutResponse,
  FieldLayoutSection,
  FieldLayoutItem,
  CustomFieldOption,
} from '../../types/custom-field.types';
import { CustomFieldTypeBadge } from './CustomFieldBadges';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import {
  XIcon,
  SlidersIcon,
} from '../../components/common/Icons';

interface LayoutPreviewModalProps {
  initialEntityType?: CustomFieldEntityType;
  isOpen: boolean;
  onClose: () => void;
}

const ENTITY_LIST: CustomFieldEntityType[] = ['LEAD', 'CONTACT', 'COMPANY', 'DEAL', 'ACTIVITY'];

export const LayoutPreviewModal: React.FC<LayoutPreviewModalProps> = ({
  initialEntityType = 'LEAD',
  isOpen,
  onClose,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<CustomFieldEntityType>(initialEntityType);
  const [layoutData, setLayoutData] = useState<EntityLayoutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    const fetchLayout = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await customFieldService.getEntityLayout(selectedEntity);
        if (!ignore) {
          setLayoutData(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load entity layout schema');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchLayout();
    return () => {
      ignore = true;
    };
  }, [isOpen, selectedEntity]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-container" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div className="modal-header-icon primary">
            <SlidersIcon size={20} />
          </div>
          <div className="modal-header-text">
            <h3 className="modal-title">Dynamic Form Layout Preview</h3>
            <p className="modal-subtitle">
              Visual simulation of ordered custom fields & sections in the CRM {selectedEntity} form
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close layout preview"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
          {/* Entity Type Switcher in Modal */}
          <div className="entity-tabs-bar" style={{ marginBottom: '1.25rem' }}>
            {ENTITY_LIST.map((type) => (
              <button
                key={type}
                type="button"
                className={`entity-tab-btn ${selectedEntity === type ? 'is-active' : ''}`}
                onClick={() => setSelectedEntity(type)}
              >
                <span>{type}</span>
              </button>
            ))}
          </div>

          {apiError && <ErrorMessage error={apiError} />}

          {isLoading ? (
            <div className="module-loading-box" style={{ padding: '2rem' }}>
              <LoadingIndicator size="medium" message={`Rendering ${selectedEntity} layout schema...`} />
            </div>
          ) : !layoutData || layoutData.layout.length === 0 ? (
            <div className="empty-state-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p className="text-muted">
                No active custom fields configured for {selectedEntity}. Create a field to see it rendered here.
              </p>
            </div>
          ) : (
            <div>
              {layoutData.layout.map((section: FieldLayoutSection) => (
                <div key={section.name} className="layout-preview-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary, #f8fafc)', fontWeight: 600 }}>
                      {section.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {section.fields.length} {section.fields.length === 1 ? 'Field' : 'Fields'}
                    </span>
                  </div>

                  <div className="layout-preview-grid">
                    {section.fields.map((field: FieldLayoutItem) => (
                      <div
                        key={field.id}
                        className="layout-preview-field-box"
                        style={{ gridColumn: `span ${field.gridWidth || 12}` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                            {field.name}
                            {field.isRequired && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                          </span>
                          <CustomFieldTypeBadge fieldType={field.fieldType} />
                        </div>

                        {field.description && (
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                            {field.description}
                          </p>
                        )}

                        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color, #1e293b)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                          {field.placeholder || `Enter ${field.name}...`}
                        </div>

                        {field.options && field.options.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {field.options.slice(0, 4).map((opt: CustomFieldOption) => (
                              <span
                                key={opt.id}
                                className="option-color-chip"
                                style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}
                              >
                                {opt.color && <span className="option-color-dot" style={{ backgroundColor: opt.color }} />}
                                <span>{opt.label}</span>
                              </span>
                            ))}
                            {field.options.length > 4 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', alignSelf: 'center' }}>
                                +{field.options.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="auth-btn btn-primary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
