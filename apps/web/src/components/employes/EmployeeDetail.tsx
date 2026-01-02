'use client';

import { Employee } from '@/lib/api/employees';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UserCircle, Mail, Phone, Linkedin, Calendar, Edit, Trash2, FileText, Plane, Clock, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface EmployeeDetailProps {
  employee: Employee;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function EmployeeDetail({
  employee,
  onEdit,
  onDelete,
  className,
}: EmployeeDetailProps) {
  
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header avec photo */}
      <Card>
        <div className="flex items-start gap-6 p-6">
          {employee.photo_url ? (
            <img
              src={employee.photo_url}
              alt={`${employee.first_name} ${employee.last_name}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {employee.first_name} {employee.last_name}
            </h2>
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

      {/* Informations de contact */}
      <Card title="Informations de contact">
        <div className="space-y-4">
          {employee.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Courriel</p>
                <a href={`mailto:${employee.email}`} className="text-foreground hover:text-primary">
                  {employee.email}
                </a>
              </div>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <a href={`tel:${employee.phone}`} className="text-foreground hover:text-primary">
                  {employee.phone}
                </a>
              </div>
            </div>
          )}
          {employee.linkedin && (
            <div className="flex items-center gap-3">
              <Linkedin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">LinkedIn</p>
                <a
                  href={employee.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary"
                >
                  {employee.linkedin}
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Informations professionnelles */}
      <Card title="Informations professionnelles">
        <div className="space-y-4">
          {employee.employee_number && (
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Numéro d'employé</p>
                <p className="text-foreground font-medium">
                  {employee.employee_number}
                </p>
              </div>
            </div>
          )}
          {employee.job_title && (
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Titre du poste</p>
                <p className="text-foreground">
                  {employee.job_title}
                </p>
              </div>
            </div>
          )}
          {employee.department && (
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Département</p>
                <p className="text-foreground">
                  {employee.department}
                </p>
              </div>
            </div>
          )}
          {employee.hire_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date d'embauche</p>
                <p className="text-foreground">
                  {new Date(employee.hire_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}
          {employee.birthday && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Anniversaire</p>
                <p className="text-foreground">
                  {new Date(employee.birthday).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Feuilles de temps */}
      <Card title="Feuilles de temps">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Accès aux feuilles de temps</p>
              <a
                href={`/dashboard/feuilles-de-temps?employee_id=${employee.id}`}
                className="text-primary hover:underline flex items-center gap-1 mt-1"
              >
                Voir les feuilles de temps
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Vacances */}
      <Card title="Vacances">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Vacances restantes</p>
              <p className="text-foreground">
                {/* Vacation balance calculation requires API endpoint for employee vacation data */}
                N/A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Demandes de vacances en suspens</p>
              <a
                href={`/dashboard/vacances?employee_id=${employee.id}&status=pending`}
                className="text-primary hover:underline flex items-center gap-1 mt-1"
              >
                Voir les demandes en suspens
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Portail employé */}
      <Card title="Portail employé">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Accès au portail employé</p>
              <a
                href={`/portail-employe/${employee.id}/dashboard`}
                className="text-primary hover:underline flex items-center gap-1 mt-1"
              >
                Ouvrir le portail employé
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Métadonnées */}
      <Card title="Métadonnées">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créé le</span>
            <span className="text-foreground">
              {new Date(employee.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modifié le</span>
            <span className="text-foreground">
              {new Date(employee.updated_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
