import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { HelpArticle, HelpCategory } from '../../../types/help-support.types';
import {
  BookOpenIcon,
  FileTextIcon,
  HelpCircleIcon,
  LifeBuoyIcon,
  MessageSquareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '../helpIcons';
import {
  ArrowRightIcon,
  ClockIcon,
  SearchIcon,
  XIcon,
} from '../../../components/common/Icons';

interface HelpCenterSectionProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
  onVoteArticle: (articleId: string, isHelpful: boolean) => Promise<void>;
}

export const HelpCenterSection: React.FC<HelpCenterSectionProps> = ({
  categories,
  articles,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onSelectCategory,
  onVoteArticle,
}) => {
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);
  const [votedArticles, setVotedArticles] = useState<Record<string, 'up' | 'down'>>({});

  const handleVote = async (articleId: string, isHelpful: boolean) => {
    setVotedArticles((prev) => ({
      ...prev,
      [articleId]: isHelpful ? 'up' : 'down',
    }));
    await onVoteArticle(articleId, isHelpful);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Search Box */}
      <div
        className="help-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F4FBF7 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(6, 46, 3, 0.04)',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EAF4ED',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            <LifeBuoyIcon size={14} />
            <span>24/7 Knowledge & Resource Center</span>
          </span>
          <h2
            style={{
              color: '#062E03',
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}
          >
            How can we help you today?
          </h2>
          <p
            style={{
              color: '#64748B',
              fontSize: '13.5px',
              lineHeight: 1.5,
              margin: '0 0 20px',
            }}
          >
            Search hundreds of articles, explore pipeline workflows, or learn how to convert leads into revenue.
          </p>

          {/* Search Input Bar */}
          <div style={{ position: 'relative', maxWidth: '560px', margin: '0 auto', textAlign: 'left' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '14px',
                display: 'flex',
                alignItems: 'center',
                color: '#10B981',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search guides (e.g. 'convert lead', 'pipelines', 'email sync')..."
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '12px',
                padding: '12px 38px 12px 42px',
                fontSize: '13.5px',
                color: '#062E03',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
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
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help Categories Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#062E03', margin: 0 }}>
            Browse Knowledge Categories
          </h3>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(undefined)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#10B981',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Show all categories
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = cat.articleCount ?? cat._count?.articles ?? 0;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? undefined : cat.id)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: isSelected
                    ? '1.5px solid #10B981'
                    : '1px solid rgba(16, 185, 129, 0.2)',
                  backgroundColor: isSelected ? '#F8FCF9' : '#FFFFFF',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: '#EAF4ED',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BookOpenIcon size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <h4
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#062E03',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat.name}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#10B981',
                          backgroundColor: '#EAF4ED',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          flexShrink: 0,
                        }}
                      >
                        {count} {count === 1 ? 'guide' : 'guides'}
                      </span>
                    </div>
                    {cat.description && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#64748B',
                          margin: '4px 0 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Articles Section */}
      <div>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#062E03', margin: 0 }}>
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : selectedCategory
                ? `${selectedCategory.name} Guides`
                : 'Popular Help Articles & Guides'}
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
            {articles.length} {articles.length === 1 ? 'article available' : 'articles available'}
          </p>
        </div>

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
                <div style={{ height: '18px', width: '60%', backgroundColor: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ height: '14px', width: '90%', backgroundColor: '#F8FCF9', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div
            style={{
              borderRadius: '14px',
              border: '1px dashed rgba(16, 185, 129, 0.25)',
              backgroundColor: '#FFFFFF',
              padding: '36px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#EAF4ED',
                color: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <FileTextIcon size={22} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#062E03', margin: '0 0 4px' }}>
              No Articles Found
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 auto 16px', maxWidth: '380px' }}>
              We couldn't find any articles matching your search query. Try searching for different keywords or check out our FAQs.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory(undefined);
                }}
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
                Reset Search
              </button>
              <Link
                to="/help/faqs"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Browse FAQs
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#062E03',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: '#10B981', display: 'flex' }}>
                      <FileTextIcon size={16} />
                    </span>
                    <span>{article.title}</span>
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#64748B' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ClockIcon size={13} />
                      <span>{article.views} views</span>
                    </span>
                    <span
                      style={{
                        color: '#10B981',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Read guide</span>
                      <ArrowRightIcon size={12} />
                    </span>
                  </div>
                </div>

                {article.summary && (
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '8px 0 0', lineHeight: 1.45 }}>
                    {article.summary}
                  </p>
                )}

                {article.tags && article.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {article.tags.map((tag) => (
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
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
        }}
      >
        <Link
          to="/help/docs"
          style={{
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            backgroundColor: '#FFFFFF',
            padding: '16px 18px',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#10B981', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EAF4ED', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpenIcon size={16} />
            </span>
            <span style={{ color: '#062E03' }}>Documentation</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Read technical references, data schemas, and pipeline rules.
          </p>
        </Link>

        <Link
          to="/help/faqs"
          style={{
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            backgroundColor: '#FFFFFF',
            padding: '16px 18px',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#2563EB', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EFF6FF', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircleIcon size={16} />
            </span>
            <span style={{ color: '#062E03' }}>FAQs</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Quick solutions to account, billing, and lead scoring questions.
          </p>
        </Link>

        <Link
          to="/help/support"
          style={{
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            backgroundColor: '#FFFFFF',
            padding: '16px 18px',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#10B981', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EAF4ED', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <LifeBuoyIcon size={16} />
            </span>
            <span style={{ color: '#062E03' }}>Contact Support</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Submit a ticket to our specialized technical assistance team.
          </p>
        </Link>

        <Link
          to="/help/feedback"
          style={{
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            backgroundColor: '#FFFFFF',
            padding: '16px 18px',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#D97706', fontWeight: 700, fontSize: '13.5px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF3C7', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquareIcon size={16} />
            </span>
            <span style={{ color: '#062E03' }}>Feedback & Ideas</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Suggest product features and vote on improvements.
          </p>
        </Link>
      </div>

      {/* Article Detail Reader Modal */}
      {activeArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(6, 46, 3, 0.4)',
            padding: '1rem',
            backdropFilter: 'blur(4px)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '680px',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
                padding: '16px 20px',
                backgroundColor: '#F8FCF9',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#10B981',
                  }}
                >
                  Help Guide
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#062E03', margin: '4px 0 0' }}>
                  {activeArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                style={{
                  borderRadius: '8px',
                  padding: '6px',
                  color: '#64748B',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeArticle.summary && (
                <div
                  style={{
                    borderRadius: '8px',
                    backgroundColor: '#EAF4ED',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: '#062E03',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontWeight: 500,
                    lineHeight: 1.45,
                  }}
                >
                  {activeArticle.summary}
                </div>
              )}

              <div style={{ whiteSpace: 'pre-line', fontSize: '13.5px', color: '#062E03', lineHeight: 1.6 }}>
                {activeArticle.content}
              </div>

              {activeArticle.tags && activeArticle.tags.length > 0 && (
                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {activeArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        borderRadius: '6px',
                        backgroundColor: '#EAF4ED',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#10B981',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Helpfulness Vote Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(16, 185, 129, 0.15)',
                padding: '12px 20px',
                backgroundColor: '#F8FCF9',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: '#64748B' }}>
                  Was this article helpful?
                </span>
                {votedArticles[activeArticle.id] ? (
                  <span style={{ fontWeight: 600, color: '#10B981' }}>
                    Thank you for your feedback!
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleVote(activeArticle.id, true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        backgroundColor: '#FFFFFF',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#10B981',
                        cursor: 'pointer',
                      }}
                    >
                      <ThumbsUpIcon size={12} />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(activeArticle.id, false)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: '#FFFFFF',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <ThumbsDownIcon size={12} />
                      <span>No</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '6px 14px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  color: '#062E03',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
