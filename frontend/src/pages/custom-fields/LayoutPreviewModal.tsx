import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
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
  BuildingIcon,
  UserIcon,
  TrophyIcon,
  CalendarIcon,
  PlusIcon,
} from '../../components/common/Icons';

interface LayoutPreviewModalProps {
  initialEntityType?: CustomFieldEntityType;
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_ENTITIES: Array<{
  type: CustomFieldEntityType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { type: 'LEAD', label: 'Lead', icon: BuildingIcon },
  { type: 'CONTACT', label: 'Contact', icon: UserIcon },
  { type: 'COMPANY', label: 'Company', icon: BuildingIcon },
  { type: 'DEAL', label: 'Deal', icon: TrophyIcon },
  { type: 'ACTIVITY', label: 'Activity', icon: CalendarIcon },
];

const ENTITY_LIST: CustomFieldEntityType[] = ['LEAD', 'CONTACT', 'COMPANY', 'DEAL', 'ACTIVITY'];

export const LayoutPreviewModal: React.FC<LayoutPreviewModalProps> = ({
  initialEntityType = 'LEAD',
  isOpen,
  onClose,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<CustomFieldEntityType>(initialEntityType);
  const [layoutCache, setLayoutCache] = useState<Partial<Record<CustomFieldEntityType, EntityLayoutResponse>>>({});
  const [layoutData, setLayoutData] = useState<EntityLayoutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync selectedEntity when modal opens
  useEffect(() => {
    if (isOpen && initialEntityType) {
      setSelectedEntity(initialEntityType);
    }
  }, [isOpen, initialEntityType]);

  // Preload all entities in background when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    ENTITY_LIST.forEach(async (entity) => {
      try {
        const data = await customFieldService.getEntityLayout(entity);
        if (!ignore) {
          setLayoutCache((prev) => ({ ...prev, [entity]: data }));
          if (entity === selectedEntity) {
            setLayoutData(data);
            setIsLoading(false);
          }
        }
      } catch {
        // quiet background preload
      }
    });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // If already in local cache, use it immediately with zero delay
    if (layoutCache[selectedEntity]) {
      setLayoutData(layoutCache[selectedEntity]!);
      setIsLoading(false);
      return;
    }

    let ignore = false;
    const fetchLayout = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await customFieldService.getEntityLayout(selectedEntity);
        if (!ignore) {
          setLayoutData(data);
          setLayoutCache((prev) => ({ ...prev, [selectedEntity]: data }));
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

  const handleSelectEntity = (type: CustomFieldEntityType) => {
    setSelectedEntity(type);
    if (layoutCache[type]) {
      setLayoutData(layoutCache[type]!);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('scrollbar-gutter', 'auto', 'important');
    document.body.style.setProperty('scrollbar-gutter', 'auto', 'important');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('scrollbar-gutter');
      document.body.style.removeProperty('scrollbar-gutter');
      if (prevBodyOverflow) document.body.style.overflow = prevBodyOverflow;
      if (prevHtmlOverflow) document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-container"
        style={{
          maxWidth: '880px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SlidersIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                Dynamic Form Layout Preview
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-secondary, #64748b)' }}>
                Visual simulation of ordered custom fields & sections in the CRM <strong>{selectedEntity}</strong> form
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close layout preview"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #64748b)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '68vh', padding: '1.5rem' }}>
          {/* Entity Type Switcher Grid in Modal */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.65rem',
              padding: '0.35rem',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
            }}
          >
            {PREVIEW_ENTITIES.map(({ type, label, icon: IconComponent }) => {
              const isSelected = selectedEntity === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelectEntity(type)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)',
                    background: isSelected ? '#10b981' : '#ffffff',
                    border: isSelected ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.22)',
                    boxShadow: isSelected
                      ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                      : '0 1px 2px rgba(0, 0, 0, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IconComponent size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {apiError && <ErrorMessage error={apiError} />}

          {isLoading ? (
            <div className="module-loading-box" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <LoadingIndicator size="medium" message={`Rendering ${selectedEntity} layout schema...`} />
            </div>
          ) : !layoutData || layoutData.layout.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                background: '#ffffff',
                border: '1.5px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <SlidersIcon size={26} />
              </div>
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                No custom fields configured for {selectedEntity}
              </h4>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.825rem', color: 'var(--text-secondary, #64748b)' }}>
                Custom schema attributes created for {selectedEntity} will appear here in their defined layout order.
              </p>
              <Link
                to="/custom-fields/create"
                className="auth-btn btn-primary btn-size-small"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                <PlusIcon size={15} />
                <span>Create {selectedEntity} Field</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {layoutData.layout.map((section: FieldLayoutSection) => (
                <div
                  key={section.name}
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(16, 185, 129, 0.14)',
                      paddingBottom: '0.65rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: 'var(--text-primary, #0f172a)',
                        fontWeight: 700,
                      }}
                    >
                      {section.name}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        color: '#065f46',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {section.fields.length} {section.fields.length === 1 ? 'Field' : 'Fields'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(12, 1fr)',
                      gap: '0.875rem',
                    }}
                  >
                    {section.fields.map((field: FieldLayoutItem) => (
                      <div
                        key={field.id}
                        style={{
                          gridColumn: `span ${field.gridWidth || 12}`,
                          background: '#ffffff',
                          border: '1.5px solid rgba(16, 185, 129, 0.22)',
                          borderRadius: '10px',
                          padding: '0.85rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.35rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              color: 'var(--text-primary, #0f172a)',
                            }}
                          >
                            {field.name}
                            {field.isRequired && (
                              <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                            )}
                          </span>
                          <CustomFieldTypeBadge fieldType={field.fieldType} />
                        </div>

                        {field.description && (
                          <p
                            style={{
                              margin: '0 0 0.5rem 0',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary, #64748b)',
                            }}
                          >
                            {field.description}
                          </p>
                        )}

                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.825rem',
                            color: '#475569',
                          }}
                        >
                          {field.placeholder || `Enter ${field.name}...`}
                        </div>

                        {field.options && field.options.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.35rem',
                              flexWrap: 'wrap',
                              marginTop: '0.5rem',
                            }}
                          >
                            {field.options.slice(0, 4).map((opt: CustomFieldOption) => (
                              <span
                                key={opt.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  fontSize: '0.725rem',
                                  fontWeight: 500,
                                  color: '#065f46',
                                }}
                              >
                                {opt.color && (
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      backgroundColor: opt.color,
                                    }}
                                  />
                                )}
                                <span>{opt.label}</span>
                              </span>
                            ))}
                            {field.options.length > 4 && (
                              <span
                                style={{
                                  fontSize: '0.725rem',
                                  color: '#64748b',
                                  alignSelf: 'center',
                                }}
                              >
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

        <div
          className="modal-footer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(16, 185, 129, 0.15)',
            background: 'rgba(16, 185, 129, 0.02)',
          }}
        >
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={onClose}
          >
            Close Preview
          </button>
          <Link
            to="/custom-fields/create"
            className="auth-btn btn-primary"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
            }}
          >
            <PlusIcon size={16} />
            <span>Create Field</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
