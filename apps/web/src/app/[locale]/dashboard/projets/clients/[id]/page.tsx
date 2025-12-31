'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsAPI } from '@/lib/api/clients';
import { Project } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
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
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
            { label: 'Clients', href: `/${params?.locale || 'fr'}/dashboard/projets/clients` },
            { label: 'Détail' },
          ]}
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
        <PageHeader
          title="Client non trouvé"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
            { label: 'Clients', href: `/${params?.locale || 'fr'}/dashboard/projets/clients` },
            { label: 'Détail' },
          ]}
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
      <PageHeader
        title={`${client.first_name} ${client.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
          { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
          { label: 'Clients', href: `/${params?.locale || 'fr'}/dashboard/projets/clients` },
          { label: `${client.first_name} ${client.last_name}` },
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
        <ClientDetail
          client={client}
          projects={projects.map(p => {
            // Convert lowercase status to uppercase to match Project type
            const statusUpper = (p.status || 'ACTIVE').toUpperCase() as 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
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
          notes={client.notes || null}
          comments={client.comments || null}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
