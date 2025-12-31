'use client';

import { useParams, useRouter } from 'next/navigation';
import { peopleAPI } from '@/lib/api/people';
import type { People, PeopleCreate, PeopleUpdate } from '@/lib/api/people';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import PeopleForm from '@/components/projects/PeopleForm';
import { Loading, Alert, Card } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { usePerson } from '@/lib/query/people';

export default function PeopleEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const peopleId = params?.id ? parseInt(String(params.id)) : null;
  const locale = params?.locale as string || 'fr';

  // Fetch person using React Query
  const { data: person, isLoading: loading, error: personError } = usePerson(peopleId || 0, !!peopleId);

  const handleUpdate = async (data: PeopleCreate | PeopleUpdate) => {
    if (!peopleId) return;

    try {
      await peopleAPI.update(peopleId, data as PeopleUpdate);
      showToast({
        message: 'Personne modifiée avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/projets/people/${peopleId}`);
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors de la modification de la personne';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const handleCancel = () => {
    if (peopleId) {
      router.push(`/${locale}/dashboard/projets/people/${peopleId}`);
    } else {
      router.push(`/${locale}/dashboard/projets/people`);
    }
  };

  const error = personError ? handleApiError(personError).message : null;

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
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Modules Opérations', href: `/${locale}/dashboard/projets` },
            { label: 'People', href: `/${locale}/dashboard/projets/people` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
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
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Modules Opérations', href: `/${locale}/dashboard/projets` },
            { label: 'People', href: `/${locale}/dashboard/projets/people` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">La personne demandée n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à People
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Modifier ${person.first_name} ${person.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${locale}/dashboard` },
          { label: 'Modules Opérations', href: `/${locale}/dashboard/projets` },
          { label: 'People', href: `/${locale}/dashboard/projets/people` },
          { label: person.first_name + ' ' + person.last_name, href: `/${locale}/dashboard/projets/people/${person.id}` },
          { label: 'Modification' },
        ]}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <PeopleForm
              person={person}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              loading={false}
            />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
