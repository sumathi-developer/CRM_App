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
    <div className="space-y-6">
      {/* Top Search & Category Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions (e.g. 'invite team', 'export data', 'audit logs')..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {FAQ_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onSelectCategory(cat.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="h-5 w-2/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-3">
              <HelpCircleIcon size={24} />
            </div>
            <h4 className="text-base font-semibold text-gray-900">
              No Questions Found
            </h4>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              We couldn't find any FAQs matching your query. Check out our documentation or contact our customer support team.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory('ALL');
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
              </button>
              <Link
                to="/help/support"
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
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
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition"
              >
                {/* Accordion Question Header */}
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/75 transition gap-3"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                      Q
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {faq.question}
                    </span>
                  </div>
                  <span className="text-gray-400 shrink-0">
                    {isExpanded ? (
                      <ChevronDownIcon size={16} />
                    ) : (
                      <ChevronRightIcon size={16} />
                    )}
                  </span>
                </button>

                {/* Accordion Answer Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 text-xs sm:text-sm text-gray-700 leading-relaxed space-y-3">
                    <div className="whitespace-pre-line">{faq.answer}</div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400">
                      <span className="rounded bg-gray-200/80 px-2 py-0.5 font-medium text-gray-700 text-[10px]">
                        Category: {faq.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <ThumbsUpIcon size={12} className="text-emerald-600" />
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
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 justify-center sm:justify-start">
            <LifeBuoyIcon size={18} className="text-purple-600" />
            <span>Still haven't found what you're looking for?</span>
          </h4>
          <p className="text-xs text-gray-600">
            Our specialized support team is here to assist you with any questions or technical challenges.
          </p>
        </div>

        <Link
          to="/help/support"
          className="shrink-0 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
        >
          Contact Customer Support
        </Link>
      </div>
    </div>
  );
};

