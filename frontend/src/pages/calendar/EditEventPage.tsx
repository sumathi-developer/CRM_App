import React, { useCallback, useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { calendarService } from '../../services/calendar.service';
import type {
  CalendarEventCategory,
  CalendarEventItem,
  UpdateCalendarEventPayload,
} from '../../types/calendar.types';
import { CalendarLayout } from './components/CalendarLayout';
import { CalendarEventForm } from './components/CalendarEventForm';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam =
    (searchParams.get('category') as CalendarEventCategory) || undefined;

  const [event, setEvent] = useState<CalendarEventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await calendarService.getEventById(id, categoryParam);
      setEvent(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load calendar event.');
    } finally {
      setIsLoading(false);
    }
  }, [id, categoryParam]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleSubmit = async (payload: UpdateCalendarEventPayload) => {
    if (!id || !event) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      await calendarService.updateEvent(id, payload, event.category);
      navigate(`/calendar/events/${id}?category=${event.category}`);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to update calendar event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CalendarLayout
      title={event ? `Edit Event — ${event.title}` : 'Edit Event'}
      subtitle="Update scheduled start/end time, priority, reminder alert, status, or linked CRM records."
      activeEvent={event}
      error={loadError}
      onDismissError={() => setLoadError(null)}
      actions={
        <Link
          to={
            event
              ? `/calendar/events/${event.id}?category=${event.category}`
              : '/calendar'
          }
          className="auth-btn btn-secondary btn-size-small"
        >
          <ArrowLeftIcon size={15} /> Back to Event Details
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading event details..." />
        </div>
      ) : !event ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Event Not Found"
            description="The calendar event you are trying to edit could not be found."
            action={
              <Link to="/calendar" className="auth-btn btn-primary">
                Return to Calendar
              </Link>
            }
          />
        </div>
      ) : (
        <CalendarEventForm
          mode="edit"
          initialEvent={event}
          isSubmitting={isSubmitting}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(`/calendar/events/${event.id}?category=${event.category}`)
          }
        />
      )}
    </CalendarLayout>
  );
};

export default EditEventPage;

