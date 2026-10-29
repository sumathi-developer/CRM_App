import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  Lead,
  LeadStatus,
  LeadSortField,
  SortDirection,
} from '../../../types/lead.types';
import { DataTable, type Column } from '../../lead-generation/components/DataTable';
import { Badge } from '../../lead-generation/components/Cards';
import { LoadingIndicator } from '../../../components/auth/LoadingIndicator';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatCurrency, formatDate, humanize } from '../../lead-generation/leadGenConstants';
import { LEAD_STATUSES, getInitials, leadFullName, statusTone } from '../leadConstants';
import { LeadCard, LeadScoreDisplay } from './LeadCard';
import {
  EyeIcon,
  EditIcon,
  TrashIcon,
  UserIcon,
  CheckCircleIcon,
  AwardIcon,
  ArrowRightIcon,
  PlusIcon,
} from '../../../components/common/Icons';

export interface SharedLeadViewProps {
  leads: Lead[];
  isLoading?: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortField: LeadSortField;
  sortDirection: SortDirection;
  onSortChange: (field: LeadSortField) => void;
  onOpenPreview: (lead: Lead) => void;
  onAssign: (lead: Lead) => void;
  onQualify: (lead: Lead) => void;
  onScore: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onQuickStatusChange: (lead: Lead, status: LeadStatus) => void;
  footer?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

/* ============================================================================
   1. LEAD TABLE VIEW
   ============================================================================ */

export const LeadsTableView: React.FC<SharedLeadViewProps> = ({
  leads,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortField,
  sortDirection,
  onSortChange,
  onOpenPreview,
  onAssign,
  onQualify,
  onScore,
  onConvert,
  onDelete,
  footer,
  emptyAction,
}) => {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.includes(l.id));

  const renderSortHeader = (label: string, field: LeadSortField) => {
    const isActive = sortField === field;
    const arrow = isActive ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';
    return (
      <button
        type="button"
        className={`ld-th-sort-btn ${isActive ? 'is-active' : ''}`}
        onClick={() => onSortChange(field)}
      >
        <span>{label}</span>
        <span className="ld-sort-arrow">{arrow}</span>
      </button>
    );
  };

  const columns: Column<Lead>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          aria-label="Select all leads on this page"
        />
      ),
      render: (lead) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(lead.id)}
          onChange={() => onToggleSelect(lead.id)}
          aria-label={`Select ${lead.title}`}
        />
      ),
    },
    {
      key: 'lead',
      header: renderSortHeader('Lead & Contact', 'title'),
      render: (l) => (
        <div className="ld-table-lead-cell">
          <div className="ld-avatar-circle sm" aria-hidden="true">
            {getInitials(leadFullName(l))}
          </div>
          <div className="lg-cell-stack">
            <Link to={`/leads/${l.id}`} className="lg-row-link">
              {l.title}
            </Link>
            <span className="lg-cell-sub">
              {leadFullName(l)} · {l.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: renderSortHeader('Company', 'companyName'),
      render: (l) => (
        <div className="lg-cell-stack">
          <span>{l.companyName || <span className="lg-muted">—</span>}</span>
          {l.phone && <span className="lg-cell-sub">{l.phone}</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: renderSortHeader('Status', 'status'),
      render: (l) => <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (l) => <Badge tone="slate">{humanize(l.source)}</Badge>,
    },
    {
      key: 'score',
      header: renderSortHeader('Score', 'leadScore'),
      align: 'center',
      render: (l) => <LeadScoreDisplay score={l.leadScore} compact />,
    },
    {
      key: 'value',
      header: renderSortHeader('Est. Value', 'estimatedValue'),
      align: 'right',
      render: (l) => <strong>{formatCurrency(l.estimatedValue)}</strong>,
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (l) =>
        l.owner ? (
          <div className="lg-cell-stack">
            <span>{l.owner.name}</span>
            <span className="lg-cell-sub">{l.owner.email}</span>
          </div>
        ) : (
          <span className="lg-muted">Unassigned</span>
        ),
    },
    {
      key: 'created',
      header: renderSortHeader('Created', 'createdAt'),
      render: (l) => formatDate(l.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (l) => (
        <div className="lg-row-actions">
          <button
            type="button"
            className="lg-icon-btn"
            onClick={() => onOpenPreview(l)}
            title="Quick Preview"
            aria-label="Quick Preview"
          >
            <EyeIcon size={15} />
          </button>
          <button
            type="button"
            className="lg-icon-btn"
            onClick={() => onAssign(l)}
            title="Assign Lead"
            aria-label="Assign Lead"
          >
            <UserIcon size={15} />
          </button>
          <button
            type="button"
            className="lg-icon-btn"
            onClick={() => onQualify(l)}
            title="Qualify Lead"
            aria-label="Qualify Lead"
          >
            <CheckCircleIcon size={15} />
          </button>
          <button
            type="button"
            className="lg-icon-btn"
            onClick={() => onScore(l)}
            title="Update Score"
            aria-label="Update Score"
          >
            <AwardIcon size={15} />
          </button>
          {l.status !== 'CONVERTED' && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              onClick={() => onConvert(l)}
              title="Convert Lead"
              aria-label="Convert Lead"
            >
              <ArrowRightIcon size={15} />
            </button>
          )}
          <Link
            to={`/leads/${l.id}/edit`}
            className="lg-icon-btn"
            title="Edit Lead"
            aria-label="Edit Lead"
          >
            <EditIcon size={15} />
          </Link>
          <button
            type="button"
            className="lg-icon-btn danger"
            onClick={() => onDelete(l)}
            title="Delete Lead"
            aria-label="Delete Lead"
          >
            <TrashIcon size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={leads}
      rowKey={(l) => l.id}
      isLoading={isLoading}
      loadingMessage="Loading leads..."
      emptyTitle="No leads found"
      emptyDescription="No leads match your active search or filter criteria."
      emptyAction={emptyAction}
      footer={footer}
    />
  );
};

/* ============================================================================
   2. LEAD LIST VIEW (Rich Card List)
   ============================================================================ */

export const LeadsListView: React.FC<SharedLeadViewProps> = ({
  leads,
  isLoading,
  selectedIds,
  onToggleSelect,
  onOpenPreview,
  onAssign,
  onQualify,
  onScore,
  onConvert,
  onDelete,
  onQuickStatusChange,
  footer,
  emptyAction,
}) => {
  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="medium" message="Loading lead cards..." />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="lg-card lg-state-box">
        <EmptyState
          title="No leads found"
          description="No leads match your active search or filter criteria."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="ld-list-view-container">
      <div className="ld-list-cards-stack">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            variant="list"
            selected={selectedIds.includes(lead.id)}
            onToggleSelect={onToggleSelect}
            onOpenPreview={onOpenPreview}
            onAssign={onAssign}
            onQualify={onQualify}
            onScore={onScore}
            onConvert={onConvert}
            onDelete={onDelete}
            onQuickStatusChange={onQuickStatusChange}
          />
        ))}
      </div>
      {footer && <div className="lg-card ld-list-footer">{footer}</div>}
    </div>
  );
};

/* ============================================================================
   3. LEAD BOARD VIEW (Kanban by Qualification Stage)
   ============================================================================ */

export const LeadsBoardView: React.FC<SharedLeadViewProps> = ({
  leads,
  isLoading,
  selectedIds,
  onToggleSelect,
  onOpenPreview,
  onAssign,
  onQualify,
  onScore,
  onConvert,
  onDelete,
  onQuickStatusChange,
  footer,
}) => {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  if (isLoading) {
    return (
      <div className="lg-card lg-state-box">
        <LoadingIndicator size="medium" message="Loading lead board..." />
      </div>
    );
  }

  const handleDrop = (targetStatus: LeadStatus) => {
    setDragOverStage(null);
    if (!draggedLead) return;
    if (draggedLead.status === targetStatus) {
      setDraggedLead(null);
      return;
    }
    if (targetStatus === 'CONVERTED') {
      onConvert(draggedLead);
    } else {
      onQuickStatusChange(draggedLead, targetStatus);
    }
    setDraggedLead(null);
  };

  return (
    <div className="ld-board-wrapper">
      <div className="ld-board-columns" role="region" aria-label="Lead Kanban Board">
        {LEAD_STATUSES.map((stage) => {
          const stageLeads = leads.filter(
            (l) => (l.status || 'NEW').toUpperCase() === stage.value,
          );
          const stageValue = stageLeads.reduce(
            (sum, l) => sum + Number(l.estimatedValue || 0),
            0,
          );
          const isDropTarget = dragOverStage === stage.value;

          return (
            <div
              key={stage.value}
              className={`ld-board-column tone-${stage.tone} ${
                isDropTarget ? 'is-drop-target' : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.value);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.value)}
            >
              <div className="ld-board-col-header">
                <div className="ld-board-col-title-row">
                  <Badge tone={stage.tone}>{stage.label}</Badge>
                  <span className="ld-board-col-count">{stageLeads.length}</span>
                </div>
                <div className="ld-board-col-value">{formatCurrency(stageValue)}</div>
              </div>

              <div className="ld-board-col-body">
                {stageLeads.length === 0 ? (
                  <div className="ld-board-empty-slot">
                    <span>No {stage.label.toLowerCase()} leads</span>
                    {stage.value !== 'CONVERTED' && (
                      <Link
                        to={`/leads/create?status=${stage.value}`}
                        className="lg-link-btn ld-board-add-link"
                      >
                        <PlusIcon size={12} /> Add lead
                      </Link>
                    )}
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable={lead.status !== 'CONVERTED'}
                      onDragStart={() => setDraggedLead(lead)}
                      onDragEnd={() => {
                        setDraggedLead(null);
                        setDragOverStage(null);
                      }}
                      className="ld-board-draggable"
                    >
                      <LeadCard
                        lead={lead}
                        variant="board"
                        selected={selectedIds.includes(lead.id)}
                        onToggleSelect={onToggleSelect}
                        onOpenPreview={onOpenPreview}
                        onAssign={onAssign}
                        onQualify={onQualify}
                        onScore={onScore}
                        onConvert={onConvert}
                        onDelete={onDelete}
                        onQuickStatusChange={onQuickStatusChange}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {footer && <div className="lg-card ld-list-footer">{footer}</div>}
    </div>
  );
};
