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
    <div className="space-y-8">
      {/* Hero Search Box */}
      <div className="relative rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-8 text-white shadow-lg">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <LifeBuoyIcon size={14} />
            <span>24/7 Knowledge & Resource Center</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How can we help you today?
          </h2>
          <p className="text-sm text-purple-100 max-w-lg mx-auto">
            Search hundreds of articles, explore pipeline workflows, or learn how to convert leads into revenue.
          </p>

          {/* Search Input Bar */}
          <div className="relative mt-4 text-left">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <SearchIcon size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search guides (e.g. 'convert lead', 'pipelines', 'email sync')..."
              className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-10 text-sm text-gray-900 shadow-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help Categories Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Browse Knowledge Categories
          </h3>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(undefined)}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = cat.articleCount ?? cat._count?.articles ?? 0;
            return (
              <div
                key={cat.id}
                onClick={() =>
                  onSelectCategory(isSelected ? undefined : cat.id)
                }
                className={`cursor-pointer rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-500'
                    : 'border-gray-200 bg-white hover:border-purple-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                    <BookOpenIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {count} {count === 1 ? 'guide' : 'guides'}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory
                  ? `${selectedCategory.name} Guides`
                  : 'Popular Help Articles & Guides'}
            </h3>
            <p className="text-xs text-gray-500">
              {articles.length} {articles.length === 1 ? 'article available' : 'articles available'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="h-5 w-3/4 rounded bg-gray-200 mb-2" />
                <div className="h-4 w-full rounded bg-gray-100 mb-2" />
                <div className="h-3 w-1/4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-3">
              <FileTextIcon size={24} />
            </div>
            <h4 className="text-base font-semibold text-gray-900">
              No Articles Found
            </h4>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              We couldn't find any articles matching your search query. Try searching for different keywords or check out our FAQs.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory(undefined);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset Search
              </button>
              <Link
                to="/help/faqs"
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
              >
                Browse FAQs
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-base font-bold text-gray-900 hover:text-purple-600 transition flex items-center gap-2">
                    <FileTextIcon size={16} className="text-purple-600 shrink-0" />
                    <span>{article.title}</span>
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <ClockIcon size={13} />
                      <span>{article.views} views</span>
                    </span>
                    <span className="text-purple-600 font-semibold inline-flex items-center gap-1">
                      <span>Read guide</span>
                      <ArrowRightIcon size={12} />
                    </span>
                  </div>
                </div>

                {article.summary && (
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    {article.summary}
                  </p>
                )}

                {article.tags && article.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-gray-200">
        <Link
          to="/help/docs"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition"
        >
          <div className="flex items-center gap-2.5 mb-2 text-purple-700 font-semibold text-sm">
            <BookOpenIcon size={18} />
            <span>Documentation</span>
          </div>
          <p className="text-xs text-gray-500">
            Read technical references, data schemas, and pipeline rules.
          </p>
        </Link>

        <Link
          to="/help/faqs"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition"
        >
          <div className="flex items-center gap-2.5 mb-2 text-blue-700 font-semibold text-sm">
            <HelpCircleIcon size={18} />
            <span>FAQs</span>
          </div>
          <p className="text-xs text-gray-500">
            Quick solutions to account, billing, and lead scoring questions.
          </p>
        </Link>

        <Link
          to="/help/support"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition"
        >
          <div className="flex items-center gap-2.5 mb-2 text-emerald-700 font-semibold text-sm">
            <LifeBuoyIcon size={18} />
            <span>Contact Support</span>
          </div>
          <p className="text-xs text-gray-500">
            Submit a ticket to our specialized technical assistance team.
          </p>
        </Link>

        <Link
          to="/help/feedback"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition"
        >
          <div className="flex items-center gap-2.5 mb-2 text-amber-700 font-semibold text-sm">
            <MessageSquareIcon size={18} />
            <span>Feedback & Ideas</span>
          </div>
          <p className="text-xs text-gray-500">
            Suggest product features and vote on improvements.
          </p>
        </Link>
      </div>

      {/* Article Detail Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                  Help Guide
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-800 leading-relaxed">
              {activeArticle.summary && (
                <div className="rounded-lg bg-purple-50/70 p-3.5 text-xs text-purple-900 border border-purple-100 font-medium">
                  {activeArticle.summary}
                </div>
              )}

              <div className="whitespace-pre-line text-sm text-gray-700 space-y-2">
                {activeArticle.content}
              </div>

              {activeArticle.tags && activeArticle.tags.length > 0 && (
                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                  {activeArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Helpfulness Vote Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3.5 bg-gray-50 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">
                  Was this article helpful?
                </span>
                {votedArticles[activeArticle.id] ? (
                  <span className="font-semibold text-emerald-600">
                    Thank you for your feedback!
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVote(activeArticle.id, true)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      <ThumbsUpIcon size={13} />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(activeArticle.id, false)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                    >
                      <ThumbsDownIcon size={13} />
                      <span>No</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="rounded-lg bg-white border border-gray-300 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-100"
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

