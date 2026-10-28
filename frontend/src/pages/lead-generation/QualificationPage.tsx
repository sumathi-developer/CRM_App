import React, { useCallback, useState } from 'react';
import { leadGenerationService } from '../../services/lead-generation.service';
import type {
  QualificationRule,
  QualificationRulePayload,
  QualificationCondition,
  RuleQuery,
  QualificationResult,
} from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { DataTable, type Column } from './components/DataTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect } from './components/FilterBar';
import { Badge } from './components/Cards';
import { Field, FormModal, Toggle, ConditionBuilder, type ConditionRow } from './components/FormParts';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  QUALIFICATION_STATUS_OPTIONS,
  CONDITION_FIELD_OPTIONS,
  CONDITION_OPERATOR_OPTIONS,
  humanize,
  toneForStatus,
} from './leadGenConstants';
import {
  TargetIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

const PAGE_SIZE = 10;

interface QualRuleFormState {
  name: string;
  description: string;
  targetStatus: string;
  minScore: string;
  conditions: ConditionRow[];
  autoQualify: boolean;
  isActive: boolean;
  priority: string;
}

const EMPTY_QUAL_FORM: QualRuleFormState = {
  name: '',
  description: '',
  targetStatus: 'QUALIFIED',
  minScore: '60',
  conditions: [],
  autoQualify: true,
  isActive: true,
  priority: '1',
};

export const QualificationPage: React.FC = () => {
  const { workspaceId, canManage } = useLeadGenAccess();

  const [targetStatus, setTargetStatus] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  // Form / Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<QualificationRule | null>(null);
  const [ruleForm, setRuleForm] = useState<QualRuleFormState>(EMPTY_QUAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [toDelete, setToDelete] = useState<QualificationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Simulator state
  const [simLead, setSimLead] = useState({
    leadScore: '75',
    estimatedValue: '45000',
    companyName: 'Wayne Enterprises',
    channel: 'WEBSITE',
    email: 'bruce@wayne.com',
  });
  const [simResult, setSimResult] = useState<QualificationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const loader = useCallback(() => {
    const isActive = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
    const query: RuleQuery = {
      page,
      limit: PAGE_SIZE,
      targetStatus: targetStatus || undefined,
      isActive,
      workspaceId,
    };
    return leadGenerationService.getQualificationRules(query);
  }, [page, targetStatus, activeFilter, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);
  const hasFilters = Boolean(targetStatus || activeFilter);

  const openCreateModal = () => {
    setEditingRule(null);
    setRuleForm(EMPTY_QUAL_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (rule: QualificationRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      targetStatus: rule.targetStatus || 'QUALIFIED',
      minScore: rule.minScore !== undefined && rule.minScore !== null ? String(rule.minScore) : '',
      conditions: (rule.conditions || []).map((c) => ({
        field: c.field,
        operator: c.operator,
        value: String(c.value ?? ''),
      })),
      autoQualify: rule.autoQualify ?? true,
      isActive: rule.isActive ?? true,
      priority: String(rule.priority ?? 1),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!ruleForm.name.trim()) errs.name = 'Rule name is required.';
    if (ruleForm.minScore.trim() !== '' && Number.isNaN(Number(ruleForm.minScore))) {
      errs.minScore = 'Minimum score must be a number.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setActionError(null);

    const conditions: QualificationCondition[] = ruleForm.conditions.map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.operator === 'NOT_EMPTY' ? '' : c.value,
    }));

    const payload: QualificationRulePayload = {
      name: ruleForm.name.trim(),
      description: ruleForm.description.trim() || undefined,
      targetStatus: ruleForm.targetStatus,
      minScore: ruleForm.minScore.trim() !== '' ? Number(ruleForm.minScore) : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      autoQualify: ruleForm.autoQualify,
      isActive: ruleForm.isActive,
      priority: Number(ruleForm.priority) || 1,
      workspaceId,
    };

    try {
      if (editingRule) {
        await leadGenerationService.updateQualificationRule(editingRule.id, payload);
        setActionSuccess('Qualification rule updated successfully.');
      } else {
        await leadGenerationService.createQualificationRule(payload);
        setActionSuccess('Qualification rule created successfully.');
      }
      setModalOpen(false);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save qualification rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: QualificationRule) => {
    setActionError(null);
    try {
      await leadGenerationService.updateQualificationRule(rule.id, { isActive: !rule.isActive });
      setActionSuccess(`Rule "${rule.name}" is now ${rule.isActive ? 'inactive' : 'active'}.`);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to toggle rule state.');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await leadGenerationService.deleteQualificationRule(toDelete.id);
      setActionSuccess(res?.message || 'Qualification rule deleted.');
      setToDelete(null);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete qualification rule.');
      setToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const leadPayload: Record<string, any> = {
        leadScore: Number(simLead.leadScore) || 0,
        estimatedValue: simLead.estimatedValue ? Number(simLead.estimatedValue) : undefined,
        companyName: simLead.companyName,
        channel: simLead.channel,
        email: simLead.email,
      };
      const res = await leadGenerationService.previewQualification(leadPayload, workspaceId);
      setSimResult(res);
    } catch (err: any) {
      setSimError(err?.message || 'Failed to preview qualification.');
    } finally {
      setIsSimulating(false);
    }
  };

  const columns: Column<QualificationRule>[] = [
    {
      key: 'name',
      header: 'Rule Name',
      render: (r) => (
        <div className="lg-cell-stack">
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          {r.description && <span className="lg-cell-sub">{r.description}</span>}
        </div>
      ),
    },
    {
      key: 'targetStatus',
      header: 'Assigned Status',
      render: (r) => <Badge tone={toneForStatus(r.targetStatus)}>{humanize(r.targetStatus)}</Badge>,
    },
    {
      key: 'minScore',
      header: 'Min Score',
      align: 'right',
      render: (r) => (r.minScore !== undefined && r.minScore !== null ? `${r.minScore} pts` : 'None'),
    },
    {
      key: 'conditions',
      header: 'Criteria Count',
      align: 'center',
      render: (r) => (r.conditions?.length ? `${r.conditions.length} condition(s)` : 'Any lead'),
    },
    {
      key: 'auto',
      header: 'Auto Qualify',
      render: (r) => <Badge tone={r.autoQualify ? 'green' : 'slate'}>{r.autoQualify ? 'Auto' : 'Review'}</Badge>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (r) => (
        <button
          type="button"
          className="lg-link-btn"
          onClick={() => canManage && handleToggleActive(r)}
          disabled={!canManage}
          style={{ textDecoration: 'none' }}
        >
          <Badge tone={r.isActive ? 'green' : 'slate'}>{r.isActive ? 'Active' : 'Disabled'}</Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) =>
        canManage ? (
          <div className="lg-row-actions">
            <button
              type="button"
              className="lg-icon-btn"
              title="Edit rule"
              aria-label={`Edit ${r.name}`}
              onClick={() => openEditModal(r)}
            >
              <EditIcon size={15} />
            </button>
            <button
              type="button"
              className="lg-icon-btn danger"
              title="Delete rule"
              aria-label={`Delete ${r.name}`}
              onClick={() => setToDelete(r)}
            >
              <TrashIcon size={15} />
            </button>
          </div>
        ) : (
          <span className="lg-muted">View only</span>
        ),
    },
  ];

  return (
    <LeadGenLayout
      title="Lead Qualification"
      subtitle="Define threshold criteria and automated qualification stages before leads enter sales rep pipelines."
      icon={<TargetIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      success={actionSuccess}
      onDismissSuccess={() => setActionSuccess(null)}
      actions={
        canManage && (
          <button type="button" className="auth-btn btn-primary" onClick={openCreateModal} id="lg-create-qual-rule-btn">
            <PlusIcon size={16} />
            <span>New Qualification Rule</span>
          </button>
        )
      }
    >
      <FilterBar
        onRefresh={reload}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setTargetStatus('');
          setActiveFilter('');
          setPage(1);
        }}
      >
        <FilterSelect
          id="lg-qual-status"
          label="Target Status"
          value={targetStatus}
          options={QUALIFICATION_STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(v) => {
            setTargetStatus(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-qual-active"
          label="Status"
          value={activeFilter}
          options={[
            { value: 'true', label: 'Active rules' },
            { value: 'false', label: 'Disabled rules' },
          ]}
          allLabel="All rules"
          onChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        loadingMessage="Loading qualification rules..."
        emptyIcon={<TargetIcon size={28} />}
        emptyTitle={hasFilters ? 'No matching qualification rules' : 'No qualification rules configured'}
        emptyDescription="Create rules to automatically evaluate leads and transition them to Qualified or Contacted stages."
        emptyAction={
          !hasFilters && canManage ? (
            <button type="button" className="auth-btn btn-primary" onClick={openCreateModal}>
              <PlusIcon size={16} />
              <span>Create first rule</span>
            </button>
          ) : undefined
        }
        footer={<Pagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} noun="rules" />}
      />

      {/* Qualification Simulator */}
      <div className="lg-card lg-section-card" style={{ marginTop: '2rem' }}>
        <div className="lg-section-head">
          <div>
            <h2 className="lg-section-title">
              <SparklesIcon size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#10b981' }} />
              Live Qualification Simulator
            </h2>
            <p className="lg-section-subtitle">
              Verify how lead qualification criteria evaluate against a candidate lead profile.
            </p>
          </div>
          <PrimaryButton
            type="button"
            fullWidth={false}
            isLoading={isSimulating}
            loadingText="Evaluating..."
            onClick={runSimulation}
            id="lg-test-qual-btn"
          >
            Test Qualification
          </PrimaryButton>
        </div>

        {simError && (
          <div className="lg-inline-alert" role="alert" style={{ marginBottom: '1rem' }}>
            {simError}
          </div>
        )}

        <div className="lg-grid-2">
          <div className="lg-form-grid">
            <Field label="Candidate Lead Score">
              <input
                className="lg-input"
                type="number"
                value={simLead.leadScore}
                onChange={(e) => setSimLead({ ...simLead, leadScore: e.target.value })}
              />
            </Field>
            <Field label="Estimated Pipeline Value ($)">
              <input
                className="lg-input"
                type="number"
                value={simLead.estimatedValue}
                onChange={(e) => setSimLead({ ...simLead, estimatedValue: e.target.value })}
              />
            </Field>
            <Field label="Company Name">
              <input
                className="lg-input"
                value={simLead.companyName}
                onChange={(e) => setSimLead({ ...simLead, companyName: e.target.value })}
              />
            </Field>
            <Field label="Channel">
              <input
                className="lg-input"
                value={simLead.channel}
                onChange={(e) => setSimLead({ ...simLead, channel: e.target.value })}
              />
            </Field>
          </div>

          <div className="lg-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Qualification Decision
            </h4>
            {simResult ? (
              <div className="lg-cell-stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>Decision:</span>
                  <Badge tone={toneForStatus(simResult.targetStatus)}>
                    {simResult.targetStatus}
                  </Badge>
                  {simResult.isQualified && (
                    <Badge tone="green">
                      <CheckCircleIcon size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Qualified
                    </Badge>
                  )}
                </div>

                {simResult.reasons && simResult.reasons.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                      Evaluation Notes:
                    </div>
                    <ul style={{ margin: '0 0 0.5rem 1.25rem', padding: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {simResult.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {simResult.matchedRules && simResult.matchedRules.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Matched {simResult.matchedRules.length} qualification rule(s):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {simResult.matchedRules.map((mr) => (
                        <Badge key={mr.id} tone="blue">{mr.name}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="lg-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                    No specific qualification rules matched. Default status retained.
                  </p>
                )}
              </div>
            ) : (
              <p className="lg-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                Click "Test Qualification" to run the evaluation against current rules.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Rule Modal */}
      <FormModal
        isOpen={modalOpen}
        title={editingRule ? 'Edit Qualification Rule' : 'New Qualification Rule'}
        subtitle="Define threshold criteria and status updates for qualifying leads."
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        isSaving={isSaving}
        submitLabel={editingRule ? 'Save Changes' : 'Create Rule'}
        error={formErrors.name || formErrors.minScore}
        wide
      >
        <div className="lg-form-grid">
          <Field label="Rule Name" required error={formErrors.name} className="lg-span-2">
            <input
              className="lg-input"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. High Value Enterprise Lead"
            />
          </Field>

          <Field label="Target Status" required>
            <select
              className="lg-select"
              value={ruleForm.targetStatus}
              onChange={(e) => setRuleForm({ ...ruleForm, targetStatus: e.target.value })}
            >
              {QUALIFICATION_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Minimum Lead Score Threshold" error={formErrors.minScore} hint="Optional score requirement">
            <input
              type="number"
              className="lg-input"
              value={ruleForm.minScore}
              onChange={(e) => setRuleForm({ ...ruleForm, minScore: e.target.value })}
              placeholder="60"
            />
          </Field>

          <Field label="Evaluation Priority">
            <input
              type="number"
              min={1}
              className="lg-input"
              value={ruleForm.priority}
              onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
              placeholder="1"
            />
          </Field>

          <Field label="Description" className="lg-span-2">
            <input
              className="lg-input"
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              placeholder="Context about when this qualification rule should trigger"
            />
          </Field>

          <div className="lg-span-2">
            <label className="lg-label">Additional Lead Criteria (Conditions)</label>
            <ConditionBuilder
              conditions={ruleForm.conditions}
              onChange={(conds) => setRuleForm({ ...ruleForm, conditions: conds })}
              fieldOptions={CONDITION_FIELD_OPTIONS}
              operatorOptions={CONDITION_OPERATOR_OPTIONS}
            />
          </div>

          <div className="lg-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Toggle
              label="Automatically Transition Lead Status"
              description="Automatically update the lead to the target status without waiting for manual rep review."
              checked={ruleForm.autoQualify}
              onChange={(chk) => setRuleForm({ ...ruleForm, autoQualify: chk })}
              id="lg-qual-auto"
            />
            <Toggle
              label="Rule Active"
              checked={ruleForm.isActive}
              onChange={(chk) => setRuleForm({ ...ruleForm, isActive: chk })}
              id="lg-qual-active"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Qualification Rule"
        message="This rule will no longer be evaluated. Current lead statuses are not modified."
        itemName={toDelete?.name}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </LeadGenLayout>
  );
};
