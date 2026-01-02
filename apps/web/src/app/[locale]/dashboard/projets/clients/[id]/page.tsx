'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errors/api';
import { PageContainer } from '@/components/layout';
import { Loading, Alert, Button, Card, Badge } from '@/components/ui';
import { 
  ArrowLeft, 
  Edit,
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Briefcase
} from 'lucide-react';
import { useClient, useClientProjects, useClientContacts } from '@/lib/query/clients';
import ClientAvatar from '@/components/projects/ClientAvatar';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'contacts' | 'documents'>('overview');

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


  // Stats calculation
  const stats = client ? [
    { icon: Briefcase, label: 'Projets', value: projects.length.toString(), color: 'text-primary-600', bgColor: 'bg-primary-100' },
    { icon: Users, label: 'Contacts', value: contacts.length.toString(), color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: DollarSign, label: 'Projets actifs', value: projects.filter(p => p.status === 'in_progress').length.toString(), color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: TrendingUp, label: 'Statut', value: client.status === 'ACTIVE' ? 'Actif' : 'Inactif', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-primary-100 text-primary-700 border-primary-300';
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'planned': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getProjectStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'planned': return 'Planifié';
      case 'on_hold': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
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
        <Alert variant="error">Le client demandé n'existe pas ou a été supprimé.</Alert>
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

  const locale = params?.locale as string || 'fr';

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-6 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Bouton retour */}
          <Link href={`/${locale}/dashboard/projets/clients`} className="inline-block">
            <Button variant="ghost" size="sm" className="hover:glass-card">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux clients
            </Button>
          </Link>

          {/* Header Card avec logo plus grand */}
          <Card className="glass-card p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Logo plus grand (56x56 = 224px) */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-nukleo-gradient rounded-2xl opacity-20 blur-lg" />
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-nukleo-lavender/30 shadow-xl bg-white flex items-center justify-center">
                  <ClientAvatar client={client} size="xl" className="w-full h-full" />
                </div>
              </div>
              
              {/* Infos */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-primary-500 mb-3 font-nukleo">
                  {client.company_name}
                </h1>
                <p className="text-xl text-foreground/80 mb-4">
                  {client.type || 'Client'}
                </p>
                
                {/* Status Badge */}
                <div className="mb-6">
                  <Badge className={getStatusColor(client.status || 'active')}>
                    {getStatusLabel(client.status || 'active')}
                  </Badge>
                </div>
                
                {/* Actions rapides */}
                <div className="flex flex-wrap gap-3">
                  {/* Contact information would need to be fetched separately or from related entities */}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-border">
              {[
                { key: 'overview', label: 'Vue d\'ensemble' },
                { key: 'projects', label: `Projets (${projects.length})` },
                { key: 'contacts', label: `Contacts (${contacts.length})` },
                { key: 'documents', label: 'Documents' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-primary-500'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nukleo-gradient" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                    Informations
                  </h3>
                  <div className="space-y-4">
                    {/* Client contact information is not directly available in the Client type */}
                    {/* This would need to be fetched from related contacts or companies */}
                  </div>
                </Card>

                {/* Description */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                    Description
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    Aucune description pour ce client.
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {client.created_at && (
                        <span>Créé le: {new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                      )}
                      {client.updated_at && (
                        <span>Dernière modification: {new Date(client.updated_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'projects' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Projets ({projects.length})
                </h3>
                {projects.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun projet pour ce client.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{project.name}</h4>
                          <Badge className={getProjectStatusColor(project.status)}>
                            {getProjectStatusLabel(project.status)}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                        )}
                        {project.annee_realisation && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Année: {project.annee_realisation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'contacts' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Contacts ({contacts.length})
                </h3>
                {contacts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun contact pour ce client.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <Link 
                        key={contact.id} 
                        href={`/${locale}/dashboard/reseau/contacts/${contact.id}`}
                        className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-500/10 flex items-center justify-center">
                            {contact.photo_url ? (
                              <img 
                                src={String(contact.photo_url)} 
                                alt={`${String(contact.first_name || '')} ${String(contact.last_name || '')}`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="text-primary-500 font-semibold">
                                {String(contact.first_name?.[0] || '')}{String(contact.last_name?.[0] || '')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                              {String(contact.first_name || '')} {String(contact.last_name || '')}
                            </h4>
                            {contact.position && typeof contact.position === 'string' ? (
                              <p className="text-sm text-muted-foreground">{contact.position as string}</p>
                            ) : null}
                            {contact.email && typeof contact.email === 'string' ? (
                              <p className="text-sm text-muted-foreground">{contact.email as string}</p>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Documents
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun document pour ce client.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action - Edit Button (Floating) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleEdit}
          className="w-14 h-14 bg-nukleo-gradient rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Modifier le client"
          title="Modifier le client"
        >
          <Edit className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    </PageContainer>
  );
}
