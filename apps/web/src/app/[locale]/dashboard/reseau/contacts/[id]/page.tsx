'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import ContactDetail from '@/components/commercial/ContactDetail';
import { Loading, Alert, Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { useReseauContact, useDeleteReseauContact } from '@/lib/query/reseau-contacts';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/reseau/ContactForm';
import { useUpdateReseauContact } from '@/lib/query/reseau-contacts';
import type { ContactUpdate } from '@/lib/api/reseau-contacts';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);

  const contactId = params?.id ? parseInt(String(params.id)) : null;

  // Fetch contact
  const { data: contact, isLoading: loadingContact, error: contactError } = useReseauContact(
    contactId || 0,
    !!contactId
  );

  // Mutations
  const updateContactMutation = useUpdateReseauContact();
  const deleteContactMutation = useDeleteReseauContact();

  const loading = loadingContact;
  const error = contactError ? handleApiError(contactError).message : null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleUpdate = async (data: ContactUpdate) => {
    if (!contact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data,
      });
      setShowEditModal(false);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!contact || !confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      await deleteContactMutation.mutateAsync(contact.id);
      showToast({
        message: 'Contact supprimé avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/reseau/contacts`);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !contact) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Réseau', href: `/${params?.locale || 'fr'}/dashboard/reseau` },
            { label: 'Contacts', href: `/${params?.locale || 'fr'}/dashboard/reseau/contacts` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/reseau/contacts`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer>
        <PageHeader
          title="Contact introuvable"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Réseau', href: `/${params?.locale || 'fr'}/dashboard/reseau` },
            { label: 'Contacts', href: `/${params?.locale || 'fr'}/dashboard/reseau/contacts` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">Le contact demandé n'existe pas ou a été supprimé.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/reseau/contacts`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${contact.first_name} ${contact.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
          { label: 'Module Réseau', href: `/${params?.locale || 'fr'}/dashboard/reseau` },
          { label: 'Contacts', href: `/${params?.locale || 'fr'}/dashboard/reseau/contacts` },
          { label: `${contact.first_name} ${contact.last_name}` },
        ]}
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <ContactDetail
        contact={contact}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le contact"
        size="lg"
      >
        <ContactForm
          contact={contact}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          loading={updateContactMutation.isPending}
          companies={[]}
          employees={[]}
          circles={['client', 'prospect', 'partenaire', 'fournisseur', 'autre']}
        />
      </Modal>
    </PageContainer>
  );
}
