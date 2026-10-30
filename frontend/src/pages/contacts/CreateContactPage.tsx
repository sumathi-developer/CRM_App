import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { contactService } from '../../services/contact.service';
import type { ContactOrganization, CreateContactPayload } from '../../types/contact.types';
import { useUserOptions } from '../lead-generation/leadGenHooks';
import { EmptyState } from '../../components/common/EmptyState';
import { getContactPermissions } from './contactConstants';
import { ContactsLayout } from './components/ContactsLayout';
import { ContactForm } from './components/ContactForm';
import { ArrowLeftIcon, PlusIcon } from '../../components/common/Icons';

export const CreateContactPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users } = useUserOptions();
  const navigate = useNavigate();
  const permissions = useMemo(() => getContactPermissions(currentUser), [currentUser]);

  const [organizations, setOrganizations] = useState<ContactOrganization[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  useEffect(() => {
    contactService.getOrganizations().then(setOrganizations).catch(() => setOrganizations([]));
  }, []);

  const handleCreate = async (payload: CreateContactPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await contactService.createContact(payload);
      navigate(`/contacts/${created.id}`, {
        state: {
          flash: `Contact "${created.firstName} ${created.lastName}" created successfully.`,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContactsLayout
      title="Create Contact"
      subtitle="Add a new stakeholder, prospect, or customer contact and link them to an organization and owner."
      icon={<PlusIcon size={22} />}
      error={error}
      onDismissError={() => setError(null)}
      breadcrumbs={
        <Link to="/contacts" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to All Contacts
        </Link>
      }
    >
      {!permissions.canCreate ? (
        <div className="lg-card lg-state-box">
          <EmptyState
            title="Insufficient Permissions"
            description="Your current role does not have permission to create contacts."
            action={
              <Link to="/contacts" className="auth-btn btn-secondary">
                Return to Contacts
              </Link>
            }
          />
        </div>
      ) : (
        <ContactForm
          initialContact={{
            stage: 'LEAD',
            ownerId: currentUser?.id || '',
          }}
          organizations={organizations}
          users={users}
          isSubmitting={isSubmitting}
          submitLabel="Create Contact"
          cancelPath="/contacts"
          onSubmit={handleCreate}
        />
      )}
    </ContactsLayout>
  );
};

