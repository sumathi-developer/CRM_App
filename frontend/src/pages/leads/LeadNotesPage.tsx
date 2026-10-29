import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type { Lead } from '../../types/lead.types';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { leadFullName } from './leadConstants';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadNotesSection } from './components/LeadSubsections';
import { ArrowLeftIcon, EditIcon } from '../../components/common/Icons';

export const LeadNotesPage: React.FC = () => {
  const { id: routeLeadId } = useParams<{ id?: string }>();

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
      title={selectedLead ? `Lead Notes — ${selectedLead.title}` : 'Lead Notes'}
      subtitle="Add, search, edit, and manage discovery notes and internal context for leads."
      icon={<EditIcon size={22} />}
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
          <LoadingIndicator size="large" message="Loading lead notes..." />
        </div>
      ) : !selectedLead ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Leads Available"
            description="Create a lead first to attach and manage notes."
            action={
              <Link to="/leads/create" className="auth-btn btn-primary">
                Create Lead
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="lg-card ld-lead-picker-bar">
            <label htmlFor="notes-lead-picker" className="lg-label">
              Active Lead Workspace:
            </label>
            <select
              id="notes-lead-picker"
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

          <LeadNotesSection
            leadId={selectedLead.id}
            onChanged={(msg) => {
              if (msg) setSuccess(msg);
            }}
          />
        </>
      )}
    </LeadsLayout>
  );
};

