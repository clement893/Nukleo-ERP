'use client';

import { useState, useRef, useEffect } from 'react';
import { Employee, EmployeeCreate, EmployeeUpdate } from '@/lib/api/employees';
import { mediaAPI } from '@/lib/api/media';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Upload, X, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ui';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (data: EmployeeCreate | EmployeeUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  loading = false,
}: EmployeeFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(employee?.photo_url || null);
  const [formData, setFormData] = useState<EmployeeCreate>({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || null,
    phone: employee?.phone || null,
    linkedin: employee?.linkedin || null,
    photo_url: employee?.photo_url || null,
    hire_date: employee?.hire_date || null,
    birthday: employee?.birthday || null,
  });
  
  useEffect(() => {
    if (employee?.photo_url) {
      setPreviewUrl(employee.photo_url);
    } else if (!employee) {
      setPreviewUrl(null);
    }
  }, [employee?.photo_url, employee]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        message: 'Veuillez sélectionner une image',
        type: 'error',
      });
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    setUploadingPhoto(true);
    try {
      const uploadedMedia = await mediaAPI.upload(file, {
        folder: 'employees/photos',
        is_public: true,
      });
      
      const photoUrlToSave = uploadedMedia.file_key || uploadedMedia.file_path;
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl(uploadedMedia.file_path);
      setFormData({ ...formData, photo_url: photoUrlToSave });
      
      showToast({
        message: 'Photo uploadée avec succès',
        type: 'success',
      });
    } catch (error) {
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl(null);
      showToast({
        message: 'Erreur lors de l\'upload de la photo',
        type: 'error',
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFormData({ ...formData, photo_url: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      showToast({
        message: 'Le prénom et le nom sont requis',
        type: 'error',
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Photo
        </label>
        <div className="flex items-center gap-4">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Employee photo"
                className="w-20 h-20 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {uploadingPhoto ? 'Upload...' : previewUrl ? 'Changer' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </div>

      {/* Prénom et Nom */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Prénom *"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          fullWidth
        />
        <Input
          label="Nom *"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
          fullWidth
        />
      </div>

      {/* Email */}
      <Input
        label="Courriel"
        type="email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
        fullWidth
      />

      {/* Téléphone */}
      <Input
        label="Téléphone"
        type="tel"
        value={formData.phone || ''}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
        fullWidth
      />

      {/* LinkedIn */}
      <Input
        label="LinkedIn"
        type="url"
        value={formData.linkedin || ''}
        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value || null })}
        placeholder="https://linkedin.com/in/..."
        fullWidth
      />

      {/* Date d'embauche */}
      <Input
        label="Date d'embauche"
        type="date"
        value={formData.hire_date || ''}
        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value || null })}
        fullWidth
      />

      {/* Anniversaire */}
      <Input
        label="Anniversaire"
        type="date"
        value={formData.birthday || ''}
        onChange={(e) => setFormData({ ...formData, birthday: e.target.value || null })}
        fullWidth
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          {employee ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
