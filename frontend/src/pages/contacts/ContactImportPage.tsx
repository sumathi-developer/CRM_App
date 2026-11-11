import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactService } from '../../services/contact.service';
import type { ContactOrganization } from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { Field, FormModal } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { EmptyState } from '../../components/common/EmptyState';
import { triggerFileDownload } from '../leads/leadConstants';
import {
  SAMPLE_CONTACTS_CSV,
  SAMPLE_CONTACTS_JSON,
  contactStageTone,
  getContactPermissions,
  parseAndValidateContactImportText,
} from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  UsersIcon,
} from '../../components/common/Icons';

export const ContactImportPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const permissions = useMemo(() => getContactPermissions(currentUser), [currentUser]);

  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [rawText, setRawText] = useState(SAMPLE_CONTACTS_CSV);
  const [format, setFormat] = useState<'auto' | 'csv' | 'json'>('auto');
  const [defaultOwnerId, setDefaultOwnerId] = useState('');
  const [defaultOrganizationId, setDefaultOrganizationId] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [failedRows, setFailedRows] = useState<Array<{ row: number; reason: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    contactService.getOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
  }, []);

  const parsedRows = useMemo(
    () => parseAndValidateContactImportText(rawText, format),
    [rawText, format],
  );

  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter((r) => !r.isValid), [parsedRows]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setRawText(text);
      if (file.name.endsWith('.json')) {
        setFormat('json');
      } else if (file.name.endsWith('.csv')) {
        setFormat('csv');
      } else {
        setFormat('auto');
      }
      setImportedCount(null);
      setFailedRows([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to read selected file.');
    }
  };

  const handleDownloadSampleCsv = () => {
    triggerFileDownload(
      SAMPLE_CONTACTS_CSV,
      'sample-contacts-import.csv',
      'text/csv;charset=utf-8;',
    );
  };

  const handleDownloadSampleJson = () => {
    triggerFileDownload(
      SAMPLE_CONTACTS_JSON,
      'sample-contacts-import.json',
      'application/json;charset=utf-8;',
    );
  };

  const handleExecuteImport = async () => {
    setIsConfirmOpen(false);
    if (validRows.length === 0 || !permissions.canImport) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);
    setFailedRows([]);

    let okCount = 0;
    const failures: Array<{ row: number; reason: string }> = [];

    for (const row of validRows) {
      try {
        // Resolve organizationId by matching organizationName if provided
        let resolvedOrgId = row.payload.organizationId || defaultOrganizationId || undefined;
        if (!resolvedOrgId && row.organizationName) {
          const match = organizations.find(
            (o) => o.name.toLowerCase() === row.organizationName?.toLowerCase(),
          );
          if (match) resolvedOrgId = match.id;
        }

        const payload = {
          ...row.payload,
          organizationId: resolvedOrgId,
          ownerId: row.payload.ownerId || defaultOwnerId || undefined,
        };
        await contactService.createContact(payload);
        okCount += 1;
      } catch (err: any) {
        failures.push({
          row: row.rowNumber,
          reason: err?.message || 'API error during creation',
        });
      }
    }

    setImportedCount(okCount);
    setFailedRows(failures);
    setIsImporting(false);

    if (okCount > 0) {
      setSuccess(
        `Successfully imported ${okCount} contact(s)${
          failures.length > 0 ? ` (${failures.length} skipped/failed)` : ''
        }.`,
      );
    } else if (failures.length > 0) {
      setError(`Import failed for all ${failures.length} row(s). Check error details below.`);
    }
  };

  return (
    <ContactsLayout
      title="Contact Import"
      subtitle="Bulk import contacts from CSV or JSON files with field validation, organization matching, and preview."
      icon={<PlusIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/contacts" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Contacts
        </Link>
      }
      actions={
        <>
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={handleDownloadSampleCsv}
          >
            Download CSV Template
          </button>
          <button
            type="button"
            className="auth-btn btn-secondary"
            onClick={handleDownloadSampleJson}
          >
            Download JSON Template
          </button>
        </>
      }
    >
      {!permissions.canImport ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Insufficient Permissions"
            description="Your current role does not have permission to import contacts."
            action={
              <Link to="/contacts" className="auth-btn btn-secondary">
                Return to Contacts
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="lg-stats-grid">
            <StatCard
              label="Total Parsed Rows"
              value={parsedRows.length}
              hint="Detected in input payload"
              tone="blue"
              icon={<UsersIcon size={18} />}
            />
            <StatCard
              label="Valid & Ready"
              value={validRows.length}
              hint="Passed field validation"
              tone="green"
              icon={<CheckCircleIcon size={18} />}
            />
            <StatCard
              label="Validation Errors"
              value={invalidRows.length}
              hint="Missing required fields or invalid email"
              tone={invalidRows.length > 0 ? 'amber' : 'slate'}
            />
            <StatCard
              label="Imported This Session"
              value={importedCount ?? 0}
              hint={
                failedRows.length > 0 ? `${failedRows.length} failed` : 'Ready to execute'
              }
              tone="purple"
            />
          </section>

          <div className="lg-grid-2" style={{ marginBottom: '24px' }}>
            {/* Step 1: Upload or Paste CSV/JSON */}
            <SectionCard
              title="1. Upload File or Paste CSV / JSON Data"
              subtitle="Required columns: firstName, lastName, email. Optional: phone, jobTitle, department, stage, organizationId."
            >
              <div className="ld-form-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="lg-form-grid">
                  <Field label="Upload CSV or JSON File" htmlFor="import-contact-file-input">
                    <input
                      id="import-contact-file-input"
                      type="file"
                      accept=".csv,.json,text/csv,application/json"
                      className="lg-input"
                      onChange={handleFileSelect}
                    />
                  </Field>

                  <Field label="Data Format" htmlFor="import-contact-format">
                    <select
                      id="import-contact-format"
                      className="lg-select"
                      value={format}
                      onChange={(e) =>
                        setFormat(e.target.value as 'auto' | 'csv' | 'json')
                      }
                    >
                      <option value="auto">Auto-Detect (CSV or JSON)</option>
                      <option value="csv">CSV (Comma-Separated Values)</option>
                      <option value="json">JSON Array</option>
                    </select>
                  </Field>

                  <Field
                    label="Default Organization (Optional)"
                    htmlFor="import-contact-org"
                  >
                    <select
                      id="import-contact-org"
                      className="lg-select"
                      value={defaultOrganizationId}
                      onChange={(e) => setDefaultOrganizationId(e.target.value)}
                    >
                      <option value="">None / Match by Row</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Default Owner (Optional)" htmlFor="import-contact-owner">
                    <select
                      id="import-contact-owner"
                      className="lg-select"
                      value={defaultOwnerId}
                      onChange={(e) => setDefaultOwnerId(e.target.value)}
                    >
                      <option value="">Leave Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Raw CSV / JSON Payload" htmlFor="import-contact-raw-textarea">
                  <textarea
                    id="import-contact-raw-textarea"
                    className="lg-textarea ld-code-textarea"
                    rows={9}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste CSV or JSON array of contacts here..."
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                  />
                </Field>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="auth-btn btn-secondary"
                      onClick={() => setRawText(SAMPLE_CONTACTS_CSV)}
                    >
                      Load Sample CSV
                    </button>
                    <button
                      type="button"
                      className="auth-btn btn-secondary"
                      onClick={() => setRawText(SAMPLE_CONTACTS_JSON)}
                    >
                      Load Sample JSON
                    </button>
                  </div>
                  <PrimaryButton
                    type="button"
                    fullWidth={false}
                    disabled={validRows.length === 0}
                    isLoading={isImporting}
                    loadingText="Importing..."
                    onClick={() => setIsConfirmOpen(true)}
                    icon={<CheckCircleIcon size={15} />}
                  >
                    Import {validRows.length} Valid Contact{validRows.length === 1 ? '' : 's'}
                  </PrimaryButton>
                </div>
              </div>
            </SectionCard>

            {/* Step 2: Validation & Preview Table */}
            <SectionCard
              title={`2. Validation Preview (${parsedRows.length} Rows)`}
              subtitle="Verify mapped fields and fix any validation errors before importing."
              actions={
                validRows.length > 0 ? (
                  <Badge tone="green">{validRows.length} Valid Ready</Badge>
                ) : undefined
              }
            >
              {failedRows.length > 0 && (
                <div className="lg-inline-alert" style={{ marginBottom: '1rem' }}>
                  <strong>Some rows could not be imported:</strong>
                  <ul className="ld-compact-list" style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                    {failedRows.map((f) => (
                      <li key={f.row}>
                        Row #{f.row}: {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedRows.length === 0 ? (
                <EmptyState
                  title="No Data to Preview"
                  description="Upload a CSV/JSON file or paste rows above to preview."
                />
              ) : (
                <div
                  className="ld-items-stack"
                  style={{ maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}
                >
                  {parsedRows.map((row) => (
                    <div
                      key={row.rowNumber}
                      className="ld-item-card"
                      style={{
                        borderLeft: row.isValid
                          ? '3px solid #10B981'
                          : '3px solid #EF4444',
                      }}
                    >
                      <div className="ld-item-card-top">
                        <div
                          className="lg-badge-row"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Badge tone={row.isValid ? 'green' : 'red'}>
                            {row.isValid ? 'VALID' : 'INVALID'} · ROW #{row.rowNumber}
                          </Badge>
                          <strong style={{ fontSize: '0.925rem', color: '#0F172A' }}>
                            {row.payload.firstName} {row.payload.lastName}
                          </strong>
                        </div>
                        <Badge tone={contactStageTone(row.payload.stage as any)}>
                          {row.payload.stage || 'LEAD'}
                        </Badge>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.8125rem',
                          color: '#64748B',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{row.payload.email || 'No email'}</span>
                        {row.payload.jobTitle && (
                          <>
                            <span style={{ opacity: 0.5 }}>·</span>
                            <span>{row.payload.jobTitle}</span>
                          </>
                        )}
                        {row.payload.department && (
                          <>
                            <span style={{ opacity: 0.5 }}>·</span>
                            <span>{row.payload.department}</span>
                          </>
                        )}
                        {row.organizationName && (
                          <>
                            <span style={{ opacity: 0.5 }}>·</span>
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              {row.organizationName}
                            </span>
                          </>
                        )}
                      </div>

                      {!row.isValid && row.errors.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.35rem',
                            marginTop: '0.35rem',
                          }}
                        >
                          {row.errors.map((errMsg, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#DC2626',
                                background: '#FEE2E2',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              {errMsg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}

      <FormModal
        isOpen={isConfirmOpen}
        title="Confirm Contact Import"
        subtitle={`Ready to import ${validRows.length} valid contact(s) into the CRM${
          invalidRows.length > 0 ? ` (${invalidRows.length} invalid row(s) will be skipped)` : ''
        }.`}
        submitLabel={`Import ${validRows.length} Contact(s)`}
        onSubmit={handleExecuteImport}
        onClose={() => setIsConfirmOpen(false)}
        isSaving={isImporting}
      >
        <p className="lg-muted">
          Each valid row will be created via the Contacts API and linked to the selected
          organization and owner.
        </p>
      </FormModal>
    </ContactsLayout>
  );
};
