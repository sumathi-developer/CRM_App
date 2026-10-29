import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactService } from '../../services/contact.service';
import type {
  Contact,
  ContactOrganization,
  CreateContactPayload,
} from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { EmptyState } from '../../components/common/EmptyState';
import { contactFullName, getContactPermissions } from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import { ContactForm } from './components/ContactForm';
import { ArrowLeftIcon, EditIcon } from '../../components/common/Icons';

export const EditContactPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const navigate = useNavigate();
  const permissions = useMemo(() => getContactPermissions(currentUser), [currentUser]);

  const [contact, setContact] = useState<Contact | null>(null);
  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  const loadContact = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [contactData, orgsData] = await Promise.all([
        contactService.getContactById(id),
        contactService.getOrganizations(),
      ]);
      setContact(contactData);
      setOrganizations(orgsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contact.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleUpdate = async (payload: CreateContactPayload) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await contactService.updateContact(id, payload);
      navigate(`/contacts/${updated.id}`, {
        state: { flash: `Contact "${contactFullName(updated)}" updated successfully.` },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to update contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContactsLayout
      title={contact ? `Edit Contact — ${contactFullName(contact)}` : 'Edit Contact'}
      subtitle="Update contact information, job title, department, organization link, lifecycle stage, or owner."
      icon={<EditIcon size={22} />}
      activeContact={contact}
      error={error}
      onDismissError={() => setError(null)}
      breadcrumbs={
        <Link to={id ? `/contacts/${id}` : '/contacts'} className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to Contact Details
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading contact record..." />
        </div>
      ) : !contact ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Contact Not Found"
            description="The contact you are trying to edit does not exist or was deleted."
            action={
              <Link to="/contacts" className="auth-btn btn-primary">
                Return to All Contacts
              </Link>
            }
          />
        </div>
      ) : !permissions.canEdit ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Insufficient Permissions"
            description="Your current role does not have permission to edit contacts."
            action={
              <Link to={`/contacts/${contact.id}`} className="auth-btn btn-secondary">
                Back to Contact Profile
              </Link>
            }
          />
        </div>
      ) : (
        <ContactForm
          initialContact={contact}
          organizations={organizations}
          users={users}
          isSubmitting={isSubmitting}
          submitLabel="Save Contact Changes"
          cancelPath={`/contacts/${contact.id}`}
          onSubmit={handleUpdate}
        />
      )}
    </ContactsLayout>
  );
};

