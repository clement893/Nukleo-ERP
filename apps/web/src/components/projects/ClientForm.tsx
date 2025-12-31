'use client';

import { useState, useRef, useEffect } from 'react';
import { Client, ClientCreate, ClientUpdate } from '@/lib/api/clients';
import { mediaAPI } from '@/lib/api/media';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Upload, X, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ui';

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: ClientCreate | ClientUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
  loading = false,
}: ClientFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(client?.photo_url || null);
  const [formData, setFormData] = useState<ClientCreate>({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    email: client?.email || null,
    phone: client?.phone || null,
    linkedin: client?.linkedin || null,
    photo_url: client?.photo_url || null,
    birthday: client?.birthday || null,
    city: client?.city || null,
    country: client?.country || null,
    notes: client?.notes || null,
    comments: client?.comments || null,
    portal_url: client?.portal_url || null,
    status: client?.status || 'active',
  });
  
  useEffect(() => {
    if (client?.photo_url) {
      setPreviewUrl(client.photo_url);
    } else if (!client) {
      setPreviewUrl(null);
    }
  }, [client?.photo_url, client]);

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
        folder: 'clients/photos',
        is_public: true,
      });
      
      const photoUrlToSave = uploadedMedia.file_key || uploadedMedia.file_path;
      if (!photoUrlToSave) {
        throw new Error('Neither file_key nor file_path returned from upload');
      }
      
      URL.revokeObjectURL(localPreviewUrl);
      
      const previewUrl = uploadedMedia.file_path?.startsWith('http') 
        ? uploadedMedia.file_path 
        : (uploadedMedia.file_key || uploadedMedia.file_path);
      
      setPreviewUrl(previewUrl);
      setFormData({ ...formData, photo_url: photoUrlToSave });
      
      showToast({
        message: 'Photo uploadée avec succès. N\'oubliez pas d\'enregistrer les modifications.',
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
                alt="Client photo"
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

      {/* Anniversaire */}
      <Input
        label="Anniversaire"
        type="date"
        value={formData.birthday || ''}
        onChange={(e) => setFormData({ ...formData, birthday: e.target.value || null })}
        fullWidth
      />

      {/* Ville et Pays */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ville"
          value={formData.city || ''}
          onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
          fullWidth
        />
        <Input
          label="Pays"
          value={formData.country || ''}
          onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
          fullWidth
        />
      </div>

      {/* Statut */}
      <Select
        label="Statut"
        value={formData.status || 'active'}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'maintenance' })}
        options={[
          { value: 'active', label: 'Actif' },
          { value: 'inactive', label: 'Inactif' },
          { value: 'maintenance', label: 'Maintenance' },
        ]}
        fullWidth
      />

      {/* URL du portail */}
      <Input
        label="URL du portail"
        type="url"
        value={formData.portal_url || ''}
        onChange={(e) => setFormData({ ...formData, portal_url: e.target.value || null })}
        placeholder="https://..."
        fullWidth
      />

      {/* Notes */}
      <Textarea
        label="Notes"
        value={formData.notes || ''}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
        rows={3}
        fullWidth
      />

      {/* Commentaires */}
      <Textarea
        label="Commentaires"
        value={formData.comments || ''}
        onChange={(e) => setFormData({ ...formData, comments: e.target.value || null })}
        rows={3}
        fullWidth
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          {client ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
