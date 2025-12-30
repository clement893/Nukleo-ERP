'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesAPI, Company } from '@/lib/api/companies';
import { contactsAPI, Contact } from '@/lib/api/contacts';
import { projectsAPI } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import ClientDetail from '@/components/projects/ClientDetail';
import { Loading, Alert, Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { useClient, useDeleteClient } from '@/lib/query/clients';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const locale = (params?.locale as string) || 'fr';
  
  const clientId = params?.id ? parseInt(String(params.id)) : null;
  
  // Fetch client
  const { data: client, isLoading: loadingClient, error: clientError } = useClient(clientId);
  
  // Fetch company
  const [company, setCompany] = useState<Company | null>(null);
  
  // Fetch projects
  const [projects, setProjects] = useState<Array<{
    id: number;
    name: string;
    status: string;
    description?: string;
  }>>([]);
  
  // Fetch contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const deleteClientMutation = useDeleteClient();

  useEffect(() => {
    if (client?.company_id) {
      // Load company
      companiesAPI.get(client.company_id)
        .then((data) => setCompany(data))
        .catch((err) => {
          console.error('Error loading company:', err);
        });
      
      // Load projects for this company
      projectsAPI.list()
        .then((response: any) => {
          const projectsData = response.data || response;
          const allProjects = Array.isArray(projectsData) ? projectsData : [];
          // Filter projects by company_id if available in project data
          const filteredProjects = allProjects.filter((p: any) => 
            p.company_id === client.company_id || p.client_id === client.company_id
          );
          setProjects(filteredProjects);
        })
        .catch((err) => {
          console.error('Error loading projects:', err);
        });
      
      // Load contacts for this company
      contactsAPI.list(0, 1000)
        .then((allContacts) => {
          // Filter contacts by company_id
          const filteredContacts = allContacts.filter(
            (contact) => contact.company_id === client.company_id
          );
          setContacts(filteredContacts);
        })
        .catch((err) => {
          console.error('Error loading contacts:', err);
        });
    }
  }, [client?.company_id]);

  const handleEdit = () => {
    if (client) {
      router.push(`/${locale}/dashboard/projets/clients/${client.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!client || !confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      await deleteClientMutation.mutateAsync(client.id);
      showToast({
        message: 'Client supprimé avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/projets/clients`);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const handleBack = () => {
    router.push(`/${locale}/dashboard/projets/clients`);
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
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Projets', href: `/${locale}/dashboard/projets` },
            { label: 'Clients', href: `/${locale}/dashboard/projets/clients` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">{error.message}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
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
            { label: 'Projets', href: `/${locale}/dashboard/projets` },
            { label: 'Clients', href: `/${locale}/dashboard/projets/clients` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">Le client demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={client.company_name || 'Client sans nom'}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${locale}/dashboard` },
          { label: 'Projets', href: `/${locale}/dashboard/projets` },
          { label: 'Clients', href: `/${locale}/dashboard/projets/clients` },
          { label: client.company_name || 'Client' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        }
      />

      <div className="mt-6">
        <ClientDetail
          client={client}
          company={company}
          projects={projects}
          contacts={contacts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
