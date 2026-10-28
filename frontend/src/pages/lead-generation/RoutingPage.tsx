import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadGenerationService } from '../../services/lead-generation.service';
import { LeadGenLayout } from './components/LeadGenLayout';
import { Field } from './components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { Badge } from './components/Cards';
import { useAsyncData, useLeadGenAccess, useUserOptions } from './leadGenHooks';
import { ROUTING_STRATEGY_OPTIONS, labelFor } from './leadGenConstants';
import {
  SendIcon,
  CheckCircleIcon,
  SlidersIcon,
} from '../../components/common/Icons';

export const RoutingPage: React.FC = () => {
  const { workspaceId } = useLeadGenAccess();
  const { users } = useUserOptions();

  // Load active assignment rules
  const rulesLoader = useCallback(async () => {
    return leadGenerationService.getAssignmentRules({ isActive: true, limit: 50, workspaceId });
  }, [workspaceId]);

  const { data: rulesData, isLoading: loadingRules } = useAsyncData(rulesLoader);
  const rules = rulesData?.data || [];

  // Individual Lead Routing state
  const [singleLeadId, setSingleLeadId] = useState('');
  const [singleTargetType, setSingleTargetType] = useState<'rule' | 'user'>('rule');
  const [singleRuleId, setSingleRuleId] = useState('');
  const [singleUserId, setSingleUserId] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<any | null>(null);

  // Bulk Routing state
  const [bulkLeadIdsText, setBulkLeadIdsText] = useState('');
  const [bulkTargetType, setBulkTargetType] = useState<'rule' | 'owner'>('rule');
  const [bulkRuleId, setBulkRuleId] = useState('');
  const [bulkOwnerId, setBulkOwnerId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  // Set initial selections when rules / users load
  useEffect(() => {
    if (rules.length > 0) {
      if (!singleRuleId) setSingleRuleId(rules[0].id);
      if (!bulkRuleId) setBulkRuleId(rules[0].id);
    }
  }, [rules, singleRuleId, bulkRuleId]);

  useEffect(() => {
    if (users.length > 0) {
      if (!singleUserId) setSingleUserId(users[0].id);
      if (!bulkOwnerId) setBulkOwnerId(users[0].id);
    }
  }, [users, singleUserId, bulkOwnerId]);

  const handleRouteSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleLeadId.trim()) {
      setSingleError('Please provide a valid Lead ID to route.');
      return;
    }

    setSingleLoading(true);
    setSingleError(null);
    setSingleResult(null);

    try {
      const payload =
        singleTargetType === 'rule'
          ? { ruleId: singleRuleId || undefined }
          : { targetUserId: singleUserId || undefined };

      const res = await leadGenerationService.routeLead(singleLeadId.trim(), payload);
      setSingleResult(res);
    } catch (err: any) {
      setSingleError(err?.message || 'Failed to route lead. Please verify the Lead ID.');
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = bulkLeadIdsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      setBulkError('Please enter at least one Lead ID.');
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);

    try {
      const payload = {
        leadIds: ids,
        ...(bulkTargetType === 'owner' ? { ownerId: bulkOwnerId } : { ruleId: bulkRuleId }),
      };

      const res = await leadGenerationService.bulkAssign(payload);
      setBulkResult(res);
      setBulkLeadIdsText('');
    } catch (err: any) {
      setBulkError(err?.message || 'Failed to bulk assign leads.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <LeadGenLayout
      title="Lead Routing"
      subtitle="Manually trigger routing rules or bulk-assign leads directly to sales representatives."
      icon={<SendIcon size={22} />}
      actions={
        <Link to="/lead-generation/assignment-rules" className="auth-btn btn-ghost">
          <SlidersIcon size={16} />
          <span>Configure Assignment Rules</span>
        </Link>
      }
    >
      <div className="lg-grid-2">
        {/* Section 1: Route Individual Lead */}
        <div className="lg-card lg-section-card">
          <h2 className="lg-section-title">Route Individual Lead</h2>
          <p className="lg-section-subtitle">
            Re-evaluate assignment rules or dispatch a specific lead to a sales rep.
          </p>

          <form onSubmit={handleRouteSingle} noValidate style={{ marginTop: '1rem' }}>
            {singleError && (
              <div className="lg-inline-alert" role="alert" style={{ marginBottom: '1rem' }}>
                {singleError}
              </div>
            )}

            <Field label="Target Lead ID" required hint="Paste the UUID of the lead to route">
              <input
                className="lg-input"
                value={singleLeadId}
                onChange={(e) => setSingleLeadId(e.target.value)}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                disabled={singleLoading}
              />
            </Field>

            <div style={{ display: 'flex', gap: '1rem', margin: '0.75rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="singleTargetType"
                  value="rule"
                  checked={singleTargetType === 'rule'}
                  onChange={() => setSingleTargetType('rule')}
                />
                Apply Assignment Rule
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="singleTargetType"
                  value="user"
                  checked={singleTargetType === 'user'}
                  onChange={() => setSingleTargetType('user')}
                />
                Specific User
              </label>
            </div>

            {singleTargetType === 'rule' ? (
              <Field label="Assignment Rule to Apply">
                <select
                  className="lg-select"
                  value={singleRuleId}
                  onChange={(e) => setSingleRuleId(e.target.value)}
                  disabled={singleLoading || rules.length === 0}
                >
                  {rules.length === 0 ? (
                    <option value="">No active rules found</option>
                  ) : (
                    rules.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({labelFor(ROUTING_STRATEGY_OPTIONS, r.routingStrategy)})
                      </option>
                    ))
                  )}
                </select>
              </Field>
            ) : (
              <Field label="Target Sales Representative">
                <select
                  className="lg-select"
                  value={singleUserId}
                  onChange={(e) => setSingleUserId(e.target.value)}
                  disabled={singleLoading}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <PrimaryButton
                type="submit"
                fullWidth={false}
                isLoading={singleLoading}
                loadingText="Routing Lead..."
                id="lg-route-single-btn"
              >
                Execute Route
              </PrimaryButton>
            </div>

            {singleResult && (
              <div
                className="lg-card"
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderLeft: '3px solid #22c55e',
                  background: 'rgba(34, 197, 94, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CheckCircleIcon size={18} style={{ color: '#22c55e' }} />
                  <strong>Lead Routed Successfully</strong>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {singleResult.assignedTo && (
                    <div>Assigned To: {singleResult.assignedTo.name || singleResult.assignedTo.email}</div>
                  )}
                  {singleResult.reason && <div>Routing Reason: {singleResult.reason}</div>}
                  {singleResult.message && <div style={{ color: 'var(--text-muted)' }}>{singleResult.message}</div>}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Section 2: Bulk Lead Assignment */}
        <div className="lg-card lg-section-card">
          <h2 className="lg-section-title">Bulk Lead Assignment</h2>
          <p className="lg-section-subtitle">
            Assign multiple leads at once by pasting their IDs.
          </p>

          <form onSubmit={handleBulkAssign} noValidate style={{ marginTop: '1rem' }}>
            {bulkError && (
              <div className="lg-inline-alert" role="alert" style={{ marginBottom: '1rem' }}>
                {bulkError}
              </div>
            )}

            <Field
              label="Lead IDs"
              required
              hint="Enter multiple IDs separated by commas or newlines"
            >
              <textarea
                className="lg-textarea"
                rows={4}
                value={bulkLeadIdsText}
                onChange={(e) => setBulkLeadIdsText(e.target.value)}
                placeholder="550e8400-e29b-41d4-a716-446655440000,&#10;734f9211-f12b-41d4-a716-224455440011"
                disabled={bulkLoading}
              />
            </Field>

            <div style={{ display: 'flex', gap: '1rem', margin: '0.75rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="bulkTargetType"
                  value="rule"
                  checked={bulkTargetType === 'rule'}
                  onChange={() => setBulkTargetType('rule')}
                />
                Distribute via Rule
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="bulkTargetType"
                  value="owner"
                  checked={bulkTargetType === 'owner'}
                  onChange={() => setBulkTargetType('owner')}
                />
                Direct Assignee
              </label>
            </div>

            {bulkTargetType === 'rule' ? (
              <Field label="Assignment Rule">
                <select
                  className="lg-select"
                  value={bulkRuleId}
                  onChange={(e) => setBulkRuleId(e.target.value)}
                  disabled={bulkLoading || rules.length === 0}
                >
                  {rules.length === 0 ? (
                    <option value="">No active rules found</option>
                  ) : (
                    rules.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({labelFor(ROUTING_STRATEGY_OPTIONS, r.routingStrategy)})
                      </option>
                    ))
                  )}
                </select>
              </Field>
            ) : (
              <Field label="Direct Assignee">
                <select
                  className="lg-select"
                  value={bulkOwnerId}
                  onChange={(e) => setBulkOwnerId(e.target.value)}
                  disabled={bulkLoading}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <PrimaryButton
                type="submit"
                fullWidth={false}
                isLoading={bulkLoading}
                loadingText="Bulk Assigning..."
                id="lg-bulk-assign-btn"
              >
                Assign Leads in Bulk
              </PrimaryButton>
            </div>

            {bulkResult && (
              <div
                className="lg-card"
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderLeft: '3px solid #22c55e',
                  background: 'rgba(34, 197, 94, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CheckCircleIcon size={18} style={{ color: '#22c55e' }} />
                  <strong>Bulk Assignment Complete</strong>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {bulkResult.message || 'Leads were assigned successfully.'}
                  {bulkResult.count !== undefined && <div>Updated Leads: {bulkResult.count}</div>}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Section 3: Active Routing Order Overview */}
      <div className="lg-card lg-section-card" style={{ marginTop: '2rem' }}>
        <div className="lg-section-head">
          <div>
            <h2 className="lg-section-title">Active Assignment Priority Sequence</h2>
            <p className="lg-section-subtitle">
              Incoming leads are matched against active rules in priority order.
            </p>
          </div>
          <Link to="/lead-generation/assignment-rules" className="lg-link-btn">
            Manage Rules &rarr;
          </Link>
        </div>

        {loadingRules ? (
          <p className="lg-muted">Loading active routing sequence...</p>
        ) : rules.length === 0 ? (
          <p className="lg-muted">
            No active assignment rules. All incoming leads will remain unassigned or route to default owners.
          </p>
        ) : (
          <div className="lg-cell-stack">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3b82f6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rule.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Strategy: {labelFor(ROUTING_STRATEGY_OPTIONS, rule.routingStrategy)} &bull;{' '}
                      {rule.targetUserIds?.length || 0} Rep(s) in pool
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge tone="blue">Priority: {rule.priority ?? 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LeadGenLayout>
  );
};
