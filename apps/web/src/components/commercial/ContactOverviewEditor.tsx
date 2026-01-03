/**
 * ContactOverviewEditor Component
 * 
 * Composant pour éditer un contact directement dans l'onglet Vue d'ensemble,
 * avec édition inline subtile (mode lecture avec crayon pour éditer).
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useContactEditor } from '@/hooks/useContactEditor';
import { Contact } from '@/lib/api/contacts';
import { companiesAPI } from '@/lib/api/companies';
import { employeesAPI } from '@/lib/api/employees';
import { Card, Button, Input, Select } from '@/components/ui';
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  X,
  Calendar,
  Building2,
  Globe,
  Linkedin
} from 'lucide-react';

export interface ContactOverviewEditorProps {
  contact: Contact;
  contactId: number;
  onUpdate: (updatedContact: Contact) => void;
  onError?: (error: Error) => void;
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateForInput = (date: string | null | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  value: string | number | null | undefined;
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

export function ContactOverviewEditor({
  contact: initialContact,
  contactId,
  onUpdate,
  onError,
}: ContactOverviewEditorProps) {
  const {
    contact,
    updateField,
    saveStatus,
    saveContact,
    error,
    lastSavedAt,
  } = useContactEditor({
    contactId,
    initialContact,
    onSaveSuccess: onUpdate,
    onSaveError: onError,
  });

  // État pour savoir quel champ est en cours d'édition
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.list(0, 1000),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch employees (users)
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAPI.list(0, 1000),
    staleTime: 1000 * 60 * 5,
  });

  // Handlers pour l'édition
  const handleStartEdit = (fieldName: string) => {
    setEditingField(fieldName);
    const currentValue = (contact as any)[fieldName];
    setFieldValues(prev => ({ ...prev, [fieldName]: currentValue }));
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setFieldValues({});
  };

  const handleSaveField = (fieldName: string) => {
    const newValue = fieldValues[fieldName];
    updateField(fieldName as keyof Contact, newValue);
    setEditingField(null);
    setFieldValues({});
    setTimeout(() => saveContact(), 100);
  };

  // Handle circle/tags change
  const handleCircleChange = (value: string) => {
    setFieldValues(prev => ({ ...prev, circle: value || null }));
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
  const companyOptions = companies.map(c => ({
    label: c.name,
    value: String(c.id),
  }));

  const employeeOptions = employees.map(e => ({
    label: `${e.first_name} ${e.last_name}${e.email ? ` (${e.email})` : ''}`,
    value: String(e.id),
  }));

  const languageOptions = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Italiano', value: 'it' },
  ];

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
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Prénom"
                value={editingField === 'first_name' ? fieldValues.first_name : contact.first_name}
                isEditing={editingField === 'first_name'}
                onEdit={() => handleStartEdit('first_name')}
                onCancel={handleCancelEdit}
                onSave={() => handleSaveField('first_name')}
                required
              >
                <Input
                  value={fieldValues.first_name !== undefined ? fieldValues.first_name : (contact.first_name || '')}
                  onChange={(e) => setFieldValues(prev => ({ ...prev, first_name: e.target.value }))}
                  fullWidth
                  autoFocus
                />
              </EditableField>

              <EditableField
                label="Nom"
                value={editingField === 'last_name' ? fieldValues.last_name : contact.last_name}
                isEditing={editingField === 'last_name'}
                onEdit={() => handleStartEdit('last_name')}
                onCancel={handleCancelEdit}
                onSave={() => handleSaveField('last_name')}
                required
              >
                <Input
                  value={fieldValues.last_name !== undefined ? fieldValues.last_name : (contact.last_name || '')}
                  onChange={(e) => setFieldValues(prev => ({ ...prev, last_name: e.target.value }))}
                  fullWidth
                  autoFocus
                />
              </EditableField>
            </div>

            <EditableField
              label="Email"
              value={editingField === 'email' ? fieldValues.email : contact.email}
              isEditing={editingField === 'email'}
              onEdit={() => handleStartEdit('email')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('email')}
              icon={<Mail className="w-4 h-4" />}
            >
              <Input
                type="email"
                value={fieldValues.email !== undefined ? (fieldValues.email || '') : (contact.email || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, email: e.target.value || null }))}
                placeholder="email@example.com"
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Téléphone"
              value={editingField === 'phone' ? fieldValues.phone : contact.phone}
              isEditing={editingField === 'phone'}
              onEdit={() => handleStartEdit('phone')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('phone')}
              icon={<Phone className="w-4 h-4" />}
            >
              <Input
                type="tel"
                value={fieldValues.phone !== undefined ? (fieldValues.phone || '') : (contact.phone || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, phone: e.target.value || null }))}
                placeholder="+33 6 12 34 56 78"
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Poste"
              value={editingField === 'position' ? fieldValues.position : contact.position}
              isEditing={editingField === 'position'}
              onEdit={() => handleStartEdit('position')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('position')}
            >
              <Input
                value={fieldValues.position !== undefined ? (fieldValues.position || '') : (contact.position || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, position: e.target.value || null }))}
                placeholder="Ex: Directeur commercial"
                fullWidth
                autoFocus
              />
            </EditableField>
          </div>
        </Card>

        {/* Section 2: Informations professionnelles */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Informations professionnelles
          </h3>
          <div className="space-y-4">
            <EditableField
              label="Entreprise"
              value={editingField === 'company_id' ? fieldValues.company_id : contact.company_id}
              displayValue={contact.company_name || '-'}
              isEditing={editingField === 'company_id'}
              onEdit={() => handleStartEdit('company_id')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('company_id')}
              icon={<Building2 className="w-4 h-4" />}
            >
              <Select
                options={companyOptions}
                value={fieldValues.company_id !== undefined 
                  ? (fieldValues.company_id ? String(fieldValues.company_id) : '')
                  : (contact.company_id ? String(contact.company_id) : '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, company_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
                placeholder="Sélectionner une entreprise"
                disabled={companiesLoading}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Cercle/Tags"
              value={editingField === 'circle' ? fieldValues.circle : contact.circle}
              displayValue={contact.circle || '-'}
              isEditing={editingField === 'circle'}
              onEdit={() => handleStartEdit('circle')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('circle')}
              icon={<Tag className="w-4 h-4" />}
            >
              <Input
                value={fieldValues.circle !== undefined ? (fieldValues.circle || '') : (contact.circle || '')}
                onChange={(e) => handleCircleChange(e.target.value)}
                placeholder="Ex: Client, Prospect, Partenaire (séparés par des virgules)"
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Employé lié"
              value={editingField === 'employee_id' ? fieldValues.employee_id : contact.employee_id}
              displayValue={contact.employee_name || '-'}
              isEditing={editingField === 'employee_id'}
              onEdit={() => handleStartEdit('employee_id')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('employee_id')}
              icon={<User className="w-4 h-4" />}
            >
              <Select
                options={employeeOptions}
                value={fieldValues.employee_id !== undefined 
                  ? (fieldValues.employee_id ? String(fieldValues.employee_id) : '')
                  : (contact.employee_id ? String(contact.employee_id) : '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, employee_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
                placeholder="Sélectionner un employé"
                disabled={employeesLoading}
                fullWidth
              />
            </EditableField>
          </div>
        </Card>
      </div>

      {/* Section 3: Informations personnelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Localisation
          </h3>
          <div className="space-y-4">
            <EditableField
              label="Ville"
              value={editingField === 'city' ? fieldValues.city : contact.city}
              isEditing={editingField === 'city'}
              onEdit={() => handleStartEdit('city')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('city')}
              icon={<MapPin className="w-4 h-4" />}
            >
              <Input
                value={fieldValues.city !== undefined ? (fieldValues.city || '') : (contact.city || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, city: e.target.value || null }))}
                placeholder="Ex: Paris"
                fullWidth
                autoFocus
              />
            </EditableField>

            <EditableField
              label="Pays"
              value={editingField === 'country' ? fieldValues.country : contact.country}
              isEditing={editingField === 'country'}
              onEdit={() => handleStartEdit('country')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('country')}
              icon={<MapPin className="w-4 h-4" />}
            >
              <Input
                value={fieldValues.country !== undefined ? (fieldValues.country || '') : (contact.country || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, country: e.target.value || null }))}
                placeholder="Ex: France"
                fullWidth
                autoFocus
              />
            </EditableField>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Informations personnelles
          </h3>
          <div className="space-y-4">
            <EditableField
              label="Date de naissance"
              value={editingField === 'birthday' ? fieldValues.birthday : contact.birthday}
              displayValue={formatDate(editingField === 'birthday' ? fieldValues.birthday : contact.birthday)}
              isEditing={editingField === 'birthday'}
              onEdit={() => handleStartEdit('birthday')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('birthday')}
              icon={<Calendar className="w-4 h-4" />}
            >
              <DatePicker
                type="date"
                value={fieldValues.birthday !== undefined 
                  ? formatDateForInput(fieldValues.birthday)
                  : formatDateForInput(contact.birthday)}
                onChange={(e) => setFieldValues(prev => ({ ...prev, birthday: e.target.value || null }))}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Langue"
              value={editingField === 'language' ? fieldValues.language : contact.language}
              isEditing={editingField === 'language'}
              onEdit={() => handleStartEdit('language')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('language')}
              icon={<Globe className="w-4 h-4" />}
            >
              <Select
                options={languageOptions}
                value={fieldValues.language !== undefined ? (fieldValues.language || '') : (contact.language || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, language: e.target.value || null }))}
                placeholder="Sélectionner une langue"
                fullWidth
              />
            </EditableField>

            <EditableField
              label="LinkedIn"
              value={editingField === 'linkedin' ? fieldValues.linkedin : contact.linkedin}
              isEditing={editingField === 'linkedin'}
              onEdit={() => handleStartEdit('linkedin')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('linkedin')}
              icon={<Linkedin className="w-4 h-4" />}
            >
              <Input
                type="url"
                value={fieldValues.linkedin !== undefined ? (fieldValues.linkedin || '') : (contact.linkedin || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, linkedin: e.target.value || null }))}
                placeholder="https://linkedin.com/in/..."
                fullWidth
                autoFocus
              />
            </EditableField>
          </div>
        </Card>
      </div>

      {/* Section 4: Métadonnées */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Métadonnées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Créé le</label>
            <p className="text-foreground">
              {initialContact.created_at 
                ? new Date(initialContact.created_at).toLocaleString('fr-FR')
                : '-'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Dernière modification</label>
            <p className="text-foreground">
              {initialContact.updated_at 
                ? new Date(initialContact.updated_at).toLocaleString('fr-FR')
                : '-'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
