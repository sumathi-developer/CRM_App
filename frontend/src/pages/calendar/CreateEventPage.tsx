import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { calendarService } from '../../services/calendar.service';
import type {
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
} from '../../types/calendar.types';
import { CalendarLayout } from './components/CalendarLayout';
import { CalendarEventForm } from './components/CalendarEventForm';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDate = searchParams.get('date') || undefined;
  const preselectedType = searchParams.get('type') || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (
    payload: CreateCalendarEventPayload | UpdateCalendarEventPayload,
  ) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const created = await calendarService.scheduleEvent(
        payload as CreateCalendarEventPayload,
      );
      navigate(`/calendar/events/${created.id}?category=${created.category}`);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to schedule calendar event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CalendarLayout
      title="Create Event"
      subtitle="Schedule a meeting, call, follow-up, email, or task on the CRM calendar."
      actions={
        <Link to="/calendar" className="auth-btn btn-secondary btn-size-small">
          <ArrowLeftIcon size={15} /> Back to Calendar
        </Link>
      }
    >
      <CalendarEventForm
        mode="create"
        preselectedDate={preselectedDate}
        preselectedType={preselectedType}
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/calendar')}
      />
    </CalendarLayout>
  );
};

export default CreateEventPage;

