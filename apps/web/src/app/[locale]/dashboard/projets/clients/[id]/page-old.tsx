'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsAPI } from '@/lib/api/clients';
import { Project } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { NukleoPageHeader } from '@/components/nukleo';
import ClientDetail from '@/components/projects/ClientDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useClient, useClientProjects, useClientContacts } from '@/lib/query/clients';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [_deleting, setDeleting] = useState(false);

  const clientId = params?.id ? parseInt(String(params.id)) : null;

  // Fetch client
  const { data: client, isLoading: loadingClient, error: clientError } = useClient(clientId || 0, !!clientId);

  // Fetch projects for this client
  const { data: projects = [] } = useClientProjects(clientId || 0, !!clientId);

  // Fetch contacts for this client
  const { data: contacts = [] } = useClientContacts(clientId || 0, !!clientId);

  const loading = loadingClient;
  const error = clientError ? handleApiError(clientError).message : null;

  const handleEdit = () => {
    if (client) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/projets/clients/${client.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!client || !confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      setDeleting(true);
      await clientsAPI.delete(client.id);
      showToast({
        message: 'Client supprimé avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/projets/clients`);
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

  if (error && !client) {
    return (
      <PageContainer>
        <NukleoPageHeader
          title="Erreur"
          description="Une erreur est survenue"
          compact
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/projets/clients`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Clients
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!client) {
    return (
      <PageContainer>
        <NukleoPageHeader
          title="Client non trouvé"
          description="Le client demandé n'existe pas"
          compact
        />
        <Alert variant="error">Le client demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/projets/clients`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Clients
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/projets/clients`);
  };

  return (
    <PageContainer>
      <NukleoPageHeader
        title={client.company_name}
        description={client.type || 'Client'}
        compact
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
        <ClientDetail
          client={client}
          projects={projects.map(p => {
            // Ensure status is lowercase to match Project type
            const statusLower = (p.status || 'active').toLowerCase() as 'active' | 'archived' | 'completed';
            return {
              id: p.id,
              name: p.name,
              description: p.description || null,
              status: statusUpper,
              client_id: client.id,
              user_id: 0, // Required by Project type but not provided by API
              responsable_id: null,
              created_at: new Date().toISOString(), // Required by Project type but not provided by API
              updated_at: new Date().toISOString(), // Required by Project type but not provided by API
            };
          }) as Project[]}
          contacts={contacts}
          portalUrl={client.portal_url || null}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
