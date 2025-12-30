'use client';

import { useState, useRef } from 'react';
import { Contact, ContactCreate, ContactUpdate } from '@/lib/api/contacts';
import { mediaAPI } from '@/lib/api/media';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Upload, X, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ui';

interface ContactFormProps {
  contact?: Contact | null;
  onSubmit: (data: ContactCreate | ContactUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  companies?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string }>;
  circles?: string[];
}

const CIRCLES_OPTIONS = [
  { value: 'client', label: 'Client' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' },
];

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
];

export default function ContactForm({
  contact,
  onSubmit,
  onCancel,
  loading = false,
  companies = [],
  employees = [],
  circles = [],
}: ContactFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState<ContactCreate>({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    company_id: contact?.company_id || null,
    company_name: contact?.company_name || null,
    position: contact?.position || null,
    circle: contact?.circle || null,
    linkedin: contact?.linkedin || null,
    photo_url: contact?.photo_url || null,
    email: contact?.email || null,
    phone: contact?.phone || null,
    city: contact?.city || null,
    country: contact?.country || null,
    birthday: contact?.birthday || null,
    language: contact?.language || null,
    employee_id: contact?.employee_id || null,
  });
  
  // Track company name input separately for better UX
  const [companyNameInput, setCompanyNameInput] = useState<string>(
    contact?.company_name || contact?.company_id 
      ? companies.find(c => c.id === contact?.company_id)?.name || ''
      : ''
  );

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

    setUploadingPhoto(true);
    try {
      const uploadedMedia = await mediaAPI.upload(file, {
        folder: 'contacts/photos',
        is_public: true,
      });
      
      // Save file_key if available, otherwise use file_path (URL)
      // The backend will regenerate presigned URLs when needed
      const photoUrlToSave = uploadedMedia.file_key || uploadedMedia.file_path;
      setFormData({ ...formData, photo_url: photoUrlToSave });
      showToast({
        message: 'Photo uploadée avec succès',
        type: 'success',
      });
    } catch (error) {
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

  const circleOptions = circles.length > 0
    ? circles.map(c => ({ value: c, label: c }))
    : CIRCLES_OPTIONS;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Photo
        </label>
        <div className="flex items-center gap-4">
          {formData.photo_url ? (
            <div className="relative">
              <img
                src={formData.photo_url}
                alt="Contact photo"
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
              {uploadingPhoto ? 'Upload...' : formData.photo_url ? 'Changer' : 'Ajouter'}
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

      {/* Entreprise */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Entreprise
        </label>
        {companies.length > 0 ? (
          <Select
            value={formData.company_id?.toString() || ''}
            onChange={(e) => {
              const selectedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedCompany = companies.find(c => c.id === selectedId);
              setFormData({
                ...formData,
                company_id: selectedId,
                company_name: selectedCompany?.name || null,
              });
              setCompanyNameInput(selectedCompany?.name || '');
            }}
            options={[
              { value: '', label: 'Aucune' },
              ...companies.map(c => ({ value: c.id.toString(), label: c.name })),
            ]}
            fullWidth
          />
        ) : (
          <Input
            label=""
            value={companyNameInput}
            onChange={(e) => {
              const name = e.target.value || '';
              setCompanyNameInput(name);
              setFormData({
                ...formData,
                company_id: null, // Clear company_id when typing manually
                company_name: name || null, // Send company_name to backend for auto-matching
              });
            }}
            placeholder="Nom de l'entreprise (sera automatiquement lié si elle existe)"
            fullWidth
          />
        )}
        {companyNameInput && !formData.company_id && (
          <p className="mt-1 text-xs text-muted-foreground">
            L'entreprise sera automatiquement liée si elle existe dans la base de données.
          </p>
        )}
      </div>

      {/* Poste */}
      <Input
        label="Poste"
        value={formData.position || ''}
        onChange={(e) => setFormData({ ...formData, position: e.target.value || null })}
        fullWidth
      />

      {/* Cercle */}
      <Select
        label="Cercle"
        value={formData.circle || ''}
        onChange={(e) => setFormData({ ...formData, circle: e.target.value || null })}
        options={[
          { value: '', label: 'Aucun' },
          ...circleOptions,
        ]}
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

      {/* Anniversaire */}
      <Input
        label="Anniversaire"
        type="date"
        value={formData.birthday || ''}
        onChange={(e) => setFormData({ ...formData, birthday: e.target.value || null })}
        fullWidth
      />

      {/* Langue */}
      <Select
        label="Langue"
        value={formData.language || ''}
        onChange={(e) => setFormData({ ...formData, language: e.target.value || null })}
        options={[
          { value: '', label: 'Aucune' },
          ...LANGUAGE_OPTIONS,
        ]}
        fullWidth
      />

      {/* Employé lié */}
      {employees.length > 0 && (
        <Select
          label="Employé lié"
          value={formData.employee_id?.toString() || ''}
          onChange={(e) => setFormData({
            ...formData,
            employee_id: e.target.value ? parseInt(e.target.value) : null,
          })}
          options={[
            { value: '', label: 'Aucun' },
            ...employees.map(e => ({ value: e.id.toString(), label: e.name })),
          ]}
          fullWidth
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          {contact ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
