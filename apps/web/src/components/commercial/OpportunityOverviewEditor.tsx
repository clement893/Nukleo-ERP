/**
 * OpportunityOverviewEditor Component
 * 
 * Composant pour éditer une opportunité directement dans l'onglet Vue d'ensemble,
 * avec édition inline subtile (mode lecture avec crayon pour éditer).
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOpportunityEditor } from '@/hooks/useOpportunityEditor';
import { Opportunity } from '@/lib/api/opportunities';
import { pipelinesAPI } from '@/lib/api/pipelines';
import { companiesAPI } from '@/lib/api/companies';
import { contactsAPI } from '@/lib/api/contacts';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';
import { Card, Button, Input, Textarea, Select, DatePicker } from '@/components/ui';
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  Tag,
  User,
  Link as LinkIcon,
  MapPin,
  Edit2,
  X,
  Calendar,
  Building2
} from 'lucide-react';
import MultiSelect from '@/components/ui/MultiSelect';

export interface OpportunityOverviewEditorProps {
  opportunity: Opportunity;
  opportunityId: string;
  onUpdate: (updatedOpportunity: Opportunity) => void;
  onError?: (error: Error) => void;
}

interface User {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

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
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `il y a ${mins} minute${mins > 1 ? 's' : ''}`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  const days = Math.floor(diff / 86400);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
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

export function OpportunityOverviewEditor({
  opportunity: initialOpportunity,
  opportunityId,
  onUpdate,
  onError,
}: OpportunityOverviewEditorProps) {
  const {
    opportunity,
    updateField,
    saveStatus,
    saveOpportunity,
    error,
    lastSavedAt,
  } = useOpportunityEditor({
    opportunityId,
    initialOpportunity,
    onSaveSuccess: onUpdate,
    onSaveError: onError,
  });

  // État pour savoir quel champ est en cours d'édition
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Fetch pipelines
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelinesAPI.list(0, 100, true),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch selected pipeline stages
  const selectedPipeline = useMemo(() => {
    return pipelines.find(p => p.id === opportunity.pipeline_id);
  }, [pipelines, opportunity.pipeline_id]);

  const { data: pipelineStages = [] } = useQuery({
    queryKey: ['pipeline-stages', opportunity.pipeline_id],
    queryFn: async () => {
      if (!opportunity.pipeline_id || !selectedPipeline) return [];
      return selectedPipeline.stages || [];
    },
    enabled: !!opportunity.pipeline_id && !!selectedPipeline,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.list(0, 1000),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.list(0, 1000, true),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/users', {
        params: { limit: 1000 },
      });
      const data = extractApiData<User[] | { items: User[] }>(response);
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'items' in data) {
        return (data as { items: User[] }).items;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Handlers pour l'édition
  const handleStartEdit = (fieldName: string) => {
    setEditingField(fieldName);
    // Sauvegarder la valeur actuelle
    const currentValue = (opportunity as any)[fieldName];
    setFieldValues(prev => ({ ...prev, [fieldName]: currentValue }));
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setFieldValues({});
  };

  const handleSaveField = (fieldName: string) => {
    const newValue = fieldValues[fieldName];
    updateField(fieldName as keyof Opportunity, newValue);
    setEditingField(null);
    setFieldValues({});
    // Sauvegarder immédiatement
    setTimeout(() => saveOpportunity(), 100);
  };

  // Handle pipeline change - reset stage if not in new pipeline
  const handlePipelineChange = (pipelineId: string) => {
    const newPipeline = pipelines.find(p => p.id === pipelineId);
    const currentStageId = opportunity.stage_id;
    
    updateField('pipeline_id', pipelineId);
    
    if (newPipeline && currentStageId) {
      const stageExists = newPipeline.stages?.some(s => s.id === currentStageId);
      if (!stageExists) {
        updateField('stage_id', null);
      }
    } else {
      updateField('stage_id', null);
    }
    
    // Sauvegarder immédiatement
    setTimeout(() => saveOpportunity(), 100);
  };

  // Handle amount change - parse currency
  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const amount = cleaned ? parseFloat(cleaned) : null;
    setFieldValues(prev => ({ ...prev, amount }));
  };

  // Handle contact IDs change
  const handleContactsChange = (contactIds: string[]) => {
    const ids = contactIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    setFieldValues(prev => ({ ...prev, contact_ids: ids }));
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
  const pipelineOptions = pipelines.map(p => ({
    label: p.name,
    value: p.id,
  }));

  const stageOptions = pipelineStages.map(s => ({
    label: s.name,
    value: s.id,
  }));

  const companyOptions = companies.map(c => ({
    label: c.name,
    value: String(c.id),
  }));

  const contactOptions = contacts.map(c => ({
    label: `${c.first_name} ${c.last_name}`,
    value: String(c.id),
  }));

  const userOptions = users.map(u => ({
    label: u.first_name && u.last_name 
      ? `${u.first_name} ${u.last_name} (${u.email})`
      : u.email,
    value: String(u.id),
  }));

  const statusOptions = [
    { label: 'Ouverte', value: 'open' },
    { label: 'Qualifiée', value: 'qualified' },
    { label: 'Proposition', value: 'proposal' },
    { label: 'Négociation', value: 'negotiation' },
    { label: 'Gagnée', value: 'won' },
    { label: 'Perdue', value: 'lost' },
    { label: 'Annulée', value: 'cancelled' },
  ];

  const selectedContactIds = (opportunity.contact_ids || []).map(id => String(id));
  const editingContactIds = fieldValues.contact_ids 
    ? fieldValues.contact_ids.map((id: number) => String(id))
    : selectedContactIds;

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
              label="Nom de l'opportunité"
              value={editingField === 'name' ? fieldValues.name : opportunity.name}
              isEditing={editingField === 'name'}
              onEdit={() => handleStartEdit('name')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('name')}
              required
            >
              <Input
                value={fieldValues.name !== undefined ? fieldValues.name : (opportunity.name || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                autoFocus
              />
            </EditableField>
            
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Montant"
                value={editingField === 'amount' ? fieldValues.amount : opportunity.amount}
                displayValue={formatCurrency(editingField === 'amount' ? fieldValues.amount : opportunity.amount)}
                isEditing={editingField === 'amount'}
                onEdit={() => handleStartEdit('amount')}
                onCancel={handleCancelEdit}
                onSave={() => {
                  const amount = fieldValues.amount;
                  updateField('amount', amount);
                  setEditingField(null);
                  setFieldValues({});
                  setTimeout(() => saveOpportunity(), 100);
                }}
                icon={<DollarSign className="w-4 h-4" />}
              >
                <Input
                  type="text"
                  value={fieldValues.amount !== undefined 
                    ? (fieldValues.amount ? formatCurrency(fieldValues.amount) : '')
                    : (opportunity.amount ? formatCurrency(opportunity.amount) : '')}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0,00 €"
                  fullWidth
                  autoFocus
                />
              </EditableField>
              
              <EditableField
                label="Probabilité"
                value={editingField === 'probability' ? fieldValues.probability : opportunity.probability}
                displayValue={opportunity.probability ? `${opportunity.probability}%` : '-'}
                isEditing={editingField === 'probability'}
                onEdit={() => handleStartEdit('probability')}
                onCancel={handleCancelEdit}
                onSave={() => handleSaveField('probability')}
                icon={<TrendingUp className="w-4 h-4" />}
              >
                <Input
                  type="number"
                  value={fieldValues.probability !== undefined ? fieldValues.probability : (opportunity.probability || '')}
                  onChange={(e) => setFieldValues(prev => ({ ...prev, probability: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  min={0}
                  max={100}
                  placeholder="0-100"
                  fullWidth
                  autoFocus
                />
              </EditableField>
            </div>

            <EditableField
              label="Date de clôture prévue"
              value={editingField === 'expected_close_date' ? fieldValues.expected_close_date : opportunity.expected_close_date}
              displayValue={formatDate(editingField === 'expected_close_date' ? fieldValues.expected_close_date : opportunity.expected_close_date)}
              isEditing={editingField === 'expected_close_date'}
              onEdit={() => handleStartEdit('expected_close_date')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('expected_close_date')}
              icon={<Calendar className="w-4 h-4" />}
            >
              <DatePicker
                type="date"
                value={fieldValues.expected_close_date !== undefined 
                  ? formatDateForInput(fieldValues.expected_close_date)
                  : formatDateForInput(opportunity.expected_close_date)}
                onChange={(e) => setFieldValues(prev => ({ ...prev, expected_close_date: e.target.value || null }))}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Statut"
              value={editingField === 'status' ? fieldValues.status : opportunity.status}
              displayValue={opportunity.status || '-'}
              isEditing={editingField === 'status'}
              onEdit={() => handleStartEdit('status')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('status')}
            >
              <Select
                options={statusOptions}
                value={fieldValues.status !== undefined ? (fieldValues.status || '') : (opportunity.status || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, status: e.target.value || null }))}
                placeholder="Sélectionner un statut"
                fullWidth
              />
            </EditableField>
          </div>
        </Card>

        {/* Section 2: Pipeline et assignation */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Pipeline et assignation
          </h3>
          <div className="space-y-4">
            <EditableField
              label="Pipeline"
              value={editingField === 'pipeline_id' ? fieldValues.pipeline_id : opportunity.pipeline_id}
              displayValue={selectedPipeline?.name || '-'}
              isEditing={editingField === 'pipeline_id'}
              onEdit={() => handleStartEdit('pipeline_id')}
              onCancel={handleCancelEdit}
              onSave={() => {
                const pipelineId = fieldValues.pipeline_id;
                handlePipelineChange(pipelineId);
                setEditingField(null);
                setFieldValues({});
              }}
              required
            >
              <Select
                options={pipelineOptions}
                value={fieldValues.pipeline_id !== undefined ? fieldValues.pipeline_id : (opportunity.pipeline_id || '')}
                onChange={(e) => {
                  const pipelineId = e.target.value;
                  setFieldValues(prev => ({ ...prev, pipeline_id: pipelineId }));
                  // Reset stage if pipeline changes
                  const newPipeline = pipelines.find(p => p.id === pipelineId);
                  if (newPipeline && opportunity.stage_id) {
                    const stageExists = newPipeline.stages?.some(s => s.id === opportunity.stage_id);
                    if (!stageExists) {
                      setFieldValues(prev => ({ ...prev, stage_id: null }));
                    }
                  }
                }}
                placeholder="Sélectionner un pipeline"
                disabled={pipelinesLoading}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Étape"
              value={editingField === 'stage_id' ? fieldValues.stage_id : opportunity.stage_id}
              displayValue={pipelineStages.find(s => s.id === opportunity.stage_id)?.name || '-'}
              isEditing={editingField === 'stage_id'}
              onEdit={() => handleStartEdit('stage_id')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('stage_id')}
            >
              <Select
                options={stageOptions}
                value={fieldValues.stage_id !== undefined ? (fieldValues.stage_id || '') : (opportunity.stage_id || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, stage_id: e.target.value || null }))}
                placeholder="Sélectionner une étape"
                disabled={!opportunity.pipeline_id || pipelinesLoading}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Assigné à"
              value={editingField === 'assigned_to_id' ? fieldValues.assigned_to_id : opportunity.assigned_to_id}
              displayValue={users.find(u => u.id === opportunity.assigned_to_id) 
                ? (users.find(u => u.id === opportunity.assigned_to_id)?.first_name && users.find(u => u.id === opportunity.assigned_to_id)?.last_name
                  ? `${users.find(u => u.id === opportunity.assigned_to_id)?.first_name} ${users.find(u => u.id === opportunity.assigned_to_id)?.last_name}`
                  : users.find(u => u.id === opportunity.assigned_to_id)?.email)
                : '-'}
              isEditing={editingField === 'assigned_to_id'}
              onEdit={() => handleStartEdit('assigned_to_id')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('assigned_to_id')}
              icon={<User className="w-4 h-4" />}
            >
              <Select
                options={userOptions}
                value={fieldValues.assigned_to_id !== undefined 
                  ? (fieldValues.assigned_to_id ? String(fieldValues.assigned_to_id) : '')
                  : (opportunity.assigned_to_id ? String(opportunity.assigned_to_id) : '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, assigned_to_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
                placeholder="Sélectionner un utilisateur"
                disabled={usersLoading}
                fullWidth
              />
            </EditableField>

            <EditableField
              label="Région"
              value={editingField === 'region' ? fieldValues.region : opportunity.region}
              isEditing={editingField === 'region'}
              onEdit={() => handleStartEdit('region')}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveField('region')}
              icon={<MapPin className="w-4 h-4" />}
            >
              <Input
                value={fieldValues.region !== undefined ? (fieldValues.region || '') : (opportunity.region || '')}
                onChange={(e) => setFieldValues(prev => ({ ...prev, region: e.target.value || null }))}
                placeholder="Ex: Europe, Amérique du Nord..."
                fullWidth
                autoFocus
              />
            </EditableField>
          </div>
        </Card>
      </div>

      {/* Section 3: Relations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Entreprise
          </h3>
          <EditableField
            label="Entreprise"
            value={editingField === 'company_id' ? fieldValues.company_id : opportunity.company_id}
            displayValue={opportunity.company_name || '-'}
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
                : (opportunity.company_id ? String(opportunity.company_id) : '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, company_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
              placeholder="Sélectionner une entreprise"
              disabled={companiesLoading}
              fullWidth
            />
          </EditableField>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Contacts ({editingField === 'contact_ids' ? editingContactIds.length : selectedContactIds.length})
          </h3>
          <EditableField
            label="Contacts"
            value={editingField === 'contact_ids' ? editingContactIds.length : selectedContactIds.length}
            displayValue={selectedContactIds.length > 0 
              ? `${selectedContactIds.length} contact${selectedContactIds.length > 1 ? 's' : ''}`
              : 'Aucun contact'}
            isEditing={editingField === 'contact_ids'}
            onEdit={() => handleStartEdit('contact_ids')}
            onCancel={handleCancelEdit}
            onSave={() => {
              const contactIds = fieldValues.contact_ids;
              updateField('contact_ids', contactIds);
              setEditingField(null);
              setFieldValues({});
              setTimeout(() => saveOpportunity(), 100);
            }}
            icon={<User className="w-4 h-4" />}
          >
            <MultiSelect
              options={contactOptions}
              value={editingContactIds}
              onChange={handleContactsChange}
              placeholder="Sélectionner des contacts"
              disabled={contactsLoading}
              fullWidth
            />
          </EditableField>
        </Card>
      </div>

      {/* Section 4: Informations complémentaires */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Informations complémentaires
        </h3>
        <div className="space-y-4">
          <EditableField
            label="Description"
            value={editingField === 'description' ? fieldValues.description : opportunity.description}
            displayValue={opportunity.description 
              ? (opportunity.description.length > 100 ? opportunity.description.substring(0, 100) + '...' : opportunity.description)
              : '-'}
            isEditing={editingField === 'description'}
            onEdit={() => handleStartEdit('description')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('description')}
          >
            <Textarea
              value={fieldValues.description !== undefined ? (fieldValues.description || '') : (opportunity.description || '')}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFieldValues(prev => ({ ...prev, description: e.target.value || null }))}
              placeholder="Description de l'opportunité..."
              rows={4}
              fullWidth
              autoFocus
            />
          </EditableField>

          <EditableField
            label="Lien service offer"
            value={editingField === 'service_offer_link' ? fieldValues.service_offer_link : opportunity.service_offer_link}
            isEditing={editingField === 'service_offer_link'}
            onEdit={() => handleStartEdit('service_offer_link')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('service_offer_link')}
            icon={<LinkIcon className="w-4 h-4" />}
          >
            <Input
              type="url"
              value={fieldValues.service_offer_link !== undefined ? (fieldValues.service_offer_link || '') : (opportunity.service_offer_link || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, service_offer_link: e.target.value || null }))}
              placeholder="https://..."
              fullWidth
              autoFocus
            />
          </EditableField>

          <EditableField
            label="Segment"
            value={editingField === 'segment' ? fieldValues.segment : opportunity.segment}
            isEditing={editingField === 'segment'}
            onEdit={() => handleStartEdit('segment')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('segment')}
            icon={<Tag className="w-4 h-4" />}
          >
            <Input
              value={fieldValues.segment !== undefined ? (fieldValues.segment || '') : (opportunity.segment || '')}
              onChange={(e) => setFieldValues(prev => ({ ...prev, segment: e.target.value || null }))}
              placeholder="Ex: B2B, B2C, Public..."
              fullWidth
              autoFocus
            />
          </EditableField>
        </div>
      </Card>

      {/* Section 5: Dates et métadonnées */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Dates et métadonnées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Créé le</label>
            <p className="text-foreground">
              {initialOpportunity.created_at 
                ? new Date(initialOpportunity.created_at).toLocaleString('fr-FR')
                : '-'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Créé par</label>
            <p className="text-foreground">
              {initialOpportunity.created_by_name || '-'}
            </p>
          </div>

          <EditableField
            label="Date d'ouverture"
            value={editingField === 'opened_at' ? fieldValues.opened_at : opportunity.opened_at}
            displayValue={formatDate(editingField === 'opened_at' ? fieldValues.opened_at : opportunity.opened_at)}
            isEditing={editingField === 'opened_at'}
            onEdit={() => handleStartEdit('opened_at')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('opened_at')}
            icon={<Calendar className="w-4 h-4" />}
          >
            <DatePicker
              type="date"
              value={fieldValues.opened_at !== undefined 
                ? formatDateForInput(fieldValues.opened_at)
                : formatDateForInput(opportunity.opened_at)}
              onChange={(e) => setFieldValues(prev => ({ ...prev, opened_at: e.target.value || null }))}
              fullWidth
            />
          </EditableField>

          <EditableField
            label="Date de clôture"
            value={editingField === 'closed_at' ? fieldValues.closed_at : opportunity.closed_at}
            displayValue={formatDate(editingField === 'closed_at' ? fieldValues.closed_at : opportunity.closed_at)}
            isEditing={editingField === 'closed_at'}
            onEdit={() => handleStartEdit('closed_at')}
            onCancel={handleCancelEdit}
            onSave={() => handleSaveField('closed_at')}
            icon={<Calendar className="w-4 h-4" />}
          >
            <DatePicker
              type="date"
              value={fieldValues.closed_at !== undefined 
                ? formatDateForInput(fieldValues.closed_at)
                : formatDateForInput(opportunity.closed_at)}
              onChange={(e) => setFieldValues(prev => ({ ...prev, closed_at: e.target.value || null }))}
              fullWidth
            />
          </EditableField>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Dernière modification</label>
            <p className="text-foreground">
              {initialOpportunity.updated_at 
                ? new Date(initialOpportunity.updated_at).toLocaleString('fr-FR')
                : '-'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
