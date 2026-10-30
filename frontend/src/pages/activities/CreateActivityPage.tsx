import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import type {
  ActivityItemType,
  CreateActivityRecordPayload,
  UpdateActivityRecordPayload,
} from '../../types/activity.types';
import { ActivitiesLayout } from './components/ActivitiesLayout';
import { ActivityForm } from './components/ActivityForm';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const CreateActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedType =
    (searchParams.get('type') as ActivityItemType) || undefined;
  const preselectedLeadId = searchParams.get('leadId') || undefined;
  const preselectedContactId = searchParams.get('contactId') || undefined;
  const preselectedDealId = searchParams.get('dealId') || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (
    payload: CreateActivityRecordPayload | UpdateActivityRecordPayload,
  ) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const created = await activityService.createActivityRecord(
        payload as CreateActivityRecordPayload,
      );
      navigate(`/activities/${created.id}?source=${created.recordSource}`);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to create activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ActivitiesLayout
      title="Create Activity"
      subtitle="Schedule a call, meeting, follow-up, email, or task and link it to a Lead, Contact, or Deal."
      actions={
        <Link to="/activities" className="auth-btn btn-secondary btn-size-small">
          <ArrowLeftIcon size={15} /> Back to Activities
        </Link>
      }
    >
      <ActivityForm
        mode="create"
        preselectedType={preselectedType}
        preselectedLeadId={preselectedLeadId}
        preselectedContactId={preselectedContactId}
        preselectedDealId={preselectedDealId}
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/activities')}
      />
    </ActivitiesLayout>
  );
};

export default CreateActivityPage;

