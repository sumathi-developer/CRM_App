import type { User } from '../../types/auth.types';
import type { Deal, DealSortField, PipelineStage, SortDirection } from '../../types/deal.types';
import {
  computeWeightedDealValue,
  getPipelinePermissions,
  type PipelinePermissions,
} from '../pipelines/pipelineConstants';

export const DEAL_SORT_OPTIONS: Array<{ value: DealSortField; label: string }> = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'value', label: 'Deal Value' },
  { value: 'probability', label: 'Win Probability' },
  { value: 'expectedCloseDate', label: 'Expected Close Date' },
  { value: 'title', label: 'Deal Title' },
  { value: 'status', label: 'Deal Status' },
];

export const CURRENCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
];

export function getDealPermissions(user?: User | null): PipelinePermissions {
  return getPipelinePermissions(user);
}

export function computeDealMetrics(deals: Deal[], stages: PipelineStage[] = []) {
  const totalDeals = deals.length;
  const openDeals = deals.filter((d) => (d.status || '').toUpperCase() === 'OPEN');
  const wonDeals = deals.filter((d) => (d.status || '').toUpperCase() === 'WON');
  const lostDeals = deals.filter((d) => (d.status || '').toUpperCase() === 'LOST');

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  const weightedValue = openDeals.reduce((sum, d) => {
    const stageProb =
      d.stage?.winProbability ??
      stages.find((s) => s.id === d.stageId)?.winProbability;
    return sum + computeWeightedDealValue(d, stageProb);
  }, 0);

  const averageDealValue = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;

  return {
    totalDeals,
    openDealsCount: openDeals.length,
    wonDealsCount: wonDeals.length,
    lostDealsCount: lostDeals.length,
    totalValue,
    weightedValue,
    wonValue,
    averageDealValue,
    winRate,
  };
}

export function filterAndSortDeals(
  deals: Deal[],
  options: {
    search?: string;
    organizationId?: string;
    sortField?: DealSortField;
    sortDirection?: SortDirection;
  },
): Deal[] {
  const {
    search = '',
    organizationId = '',
    sortField = 'createdAt',
    sortDirection = 'desc',
  } = options;

  const q = search.trim().toLowerCase();

  const filtered = deals.filter((deal) => {
    if (organizationId && deal.organizationId !== organizationId) {
      return false;
    }
    if (q) {
      const hay = [
        deal.title,
        deal.organization?.name || '',
        deal.contact?.firstName || '',
        deal.contact?.lastName || '',
        deal.contact?.email || '',
        deal.stage?.name || '',
        deal.pipeline?.name || '',
        deal.owner?.name || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const dir = sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (sortField) {
      case 'value':
        return dir * ((Number(a.value) || 0) - (Number(b.value) || 0));
      case 'probability':
        return dir * ((Number(a.probability) || 0) - (Number(b.probability) || 0));
      case 'expectedCloseDate': {
        const dA = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
        const dB = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
        return dir * (dA - dB);
      }
      case 'title':
        return dir * (a.title || '').localeCompare(b.title || '');
      case 'status':
        return dir * (a.status || '').localeCompare(b.status || '');
      case 'createdAt':
      default: {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return dir * (tA - tB);
      }
    }
  });
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateDealsCsv(deals: Deal[]): string {
  const cols = [
    'id',
    'title',
    'value',
    'currency',
    'status',
    'probability',
    'pipelineName',
    'stageName',
    'organizationName',
    'contactName',
    'ownerName',
    'expectedCloseDate',
    'createdAt',
  ];

  const rows = deals.map((deal) =>
    [
      deal.id,
      deal.title,
      deal.value,
      deal.currency || 'USD',
      deal.status,
      deal.probability,
      deal.pipeline?.name || '',
      deal.stage?.name || '',
      deal.organization?.name || '',
      deal.contact ? `${deal.contact.firstName || ''} ${deal.contact.lastName || ''}`.trim() : '',
      deal.owner?.name || deal.owner?.email || '',
      deal.expectedCloseDate || '',
      deal.createdAt,
    ]
      .map(escapeCsvCell)
      .join(','),
  );

  return [cols.join(','), ...rows].join('\n');
}
