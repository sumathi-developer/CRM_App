import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  Contact,
  ContactOrganization,
  ContactStage,
  CreateContactPayload,
} from '../../../types/contact.types';
import type { UserOption } from '../../lead-generation/leadGenHooks';
import { Field } from '../../lead-generation/components/FormParts';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';
import { EMAIL_REGEX } from '../../lead-generation/leadGenConstants';
import { CONTACT_STAGE_OPTIONS, DEPARTMENT_SUGGESTIONS } from '../contactConstants';
import { ContactStagePipeline } from './ContactViews';

interface ContactFormProps {
  initialContact?: Partial<Contact> | null;
  organizations: ContactOrganization[];
  users: UserOption[];
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelPath?: string;
  onSubmit: (payload: CreateContactPayload) => Promise<void>;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialContact,
  organizations,
  users,
  isSubmitting = false,
  submitLabel = 'Save Contact',
  cancelPath = '/contacts',
  onSubmit,
}) => {
  const [firstName, setFirstName] = useState(initialContact?.firstName || '');
  const [lastName, setLastName] = useState(initialContact?.lastName || '');
  const [email, setEmail] = useState(initialContact?.email || '');
  const [phone, setPhone] = useState(initialContact?.phone || '');
  const [jobTitle, setJobTitle] = useState(initialContact?.jobTitle || '');
  const [department, setDepartment] = useState(initialContact?.department || '');
  const [stage, setStage] = useState<ContactStage>(
    ((initialContact?.stage || 'LEAD').toUpperCase() as ContactStage) || 'LEAD',
  );
  const [organizationId, setOrganizationId] = useState(initialContact?.organizationId || '');
  const [ownerId, setOwnerId] = useState(initialContact?.ownerId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};

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

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateContactPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      department: department.trim() || undefined,
      stage,
      organizationId: organizationId || undefined,
      ownerId: ownerId || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form className="lg-card lg-form-card" onSubmit={handleFormSubmit} noValidate>
      <h2 className="lg-form-section-title">1. Contact Identity & Communication</h2>

      <div className="lg-form-grid">
        <Field label="First Name" htmlFor="contact-first-name" required error={errors.firstName}>
          <input
            id="contact-first-name"
            className="lg-input"
            placeholder="e.g. Bruce"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
            }}
          />
        </Field>

        <Field label="Last Name" htmlFor="contact-last-name" required error={errors.lastName}>
          <input
            id="contact-last-name"
            className="lg-input"
            placeholder="e.g. Wayne"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
            }}
          />
        </Field>

        <Field label="Email Address" htmlFor="contact-email" required error={errors.email}>
          <input
            id="contact-email"
            type="email"
            className="lg-input"
            placeholder="bruce@wayneenterprises.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
          />
        </Field>

        <Field label="Phone Number" htmlFor="contact-phone" error={errors.phone}>
          <input
            id="contact-phone"
            type="tel"
            className="lg-input"
            placeholder="+1-555-0199"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
          />
        </Field>
      </div>

      <h2 className="lg-form-section-title">2. Role, Organization & Lifecycle Stage</h2>

      <div className="lg-form-grid">
        <Field label="Job Title / Role" htmlFor="contact-job-title">
          <input
            id="contact-job-title"
            className="lg-input"
            placeholder="e.g. Chief Executive Officer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </Field>

        <Field
          label="Department"
          htmlFor="contact-department"
          hint="Type a custom department or pick a common function."
        >
          <input
            id="contact-department"
            list="contact-department-list"
            className="lg-input"
            placeholder="e.g. Executive"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <datalist id="contact-department-list">
            {DEPARTMENT_SUGGESTIONS.map((dept) => (
              <option key={dept} value={dept} />
            ))}
          </datalist>
        </Field>

        <Field label="Organization / Company" htmlFor="contact-organization">
          <select
            id="contact-organization"
            className="lg-select"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          >
            <option value="">Independent Contact (No Organization)</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
                {org.industry ? ` (${org.industry})` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Assigned Owner" htmlFor="contact-owner">
          <select
            id="contact-owner"
            className="lg-select"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Lifecycle Stage" htmlFor="contact-stage" className="lg-span-2">
          <select
            id="contact-stage"
            className="lg-select"
            value={stage}
            onChange={(e) => setStage(e.target.value as ContactStage)}
          >
            {CONTACT_STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="ld-form-score-preview">
        <ContactStagePipeline currentStage={stage} onSelectStage={setStage} />
      </div>

      <div className="lg-form-footer">
        <Link to={cancelPath} className="auth-btn btn-secondary">
          Cancel
        </Link>
        <div className="ld-submit-btn-wrap">
          <PrimaryButton type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
};

