import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactService } from '../../services/contact.service';
import type { Contact } from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { contactFullName, getContactPermissions } from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import {
  ContactActivitiesSection,
  ContactTimelineSection,
} from './components/ContactSubsections';
import { ActivityIcon, ArrowLeftIcon } from '../../components/common/Icons';

export const ContactActivitiesPage: React.FC = () => {
  const { id: routeContactId } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const permissions = useMemo(() => getContactPermissions(currentUser), [currentUser]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, singleRes] = await Promise.all([
        contactService.getContacts({ limit: 50 }),
        routeContactId
          ? contactService.getContactById(routeContactId).catch(() => null)
          : Promise.resolve(null),
      ]);
      const items = listRes.data || [];
      setContacts(items);
      const active =
        singleRes || items.find((c) => c.id === routeContactId) || items[0] || null;
      setSelectedContact(active);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, [routeContactId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectContactId = async (newId: string) => {
    const found = contacts.find((c) => c.id === newId);
    if (found) {
      setSelectedContact(found);
      return;
    }
    try {
      const full = await contactService.getContactById(newId);
      setSelectedContact(full);
    } catch (err: any) {
      setError(err?.message || 'Failed to load selected contact.');
    }
  };

  return (
    <ContactsLayout
      title={
        selectedContact
          ? `Contact Activities — ${contactFullName(selectedContact)}`
          : 'Contact Activities'
      }
      subtitle="Log and track calls, emails, meetings, WhatsApp messages, follow-ups, and chronological timeline history."
      icon={<ActivityIcon size={22} />}
      activeContact={selectedContact}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link
          to={selectedContact ? `/contacts/${selectedContact.id}` : '/contacts'}
          className="lg-link-btn"
        >
          <ArrowLeftIcon size={14} />{' '}
          {selectedContact ? 'Back to Contact Details' : 'Back to All Contacts'}
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading contact activities..." />
        </div>
      ) : !selectedContact ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="No Contacts Available"
            description="Create a contact first to log and track activities."
            action={
              <Link to="/contacts/create" className="auth-btn btn-primary">
                Create Contact
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="lg-card ld-lead-picker-bar">
            <label htmlFor="activities-contact-picker" className="lg-label">
              Active Contact Workspace:
            </label>
            <select
              id="activities-contact-picker"
              className="lg-select ld-lead-picker-select"
              value={selectedContact.id}
              onChange={(e) => handleSelectContactId(e.target.value)}
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contactFullName(c)} — {c.organization?.name || c.email}
                </option>
              ))}
            </select>
            <Link to={`/contacts/${selectedContact.id}`} className="auth-btn btn-secondary">
              View Contact Profile
            </Link>
          </div>

          <ContactActivitiesSection
            contactId={selectedContact.id}
            users={users}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
            onChanged={(msg) => {
              if (msg) setSuccess(msg);
            }}
          />

          <ContactTimelineSection contactId={selectedContact.id} />
        </>
      )}
    </ContactsLayout>
  );
};

