import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { Badge, SectionCard, StatCard } from '../lead-generation/components/Cards';
import { DataTable, type Column } from '../lead-generation/components/DataTable';
import { Field } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { formatCurrency } from '../lead-generation/leadGenConstants';
import {
  SAMPLE_LEADS_CSV,
  parseLeadsImportText,
  triggerFileDownload,
  type ParsedImportRow,
} from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon,
} from '../../components/common/Icons';

export const LeadImportPage: React.FC = () => {
  const { users } = useUserOptions();

  const [rawInput, setRawInput] = useState(SAMPLE_LEADS_CSV);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [defaultOwnerId, setDefaultOwnerId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    failed: number;
    messages: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedRows = useMemo(
    () => parseLeadsImportText(rawInput, format),
    [rawInput, format],
  );

  const validRows = useMemo(
    () => parsedRows.filter((r) => r.errors.length === 0),
    [parsedRows],
  );
  const invalidRows = useMemo(
    () => parsedRows.filter((r) => r.errors.length > 0),
    [parsedRows],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isJson = file.name.toLowerCase().endsWith('.json');
    setFormat(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      setRawInput(content);
      setImportSummary(null);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    triggerFileDownload('crm-leads-import-template.csv', SAMPLE_LEADS_CSV);
  };

  const handleExecuteImport = async () => {
    if (validRows.length === 0) {
      setError('No valid lead rows available to import. Fix validation errors first.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    let imported = 0;
    let failed = 0;
    const messages: string[] = [];

    for (const row of validRows) {
      try {
        await leadService.createLead({
          ...row.payload,
          ownerId: row.payload.ownerId || defaultOwnerId || undefined,
        });
        imported++;
      } catch (err: any) {
        failed++;
        messages.push(`Row #${row.rowNumber} (${row.payload.email}): ${err?.message || 'Failed'}`);
      }
    }

    setImportSummary({ imported, failed, messages });
    if (imported > 0) {
      setSuccess(`Successfully imported ${imported} lead(s) into the CRM.`);
    }
    if (failed > 0) {
      setError(`${failed} row(s) failed during import.`);
    }
    setIsImporting(false);
  };

  const columns: Column<ParsedImportRow>[] = [
    {
      key: 'row',
      header: 'Row',
      render: (r) => `#${r.rowNumber}`,
    },
    {
      key: 'title',
      header: 'Lead Title',
      render: (r) => <strong>{r.payload.title || '—'}</strong>,
    },
    {
      key: 'contact',
      header: 'Contact & Email',
      render: (r) => (
        <div className="lg-cell-stack">
          <span>
            {r.payload.firstName} {r.payload.lastName}
          </span>
          <span className="lg-cell-sub">{r.payload.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (r) => r.payload.companyName || '—',
    },
    {
      key: 'status',
      header: 'Status / Source',
      render: (r) => (
        <div className="lg-badge-row">
          <Badge tone="blue">{r.payload.status}</Badge>
          <Badge tone="slate">{r.payload.source}</Badge>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score / Value',
      render: (r) =>
        `${r.payload.leadScore ?? 0} pts · ${formatCurrency(r.payload.estimatedValue)}`,
    },
    {
      key: 'validation',
      header: 'Validation',
      render: (r) =>
        r.errors.length === 0 ? (
          <Badge tone="green">Valid</Badge>
        ) : (
          <Badge tone="red" title={r.errors.join(', ')}>
            {r.errors.join(', ')}
          </Badge>
        ),
    },
  ];

  return (
    <LeadsLayout
      title="Lead Import"
      subtitle="Bulk import leads from CSV or JSON files with field validation and preview."
      icon={<PlusIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/leads" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Leads
        </Link>
      }
      actions={
        <button type="button" className="auth-btn btn-secondary" onClick={handleDownloadSample}>
          <SparklesIcon size={15} />
          <span>Download Sample CSV Template</span>
        </button>
      }
    >
      <div className="lg-stat-grid">
        <StatCard
          label="Parsed Rows"
          value={parsedRows.length}
          hint={`Format: ${format.toUpperCase()}`}
          icon={<PlusIcon size={20} />}
          tone="blue"
        />
        <StatCard
          label="Valid Rows"
          value={validRows.length}
          hint="Ready to import"
          icon={<CheckCircleIcon size={20} />}
          tone="green"
        />
        <StatCard
          label="Rows with Errors"
          value={invalidRows.length}
          hint="Will be skipped until fixed"
          icon={<AlertCircleIcon size={20} />}
          tone={invalidRows.length > 0 ? 'red' : 'slate'}
        />
      </div>

      <SectionCard
        title="1. Upload File or Paste CSV / JSON Data"
        subtitle="Required columns: title, firstName, lastName, email. Optional: phone, companyName, status, source, leadScore, estimatedValue."
      >
        <div className="ld-doc-upload-bar">
          <label className="ld-upload-dropzone">
            <input
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileUpload}
              className="ld-hidden-file-input"
            />
            <PlusIcon size={18} />
            <div>
              <strong>Choose a .CSV or .JSON file from your computer</strong>
              <span className="lg-field-hint">
                Or edit / paste your rows directly in the editor below.
              </span>
            </div>
          </label>

          <Field
            label="Assign Imported Leads to Owner (Optional)"
            htmlFor="import-default-owner"
          >
            <select
              id="import-default-owner"
              className="lg-select"
              value={defaultOwnerId}
              onChange={(e) => setDefaultOwnerId(e.target.value)}
            >
              <option value="">— Leave Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Raw CSV / JSON Payload"
          htmlFor="import-raw-textarea"
          hint="First row must be the CSV header row."
        >
          <textarea
            id="import-raw-textarea"
            className="lg-textarea font-mono"
            rows={7}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
        </Field>
      </SectionCard>

      {importSummary && (
        <SectionCard
          title="Import Execution Summary"
          subtitle={`Imported ${importSummary.imported} lead(s) · ${importSummary.failed} failed.`}
        >
          {importSummary.messages.length > 0 && (
            <ul className="ld-error-list">
              {importSummary.messages.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          )}
          <div className="lg-form-actions">
            <Link to="/leads" className="auth-btn btn-primary">
              View All Imported Leads
            </Link>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title={`2. Validation & Import Preview (${parsedRows.length} rows)`}
        subtitle="Verify parsed fields and validation status before importing into the CRM."
        actions={
          <PrimaryButton
            type="button"
            fullWidth={false}
            isLoading={isImporting}
            loadingText="Importing Leads..."
            disabled={validRows.length === 0}
            onClick={handleExecuteImport}
            icon={<CheckCircleIcon size={16} />}
          >
            Import {validRows.length} Valid Lead{validRows.length === 1 ? '' : 's'}
          </PrimaryButton>
        }
      >
        <DataTable
          columns={columns}
          rows={parsedRows}
          rowKey={(r) => String(r.rowNumber)}
          emptyTitle="No rows to preview"
          emptyDescription="Upload a CSV/JSON file or paste rows above to preview."
        />
      </SectionCard>
    </LeadsLayout>
  );
};

