import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type { Lead } from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { leadFullName } from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadActivitiesSection, LeadTimelineSection } from './components/LeadSubsections';
import { ActivityIcon, ArrowLeftIcon } from '../../components/common/Icons';

export const LeadActivitiesPage: React.FC = () => {
  const { id: routeLeadId } = useParams<{ id?: string }>();
  const { users } = useUserOptions();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, singleRes] = await Promise.all([
        leadService.getLeads({ limit: 50 }),
        routeLeadId ? leadService.getLeadById(routeLeadId).catch(() => null) : Promise.resolve(null),
      ]);
      const items = listRes.data || [];
      setLeads(items);
      const active = singleRes || items.find((l) => l.id === routeLeadId) || items[0] || null;
      setSelectedLead(active);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads.');
    } finally {
      setIsLoading(false);
    }
  }, [routeLeadId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectLeadId = async (newId: string) => {
    const found = leads.find((l) => l.id === newId);
    if (found) {
      setSelectedLead(found);
      return;
    }
    try {
      const full = await leadService.getLeadById(newId);
      setSelectedLead(full);
    } catch (err: any) {
      setError(err?.message || 'Failed to load selected lead.');
    }
  };

  return (
    <LeadsLayout
      title={selectedLead ? `Lead Activities — ${selectedLead.title}` : 'Lead Activities'}
      subtitle="Log and track calls, emails, meetings, WhatsApp messages,follow-ups, and timeline history."
      icon={<ActivityIcon size={22} />}
      activeLead={selectedLead}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to={selectedLead ? `/leads/${selectedLead.id}` : '/leads'} className="lg-link-btn">
          <ArrowLeftIcon size={14} /> {selectedLead ? 'Back to Lead Details' : 'Back to All Leads'}
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead activities..." />
        </div>
      ) : !selectedLead ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Leads Available"
            description="Create a lead first to log and track activities."
            action={
              <Link to="/leads/create" className="auth-btn btn-primary">
                Create Lead
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Lead Selector Strip */}
          <div className="lg-card ld-lead-picker-bar">
            <label htmlFor="activities-lead-picker" className="lg-label">
              Active Lead Workspace:
            </label>
            <select
              id="activities-lead-picker"
              className="lg-select ld-lead-picker-select"
              value={selectedLead.id}
              onChange={(e) => handleSelectLeadId(e.target.value)}
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} — {leadFullName(l)} ({l.companyName || l.email})
                </option>
              ))}
            </select>
            <Link to={`/leads/${selectedLead.id}`} className="auth-btn btn-secondary">
              View Lead Profile
            </Link>
          </div>

          <LeadActivitiesSection
            leadId={selectedLead.id}
            users={users}
            onChanged={(msg) => {
              if (msg) setSuccess(msg);
            }}
          />

          <LeadTimelineSection leadId={selectedLead.id} />
        </>
      )}
    </LeadsLayout>
  );
};
