import type { User } from '../../types/auth.types';
import type {
  CreatePipelineStagePayload,
  DealStatus,
  PipelineDeal,
  PipelineStage,
} from '../../types/pipeline.types';

export const STAGE_COLOR_PRESETS: Array<{ value: string; label: string }> = [
  { value: '#3b82f6', label: 'Ocean Blue (#3b82f6)' },
  { value: '#6366f1', label: 'Indigo (#6366f1)' },
  { value: '#8b5cf6', label: 'Violet (#8b5cf6)' },
  { value: '#06b6d4', label: 'Cyan (#06b6d4)' },
  { value: '#10b981', label: 'Emerald (#10b981)' },
  { value: '#f59e0b', label: 'Amber (#f59e0b)' },
  { value: '#ec4899', label: 'Rose (#ec4899)' },
  { value: '#ef4444', label: 'Crimson (#ef4444)' },
  { value: '#64748b', label: 'Slate (#64748b)' },
];

export const PROBABILITY_PRESETS: Array<{ value: number; label: string; desc: string }> = [
  { value: 0, label: '0% — Closed Lost', desc: 'Disqualified or lost deal stage' },
  { value: 10, label: '10% — Prospecting / Discovery', desc: 'Early qualification & outreach' },
  { value: 25, label: '25% — Needs Analysis', desc: 'Requirements and stakeholders identified' },
  { value: 50, label: '50% — Solution Demo / Evaluation', desc: 'Active technical evaluation' },
  { value: 75, label: '75% — Proposal / Quote Sent', desc: 'Commercial terms presented' },
  { value: 90, label: '90% — Negotiation / Legal', desc: 'Final redlines and sign-off' },
  { value: 100, label: '100% — Closed Won', desc: 'Signed contract / won revenue' },
];

export const DEFAULT_STARTER_STAGES: CreatePipelineStagePayload[] = [
  { name: 'Discovery & Qualification', order: 1, winProbability: 15, color: '#3b82f6' },
  { name: 'Solution Demo', order: 2, winProbability: 35, color: '#6366f1' },
  { name: 'Proposal & Pricing', order: 3, winProbability: 60, color: '#8b5cf6' },
  { name: 'Contract Negotiation', order: 4, winProbability: 85, color: '#f59e0b' },
  { name: 'Closed Won', order: 5, winProbability: 100, color: '#10b981' },
];

export const DEAL_STATUS_OPTIONS: Array<{ value: DealStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

export function dealStatusTone(
  status?: string | null,
): 'blue' | 'green' | 'red' | 'amber' | 'slate' {
  switch ((status || '').toUpperCase()) {
    case 'WON':
      return 'green';
    case 'LOST':
      return 'red';
    case 'OPEN':
      return 'blue';
    default:
      return 'slate';
  }
}

export function probabilityTone(
  probability?: number | null,
): 'green' | 'blue' | 'amber' | 'red' | 'slate' {
  const p = Number(probability ?? 0);
  if (p >= 80) return 'green';
  if (p >= 50) return 'blue';
  if (p >= 20) return 'amber';
  if (p === 0) return 'red';
  return 'slate';
}

export function computeWeightedDealValue(
  deal: Pick<PipelineDeal, 'value' | 'probability'>,
  stageProbability?: number,
): number {
  const val = Number(deal.value || 0);
  const prob =
    typeof deal.probability === 'number'
      ? deal.probability
      : typeof stageProbability === 'number'
        ? stageProbability
        : 0;
  return Math.round(val * (Math.max(0, Math.min(100, prob)) / 100));
}

export function summarizeStageDeals(
  stage: PipelineStage,
  deals: PipelineDeal[],
): {
  stageDeals: PipelineDeal[];
  totalValue: number;
  weightedValue: number;
} {
  const stageDeals = deals.filter((d) => d.stageId === stage.id);
  const totalValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const weightedValue = Math.round(
    totalValue * (Math.max(0, Math.min(100, Number(stage.winProbability || 0))) / 100),
  );
  return { stageDeals, totalValue, weightedValue };
}

export interface PipelinePermissions {
  canView: boolean;
  canManagePipelines: boolean;
  canDeletePipelines: boolean;
  canManageDeals: boolean;
  roleLabel: string;
}

export function getPipelinePermissions(user?: User | null): PipelinePermissions {
  const roleName = (user?.role?.name || 'ADMIN').toUpperCase();
  const isSuspended = user?.status === 'SUSPENDED' || user?.status === 'INACTIVE';
  const isViewer = roleName === 'VIEWER' || roleName === 'READ_ONLY' || roleName === 'GUEST';

  return {
    canView: true,
    canManagePipelines: !isSuspended && !isViewer,
    canDeletePipelines: !isSuspended && !isViewer,
    canManageDeals: !isSuspended && !isViewer,
    roleLabel: user?.role?.name || 'Member',
  };
}

