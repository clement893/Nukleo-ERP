'use client';

import { Client, ClientStatus } from '@/lib/api/clients';
import { Company } from '@/lib/api/companies';
import { Contact } from '@/lib/api/contacts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CompanyAvatar from '@/components/commercial/CompanyAvatar';
import { Building2, User, ExternalLink, FileText, MessageSquare, Edit, Trash2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface ClientDetailProps {
  client: Client;
  company?: Company | null;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
    description?: string;
  }>;
  contacts?: Contact[];
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const getStatusBadgeColor = (status: ClientStatus) => {
  switch (status) {
    case ClientStatus.ACTIVE:
      return 'bg-green-500 hover:bg-green-600';
    case ClientStatus.INACTIVE:
      return 'bg-gray-500 hover:bg-gray-600';
    case ClientStatus.MAINTENANCE:
      return 'bg-yellow-500 hover:bg-yellow-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getStatusLabel = (status: ClientStatus): string => {
  const labels: Record<ClientStatus, string> = {
    [ClientStatus.ACTIVE]: 'Actif',
    [ClientStatus.INACTIVE]: 'Inactif',
    [ClientStatus.MAINTENANCE]: 'Maintenance',
  };
  return labels[status] || status;
};

export default function ClientDetail({
  client,
  company,
  projects = [],
  contacts = [],
  onEdit,
  onDelete,
  className,
}: ClientDetailProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'in_progress');

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header avec logo */}
      <Card>
        <div className="flex items-start gap-6 p-6">
          {company && (
            <CompanyAvatar company={company} size="xl" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">
                {client.company_name || 'Client sans nom'}
              </h2>
              <Badge 
                variant="default" 
                className={`capitalize text-white ${getStatusBadgeColor(client.status)}`}
              >
                {getStatusLabel(client.status)}
              </Badge>
            </div>
            {client.responsible_name && (
              <p className="text-lg text-muted-foreground mb-4">
                Responsable: {client.responsible_name}
              </p>
            )}
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Projets actifs */}
      <Card title="Projets actifs">
        {activeProjects.length > 0 ? (
          <div className="space-y-3">
            {activeProjects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => router.push(`/${locale}/dashboard/projects/${project.id}`)}
              >
                <div className="flex-1">
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-muted-foreground mt-1">{project.description}</div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
            {activeProjects.length > 5 && (
              <div className="text-sm text-muted-foreground text-center pt-2">
                + {activeProjects.length - 5} autre(s) projet(s)
              </div>
            )}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${locale}/dashboard/projects?company_id=${client.company_id}`)}
                className="w-full"
              >
                Voir tous les projets
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun projet actif</p>
          </div>
        )}
      </Card>

      {/* Portail client */}
      {client.portal_url && (
        <Card title="Portail client">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Accéder au portail</p>
                <p className="text-sm text-muted-foreground">{client.portal_url}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(client.portal_url || '', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Ouvrir
            </Button>
          </div>
        </Card>
      )}

      {/* Notes et commentaires */}
      {(client.notes || client.comments) && (
        <Card title="Notes et commentaires">
          <div className="space-y-4">
            {client.notes && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              </div>
            )}
            {client.comments && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Commentaires
                </h4>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{client.comments}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Contacts liés */}
      <Card title="Contacts liés">
        {contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.slice(0, 10).map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => router.push(`/${locale}/dashboard/reseau/contacts/${contact.id}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.position && (
                      <div className="text-sm text-muted-foreground">{contact.position}</div>
                    )}
                    {contact.email && (
                      <div className="text-sm text-muted-foreground">{contact.email}</div>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
            {contacts.length > 10 && (
              <div className="text-sm text-muted-foreground text-center pt-2">
                + {contacts.length - 10} autre(s) contact(s)
              </div>
            )}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${locale}/dashboard/reseau/contacts?company_id=${client.company_id}`)}
                className="w-full"
              >
                Voir tous les contacts
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun contact lié</p>
          </div>
        )}
      </Card>

      {/* Métadonnées */}
      <Card title="Métadonnées">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créé le</span>
            <span className="text-foreground">
              {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modifié le</span>
            <span className="text-foreground">
              {new Date(client.updated_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
