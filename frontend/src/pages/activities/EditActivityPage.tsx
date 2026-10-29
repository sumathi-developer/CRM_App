import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import type {
  ActivityRecord,
  ActivityRecordSource,
  UpdateActivityRecordPayload,
} from '../../types/activity.types';
import { ActivitiesLayout } from './components/ActivitiesLayout';
import { ActivityForm } from './components/ActivityForm';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const EditActivityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam =
    (searchParams.get('source') as ActivityRecordSource) || undefined;

  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await activityService.getActivityById(id, sourceParam);
      setActivity(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load activity details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, sourceParam]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleSubmit = async (payload: UpdateActivityRecordPayload) => {
    if (!id || !activity) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      await activityService.updateActivityRecord(
        id,
        payload,
        activity.recordSource,
      );
      navigate(`/activities/${id}?source=${activity.recordSource}`);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to update activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ActivitiesLayout
      title={activity ? `Edit Activity — ${activity.subject}` : 'Edit Activity'}
      subtitle="Update activity type, due date, completion status, priority, assignee, or linked CRM records."
      activeActivity={activity}
      error={loadError}
      onDismissError={() => setLoadError(null)}
      actions={
        <Link
          to={
            activity
              ? `/activities/${activity.id}?source=${activity.recordSource}`
              : '/activities'
          }
          className="auth-btn btn-secondary btn-size-small"
        >
          <ArrowLeftIcon size={15} /> Back to Activity Details
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading activity record..." />
        </div>
      ) : !activity ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Activity Not Found"
            description="The activity you are trying to edit could not be found."
            action={
              <Link to="/activities" className="auth-btn btn-primary">
                Return to All Activities
              </Link>
            }
          />
        </div>
      ) : (
        <ActivityForm
          mode="edit"
          initialActivity={activity}
          isSubmitting={isSubmitting}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(`/activities/${activity.id}?source=${activity.recordSource}`)
          }
        />
      )}
    </ActivitiesLayout>
  );
};

export default EditActivityPage;

