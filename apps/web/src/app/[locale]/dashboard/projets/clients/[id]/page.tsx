'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientsAPI } from '@/lib/api/clients';
import { companiesAPI } from '@/lib/api/companies';
import { contactsAPI } from '@/lib/api/contacts';
import { projectsAPI } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import ClientDetail from '@/components/projects/ClientDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const clientId = params?.id ? parseInt(String(params.id)) : null;
  
  // Fetch client
  const { data: client, isLoading: loadingClient, error: clientError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? clientsAPI.get(clientId) : null,
    enabled: !!clientId,
  });
  
  // Fetch company
  const { data: company } = useQuery({
    queryKey: ['company', client?.company_id],
    queryFn: () => client?.company_id ? companiesAPI.get(client.company_id) : null,
    enabled: !!client?.company_id,
  });
  
  // Fetch projects for this client
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list(0, 1000),
    enabled: !!client?.company_id,
  });
  
  // Filter projects by client company_id
  const projects = useMemo(() => {
    if (!client?.company_id || !allProjects) return [];
    return allProjects.filter(p => p.client_id === client.company_id);
  }, [allProjects, client?.company_id]);
  
  // Fetch contacts for this company
  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.list(0, 1000),
    enabled: !!client?.company_id,
  });
  
  // Filter contacts by company_id
  const contacts = useMemo(() => {
    if (!client?.company_id || !allContacts) return [];
    return allContacts.filter(c => c.company_id === client.company_id);
  }, [allContacts, client?.company_id]);
  
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
    }
  };
  
  if (loadingClient) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }
  
  if (clientError && !client) {
    const error = handleApiError(clientError);
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Modules Opérations', href: '/dashboard/projets' },
            { label: 'Clients', href: '/dashboard/projets/clients' },
            { label: 'Erreur' },
          ]}
        />
        <Alert variant="error" className="mt-6">
          {error.message || 'Erreur lors du chargement du client'}
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const locale = params?.locale as string || 'fr';
              router.push(`/${locale}/dashboard/projets/clients`);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  if (!client) {
    return (
      <PageContainer>
        <PageHeader
          title="Client introuvable"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Modules Opérations', href: '/dashboard/projets' },
            { label: 'Clients', href: '/dashboard/projets/clients' },
            { label: 'Introuvable' },
          ]}
        />
        <Alert variant="error" className="mt-6">
          Client introuvable
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const locale = params?.locale as string || 'fr';
              router.push(`/${locale}/dashboard/projets/clients`);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageHeader
        title={client.company_name || 'Client'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules Opérations', href: '/dashboard/projets' },
          { label: 'Clients', href: '/dashboard/projets/clients' },
          { label: client.company_name || 'Client' },
        ]}
      />
      
      <div className="mt-6">
        <ClientDetail
          client={client}
          company={company || null}
          projects={projects.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            description: p.description || undefined,
          }))}
          contacts={contacts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
