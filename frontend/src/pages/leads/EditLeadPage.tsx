import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type { CreateLeadPayload, Lead } from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadForm } from './components/LeadForm';
import { ArrowLeftIcon, EditIcon } from '../../components/common/Icons';

export const EditLeadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users } = useUserOptions();

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await leadService.getLeadById(id);
        if (!ignore) setLead(data);
      } catch (err: any) {
        if (!ignore) setError(err?.message || 'Failed to load lead details.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleUpdate = async (payload: CreateLeadPayload) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await leadService.updateLead(id, payload);
      navigate(`/leads/${updated.id}`, {
        state: { flash: `Lead "${updated.title}" updated successfully.` },
      });
    } catch (err: any) {
      if (Array.isArray(err?.validationErrors) && err.validationErrors.length > 0) {
        setError(err.validationErrors);
      } else {
        setError(err?.message || 'Failed to update lead.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LeadsLayout
      title={lead ? `Edit Lead — ${lead.title}` : 'Edit Lead'}
      subtitle="Update contact information, qualification status, score, value, and assigned owner."
      icon={<EditIcon size={22} />}
      activeLead={lead}
      error={error}
      onDismissError={() => setError(null)}
      breadcrumbs={
        <Link to={id ? `/leads/${id}` : '/leads'} className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to Lead Details
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading lead record..." />
        </div>
      ) : !lead ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Lead Not Found"
            description="The requested lead could not be found or may have been deleted."
            action={
              <Link to="/leads" className="auth-btn btn-primary">
                Return to All Leads
              </Link>
            }
          />
        </div>
      ) : (
        <LeadForm
          initialLead={lead}
          users={users}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
          cancelPath={`/leads/${lead.id}`}
          onSubmit={handleUpdate}
        />
      )}
    </LeadsLayout>
  );
};

