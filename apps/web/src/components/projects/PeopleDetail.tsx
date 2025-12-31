'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Employee } from '@/lib/api/employees';
import { Project } from '@/lib/api/projects';
import { Contact } from '@/lib/api/contacts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { Edit, Trash2, ExternalLink, FolderKanban, Users, FileText, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import EmployeeAvatar from '@/components/employes/EmployeeAvatar';

interface PeopleDetailProps {
  employee: Employee;
  projects?: Project[];
  contacts?: Contact[];
  portalUrl?: string | null;
  notes?: string | null;
  comments?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function PeopleDetail({
  employee,
  projects = [],
  contacts = [],
  portalUrl,
  notes,
  comments,
  onEdit,
  onDelete,
  className,
}: PeopleDetailProps) {
  const router = useRouter();

  // Filter active projects
  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'active' && p.responsable_id === employee.id);
  }, [projects, employee.id]);

  // Get locale from path
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'fr' : 'fr';

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header avec photo */}
      <Card>
        <div className="flex items-start gap-6 p-6">
          <EmployeeAvatar employee={employee} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">
                {employee.first_name} {employee.last_name}
              </h2>
            </div>
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
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted cursor-pointer transition-colors"
                onClick={() => router.push(`/${locale}/dashboard/projets/projets/${project.id}`)}
              >
                <div className="flex items-center gap-3">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                  Actif
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun projet actif</p>
        )}
      </Card>

      {/* Portail */}
      {portalUrl && (
        <Card title="Portail">
          <div className="flex items-center justify-between p-3 border border-border rounded-md">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Portail employé</div>
                <div className="text-sm text-muted-foreground">Accéder au portail dédié</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(portalUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Ouvrir
            </Button>
          </div>
        </Card>
      )}

      {/* Notes et commentaires */}
      {(notes || comments) && (
        <Card title="Notes et commentaires">
          <div className="space-y-4">
            {notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium">Notes</h3>
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {notes}
                </div>
              </div>
            )}
            {comments && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium">Commentaires</h3>
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {comments}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Contacts liés */}
      <Card title="Contacts liés">
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted cursor-pointer transition-colors"
                onClick={() => router.push(`/${locale}/dashboard/reseau/contacts/${contact.id}`)}
              >
                <div className="flex items-center gap-3">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={`${contact.first_name} ${contact.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.company_name && (
                      <div className="text-sm text-muted-foreground">
                        {contact.company_name}
                      </div>
                    )}
                    {contact.position && (
                      <div className="text-sm text-muted-foreground">
                        {contact.position}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun contact lié</p>
        )}
      </Card>
    </div>
  );
}
