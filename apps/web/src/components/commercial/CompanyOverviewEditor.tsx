/**
 * CompanyOverviewEditor Component
 * 
 * Composant pour éditer une entreprise directement dans l'onglet Vue d'ensemble,
 * avec édition inline subtile (mode lecture avec crayon pour éditer).
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompanyEditor } from '@/hooks/useCompanyEditor';
import { Company } from '@/lib/api/companies';
import { companiesAPI } from '@/lib/api/companies';
import { Card, Button, Input, Textarea, Select, DatePicker } from '@/components/ui';
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  Building2,
  Globe,
  MapPin,
  Edit2,
  X,
  Mail,
  Phone,
  Link as LinkIcon,
  Facebook,
  Instagram,
  Linkedin,
  Tag
} from 'lucide-react';

export interface CompanyOverviewEditorProps {
  company: Company;
  companyId: number;
  onUpdate: (updatedCompany: Company) => void;
  onError?: (error: Error) => void;
}

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `il y a ${diff} seconde${diff > 1 ? 's' : ''}`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''}`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} heure${Math.floor(diff / 3600) > 1 ? 's' : ''}`;
  return `il y a ${Math.floor(diff / 86400)} jour${Math.floor(diff / 86400) > 1 ? 's' : ''}`;
};

// Composant réutilisable pour un champ éditable
interface EditableFieldProps {
  label: string;
  value: string | number | boolean | null | undefined;
  displayValue?: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  required?: boolean;
}

function EditableField({
  label,
  value,
  displayValue,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  children,
  icon,
  required = false,
}: EditableFieldProps) {
  const hasValue = value !== null && value !== undefined && value !== '';
  const display = displayValue || (hasValue ? String(value) : '-');

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {required && <span className="text-error-500">*</span>}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          {children}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={onSave}
              className="flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Enregistrer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between group">
          <p className={`text-foreground ${!hasValue ? 'text-muted-foreground italic' : 'font-medium'}`}>
            {display}
          </p>
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function CompanyOverviewEditor({
  company: initialCompany,
  companyId,
  onUpdate,
  onError,
}: CompanyOverviewEditorProps) {
  const {
    company,
    updateField,
    saveStatus,
    saveCompany,
    error,
    lastSavedAt,
  } = useCompanyEditor({
    companyId,
    initialCompany,
    onSaveSuccess: onUpdate,
    onSaveError: onError,
  });

  // État pour savoir quel champ est en cours d'édition
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Fetch companies for parent company selection
  const { data: allCompanies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.list(0, 1000),
    staleTime: 1000 * 60 * 5,
  });

  // Handlers pour l'édition
  const handleStartEdit = (fieldName: string) => {
    setEditingField(fieldName);
    const currentValue = (company as any)[fieldName];
    setFieldValues(prev => ({ ...prev, [fieldName]: currentValue }));
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setFieldValues({});
  };

  const handleSaveField = (fieldName: string) => {
    const newValue = fieldValues[fieldName];
    updateField(fieldName as keyof Company, newValue);
    setEditingField(null);
    setFieldValues({});
    setTimeout(() => saveCompany(), 100);
  };

  const getStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enregistrement...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            <span>{lastSavedAt ? formatTimeAgo(lastSavedAt) : 'Enregistré'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Erreur de sauvegarde</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Prepare select options
  const parentCompanyOptions = allCompanies
    .filter(c => c.id !== companyId)
    .map(c => ({
      label: c.name,
      value: String(c.id),
    }));

  return (
    <div className="space-y-6">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getStatusIndicator()}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error.message}
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Informations principales
          </h3>
          <div className="space-y-4">
            <EditableField
              label="Nom de l'entreprise"
              value={editingField === 'name' ? fieldValues.name : company.name}
              isEditing={editingField === 'name'}
              onEdit={() => handleStartEdit('name')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('name')}
              required
            >
              <Input
                value={fieldValues.name !== undefined ? fieldValues.name : (company.name || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Entreprise mère"
              value={editingField === 'parent_company_id' ? fieldValues.parent_company_id : company.parent_company_id}
              displayValue={company.parent_company_name || '-'}
              isEditing={editingField === 'parent_company_id'}
              onEdit={() => handleStartEdit('parent_company_id')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('parent_company_id')}
              icon={<Building2 className="w-4 h-4" />}
            >
              <Select
                options={parentCompanyOptions}
                value={fieldValues.parent_company_id !== undefined 
                  ? (fieldValues.parent_company_id ? String(fieldValues.parent_company_id) : '')
                  : (company.parent_company_id ? String(company.parent_company_id) : '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, parent_company_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
                placeholder="Sélectionner une entreprise mère"
                disabled={companiesLoading}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Description"
              value={editingField === 'description' ? fieldValues.description : company.description}
              displayValue={company.description 
                ? (company.description.length > 100 ? company.description.substring(0, 100) + '...' : company.description)
                : '-'}
              isEditing={editingField === 'description'}
              onEdit={() => handleStartEdit('description')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('description')}
            >
              <Textarea
                value={fieldValues.description !== undefined ? (fieldValues.description || '') : (company.description || '')}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFieldValues(prev => ({ ...prev, description: e.target.value || null }))}
                placeholder="Description de l'entreprise..."
                rows={4}
                fullWidth
                autoFocus
              />
            </EditableField>

            <div className="flex items-center gap-2">
              <EditableField
                label="Statut client"
                value={editingField === 'is_client' ? fieldValues.is_client : company.is_client}
                displayValue={company.is_client ? 'Client' : 'Non-client'}
                isEditing={editingField === 'is_client'}
                onEdit={() => handleStartEdit('is_client')}
                onCancel={handleCancelEdit}
                onSave={() => handleSaveField('is_client')}
              >
                <Select
                  options={[
                    { label: 'Client', value: 'true' },
                    { label: 'Non-client', value: 'false' },
                  ]}
                  value={fieldValues.is_client !== undefined 
                    ? String(fieldValues.is_client)
                    : String(company.is_client)}
                  onChange={(e) => setFieldValues(prev => ({ ...prev, is_client: e.target.value === 'true' }))}
                  fullWidth
                />
              </EditableField>
            </div>
          </div>
        </Card>

        {/* Section 2: Contact */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Contact
          </h3>
          <div className="space-y-4">
            <EditableField
              label="Email"
              value={editingField === 'email' ? fieldValues.email : company.email}
              isEditing={editingField === 'email'}
              onEdit={() => handleStartEdit('email')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('email')}
              icon={<Mail className="w-4 h-4" />}
            >
              <Input
                type="email"
                value={fieldValues.email !== undefined ? (fieldValues.email || '') : (company.email || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, email: e.target.value || null }))}
                placeholder="contact@entreprise.com"
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Téléphone"
              value={editingField === 'phone' ? fieldValues.phone : company.phone}
              isEditing={editingField === 'phone'}
              onEdit={() => handleStartEdit('phone')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('phone')}
              icon={<Phone className="w-4 h-4" />}
            >
              <Input
                type="tel"
                value={fieldValues.phone !== undefined ? (fieldValues.phone || '') : (company.phone || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, phone: e.target.value || null }))}
                placeholder="+33 1 23 45 67 89"
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Site web"
              value={editingField === 'website' ? fieldValues.website : company.website}
              isEditing={editingField === 'website'}
              onEdit={() => handleStartEdit('website')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('website')}
              icon={<Globe className="w-4 h-4" />}
            >
              <Input
                type="url"
                value={fieldValues.website !== undefined ? (fieldValues.website || '') : (company.website || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, website: e.target.value || null }))}
                placeholder="https://www.entreprise.com"
                fullWidth
                autoFocus
              />
            </EditableField>
          </div>
        </Card>
      </div>

      {/* Section 3: Adresse */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Adresse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditableField
            label="Adresse"
            value={editingField === 'address' ? fieldValues.address : company.address}
            isEditing={editingField === 'address'}
            onEdit={() => handleStartEdit('address')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('address')}
            icon={<MapPin className="w-4 h-4" />}
          >
            <Input
              value={fieldValues.address !== undefined ? (fieldValues.address || '') : (company.address || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, address: e.target.value || null }))}
              placeholder="123 Rue Example"
              fullWidth
              autoFocus
            />
          </EditableField>

          <EditableField
            label="Ville"
            value={editingField === 'city' ? fieldValues.city : company.city}
            isEditing={editingField === 'city'}
            onEdit={() => handleStartEdit('city')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('city')}
            icon={<MapPin className="w-4 h-4" />}
          >
            <Input
              value={fieldValues.city !== undefined ? (fieldValues.city || '') : (company.city || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, city: e.target.value || null }))}
              placeholder="Paris"
              fullWidth
              autoFocus
            />
          </EditableField>

          <EditableField
            label="Pays"
            value={editingField === 'country' ? fieldValues.country : company.country}
            isEditing={editingField === 'country'}
            onEdit={() => handleStartEdit('country')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('country')}
            icon={<MapPin className="w-4 h-4" />}
          >
            <Input
              value={fieldValues.country !== undefined ? (fieldValues.country || '') : (company.country || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, country: e.target.value || null }))}
              placeholder="France"
              fullWidth
              autoFocus
            />
          </EditableField>
        </div>
      </Card>

      {/* Section 4: Réseaux sociaux */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Réseaux sociaux
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditableField
            label="LinkedIn"
            value={editingField === 'linkedin' ? fieldValues.linkedin : company.linkedin}
            isEditing={editingField === 'linkedin'}
            onEdit={() => handleStartEdit('linkedin')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('linkedin')}
            icon={<Linkedin className="w-4 h-4" />}
          >
            <Input
              type="url"
              value={fieldValues.linkedin !== undefined ? (fieldValues.linkedin || '') : (company.linkedin || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, linkedin: e.target.value || null }))}
              placeholder="https://linkedin.com/company/..."
              fullWidth
              autoFocus
            />
          </EditableField>

          <EditableField
            label="Facebook"
            value={editingField === 'facebook' ? fieldValues.facebook : company.facebook}
            isEditing={editingField === 'facebook'}
            onEdit={() => handleStartEdit('facebook')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('facebook')}
            icon={<Facebook className="w-4 h-4" />}
          >
            <Input
              type="url"
              value={fieldValues.facebook !== undefined ? (fieldValues.facebook || '') : (company.facebook || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, facebook: e.target.value || null }))}
              placeholder="https://facebook.com/..."
              fullWidth
              autoFocus
            />
          </EditableField>

          <EditableField
            label="Instagram"
            value={editingField === 'instagram' ? fieldValues.instagram : company.instagram}
            isEditing={editingField === 'instagram'}
            onEdit={() => handleStartEdit('instagram')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('instagram')}
            icon={<Instagram className="w-4 h-4" />}
          >
            <Input
              type="url"
              value={fieldValues.instagram !== undefined ? (fieldValues.instagram || '') : (company.instagram || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, instagram: e.target.value || null }))}
              placeholder="https://instagram.com/..."
              fullWidth
              autoFocus
            />
          </EditableField>
        </div>
      </Card>

      {/* Section 5: Métadonnées */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Métadonnées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Créé le</label>
            <p className="text-foreground">
              {initialCompany.created_at 
                ? new Date(initialCompany.created_at).toLocaleString('fr-FR')
                : '-'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Dernière modification</label>
            <p className="text-foreground">
              {initialCompany.updated_at 
                ? new Date(initialCompany.updated_at).toLocaleString('fr-FR')
                : '-'}
            </p>
          </div>

          {company.contacts_count !== undefined && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nombre de contacts</label>
              <p className="text-foreground">
                {company.contacts_count}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
