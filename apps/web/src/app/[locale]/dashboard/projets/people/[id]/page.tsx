'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { peopleAPI } from '@/lib/api/people';
import { Project } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import PeopleDetail from '@/components/projects/PeopleDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { usePerson, usePersonProjects, usePersonContacts } from '@/lib/query/people';

export default function PeopleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [_deleting, setDeleting] = useState(false);

  const peopleId = params?.id ? parseInt(String(params.id)) : null;

  // Fetch person
  const { data: person, isLoading: loadingPerson, error: personError } = usePerson(peopleId || 0, !!peopleId);

  // Fetch projects for this person
  const { data: projects = [] } = usePersonProjects(peopleId || 0, !!peopleId);

  // Fetch contacts for this person
  const { data: contacts = [] } = usePersonContacts(peopleId || 0, !!peopleId);

  const loading = loadingPerson;
  const error = personError ? handleApiError(personError).message : null;

  const handleEdit = () => {
    if (person) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/projets/people/${person.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!person || !confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
      return;
    }

    try {
      setDeleting(true);
      await peopleAPI.delete(person.id);
      showToast({
        message: 'Personne supprimée avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/projets/people`);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setDeleting(false);
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

  if (error && !person) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
            { label: 'People', href: `/${params?.locale || 'fr'}/dashboard/projets/people` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/projets/people`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à People
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!person) {
    return (
      <PageContainer>
        <PageHeader
          title="Personne non trouvée"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
            { label: 'People', href: `/${params?.locale || 'fr'}/dashboard/projets/people` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">La personne demandée n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/projets/people`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à People
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/projets/people`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${person.first_name} ${person.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
          { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
          { label: 'People', href: `/${params?.locale || 'fr'}/dashboard/projets/people` },
          { label: `${person.first_name} ${person.last_name}` },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <PeopleDetail
          person={person}
          projects={projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || null,
            status: (p.status || 'active') as 'active' | 'archived' | 'completed',
            responsable_id: person.id,
            user_id: 0, // Required by Project type but not provided by API
            client_id: p.client_id || null,
            created_at: new Date().toISOString(), // Required by Project type but not provided by API
            updated_at: new Date().toISOString(), // Required by Project type but not provided by API
          })) as Project[]}
          contacts={contacts}
          portalUrl={person.portal_url || null}
          notes={person.notes || null}
          comments={person.comments || null}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
