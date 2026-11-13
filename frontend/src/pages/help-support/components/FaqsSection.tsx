import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FaqItem } from '../../../types/help-support.types';
import { FAQ_CATEGORIES } from '../helpSupportConstants';
import { HelpCircleIcon, LifeBuoyIcon, ThumbsUpIcon } from '../helpIcons';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from '../../../components/common/Icons';

interface FaqsSectionProps {
  faqs: FaqItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const FaqsSection: React.FC<FaqsSectionProps> = ({
  faqs,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
}) => {
  // Expanded FAQ items tracker
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    // Keep first item open by default for immediate preview
    [faqs[0]?.id || '']: true,
  });

  const toggleFaq = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Search & Category Filters */}
      <div
        style={{
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          backgroundColor: '#FFFFFF',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
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
            placeholder="Search questions (e.g. 'invite team', 'export data', 'audit logs')..."
            style={{
              width: '100%',
              backgroundColor: '#F8FCF9',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '10px 36px 10px 38px',
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
                right: '12px',
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

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {FAQ_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onSelectCategory(cat.value)}
                style={{
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid #10B981'
                    : '1px solid rgba(16, 185, 129, 0.25)',
                  backgroundColor: isSelected ? '#10B981' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#062E03',
                  boxShadow: isSelected ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#EAF4ED';
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.color = '#10B981';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                    e.currentTarget.style.color = '#062E03';
                  }
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                  backgroundColor: '#FFFFFF',
                  padding: '16px 20px',
                }}
              >
                <div style={{ height: '18px', width: '65%', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div
            style={{
              borderRadius: '16px',
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
              <HelpCircleIcon size={24} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#062E03', margin: '0 0 6px' }}>
              No Questions Found
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 0 16px', lineHeight: 1.5 }}>
              We couldn't find any FAQs matching your query. Check out our documentation or contact our customer support team.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory('ALL');
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#062E03',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
              <Link
                to="/help/support"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Contact Support
              </Link>
            </div>
          </div>
        ) : (
          faqs.map((faq) => {
            const isExpanded = Boolean(expandedIds[faq.id]);
            return (
              <div
                key={faq.id}
                style={{
                  borderRadius: '12px',
                  border: isExpanded
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid rgba(16, 185, 129, 0.2)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Accordion Question Header */}
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    textAlign: 'left',
                    backgroundColor: isExpanded ? '#F8FCF9' : '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    gap: '12px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.backgroundColor = '#F8FCF9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#EAF4ED',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10B981',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      Q
                    </span>
                    <span
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: '#062E03',
                        lineHeight: 1.4,
                      }}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <span style={{ color: isExpanded ? '#10B981' : '#94A3B8', display: 'flex', flexShrink: 0 }}>
                    {isExpanded ? (
                      <ChevronDownIcon size={18} />
                    ) : (
                      <ChevronRightIcon size={18} />
                    )}
                  </span>
                </button>

                {/* Accordion Answer Content */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid rgba(16, 185, 129, 0.15)',
                      backgroundColor: '#FFFFFF',
                      padding: '18px 20px 18px 58px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        whiteSpace: 'pre-line',
                        fontSize: '13.5px',
                        color: '#062E03',
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.answer}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(16, 185, 129, 0.12)',
                        fontSize: '12px',
                        color: '#64748B',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <span
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
                        Category: {faq.category}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#64748B',
                        }}
                      >
                        <ThumbsUpIcon size={13} style={{ color: '#10B981' }} />
                        <span>{faq.helpfulCount} people found this helpful</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions CTA Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F4FBF7 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(6, 46, 3, 0.04)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#EAF4ED',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LifeBuoyIcon size={20} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '15.5px',
                fontWeight: 700,
                color: '#062E03',
                margin: 0,
              }}
            >
              Still haven't found what you're looking for?
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                margin: '3px 0 0',
                lineHeight: 1.4,
              }}
            >
              Our specialized support team is here to assist you with any questions or technical challenges.
            </p>
          </div>
        </div>

        <Link
          to="/help/support"
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: '1px solid #10B981',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.borderColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10B981';
            e.currentTarget.style.borderColor = '#10B981';
          }}
        >
          Contact Customer Support
        </Link>
      </div>
    </div>
  );
};
