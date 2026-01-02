'use client';

import { useState, useRef } from 'react';
import { Company, CompanyCreate, CompanyUpdate } from '@/lib/api/companies';
import { mediaAPI } from '@/lib/api/media';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Upload, X, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui';

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: CompanyCreate | CompanyUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  parentCompanies?: Array<{ id: number; name: string }>;
}

export default function CompanyForm({
  company,
  onSubmit,
  onCancel,
  loading = false,
  parentCompanies = [],
}: CompanyFormProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<CompanyCreate>({
    name: company?.name || '',
    parent_company_id: company?.parent_company_id || null,
    description: company?.description || null,
    website: company?.website || null,
    logo_url: company?.logo_url || null,
    email: company?.email || null,
    phone: company?.phone || null,
    address: company?.address || null,
    city: company?.city || null,
    country: company?.country || null,
    is_client: company?.is_client || false,
    facebook: company?.facebook || null,
    instagram: company?.instagram || null,
    linkedin: company?.linkedin || null,
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingLogo(true);
    try {
      const uploadedMedia = await mediaAPI.upload(file, {
        folder: 'companies/logos',
        is_public: true,
      });
      
      // Save file_key if available, otherwise use file_path (URL)
      const logoUrlToSave = uploadedMedia.file_key || uploadedMedia.file_path;
      setFormData({ ...formData, logo_url: logoUrlToSave });
      showToast({
        message: 'Logo uploadé avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de l\'upload du logo',
        type: 'error',
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast({
        message: 'Le nom de l\'entreprise est requis',
        type: 'error',
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled by parent component, but we can add additional handling here if needed
      console.error('Error submitting company form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Logo
        </label>
        <div className="flex items-center gap-4">
          {formData.logo_url ? (
            <div className="relative">
              <img
                src={formData.logo_url}
                alt="Company logo"
                className="w-20 h-20 rounded object-cover border border-border"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded bg-muted flex items-center justify-center border border-border">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {uploadingLogo ? 'Upload...' : formData.logo_url ? 'Changer' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </div>

      {/* Nom de l'entreprise */}
      <Input
        label="Nom de l'entreprise *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        fullWidth
      />

      {/* Entreprise parente */}
      {parentCompanies.length > 0 && (
        <Select
          label="Entreprise parente"
          value={formData.parent_company_id?.toString() || ''}
          onChange={(e) => setFormData({
            ...formData,
            parent_company_id: e.target.value ? parseInt(e.target.value) : null,
          })}
          options={[
            { value: '', label: 'Aucune' },
            ...parentCompanies
              .filter(c => !company || c.id !== company.id) // Exclude self from parent options
              .map(c => ({ value: c.id.toString(), label: c.name })),
          ]}
          fullWidth
        />
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
        />
      </div>

      {/* Site web */}
      <Input
        label="Site web"
        type="url"
        value={formData.website || ''}
        onChange={(e) => setFormData({ ...formData, website: e.target.value || null })}
        placeholder="https://example.com"
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

      {/* Adresse */}
      <Input
        label="Adresse"
        value={formData.address || ''}
        onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
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

      {/* Client (Y/N) */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_client}
            onChange={(e) => setFormData({ ...formData, is_client: e.target.checked })}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm font-medium text-foreground">Client</span>
        </label>
      </div>

      {/* Réseaux sociaux */}
      <div className="space-y-3 pt-2 border-t border-border">
        <h3 className="text-sm font-medium text-foreground">Réseaux sociaux</h3>
        
        <Input
          label="Facebook"
          type="url"
          value={formData.facebook || ''}
          onChange={(e) => setFormData({ ...formData, facebook: e.target.value || null })}
          placeholder="https://facebook.com/..."
          fullWidth
        />

        <Input
          label="Instagram"
          type="url"
          value={formData.instagram || ''}
          onChange={(e) => setFormData({ ...formData, instagram: e.target.value || null })}
          placeholder="https://instagram.com/..."
          fullWidth
        />

        <Input
          label="LinkedIn"
          type="url"
          value={formData.linkedin || ''}
          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value || null })}
          placeholder="https://linkedin.com/company/..."
          fullWidth
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          {company ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
