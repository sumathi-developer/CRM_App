import React, { useCallback, useState } from 'react';
import { leadGenerationService } from '../../services/lead-generation.service';
import type {
  ScoringCategory,
  RuleOperator,
  ScoringRule,
  ScoringRulePayload,
  RuleQuery,
  ScorePreviewResult,
} from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { DataTable, type Column } from './components/DataTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect } from './components/FilterBar';
import { Badge, ScorePill } from './components/Cards';
import { Field, FormModal, Toggle } from './components/FormParts';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { useAsyncData, useLeadGenAccess } from './leadGenHooks';
import {
  SCORING_CATEGORY_OPTIONS,
  SCORING_FIELD_OPTIONS,
  OPERATOR_OPTIONS,
  labelFor,
  humanize,
} from './leadGenConstants';
import {
  AwardIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SparklesIcon,
} from '../../components/common/Icons';

const PAGE_SIZE = 10;

interface RuleFormState {
  name: string;
  description: string;
  category: ScoringCategory;
  conditionField: string;
  operator: RuleOperator;
  conditionValue: string;
  scoreChange: string;
  isActive: boolean;
  priority: string;
}

const EMPTY_RULE_FORM: RuleFormState = {
  name: '',
  description: '',
  category: 'DEMOGRAPHIC',
  conditionField: 'jobTitle',
  operator: 'CONTAINS',
  conditionValue: '',
  scoreChange: '10',
  isActive: true,
  priority: '1',
};

export const ScoringPage: React.FC = () => {
  const { workspaceId, canManage } = useLeadGenAccess();

  const [category, setCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal / form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [toDelete, setToDelete] = useState<ScoringRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action status
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Simulator state
  const [simLead, setSimLead] = useState({
    jobTitle: 'VP of Engineering',
    companyName: 'Acme Corp',
    email: 'vp@acme.com',
    estimatedValue: '50000',
    channel: 'WEBSITE',
  });
  const [simResult, setSimResult] = useState<ScorePreviewResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const loader = useCallback(() => {
    const isActive = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
    const query: RuleQuery = {
      page,
      limit: PAGE_SIZE,
      category: category || undefined,
      isActive,
      workspaceId,
    };
    return leadGenerationService.getScoringRules(query);
  }, [page, category, activeFilter, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);
  const hasFilters = Boolean(category || activeFilter);

  const openCreateModal = () => {
    setEditingRule(null);
    setRuleForm(EMPTY_RULE_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (rule: ScoringRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      category: rule.category,
      conditionField: rule.conditionField,
      operator: rule.operator,
      conditionValue: rule.conditionValue || '',
      scoreChange: String(rule.scoreChange),
      isActive: rule.isActive,
      priority: String(rule.priority ?? 1),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateRule = (): boolean => {
    const errs: Record<string, string> = {};
    if (!ruleForm.name.trim()) errs.name = 'Rule name is required.';
    if (ruleForm.operator !== 'NOT_EMPTY' && !ruleForm.conditionValue.trim()) {
      errs.conditionValue = 'Condition value is required.';
    }
    if (ruleForm.scoreChange.trim() === '' || Number.isNaN(Number(ruleForm.scoreChange))) {
      errs.scoreChange = 'Score change must be a valid number (e.g. 15 or -10).';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveRule = async () => {
    if (!validateRule()) return;
    setIsSaving(true);
    setActionError(null);

    const payload: ScoringRulePayload = {
      name: ruleForm.name.trim(),
      description: ruleForm.description.trim() || undefined,
      category: ruleForm.category,
      conditionField: ruleForm.conditionField,
      operator: ruleForm.operator,
      conditionValue: ruleForm.operator === 'NOT_EMPTY' ? '' : ruleForm.conditionValue.trim(),
      scoreChange: Number(ruleForm.scoreChange),
      isActive: ruleForm.isActive,
      priority: Number(ruleForm.priority) || 1,
      workspaceId,
    };

    try {
      if (editingRule) {
        await leadGenerationService.updateScoringRule(editingRule.id, payload);
        setActionSuccess('Scoring rule updated successfully.');
      } else {
        await leadGenerationService.createScoringRule(payload);
        setActionSuccess('Scoring rule created successfully.');
      }
      setModalOpen(false);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save scoring rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: ScoringRule) => {
    setActionError(null);
    try {
      await leadGenerationService.updateScoringRule(rule.id, { isActive: !rule.isActive });
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
      const res = await leadGenerationService.deleteScoringRule(toDelete.id);
      setActionSuccess(res?.message || 'Scoring rule deleted.');
      setToDelete(null);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete scoring rule.');
      setToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const payload: Record<string, any> = {
        jobTitle: simLead.jobTitle,
        companyName: simLead.companyName,
        email: simLead.email,
        channel: simLead.channel,
        estimatedValue: simLead.estimatedValue ? Number(simLead.estimatedValue) : undefined,
      };
      const res = await leadGenerationService.previewScore(payload, workspaceId);
      setSimResult(res);
    } catch (err: any) {
      setSimError(err?.message || 'Failed to simulate score.');
    } finally {
      setIsSimulating(false);
    }
  };

  const columns: Column<ScoringRule>[] = [
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
      key: 'category',
      header: 'Category',
      render: (r) => <Badge tone="blue">{humanize(r.category)}</Badge>,
    },
    {
      key: 'condition',
      header: 'Condition Evaluated',
      render: (r) => (
        <span className="lg-cell-sub" style={{ fontFamily: 'monospace' }}>
          {labelFor(SCORING_FIELD_OPTIONS, r.conditionField)} {labelFor(OPERATOR_OPTIONS, r.operator).toLowerCase()}{' '}
          {r.operator === 'NOT_EMPTY' ? '' : `"${r.conditionValue}"`}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Score Change',
      align: 'right',
      render: (r) => (
        <Badge tone={r.scoreChange >= 0 ? 'green' : 'red'}>
          {r.scoreChange >= 0 ? `+${r.scoreChange}` : r.scoreChange} pts
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Active',
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
      key: 'priority',
      header: 'Priority',
      align: 'right',
      render: (r) => r.priority ?? 1,
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
      title="Lead Scoring"
      subtitle="Configure demographic, behavioral, and source-based scoring rules to prioritize high-intent leads automatically."
      icon={<AwardIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      success={actionSuccess}
      onDismissSuccess={() => setActionSuccess(null)}
      actions={
        canManage && (
          <button type="button" className="auth-btn btn-primary" onClick={openCreateModal} id="lg-create-scoring-rule-btn">
            <PlusIcon size={16} />
            <span>New Scoring Rule</span>
          </button>
        )
      }
    >
      <FilterBar
        onRefresh={reload}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setCategory('');
          setActiveFilter('');
          setPage(1);
        }}
      >
        <FilterSelect
          id="lg-score-cat"
          label="Category"
          value={category}
          options={SCORING_CATEGORY_OPTIONS}
          allLabel="All categories"
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-score-active"
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
        loadingMessage="Loading scoring rules..."
        emptyIcon={<AwardIcon size={28} />}
        emptyTitle={hasFilters ? 'No matching rules' : 'No scoring rules configured'}
        emptyDescription="Create scoring rules to automatically grade incoming leads based on their attributes."
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

      {/* Lead Score Simulator / Tester */}
      <div className="lg-card lg-section-card" style={{ marginTop: '2rem' }}>
        <div className="lg-section-head">
          <div>
            <h2 className="lg-section-title">
              <SparklesIcon size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#f59e0b' }} />
              Live Lead Score Simulator
            </h2>
            <p className="lg-section-subtitle">
              Test how your active scoring rules evaluate a sample lead in real-time.
            </p>
          </div>
          <PrimaryButton
            type="button"
            fullWidth={false}
            isLoading={isSimulating}
            loadingText="Evaluating..."
            onClick={runSimulation}
            id="lg-test-score-btn"
          >
            Calculate Score
          </PrimaryButton>
        </div>

        {simError && (
          <div className="lg-inline-alert" role="alert" style={{ marginBottom: '1rem' }}>
            {simError}
          </div>
        )}

        <div className="lg-grid-2">
          {/* Inputs */}
          <div className="lg-form-grid">
            <Field label="Job Title">
              <input
                className="lg-input"
                value={simLead.jobTitle}
                onChange={(e) => setSimLead({ ...simLead, jobTitle: e.target.value })}
              />
            </Field>
            <Field label="Company Name">
              <input
                className="lg-input"
                value={simLead.companyName}
                onChange={(e) => setSimLead({ ...simLead, companyName: e.target.value })}
              />
            </Field>
            <Field label="Email Address">
              <input
                className="lg-input"
                value={simLead.email}
                onChange={(e) => setSimLead({ ...simLead, email: e.target.value })}
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
          </div>

          {/* Result view */}
          <div className="lg-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Simulation Outcome
            </h4>
            {simResult ? (
              <div className="lg-cell-stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>Total Evaluated Score:</span>
                  <ScorePill score={simResult.totalScore} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Breakdown across {simResult.breakdown?.length || 0} evaluated rules:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {simResult.breakdown?.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        background: b.matched ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        borderLeft: b.matched ? '3px solid #22c55e' : '3px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <strong>{b.ruleName}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{b.reason}</div>
                      </div>
                      <Badge tone={b.matched ? (b.scoreChange >= 0 ? 'green' : 'red') : 'slate'}>
                        {b.matched ? (b.scoreChange >= 0 ? `+${b.scoreChange}` : b.scoreChange) : '0'} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="lg-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                Click "Calculate Score" to test this lead profile against current workspace scoring rules.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rule Create / Edit Modal */}
      <FormModal
        isOpen={modalOpen}
        title={editingRule ? 'Edit Scoring Rule' : 'New Scoring Rule'}
        subtitle="Specify conditions under which points are added or subtracted from a lead."
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveRule}
        isSaving={isSaving}
        submitLabel={editingRule ? 'Save Changes' : 'Create Rule'}
        error={formErrors.name || formErrors.conditionValue || formErrors.scoreChange}
        wide
      >
        <div className="lg-form-grid">
          <Field label="Rule Name" required error={formErrors.name} className="lg-span-2">
            <input
              className="lg-input"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. Executive Title (+20)"
            />
          </Field>

          <Field label="Category" required>
            <select
              className="lg-select"
              value={ruleForm.category}
              onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value as ScoringCategory })}
            >
              {SCORING_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Lead Field to Inspect" required>
            <select
              className="lg-select"
              value={ruleForm.conditionField}
              onChange={(e) => setRuleForm({ ...ruleForm, conditionField: e.target.value })}
            >
              {SCORING_FIELD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Comparison Operator" required>
            <select
              className="lg-select"
              value={ruleForm.operator}
              onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value as RuleOperator })}
            >
              {OPERATOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Condition Value"
            required={ruleForm.operator !== 'NOT_EMPTY'}
            error={formErrors.conditionValue}
            hint={ruleForm.operator === 'IN' ? 'Comma separated list' : undefined}
          >
            <input
              className="lg-input"
              value={ruleForm.operator === 'NOT_EMPTY' ? '' : ruleForm.conditionValue}
              onChange={(e) => setRuleForm({ ...ruleForm, conditionValue: e.target.value })}
              placeholder={ruleForm.operator === 'NOT_EMPTY' ? 'No value needed' : 'e.g. Director, VP, Chief'}
              disabled={ruleForm.operator === 'NOT_EMPTY'}
            />
          </Field>

          <Field label="Score Change (Points)" required error={formErrors.scoreChange} hint="Can be positive or negative">
            <input
              type="number"
              className="lg-input"
              value={ruleForm.scoreChange}
              onChange={(e) => setRuleForm({ ...ruleForm, scoreChange: e.target.value })}
              placeholder="15"
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
              placeholder="Explanation of why this rule awards or deducts points"
            />
          </Field>

          <div className="lg-span-2">
            <Toggle
              label="Rule Active"
              description="When enabled, this rule will automatically evaluate on newly created and updated leads."
              checked={ruleForm.isActive}
              onChange={(chk) => setRuleForm({ ...ruleForm, isActive: chk })}
              id="lg-score-rule-active"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Scoring Rule"
        message="This rule will no longer apply to future lead evaluations. Existing lead scores are preserved."
        itemName={toDelete?.name}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </LeadGenLayout>
  );
};
