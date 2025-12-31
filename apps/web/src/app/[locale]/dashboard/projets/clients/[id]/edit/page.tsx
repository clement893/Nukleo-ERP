'use client';

import { useParams, useRouter } from 'next/navigation';
import { clientsAPI } from '@/lib/api/clients';
import type { ClientCreate, ClientUpdate } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import ClientForm from '@/components/projects/ClientForm';
import { Loading, Alert, Card } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useClient } from '@/lib/query/clients';

export default function ClientEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const clientId = params?.id ? parseInt(String(params.id)) : null;
  const locale = params?.locale as string || 'fr';

  // Fetch client using React Query
  const { data: client, isLoading: loading, error: clientError } = useClient(clientId || 0, !!clientId);

  const handleUpdate = async (data: ClientCreate | ClientUpdate) => {
    if (!clientId) return;

    try {
      await clientsAPI.update(clientId, data as ClientUpdate);
      showToast({
        message: 'Client modifié avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/projets/clients/${clientId}`);
    } catch (err) {
      const appError = handleApiError(err);
      const errorMessage = appError.message || 'Erreur lors de la modification du client';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const handleCancel = () => {
    if (clientId) {
      router.push(`/${locale}/dashboard/projets/clients/${clientId}`);
    } else {
      router.push(`/${locale}/dashboard/projets/clients`);
    }
  };

  const error = clientError ? handleApiError(clientError).message : null;

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !client) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Modules Opérations', href: `/${locale}/dashboard/projets` },
            { label: 'Clients', href: `/${locale}/dashboard/projets/clients` },
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

  if (!client) {
    return (
      <PageContainer>
        <PageHeader
          title="Client non trouvé"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Modules Opérations', href: `/${locale}/dashboard/projets` },
            { label: 'Clients', href: `/${locale}/dashboard/projets/clients` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">Le client demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Clients
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Modifier ${client.first_name} ${client.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${locale}/dashboard` },
          { label: 'Modules Opérations', href: `/${locale}/dashboard/projets` },
          { label: 'Clients', href: `/${locale}/dashboard/projets/clients` },
          { label: client.first_name + ' ' + client.last_name, href: `/${locale}/dashboard/projets/clients/${client.id}` },
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
            <ClientForm
              client={client}
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
