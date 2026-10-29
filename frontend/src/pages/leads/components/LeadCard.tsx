import React from 'react';
import { Link } from 'react-router-dom';
import type { Lead, LeadStatus } from '../../../types/lead.types';
import { Badge, ScorePill } from '../../lead-generation/components/Cards';
import { formatCurrency, formatDate, humanize } from '../../lead-generation/leadGenConstants';
import {
  LEAD_STATUSES,
  getInitials,
  getScoreTier,
  leadFullName,
  statusTone,
} from '../leadConstants';
import {
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  UserIcon,
  EditIcon,
  TrashIcon,
  AwardIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  ActivityIcon,
} from '../../../components/common/Icons';

interface LeadScoreDisplayProps {
  score: number;
  hotThreshold?: number;
  warmThreshold?: number;
  compact?: boolean;
}

export const LeadScoreDisplay: React.FC<LeadScoreDisplayProps> = ({
  score,
  hotThreshold = 70,
  warmThreshold = 40,
  compact = false,
}) => {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)));
  const tierInfo = getScoreTier(safeScore, hotThreshold, warmThreshold);

  if (compact) {
    return (
      <div className="ld-score-inline" title={`Lead Score: ${safeScore}/100 (${tierInfo.label})`}>
        <ScorePill score={safeScore} />
        <span className={`ld-score-tier-tag tone-${tierInfo.tone}`}>{tierInfo.label}</span>
      </div>
    );
  }

  return (
    <div className="ld-score-widget">
      <div className="ld-score-widget-top">
        <div className="ld-score-value-group">
          <span className="ld-score-big-number">{safeScore}</span>
          <span className="ld-score-max">/ 100</span>
        </div>
        <Badge tone={tierInfo.tone}>{tierInfo.label} Lead</Badge>
      </div>
      <div className="ld-score-bar-track" aria-hidden="true">
        <div
          className={`ld-score-bar-fill tone-${tierInfo.tone}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
};

interface QualificationPipelineProps {
  currentStatus: LeadStatus | string;
  onSelectStatus?: (status: LeadStatus) => void;
  disabled?: boolean;
}

export const QualificationPipeline: React.FC<QualificationPipelineProps> = ({
  currentStatus,
  onSelectStatus,
  disabled = false,
}) => {
  const normalized = (currentStatus || 'NEW').toUpperCase();

  return (
    <div className="ld-qualification-stepper" role="group" aria-label="Lead qualification stage">
      {LEAD_STATUSES.map((step, index) => {
        const isCurrent = step.value === normalized;
        const currentIndex = LEAD_STATUSES.findIndex((s) => s.value === normalized);
        const isCompleted =
          currentIndex > index && step.value !== 'UNQUALIFIED' && normalized !== 'UNQUALIFIED';

        return (
          <button
            key={step.value}
            type="button"
            disabled={disabled || !onSelectStatus || step.value === 'CONVERTED'}
            onClick={() => onSelectStatus?.(step.value)}
            className={`ld-step-pill ${isCurrent ? 'is-current' : ''} ${
              isCompleted ? 'is-completed' : ''
            } tone-${step.tone}`}
            title={step.description}
          >
            <span className="ld-step-index">{index + 1}</span>
            <span className="ld-step-label">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export interface LeadCardProps {
  lead: Lead;
  variant?: 'list' | 'board';
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenPreview?: (lead: Lead) => void;
  onAssign?: (lead: Lead) => void;
  onQualify?: (lead: Lead) => void;
  onScore?: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onQuickStatusChange?: (lead: Lead, status: LeadStatus) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  variant = 'list',
  selected = false,
  onToggleSelect,
  onOpenPreview,
  onAssign,
  onQualify,
  onScore,
  onConvert,
  onDelete,
  onQuickStatusChange,
}) => {
  const fullName = leadFullName(lead);
  const canConvert = lead.status !== 'CONVERTED';

  return (
    <article
      className={`lg-card ld-lead-card ld-card-${variant} ${selected ? 'is-selected' : ''}`}
      data-lead-id={lead.id}
    >
      {/* Card Top Row */}
      <div className="ld-card-header">
        <div className="ld-card-title-group">
          {onToggleSelect && (
            <input
              type="checkbox"
              className="ld-card-checkbox"
              checked={selected}
              onChange={() => onToggleSelect(lead.id)}
              aria-label={`Select ${lead.title}`}
            />
          )}
          <div className="ld-avatar-circle" aria-hidden="true">
            {getInitials(fullName)}
          </div>
          <div className="ld-card-headings">
            <div className="ld-card-title-row">
              <Link to={`/leads/${lead.id}`} className="ld-card-title-link">
                {lead.title}
              </Link>
              <Badge tone={statusTone(lead.status)}>{humanize(lead.status)}</Badge>
            </div>
            <div className="ld-card-subtitle">
              <span className="ld-contact-name">{fullName}</span>
              {lead.companyName && (
                <span className="ld-company-pill">
                  <BuildingIcon size={12} />
                  <span>{lead.companyName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ld-card-score-value">
          <LeadScoreDisplay score={lead.leadScore} compact />
          <span className="ld-card-value">{formatCurrency(lead.estimatedValue)}</span>
        </div>
      </div>

      {/* Contact & Meta Row */}
      <div className="ld-card-meta-grid">
        <div className="ld-meta-item" title={lead.email}>
          <MailIcon size={13} />
          <a href={`mailto:${lead.email}`} className="ld-meta-link">
            {lead.email}
          </a>
        </div>

        {lead.phone && (
          <div className="ld-meta-item">
            <PhoneIcon size={13} />
            <a href={`tel:${lead.phone}`} className="ld-meta-link">
              {lead.phone}
            </a>
          </div>
        )}

        <div className="ld-meta-item">
          <UserIcon size={13} />
          <span>{lead.owner?.name || 'Unassigned'}</span>
        </div>

        <div className="ld-meta-item">
          <Badge tone="slate">{humanize(lead.source)}</Badge>
        </div>

        {lead._count && (
          <div className="ld-meta-item ld-counts-pill">
            <ActivityIcon size={13} />
            <span>
              {lead._count.activities || 0} act · {lead._count.notes || 0} notes
            </span>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="ld-card-footer">
        <span className="lg-muted ld-card-date">Created {formatDate(lead.createdAt)}</span>

        <div className="ld-card-actions">
          {variant === 'board' && onQuickStatusChange && lead.status !== 'CONVERTED' && (
            <select
              className="ld-board-stage-select"
              value={lead.status}
              onChange={(e) => onQuickStatusChange(lead, e.target.value as LeadStatus)}
              aria-label={`Change stage for ${lead.title}`}
            >
              {LEAD_STATUSES.filter((s) => s.value !== 'CONVERTED').map((s) => (
                <option key={s.value} value={s.value}>
                  Stage: {s.label}
                </option>
              ))}
            </select>
          )}

          {onOpenPreview && (
            <button
              type="button"
              className="lg-icon-btn"
              onClick={() => onOpenPreview(lead)}
              title="Quick Preview Drawer"
              aria-label="Quick Preview"
            >
              <EyeIcon size={15} />
            </button>
          )}

          {onAssign && (
            <button
              type="button"
              className="lg-icon-btn"
              onClick={() => onAssign(lead)}
              title="Assign Owner"
              aria-label="Assign Owner"
            >
              <UserIcon size={15} />
            </button>
          )}

          {onQualify && (
            <button
              type="button"
              className="lg-icon-btn"
              onClick={() => onQualify(lead)}
              title="Update Qualification"
              aria-label="Update Qualification"
            >
              <CheckCircleIcon size={15} />
            </button>
          )}

          {onScore && (
            <button
              type="button"
              className="lg-icon-btn"
              onClick={() => onScore(lead)}
              title="Update Score"
              aria-label="Update Score"
            >
              <AwardIcon size={15} />
            </button>
          )}

          {onConvert && canConvert && (
            <button
              type="button"
              className="lg-icon-btn ld-convert-icon-btn"
              onClick={() => onConvert(lead)}
              title="Convert Lead"
              aria-label="Convert Lead"
            >
              <ArrowRightIcon size={15} />
            </button>
          )}

          <Link
            to={`/leads/${lead.id}/edit`}
            className="lg-icon-btn"
            title="Edit Lead"
            aria-label="Edit Lead"
          >
            <EditIcon size={15} />
          </Link>

          {onDelete && (
            <button
              type="button"
              className="lg-icon-btn danger"
              onClick={() => onDelete(lead)}
              title="Delete Lead"
              aria-label="Delete Lead"
            >
              <TrashIcon size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

