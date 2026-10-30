import React from 'react';
import { Link } from 'react-router-dom';
import type { SearchResultItem } from '../../../types/search.types';
import { Badge } from '../../lead-generation/components/Cards';
import { formatDateTime } from '../../lead-generation/leadGenConstants';
import { ArrowRightIcon } from '../../../components/common/Icons';
import {
  entityBadgeTone,
  resolveSearchResultPath,
} from '../searchConstants';

interface SearchResultCardProps {
  item: SearchResultItem;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ item }) => {
  const targetPath = resolveSearchResultPath(item);
  const metadataEntries = item.metadata
    ? Object.entries(item.metadata).filter(
        ([, val]) => val !== undefined && val !== null && String(val).trim() !== '',
      )
    : [];

  return (
    <div className="group flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all hover:border-blue-400 hover:shadow-sm sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={entityBadgeTone(item.entityType)}>
            {item.entityType}
          </Badge>

          {item.relevanceScore > 0 && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              Relevance: {Number(item.relevanceScore).toFixed(1)}
            </span>
          )}

          {item.matchedFields && item.matchedFields.length > 0 && (
            <span className="text-[11px] text-gray-400">
              Matched in:{' '}
              <strong className="text-gray-600">
                {item.matchedFields.join(', ')}
              </strong>
            </span>
          )}
        </div>

        <Link
          to={targetPath}
          className="mt-1.5 block truncate text-sm font-bold text-gray-900 group-hover:text-blue-600"
        >
          {item.title}
        </Link>

        {item.subtitle && (
          <p className="mt-0.5 truncate text-xs font-medium text-gray-600">
            {item.subtitle}
          </p>
        )}

        {(item.snippet || item.description) && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {item.snippet || item.description}
          </p>
        )}

        {metadataEntries.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {metadataEntries.slice(0, 4).map(([k, v]) => (
              <span
                key={k}
                className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600"
              >
                <span className="font-semibold capitalize">{k}:</span>{' '}
                {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        {item.updatedAt || item.createdAt ? (
          <span className="text-[11px] text-gray-400">
            {formatDateTime(item.updatedAt || item.createdAt)}
          </span>
        ) : null}

        <Link
          to={targetPath}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
        >
          <span>Open Record</span>
          <ArrowRightIcon size={13} />
        </Link>
      </div>
    </div>
  );
};

