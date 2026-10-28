import React, { useCallback, useState } from 'react';
import { leadGenerationService } from '../../services/lead-generation.service';
import type {
  AssignmentRule,
  AssignmentRulePayload,
  AssignmentRuleCondition,
  RoutingStrategy,
  RuleQuery,
} from '../../types/lead-generation.types';
import { LeadGenLayout } from './components/LeadGenLayout';
import { DataTable, type Column } from './components/DataTable';
import { Pagination } from './components/Pagination';
import { FilterBar, FilterSelect } from './components/FilterBar';
import { Badge } from './components/Cards';
import { Field, FormModal, Toggle, ConditionBuilder, type ConditionRow } from './components/FormParts';
import { ConfirmDeleteModal } from '../../components/workspace/ConfirmDeleteModal';
import { useAsyncData, useLeadGenAccess, useUserOptions } from './leadGenHooks';
import {
  ROUTING_STRATEGY_OPTIONS,
  CONDITION_FIELD_OPTIONS,
  CONDITION_OPERATOR_OPTIONS,
  labelFor,
} from './leadGenConstants';
import {
  SendIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from '../../components/common/Icons';

const PAGE_SIZE = 10;

interface RuleFormState {
  name: string;
  description: string;
  routingStrategy: RoutingStrategy;
  targetUserIds: string[];
  conditions: ConditionRow[];
  isActive: boolean;
  priority: string;
}

const EMPTY_RULE_FORM: RuleFormState = {
  name: '',
  description: '',
  routingStrategy: 'ROUND_ROBIN',
  targetUserIds: [],
  conditions: [],
  isActive: true,
  priority: '1',
};

export const AssignmentRulesPage: React.FC = () => {
  const { workspaceId, canManage } = useLeadGenAccess();
  const { users } = useUserOptions();

  const [strategy, setStrategy] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal / form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [toDelete, setToDelete] = useState<AssignmentRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loader = useCallback(() => {
    const isActive = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
    const query: RuleQuery = {
      page,
      limit: PAGE_SIZE,
      strategy: strategy || undefined,
      isActive,
      workspaceId,
    };
    return leadGenerationService.getAssignmentRules(query);
  }, [page, strategy, activeFilter, workspaceId]);

  const { data, isLoading, error, reload, clearError } = useAsyncData(loader);
  const hasFilters = Boolean(strategy || activeFilter);

  const openCreateModal = () => {
    setEditingRule(null);
    setRuleForm({
      ...EMPTY_RULE_FORM,
      targetUserIds: users.length > 0 ? [users[0].id] : [],
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (rule: AssignmentRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      routingStrategy: rule.routingStrategy,
      targetUserIds: rule.targetUserIds || [],
      conditions: (rule.conditions || []).map((c) => ({
        field: c.field,
        operator: c.operator,
        value: String(c.value ?? ''),
      })),
      isActive: rule.isActive ?? true,
      priority: String(rule.priority ?? 1),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    setRuleForm((prev) => {
      const exists = prev.targetUserIds.includes(userId);
      const next = exists ? prev.targetUserIds.filter((id) => id !== userId) : [...prev.targetUserIds, userId];
      return { ...prev, targetUserIds: next };
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!ruleForm.name.trim()) errs.name = 'Rule name is required.';
    if (ruleForm.targetUserIds.length === 0) {
      errs.targetUsers = 'Select at least one sales rep / user to receive assigned leads.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setActionError(null);

    const conditions: AssignmentRuleCondition[] = ruleForm.conditions.map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.operator === 'NOT_EMPTY' ? '' : c.value,
    }));

    const payload: AssignmentRulePayload = {
      name: ruleForm.name.trim(),
      description: ruleForm.description.trim() || undefined,
      routingStrategy: ruleForm.routingStrategy,
      targetUserIds: ruleForm.targetUserIds,
      conditions: conditions.length > 0 ? conditions : undefined,
      isActive: ruleForm.isActive,
      priority: Number(ruleForm.priority) || 1,
      workspaceId,
    };

    try {
      if (editingRule) {
        await leadGenerationService.updateAssignmentRule(editingRule.id, payload);
        setActionSuccess('Assignment rule updated successfully.');
      } else {
        await leadGenerationService.createAssignmentRule(payload);
        setActionSuccess('Assignment rule created successfully.');
      }
      setModalOpen(false);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save assignment rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: AssignmentRule) => {
    setActionError(null);
    try {
      await leadGenerationService.updateAssignmentRule(rule.id, { isActive: !rule.isActive });
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
      const res = await leadGenerationService.deleteAssignmentRule(toDelete.id);
      setActionSuccess(res?.message || 'Assignment rule deleted.');
      setToDelete(null);
      reload();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete assignment rule.');
      setToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<AssignmentRule>[] = [
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
      key: 'strategy',
      header: 'Routing Strategy',
      render: (r) => <Badge tone="blue">{labelFor(ROUTING_STRATEGY_OPTIONS, r.routingStrategy)}</Badge>,
    },
    {
      key: 'targets',
      header: 'Assigned Pool',
      render: (r) => {
        const count = r.targetUserIds?.length || 0;
        return (
          <div className="lg-cell-stack">
            <span>{count} rep(s) assigned</span>
            <span className="lg-cell-sub">
              {users
                .filter((u) => r.targetUserIds?.includes(u.id))
                .map((u) => u.name)
                .slice(0, 2)
                .join(', ') || 'No users'}
              {count > 2 ? ` +${count - 2} more` : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'conditions',
      header: 'Conditions',
      align: 'center',
      render: (r) => (r.conditions?.length ? `${r.conditions.length} condition(s)` : 'All leads'),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'right',
      render: (r) => r.priority ?? 1,
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
      title="Lead Assignment Rules"
      subtitle="Automate lead distribution across sales representatives with round-robin, load-balanced, or attribute-based routing."
      icon={<SendIcon size={22} />}
      error={actionError || error}
      onDismissError={() => {
        setActionError(null);
        clearError();
      }}
      success={actionSuccess}
      onDismissSuccess={() => setActionSuccess(null)}
      actions={
        canManage && (
          <button type="button" className="auth-btn btn-primary" onClick={openCreateModal} id="lg-create-assign-rule-btn">
            <PlusIcon size={16} />
            <span>New Assignment Rule</span>
          </button>
        )
      }
    >
      <FilterBar
        onRefresh={reload}
        hasActiveFilters={hasFilters}
        onReset={() => {
          setStrategy('');
          setActiveFilter('');
          setPage(1);
        }}
      >
        <FilterSelect
          id="lg-assign-strat"
          label="Strategy"
          value={strategy}
          options={ROUTING_STRATEGY_OPTIONS}
          allLabel="All strategies"
          onChange={(v) => {
            setStrategy(v);
            setPage(1);
          }}
        />
        <FilterSelect
          id="lg-assign-active"
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
        loadingMessage="Loading assignment rules..."
        emptyIcon={<SendIcon size={28} />}
        emptyTitle={hasFilters ? 'No matching assignment rules' : 'No assignment rules configured'}
        emptyDescription="Set up assignment rules to distribute incoming leads to your sales reps without manual intervention."
        emptyAction={
          !hasFilters && canManage ? (
            <button type="button" className="auth-btn btn-primary" onClick={openCreateModal}>
              <PlusIcon size={16} />
              <span>Create assignment rule</span>
            </button>
          ) : undefined
        }
        footer={<Pagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} noun="rules" />}
      />

      {/* Create / Edit Rule Modal */}
      <FormModal
        isOpen={modalOpen}
        title={editingRule ? 'Edit Assignment Rule' : 'New Assignment Rule'}
        subtitle="Configure the strategy and target sales rep pool for this rule."
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        isSaving={isSaving}
        submitLabel={editingRule ? 'Save Changes' : 'Create Rule'}
        error={formErrors.name || formErrors.targetUsers}
        wide
      >
        <div className="lg-form-grid">
          <Field label="Rule Name" required error={formErrors.name} className="lg-span-2">
            <input
              className="lg-input"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. Inbound Website Leads — Round Robin"
            />
          </Field>

          <Field label="Distribution Strategy" required>
            <select
              className="lg-select"
              value={ruleForm.routingStrategy}
              onChange={(e) => setRuleForm({ ...ruleForm, routingStrategy: e.target.value as RoutingStrategy })}
            >
              {ROUTING_STRATEGY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Priority (Highest runs first)">
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
              placeholder="Notes on which team or territory receives these leads"
            />
          </Field>

          {/* Target users multi-select pool */}
          <div className="lg-span-2">
            <label className="lg-label">
              Assigned Sales Reps Pool ({ruleForm.targetUserIds.length} selected)
              <span className="lg-required">*</span>
            </label>
            {formErrors.targetUsers && (
              <span className="lg-field-error" style={{ display: 'block', marginBottom: '0.5rem' }}>
                {formErrors.targetUsers}
              </span>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.5rem',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              }}
            >
              {users.map((u) => {
                const isSelected = ruleForm.targetUserIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUserSelection(u.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="lg-span-2">
            <label className="lg-label">Matching Criteria (Conditions)</label>
            <ConditionBuilder
              conditions={ruleForm.conditions}
              onChange={(conds) => setRuleForm({ ...ruleForm, conditions: conds })}
              fieldOptions={CONDITION_FIELD_OPTIONS}
              operatorOptions={CONDITION_OPERATOR_OPTIONS}
            />
          </div>

          <div className="lg-span-2">
            <Toggle
              label="Rule Active"
              description="Active rules are evaluated in priority sequence on incoming leads."
              checked={ruleForm.isActive}
              onChange={(chk) => setRuleForm({ ...ruleForm, isActive: chk })}
              id="lg-assign-active-toggle"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDeleteModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Assignment Rule"
        message="Incoming leads will fall back to other active assignment rules or default pool."
        itemName={toDelete?.name}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </LeadGenLayout>
  );
};
