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
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documentation (e.g. 'architecture', 'lead deduplication', 'webhooks')..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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

        {/* Category Pill Dropdown / Reset */}
        {selectedCategoryId && (
          <button
            type="button"
            onClick={() => onSelectCategory(undefined)}
            className="shrink-0 text-xs font-semibold text-purple-600 hover:text-purple-800"
          >
            Clear category filter ({selectedCategory?.name})
          </button>
        )}
      </div>

      {activePage ? (
        // Documentation Page Reader
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <button
              type="button"
              onClick={() => setActivePage(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeftIcon size={13} />
              <span>Back to Documentation Index</span>
            </button>

            <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-bold text-purple-700">
              v2.0.0
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600">
              <BookOpenIcon size={14} />
              <span>Documentation Guide</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {activePage.title}
            </h2>
            {activePage.summary && (
              <p className="text-sm text-gray-500 font-medium">
                {activePage.summary}
              </p>
            )}
          </div>

          <div className="prose max-w-none text-sm text-gray-800 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-6">
            {activePage.content}
          </div>

          {activePage.tags && activePage.tags.length > 0 && (
            <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-2">
              {activePage.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Documentation Categories & Pages List
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-1">
              Manual Sections
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectCategory(undefined)}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  !selectedCategoryId
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Sections ({pages.length})
              </button>
              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                const count = c.pageCount ?? c._count?.pages ?? 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCategory(c.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate mr-2">{c.name}</span>
                    <span
                      className={`text-[10px] rounded px-1.5 py-0.5 ${
                        isSelected
                          ? 'bg-purple-700 text-purple-100'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doc Pages List */}
          <div className="lg:col-span-3 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="h-5 w-1/2 rounded bg-gray-200 mb-2" />
                    <div className="h-4 w-full rounded bg-gray-100 mb-2" />
                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : pages.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-3">
                  <BookOpenIcon size={24} />
                </div>
                <h4 className="text-base font-semibold text-gray-900">
                  No Documentation Pages Found
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  No pages match your current filters. Try resetting the search query or selecting a different section.
                </p>
              </div>
            ) : (
              pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => setActivePage(page)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileTextIcon size={16} className="text-purple-600" />
                        <h4 className="font-bold text-gray-900 text-base hover:text-purple-600 transition">
                          {page.title}
                        </h4>
                      </div>
                      {page.summary && (
                        <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                          {page.summary}
                        </p>
                      )}
                    </div>
                    <span className="text-purple-600 text-xs font-semibold inline-flex items-center gap-1 shrink-0">
                      <span>View</span>
                      <ArrowRightIcon size={12} />
                    </span>
                  </div>

                  {page.tags && page.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {page.tags.map((tag) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

