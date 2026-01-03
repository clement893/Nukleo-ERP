'use client';

import { useState, useRef } from 'react';
import { Employee } from '@/lib/api/employees';
import { mediaAPI } from '@/lib/api/media';
import { employeesAPI } from '@/lib/api/employees';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UserCircle, Mail, Phone, Linkedin, Calendar, Edit, Trash2, FileText, Plane, Clock, ExternalLink, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors/api';

interface EmployeeDetailProps {
  employee: Employee;
  onEdit?: () => void;
  onDelete?: () => void;
  onPhotoUpdate?: (updatedEmployee: Employee) => void;
  className?: string;
}

export default function EmployeeDetail({
  employee,
  onEdit,
  onDelete,
  onPhotoUpdate,
  className,
}: EmployeeDetailProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(employee.photo_url || null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        message: 'Veuillez sélectionner une image',
        type: 'error',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        message: 'La taille de l\'image doit être inférieure à 5MB',
        type: 'error',
      });
      return;
    }

    // Create local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    setUploadingPhoto(true);
    try {
      const uploadedMedia = await mediaAPI.upload(file, {
        folder: 'employees/photos',
        is_public: true,
      });
      
      // Save file_key if available, otherwise use file_path (URL)
      // The backend will regenerate presigned URLs when needed
      const photoUrlToSave = uploadedMedia.file_key || uploadedMedia.file_path;
      
      // Update employee with new photo
      const updatedEmployee = await employeesAPI.update(employee.id, {
        photo_url: photoUrlToSave,
        photo_filename: uploadedMedia.filename,
      });
      
      // Revoke the local preview URL and use the server URL
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl((updatedEmployee.photo_url ?? null) as string | null);
      
      // Notify parent component to refresh
      if (onPhotoUpdate) {
        onPhotoUpdate(updatedEmployee);
      }
      
      showToast({
        message: 'Photo uploadée avec succès',
        type: 'success',
      });
    } catch (error) {
      // Revert preview on error
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl((employee.photo_url ?? null) as string | null);
      
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de l\'upload de la photo',
        type: 'error',
      });
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer la photo de cet employé ?')) {
      return;
    }

    try {
      const updatedEmployee = await employeesAPI.update(employee.id, {
        photo_url: null,
        photo_filename: null,
      });
      
      setPreviewUrl(null);
      
      // Notify parent component to refresh
      if (onPhotoUpdate) {
        onPhotoUpdate(updatedEmployee);
      }
      
      showToast({
        message: 'Photo supprimée avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de la photo',
        type: 'error',
      });
    }
  };
  
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header avec photo */}
      <Card>
        <div className="flex items-start gap-6 p-6">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center ${previewUrl ? 'hidden' : ''}`}>
              <UserCircle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id={`photo-upload-${employee.id}`}
                disabled={uploadingPhoto}
              />
              <label
                htmlFor={`photo-upload-${employee.id}`}
                className={clsx(
                  'cursor-pointer p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors',
                  uploadingPhoto && 'opacity-50 cursor-not-allowed'
                )}
                title="Changer la photo"
              >
                <Upload className="w-4 h-4" />
              </label>
              {previewUrl && (
                <button
                  onClick={handleRemovePhoto}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Supprimer la photo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {employee.first_name} {employee.last_name}
            </h2>
            {uploadingPhoto && (
              <p className="text-sm text-muted-foreground mb-2">Upload en cours...</p>
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
