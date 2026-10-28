import React from 'react';
import type { ChannelLead } from '../../../types/lead-generation.types';
import { DataTable, type Column } from './DataTable';
import { Badge, ScorePill } from './Cards';
import {
  CHANNEL_LABELS,
  formatCurrency,
  formatDate,
  fullName,
  humanize,
  toneForStatus,
} from '../leadGenConstants';

interface LeadsTableProps {
  leads: ChannelLead[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  footer?: React.ReactNode;
  showCampaign?: boolean;
}

/** Lead table shared by every channel screen (landing page, campaign, social, ...). */
export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  isLoading,
  emptyTitle = 'No leads found',
  emptyDescription = 'No leads match the current filters.',
  emptyAction,
  footer,
  showCampaign = true,
}) => {
  const columns: Column<ChannelLead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      render: (l) => (
        <div className="lg-cell-stack">
          <strong>{fullName(l.firstName, l.lastName, l.title || 'Unnamed lead')}</strong>
          <span className="lg-cell-sub">{l.email || l.title || '—'}</span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (l) => l.companyName || <span className="lg-muted">—</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (l) => (
        <div className="lg-cell-stack">
          <span>{l.leadSource?.name || CHANNEL_LABELS[l.channel || ''] || humanize(l.channel || l.source)}</span>
          {l.webForm && <span className="lg-cell-sub">Form: {l.webForm.name}</span>}
        </div>
      ),
    },
    ...(showCampaign
      ? ([
          {
            key: 'campaign',
            header: 'Campaign / Medium',
            render: (l) => (
              <div className="lg-cell-stack">
                <span>{l.campaign || '—'}</span>
                <span className="lg-cell-sub">{l.medium || ''}</span>
              </div>
            ),
          },
        ] as Column<ChannelLead>[])
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (l) => <Badge tone={toneForStatus(l.status)}>{humanize(l.status)}</Badge>,
    },
    { key: 'score', header: 'Score', align: 'center', render: (l) => <ScorePill score={l.leadScore} /> },
    { key: 'value', header: 'Value', align: 'right', render: (l) => formatCurrency(l.estimatedValue) },
    {
      key: 'owner',
      header: 'Owner',
      render: (l) => l.owner?.name || <span className="lg-muted">Unassigned</span>,
    },
    { key: 'created', header: 'Created', render: (l) => formatDate(l.createdAt) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={leads}
      rowKey={(l) => l.id}
      isLoading={isLoading}
      loadingMessage="Loading leads..."
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      footer={footer}
    />
  );
};
