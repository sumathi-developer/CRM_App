import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { leadService } from '../../services/lead.service';
import type { CreateLeadPayload, LeadStatus } from '../../types/lead.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { LeadsLayout } from './components/LeadsLayout';
import { LeadForm } from './components/LeadForm';
import { ArrowLeftIcon, PlusIcon } from '../../components/common/Icons';

export const CreateLeadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { users } = useUserOptions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  const settings = useMemo(() => leadService.getLocalSettings(), []);
  const statusFromUrl = searchParams.get('status') as LeadStatus | null;

  const initialLead = useMemo(
    () => ({
      status: statusFromUrl || settings.defaultStatus || 'NEW',
      source: settings.defaultSource || 'WEBSITE',
      leadScore: 0,
      estimatedValue: 0,
    }),
    [statusFromUrl, settings],
  );

  const handleCreate = async (payload: CreateLeadPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await leadService.createLead(payload);
      navigate(`/leads/${created.id}`, {
        state: { flash: `Lead "${created.title}" created successfully.` },
      });
    } catch (err: any) {
      if (Array.isArray(err?.validationErrors) && err.validationErrors.length > 0) {
        setError(err.validationErrors);
      } else {
        setError(err?.message || 'Failed to create lead. Please check your input.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LeadsLayout
      title="Create Lead"
      subtitle="Add a new inbound or outbound sales lead to the CRM pipeline."
      icon={<PlusIcon size={22} />}
      error={error}
      onDismissError={() => setError(null)}
      breadcrumbs={
        <Link to="/leads" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Leads
        </Link>
      }
    >
      <LeadForm
        initialLead={initialLead}
        users={users}
        isSubmitting={isSubmitting}
        submitLabel="Create Lead"
        cancelPath="/leads"
        onSubmit={handleCreate}
      />
    </LeadsLayout>
  );
};

