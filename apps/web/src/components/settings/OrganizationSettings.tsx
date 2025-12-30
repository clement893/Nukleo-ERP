/**
 * Organization Settings Component
 * Organization-level settings and configuration
 * Updated: Fixed unused imports
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import { Save, Building2, Globe, MapPin, Mail, Upload, X, Image as ImageIcon } from 'lucide-react';
import { mediaAPI } from '@/lib/api/media';

export interface OrganizationSettingsProps {
  organization?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    logo_url?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    timezone?: string;
    locale?: string;
  };
  onSave?: (data: OrganizationSettingsData) => void | Promise<void>;
  onChange?: (data: OrganizationSettingsData) => void;
  className?: string;
}

export interface OrganizationSettingsData {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  timezone?: string;
  locale?: string;
}

const timezoneOptions: SelectOption[] = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Chicago (CST)', value: 'America/Chicago' },
  { label: 'America/Denver (MST)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
];

const localeOptions: SelectOption[] = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'French (FR)', value: 'fr-FR' },
  { label: 'Spanish (ES)', value: 'es-ES' },
  { label: 'German (DE)', value: 'de-DE' },
];

export default function OrganizationSettings({
  organization,
  onSave,
  onChange,
  className,
}: OrganizationSettingsProps) {
  const [formData, setFormData] = useState<OrganizationSettingsData>({
    name: organization?.name || '',
    slug: organization?.slug || '',
    description: organization?.description || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    website: organization?.website || '',
    logo_url: organization?.logo_url || '',
    address: organization?.address || {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    timezone: organization?.timezone || 'UTC',
    locale: organization?.locale || 'en-US',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((field: keyof OrganizationSettingsData, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      onChange?.(updated);
      return updated;
    });
    setErrors((prev) => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, [onChange]);

  const handleAddressChange = useCallback((field: string, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        address: {
          ...prev.address!,
          [field]: value,
        },
      };
      onChange?.(updated);
      return updated;
    });
  }, [onChange]);

  const handleSlugChange = useCallback((value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    handleChange('slug', slug);
  }, [handleChange]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ logo: 'Le fichier doit être une image' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ logo: 'L\'image ne doit pas dépasser 5MB' });
      return;
    }

    setLogoUploading(true);
    setErrors((prev) => ({ ...prev, logo: '' }));

    try {
      const uploadedMedia = await mediaAPI.upload(file, {
        folder: 'organization-logos',
        is_public: true,
      });
      
      handleChange('logo_url', uploadedMedia.file_path || uploadedMedia.file_key || uploadedMedia.id);
    } catch (error) {
      setErrors({ logo: 'Erreur lors de l\'upload du logo. Veuillez réessayer.' });
      console.error('Logo upload error:', error);
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [handleChange]);

  const handleRemoveLogo = useCallback(() => {
    handleChange('logo_url', '');
  }, [handleChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave?.(formData);
    } catch (_error) {
      setErrors({ submit: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [formData, onSave]);

  return (
    <div className={clsx('space-y-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Information */}
        <Card title="Organization Information" className="bg-background">
          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Logo de l'entreprise
              </label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative">
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="h-16 w-16 object-contain rounded-lg border border-border bg-background p-2"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-danger text-white rounded-full hover:bg-danger/80 transition-colors"
                      aria-label="Supprimer le logo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={logoUploading}
                      disabled={logoUploading}
                      className="cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.logo_url ? 'Changer le logo' : 'Télécharger un logo'}
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formats acceptés: JPG, PNG, GIF. Taille max: 5MB
                  </p>
                  {errors.logo && (
                    <p className="text-xs text-danger mt-1">{errors.logo}</p>
                  )}
                </div>
              </div>
            </div>
            <Input
              label="Organization Name"
              value={formData.name}
              onChange={(e) => {
                handleChange('name', e.target.value);
                if (!formData.slug) {
                  handleSlugChange(e.target.value);
                }
              }}
              placeholder="Acme Inc."
              leftIcon={<Building2 className="w-5 h-5" />}
              error={errors.name}
              required
            />
            <Input
              label="Organization Slug"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="acme-inc"
              helperText="Used in URLs. Only lowercase letters, numbers, and hyphens."
              error={errors.slug}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              error={errors.phone}
            />
            <Input
              label="Website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
              leftIcon={<Globe className="w-5 h-5" />}
              error={errors.website}
            />
          </div>
        </Card>

        {/* Address */}
        <Card title="Address" className="bg-background">
          <div className="space-y-4">
            <Input
              label="Address Line 1"
              value={formData.address?.line1 || ''}
              onChange={(e) => handleAddressChange('line1', e.target.value)}
              placeholder="123 Main Street"
              leftIcon={<MapPin className="w-5 h-5" />}
              required
            />
            <Input
              label="Address Line 2 (Optional)"
              value={formData.address?.line2 || ''}
              onChange={(e) => handleAddressChange('line2', e.target.value)}
              placeholder="Suite 100"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.address?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="New York"
                required
              />
              <Input
                label="State/Province"
                value={formData.address?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="NY"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                value={formData.address?.postalCode || ''}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                placeholder="10001"
                required
              />
              <Input
                label="Country"
                value={formData.address?.country || ''}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="United States"
                required
              />
            </div>
          </div>
        </Card>

        {/* Regional Settings */}
        <Card title="Regional Settings" className="bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Timezone"
              options={timezoneOptions}
              value={formData.timezone || 'UTC'}
              onChange={(e) => handleChange('timezone', e.target.value)}
            />
            <Select
              label="Locale"
              options={localeOptions}
              value={formData.locale || 'en-US'}
              onChange={(e) => handleChange('locale', e.target.value)}
            />
          </div>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800 text-sm text-danger-800 dark:text-danger-200">
            {errors.submit}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

