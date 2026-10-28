import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import type {
  LeadSource,
  ManualLeadPayload,
  ManualLeadResult,
} from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Field } from './components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { Badge, ScorePill, StatCard } from './components/Cards';
import { useLeadGenAccess, useUserOptions } from './leadGenHooks';
import {
  MANUAL_CHANNEL_OPTIONS,
  EMAIL_REGEX,
  toneForStatus,
} from './leadGenConstants';
import {
  UserPlusIcon,
  CheckCircleIcon,
  AwardIcon,
  TargetIcon,
  SendIcon,
  PlusIcon,
} from '../../components/common/Icons';

export const ManualCapturePage: React.FC = () => {
  const { workspaceId } = useLeadGenAccess();
  const { users } = useUserOptions();

  // Sources for picker
  const [sources, setSources] = useState<LeadSource[]>([]);
  useEffect(() => {
    let ignore = false;
    leadGenerationService.getSources({ limit: 100, workspaceId }).then((res) => {
      if (!ignore) setSources(res.data);
    }).catch(() => {});
    return () => { ignore = true; };
  }, [workspaceId]);

  // Form inputs
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [channel, setChannel] = useState('MANUAL');
  const [leadSourceId, setLeadSourceId] = useState('');
  const [campaign, setCampaign] = useState('');
  const [medium, setMedium] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [qualificationNotes, setQualificationNotes] = useState('');

  // Execution states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<ManualLeadResult | null>(null);

  // Auto-generate title if user enters first/last/company and title is empty
  const handleNameBlur = () => {
    if (!title.trim() && (firstName.trim() || lastName.trim())) {
      const full = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (companyName.trim()) {
        setTitle(`${companyName.trim()} — ${full}`);
      } else {
        setTitle(`Lead: ${full}`);
      }
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Lead title is required.';
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (estimatedValue.trim() !== '') {
      const val = Number(estimatedValue);
      if (Number.isNaN(val) || val < 0) {
        errs.estimatedValue = 'Estimated value must be a positive number.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    const payload: ManualLeadPayload = {
      title: title.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      estimatedValue: estimatedValue.trim() ? Number(estimatedValue) : undefined,
      channel: channel || 'MANUAL',
      leadSourceId: leadSourceId || undefined,
      campaign: campaign.trim() || undefined,
      medium: medium.trim() || undefined,
      ownerId: ownerId || undefined,
      qualificationNotes: qualificationNotes.trim() || undefined,
      workspaceId,
    };

    try {
      const res = await leadGenerationService.captureManualLead(payload);
      setResult(res);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to capture manual lead. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setEstimatedValue('');
    setChannel('MANUAL');
    setLeadSourceId('');
    setCampaign('');
    setMedium('');
    setOwnerId('');
    setQualificationNotes('');
    setErrors({});
    setResult(null);
    setApiError(null);
  };

  return (
    <LeadGenLayout
      title="Manual Lead Capture"
      subtitle="Quickly ingest leads manually with instant scoring, qualification evaluation, and automated sales routing."
      icon={<UserPlusIcon size={22} />}
      error={apiError}
      onDismissError={() => setApiError(null)}
    >
      {result ? (
        /* Result Screen */
        <div className="lg-cell-stack">
          <div className="lg-card" style={{ padding: '1.5rem', borderLeft: '4px solid #22c55e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <CheckCircleIcon size={24} style={{ color: '#22c55e' }} />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Lead Successfully Captured!</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {result.message || 'The lead has been recorded and processed through the lead engine.'}
            </p>
          </div>

          <div className="lg-stat-grid">
            <StatCard
              label="Lead Title"
              value={result.lead?.title || 'Untitled Lead'}
              hint={result.lead?.email || ''}
              icon={<TargetIcon size={18} />}
              tone="blue"
            />
            <StatCard
              label="Assigned Status"
              value={<Badge tone={toneForStatus(result.lead?.status)}>{result.lead?.status || 'NEW'}</Badge>}
              hint={result.qualification?.isQualified ? 'Meets qualification criteria' : 'Pending qualification'}
              icon={<CheckCircleIcon size={18} />}
              tone="green"
            />
            <StatCard
              label="Automated Score"
              value={<ScorePill score={result.scoring?.totalScore ?? result.lead?.leadScore} />}
              hint={`${result.scoring?.breakdown?.filter((b) => b.matched).length || 0} scoring rule(s) matched`}
              icon={<AwardIcon size={18} />}
              tone="amber"
            />
            <StatCard
              label="Assigned Owner"
              value={result.routing?.assignedTo?.name || result.lead?.owner?.name || 'Unassigned'}
              hint={result.routing?.reason || 'Routed via rules'}
              icon={<SendIcon size={18} />}
              tone="purple"
            />
          </div>

          {/* Details & breakdown */}
          <div className="lg-grid-2">
            {/* Scoring breakdown */}
            <div className="lg-card lg-section-card">
              <h3 className="lg-section-title">Scoring Evaluation</h3>
              {result.scoring?.breakdown && result.scoring.breakdown.length > 0 ? (
                <div className="lg-cell-stack">
                  {result.scoring.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.ruleName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.reason}</div>
                      </div>
                      <Badge tone={item.scoreChange >= 0 ? 'green' : 'red'}>
                        {item.scoreChange >= 0 ? `+${item.scoreChange}` : item.scoreChange} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="lg-muted">No custom scoring rules matched this lead.</p>
              )}
            </div>

            {/* Routing & Qualification notes */}
            <div className="lg-card lg-section-card">
              <h3 className="lg-section-title">Qualification & Routing Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <strong>Qualification Status: </strong>
                  <Badge tone={result.qualification?.isQualified ? 'green' : 'slate'}>
                    {result.qualification?.targetStatus || 'Standard'}
                  </Badge>
                </div>
                {result.qualification?.reasons && result.qualification.reasons.length > 0 && (
                  <div>
                    <strong>Reasons: </strong>
                    <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                      {result.qualification.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <strong>Routing Assignment: </strong>
                  {result.routing?.assignedTo ? (
                    <span>
                      {result.routing.assignedTo.name} ({result.routing.assignedTo.email})
                    </span>
                  ) : (
                    <span className="lg-muted">Default Workspace Pool</span>
                  )}
                </div>
                {result.routing?.reason && (
                  <div>
                    <strong>Routing Rule: </strong>
                    <span className="lg-cell-sub">{result.routing.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="auth-btn btn-primary" onClick={handleReset}>
              <PlusIcon size={16} />
              <span>Capture Another Lead</span>
            </button>
            <Link to="/lead-generation/leads/manual" className="auth-btn btn-ghost">
              <span>View in Manually Captured Leads</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Capture Form */
        <form className="lg-card lg-form-card" onSubmit={handleSubmit} noValidate>
          <div className="lg-form-grid">
            <Field label="First Name" htmlFor="lg-mc-first" required error={errors.firstName}>
              <input
                id="lg-mc-first"
                className="lg-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Sarah"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Last Name" htmlFor="lg-mc-last" required error={errors.lastName}>
              <input
                id="lg-mc-last"
                className="lg-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Connor"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Work Email" htmlFor="lg-mc-email" required error={errors.email}>
              <input
                id="lg-mc-email"
                type="email"
                className="lg-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.connor@cyberdyne.com"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Phone Number" htmlFor="lg-mc-phone">
              <input
                id="lg-mc-phone"
                type="tel"
                className="lg-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Company Name" htmlFor="lg-mc-company">
              <input
                id="lg-mc-company"
                className="lg-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Cyberdyne Systems"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Lead Title / Subject" htmlFor="lg-mc-title" required error={errors.title}>
              <input
                id="lg-mc-title"
                className="lg-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Cyberdyne Systems — Sarah Connor"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Estimated Pipeline Value ($)" htmlFor="lg-mc-value" error={errors.estimatedValue}>
              <input
                id="lg-mc-value"
                type="number"
                min={0}
                step="1"
                className="lg-input"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="25000"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Acquisition Channel" htmlFor="lg-mc-channel">
              <select
                id="lg-mc-channel"
                className="lg-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                disabled={isSubmitting}
              >
                {MANUAL_CHANNEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Attributed Lead Source" htmlFor="lg-mc-source">
              <select
                id="lg-mc-source"
                className="lg-select"
                value={leadSourceId}
                onChange={(e) => setLeadSourceId(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">None / Direct</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                ))}
              </select>
            </Field>

            <Field label="Direct Assignee (Sales Rep)" htmlFor="lg-mc-owner" hint="Leave empty to apply automatic assignment rules">
              <select
                id="lg-mc-owner"
                className="lg-select"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Automatic (Apply routing rules)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </Field>

            <Field label="Campaign" htmlFor="lg-mc-campaign">
              <input
                id="lg-mc-campaign"
                className="lg-input"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="e.g. Inbound_Cold_Call"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Medium" htmlFor="lg-mc-medium">
              <input
                id="lg-mc-medium"
                className="lg-input"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="e.g. Phone / Conference"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Qualification Notes & Context" htmlFor="lg-mc-notes" className="lg-span-2">
              <textarea
                id="lg-mc-notes"
                className="lg-textarea"
                rows={3}
                value={qualificationNotes}
                onChange={(e) => setQualificationNotes(e.target.value)}
                placeholder="Key requirements, budget discussions, or specific pain points mentioned by the prospect..."
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="lg-form-actions">
            <button
              type="button"
              className="auth-btn btn-ghost"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Clear Form
            </button>
            <PrimaryButton
              type="submit"
              fullWidth={false}
              isLoading={isSubmitting}
              loadingText="Processing Lead..."
              id="lg-mc-submit-btn"
            >
              Capture & Evaluate Lead
            </PrimaryButton>
          </div>
        </form>
      )}
    </LeadGenLayout>
  );
};
