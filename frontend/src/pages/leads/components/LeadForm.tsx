import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  CreateLeadPayload,
  Lead,
  LeadSourceType,
  LeadStatus,
} from '../../../types/lead.types';
import type { UserOption } from '../../lead-generation/leadGenHooks';
import { Field } from '../../lead-generation/components/FormParts';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';
import { EMAIL_REGEX } from '../../lead-generation/leadGenConstants';
import { LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS } from '../leadConstants';
import { LeadScoreDisplay } from './LeadCard';

interface LeadFormProps {
  initialLead?: Partial<Lead> | null;
  users: UserOption[];
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelPath?: string;
  onSubmit: (payload: CreateLeadPayload) => Promise<void>;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  initialLead,
  users,
  isSubmitting = false,
  submitLabel = 'Save Lead',
  cancelPath = '/leads',
  onSubmit,
}) => {
  const [title, setTitle] = useState(initialLead?.title || '');
  const [firstName, setFirstName] = useState(initialLead?.firstName || '');
  const [lastName, setLastName] = useState(initialLead?.lastName || '');
  const [email, setEmail] = useState(initialLead?.email || '');
  const [phone, setPhone] = useState(initialLead?.phone || '');
  const [companyName, setCompanyName] = useState(initialLead?.companyName || '');
  const [status, setStatus] = useState<LeadStatus>(
    ((initialLead?.status || 'NEW').toUpperCase() as LeadStatus) || 'NEW',
  );
  const [source, setSource] = useState<LeadSourceType>(
    ((initialLead?.source || 'WEBSITE').toUpperCase() as LeadSourceType) || 'WEBSITE',
  );
  const [leadScore, setLeadScore] = useState<string>(String(initialLead?.leadScore ?? 0));
  const [estimatedValue, setEstimatedValue] = useState<string>(
    String(initialLead?.estimatedValue ?? 0),
  );
  const [ownerId, setOwnerId] = useState(initialLead?.ownerId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!title.trim()) {
      next.title = 'Lead title is required.';
    } else if (title.trim().length < 2) {
      next.title = 'Lead title must be at least 2 characters.';
    }

    if (!firstName.trim()) {
      next.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      next.lastName = 'Last name is required.';
    }

    if (!email.trim()) {
      next.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Enter a valid email address (e.g. name@company.com).';
    }

    if (phone.trim() && phone.trim().length < 5) {
      next.phone = 'Enter a valid phone number.';
    }

    const parsedScore = Number(leadScore);
    if (leadScore !== '' && (Number.isNaN(parsedScore) || parsedScore < 0)) {
      next.leadScore = 'Lead score must be 0 or greater.';
    }

    const parsedValue = Number(estimatedValue);
    if (estimatedValue !== '' && (Number.isNaN(parsedValue) || parsedValue < 0)) {
      next.estimatedValue = 'Estimated value must be 0 or greater.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateLeadPayload = {
      title: title.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      status,
      source,
      leadScore: leadScore === '' ? 0 : Math.max(0, Math.round(Number(leadScore))),
      estimatedValue: estimatedValue === '' ? 0 : Math.max(0, Number(estimatedValue)),
      ownerId: ownerId || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form className="lg-card lg-form-card" onSubmit={handleFormSubmit} noValidate>
      <h2 className="lg-form-section-title">1. Lead & Contact Identity</h2>

      <div className="lg-form-grid">
        <Field
          label="Lead Title / Opportunity Summary"
          htmlFor="lead-title"
          required
          error={errors.title}
          className="lg-span-2"
          hint="Descriptive title for the inbound inquiry or sales opportunity."
        >
          <input
            id="lead-title"
            className="lg-input"
            placeholder="e.g. Enterprise Security Solution Inquiry"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
          />
        </Field>

        <Field
          label="First Name"
          htmlFor="lead-first-name"
          required
          error={errors.firstName}
        >
          <input
            id="lead-first-name"
            className="lg-input"
            placeholder="e.g. Clark"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
            }}
          />
        </Field>

        <Field
          label="Last Name"
          htmlFor="lead-last-name"
          required
          error={errors.lastName}
        >
          <input
            id="lead-last-name"
            className="lg-input"
            placeholder="e.g. Kent"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
            }}
          />
        </Field>

        <Field
          label="Work Email"
          htmlFor="lead-email"
          required
          error={errors.email}
        >
          <input
            id="lead-email"
            type="email"
            className="lg-input"
            placeholder="clark@dailyplanet.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
          />
        </Field>

        <Field
          label="Phone Number"
          htmlFor="lead-phone"
          error={errors.phone}
        >
          <input
            id="lead-phone"
            type="tel"
            className="lg-input"
            placeholder="+1-555-0144"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
          />
        </Field>

        <Field
          label="Company / Organization Name"
          htmlFor="lead-company"
          className="lg-span-2"
          hint="Used to link or create an Organization record upon lead conversion."
        >
          <input
            id="lead-company"
            className="lg-input"
            placeholder="e.g. Daily Planet Media Group"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </Field>
      </div>

      <h2 className="lg-form-section-title">2. Qualification, Scoring & Ownership</h2>

      <div className="lg-form-grid">
        <Field label="Qualification Status" htmlFor="lead-status">
          <select
            id="lead-status"
            className="lg-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {LEAD_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Lead Source" htmlFor="lead-source">
          <select
            id="lead-source"
            className="lg-select"
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSourceType)}
          >
            {LEAD_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Lead Score (0–100)"
          htmlFor="lead-score"
          error={errors.leadScore}
          hint="Hot: 70+ · Warm: 40–69 · Cold: <40"
        >
          <div className="ld-score-slider-row">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.min(100, Math.max(0, Number(leadScore || 0)))}
              onChange={(e) => setLeadScore(e.target.value)}
              className="ld-score-range-input"
              aria-label="Lead score slider"
            />
            <input
              id="lead-score"
              type="number"
              min={0}
              max={1000}
              className="lg-input ld-score-number-input"
              value={leadScore}
              onChange={(e) => setLeadScore(e.target.value)}
            />
          </div>
        </Field>

        <Field
          label="Estimated Deal Value (USD)"
          htmlFor="lead-estimated-value"
          error={errors.estimatedValue}
        >
          <input
            id="lead-estimated-value"
            type="number"
            min={0}
            step="100"
            className="lg-input"
            placeholder="35000"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </Field>

        <Field
          label="Assigned Sales Owner"
          htmlFor="lead-owner"
          hint="Optional. Leave unassigned to route later via assignment rules."
        >
          <select
            id="lead-owner"
            className="lg-select"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </Field>

        <div className="ld-form-score-preview">
          <span className="lg-label">Live Score Preview</span>
          <LeadScoreDisplay score={Number(leadScore || 0)} />
        </div>
      </div>

      <div className="lg-form-actions">
        <Link to={cancelPath} className="auth-btn btn-ghost">
          Cancel
        </Link>
        <PrimaryButton
          type="submit"
          fullWidth={false}
          isLoading={isSubmitting}
          loadingText="Saving..."
        >
          {submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );
};
