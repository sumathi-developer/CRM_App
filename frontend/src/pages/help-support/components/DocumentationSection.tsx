import React, { useState } from 'react';
import type { DocCategory, DocPage } from '../../../types/help-support.types';
import { BookOpenIcon, FileTextIcon } from '../helpIcons';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SearchIcon,
  XIcon,
} from '../../../components/common/Icons';

interface DocumentationSectionProps {
  categories: DocCategory[];
  pages: DocPage[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
}

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  categories,
  pages,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [activePage, setActivePage] = useState<DocPage | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .docs-section-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .docs-section-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Top Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          borderRadius: '14px',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: '#10B981',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documentation (e.g. 'architecture', 'lead deduplication', 'webhooks')..."
            style={{
              width: '100%',
              backgroundColor: '#F8FCF9',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '9px 34px 9px 36px',
              fontSize: '13.5px',
              color: '#062E03',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#10B981';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.backgroundColor = '#F8FCF9';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: '10px',
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label="Clear search"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Category Pill Dropdown / Reset */}
        {selectedCategoryId && (
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EAF4ED',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#10B981',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D1FAE5';
              e.currentTarget.style.borderColor = '#10B981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#EAF4ED';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }}
          >
            <span>Clear category filter ({selectedCategory?.name})</span>
            <XIcon size={12} />
          </button>
        )}
      </div>

      {activePage ? (
        // Documentation Page Reader
        <div
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            backgroundColor: '#FFFFFF',
            padding: '28px 32px',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
              paddingBottom: '14px',
            }}
          >
            <button
              type="button"
              onClick={() => setActivePage(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                backgroundColor: '#FFFFFF',
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#062E03',
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
              <ArrowLeftIcon size={14} />
              <span>Back to Documentation Index</span>
            </button>

            <span
              style={{
                borderRadius: '9999px',
                backgroundColor: '#EAF4ED',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#10B981',
              }}
            >
              v2.0.0
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#10B981',
              }}
            >
              <BookOpenIcon size={14} />
              <span>Documentation Guide</span>
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#062E03',
                margin: 0,
              }}
            >
              {activePage.title}
            </h2>
            {activePage.summary && (
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#64748B',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {activePage.summary}
              </p>
            )}
          </div>

          <div
            style={{
              fontSize: '14px',
              color: '#062E03',
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
              borderTop: '1px solid rgba(16, 185, 129, 0.12)',
              paddingTop: '20px',
            }}
          >
            {activePage.content}
          </div>

          {activePage.tags && activePage.tags.length > 0 && (
            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px solid rgba(16, 185, 129, 0.12)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {activePage.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    borderRadius: '6px',
                    backgroundColor: '#EAF4ED',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '3px 10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#10B981',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Documentation Categories & Pages List
        <div className="docs-section-grid">
          {/* Categories Sidebar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(16, 185, 129, 0.22)',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <h4
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#062E03',
                margin: '0 0 10px',
                padding: '0 4px',
              }}
            >
              Manual Sections
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <button
                type="button"
                onClick={() => onSelectCategory(undefined)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: !selectedCategoryId ? 600 : 500,
                  backgroundColor: !selectedCategoryId ? '#10B981' : 'transparent',
                  color: !selectedCategoryId ? '#FFFFFF' : '#062E03',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedCategoryId) {
                    e.currentTarget.style.backgroundColor = '#EAF4ED';
                    e.currentTarget.style.color = '#10B981';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategoryId) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#062E03';
                  }
                }}
              >
                <span>All Sections</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    backgroundColor: !selectedCategoryId ? '#059669' : '#EAF4ED',
                    color: !selectedCategoryId ? '#FFFFFF' : '#10B981',
                  }}
                >
                  {pages.length}
                </span>
              </button>
              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                const count = c.pageCount ?? c._count?.pages ?? 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCategory(c.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 500,
                      backgroundColor: isSelected ? '#10B981' : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#062E03',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#EAF4ED';
                        e.currentTarget.style.color = '#10B981';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#062E03';
                      }
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        backgroundColor: isSelected ? '#059669' : '#EAF4ED',
                        color: isSelected ? '#FFFFFF' : '#10B981',
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doc Pages List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.18)',
                      backgroundColor: '#FFFFFF',
                      padding: '20px',
                    }}
                  >
                    <div style={{ height: '18px', width: '50%', backgroundColor: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ height: '14px', width: '80%', backgroundColor: '#F8FCF9', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            ) : pages.length === 0 ? (
              <div
                style={{
                  borderRadius: '14px',
                  border: '1px dashed rgba(16, 185, 129, 0.3)',
                  backgroundColor: '#FFFFFF',
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#EAF4ED',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <BookOpenIcon size={24} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#062E03', margin: '0 0 6px' }}>
                  No Documentation Pages Found
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {searchQuery
                    ? `No documentation pages match "${searchQuery}". Try a different keyword.`
                    : selectedCategoryId
                      ? `No pages found in ${selectedCategory?.name || 'this section'}. Try selecting a different section or viewing all.`
                      : 'No documentation pages have been published yet.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#062E03',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '8px',
                        padding: '7px 14px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Clear Search
                    </button>
                  )}
                  {selectedCategoryId && (
                    <button
                      type="button"
                      onClick={() => onSelectCategory(undefined)}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: '1px solid #10B981',
                        borderRadius: '8px',
                        padding: '7px 16px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Show All Sections
                    </button>
                  )}
                </div>
              </div>
            ) : (
              pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => setActivePage(page)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    backgroundColor: '#FFFFFF',
                    padding: '18px 20px',
                    boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10B981', display: 'flex' }}>
                          <FileTextIcon size={16} />
                        </span>
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#062E03',
                            margin: 0,
                          }}
                        >
                          {page.title}
                        </h4>
                      </div>
                      {page.summary && (
                        <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0', lineHeight: 1.45 }}>
                          {page.summary}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        color: '#10B981',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <span>View</span>
                      <ArrowRightIcon size={12} />
                    </span>
                  </div>

                  {page.tags && page.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {page.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            backgroundColor: '#EAF4ED',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
