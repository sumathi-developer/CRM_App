import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { contactService } from '../../services/contact.service';
import type { Contact, ContactOrganization } from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { SectionCard, StatCard } from '../lead-generation/components/Cards';
import { Field } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { triggerFileDownload } from '../leads/leadConstants';
import {
  CONTACT_STAGE_OPTIONS,
  generateContactsCsv,
  generateContactsJson,
} from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  UsersIcon,
} from '../../components/common/Icons';

const EXPORTABLE_COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'id', label: 'Contact UUID (id)' },
  { key: 'firstName', label: 'First Name (firstName)' },
  { key: 'lastName', label: 'Last Name (lastName)' },
  { key: 'email', label: 'Email Address (email)' },
  { key: 'phone', label: 'Phone Number (phone)' },
  { key: 'jobTitle', label: 'Job Title (jobTitle)' },
  { key: 'department', label: 'Department (department)' },
  { key: 'stage', label: 'Lifecycle Stage (stage)' },
  { key: 'organizationName', label: 'Organization Name (organizationName)' },
  { key: 'ownerName', label: 'Assigned Owner (ownerName)' },
  { key: 'createdAt', label: 'Created Timestamp (createdAt)' },
];

export const ContactExportPage: React.FC = () => {
  const { users } = useUserOptions();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORTABLE_COLUMNS.map((c) => c.key),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadContactsForExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await contactService.getContacts({
        limit: 100,
        stage: stageFilter || undefined,
        organizationId: organizationFilter || undefined,
        ownerId: ownerFilter || undefined,
        search: searchFilter || undefined,
      });
      setContacts(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contacts for export.');
    } finally {
      setIsLoading(false);
    }
  }, [stageFilter, organizationFilter, ownerFilter, searchFilter]);

  useEffect(() => {
    loadContactsForExport();
  }, [loadContactsForExport]);

  useEffect(() => {
    contactService.getOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
  }, []);

  const toggleColumn = (colKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey],
    );
  };

  const previewContent = useMemo(() => {
    const sample = contacts.slice(0, 10);
    if (exportFormat === 'json') {
      return generateContactsJson(sample, selectedColumns);
    }
    return generateContactsCsv(sample, selectedColumns);
  }, [contacts, exportFormat, selectedColumns]);

  const handleDownloadExport = () => {
    if (contacts.length === 0) return;
    if (selectedColumns.length === 0) {
      setError('Select at least one column to export.');
      return;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    if (exportFormat === 'json') {
      const json = generateContactsJson(contacts, selectedColumns);
      triggerFileDownload(
        json,
        `crm-contacts-export-${dateStamp}.json`,
        'application/json;charset=utf-8;',
      );
      setSuccess(`Exported ${contacts.length} contact(s) as JSON.`);
    } else {
      const csv = generateContactsCsv(contacts, selectedColumns);
      triggerFileDownload(
        csv,
        `crm-contacts-export-${dateStamp}.csv`,
        'text/csv;charset=utf-8;',
      );
      setSuccess(`Exported ${contacts.length} contact(s) as CSV.`);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const fullContent =
        exportFormat === 'json'
          ? generateContactsJson(contacts, selectedColumns)
          : generateContactsCsv(contacts, selectedColumns);
      await navigator.clipboard.writeText(fullContent);
      setSuccess(`Copied ${contacts.length} contact(s) in ${exportFormat.toUpperCase()} format.`);
    } catch {
      setError('Unable to copy to clipboard.');
    }
  };

  return (
    <ContactsLayout
      title="Contact Export"
      subtitle="Filter, customize columns, preview, and download contacts in CSV or JSON format."
      icon={<ExternalLinkIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/contacts" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Contacts
        </Link>
      }
    >
      <section className="lg-stats-grid">
        <StatCard
          label="Matching Contacts"
          value={contacts.length}
          hint="Ready for export"
          tone="blue"
          icon={<UsersIcon size={18} />}
        />
        <StatCard
          label="Selected Columns"
          value={selectedColumns.length}
          hint={`Of ${EXPORTABLE_COLUMNS.length} available fields`}
          tone="green"
          icon={<CheckCircleIcon size={18} />}
        />
        <StatCard
          label="Export Format"
          value={exportFormat.toUpperCase()}
          hint={
            exportFormat === 'csv'
              ? 'Spreadsheet compatible'
              : 'Structured JSON payload'
          }
          tone="purple"
        />
      </section>

      <div className="lg-two-col">
        {/* Left: Export Filters & Column Configuration */}
        <SectionCard
          title="1. Filter Dataset & Choose Columns"
          subtitle="Refine which contacts and columns are included in your export file."
        >
          <div className="ld-form-stack">
            <div className="lg-form-grid">
              <Field label="Export Format" htmlFor="export-contact-format">
                <select
                  id="export-contact-format"
                  className="lg-select"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                >
                  <option value="csv">CSV (.csv) — Excel / Google Sheets</option>
                  <option value="json">JSON (.json) — API / Data Pipeline</option>
                </select>
              </Field>

              <Field label="Search Keyword" htmlFor="export-contact-search">
                <input
                  id="export-contact-search"
                  className="lg-input"
                  placeholder="Filter by name or email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </Field>

              <Field label="Lifecycle Stage" htmlFor="export-contact-stage">
                <select
                  id="export-contact-stage"
                  className="lg-select"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <option value="">All Lifecycle Stages</option>
                  {CONTACT_STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Organization" htmlFor="export-contact-org">
                <select
                  id="export-contact-org"
                  className="lg-select"
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                >
                  <option value="">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Owner" htmlFor="export-contact-owner" className="lg-span-2">
                <select
                  id="export-contact-owner"
                  className="lg-select"
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                >
                  <option value="">All Owners</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <div className="ld-qual-notes-head">
                <span className="lg-label">Included Columns ({selectedColumns.length})</span>
                <div className="lg-badge-row">
                  <button
                    type="button"
                    className="lg-link-btn"
                    onClick={() =>
                      setSelectedColumns(EXPORTABLE_COLUMNS.map((c) => c.key))
                    }
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="lg-link-btn"
                    onClick={() =>
                      setSelectedColumns(['firstName', 'lastName', 'email', 'stage'])
                    }
                  >
                    Core Only
                  </button>
                </div>
              </div>

              <div className="ld-columns-checklist">
                {EXPORTABLE_COLUMNS.map((col) => (
                  <label key={col.key} className="lg-CheckRow">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="lg-form-footer">
              <button
                type="button"
                className="auth-btn btn-secondary"
                disabled={contacts.length === 0}
                onClick={handleCopyClipboard}
              >
                Copy to Clipboard
              </button>
              <div className="ld-submit-btn-wrap">
                <PrimaryButton
                  type="button"
                  disabled={contacts.length === 0 || selectedColumns.length === 0}
                  onClick={handleDownloadExport}
                >
                  Download {exportFormat.toUpperCase()} ({contacts.length} Contacts)
                </PrimaryButton>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Right: Live Export Preview */}
        <SectionCard
          title="2. Live Export Preview (First 10 Rows)"
          subtitle="Verify the exact output structure before downloading."
        >
          {isLoading ? (
            <div className="lg-state-box">
              <LoadingIndicator size="medium" message="Building export preview..." />
            </div>
          ) : (
            <pre className="ld-export-preview">{previewContent || 'No matching contacts.'}</pre>
          )}
        </SectionCard>
      </div>
    </ContactsLayout>
  );
};

