'use client';

import { Project } from '@/lib/api/projects';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Building2, User, Edit, Trash2, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '@/components/ui/Badge';

interface ProjectDetailProps {
  project: Project;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function ProjectDetail({
  project,
  onEdit,
  onDelete,
  className,
}: ProjectDetailProps) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500 hover:bg-green-600',
    archived: 'bg-gray-500 hover:bg-gray-600',
    completed: 'bg-blue-500 hover:bg-blue-600',
  };
  
  const statusLabels: Record<string, string> = {
    active: 'Actif',
    archived: 'Archivé',
    completed: 'Complété',
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between p-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">
                {project.name}
              </h2>
              <Badge 
                variant="default" 
                className={`text-white ${statusColors[project.status] || 'bg-gray-500'}`}
              >
                {statusLabels[project.status] || project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mb-4">{project.description}</p>
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

      {/* Informations du projet */}
      <Card title="Informations du projet">
        <div className="space-y-4">
          {project.client_name && (
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="text-foreground">{project.client_name}</p>
              </div>
            </div>
          )}
          {project.responsable_name && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="text-foreground">{project.responsable_name}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Documents */}
      <Card title="Documents">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Soumission</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Budget</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Drive</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Les liens vers les documents seront ajoutés ici
          </p>
        </div>
      </Card>

      {/* Tâches */}
      <Card title="Tâches">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Liste des tâches du projet
          </p>
          <p className="text-xs text-muted-foreground">
            Les tâches seront affichées ici
          </p>
        </div>
      </Card>

      {/* Commentaires */}
      <Card title="Commentaires">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Commentaires du projet
          </p>
          <p className="text-xs text-muted-foreground">
            Les commentaires seront affichés ici
          </p>
        </div>
      </Card>

      {/* Discussions */}
      <Card title="Discussions">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Discussions du projet
          </p>
          <p className="text-xs text-muted-foreground">
            Les discussions seront affichées ici
          </p>
        </div>
      </Card>

      {/* Contacts liés */}
      <Card title="Contacts liés">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Contacts associés au projet
          </p>
          <p className="text-xs text-muted-foreground">
            Les contacts liés seront affichés ici
          </p>
        </div>
      </Card>

      {/* Départements */}
      <Card title="Départements">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Départements associés au projet
          </p>
          <p className="text-xs text-muted-foreground">
            Les départements seront affichés ici
          </p>
        </div>
      </Card>

      {/* Métadonnées */}
      <Card title="Métadonnées">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créé le</span>
            <span className="text-foreground">
              {new Date(project.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modifié le</span>
            <span className="text-foreground">
              {new Date(project.updated_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
