/**
 * OpportunityOverviewEditor Component
 * 
 * Composant pour éditer une opportunité directement dans l'onglet Vue d'ensemble,
 * avec édition inline et sauvegarde automatique.
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOpportunityEditor } from '@/hooks/useOpportunityEditor';
import { Opportunity } from '@/lib/api/opportunities';
import { pipelinesAPI, Pipeline } from '@/lib/api/pipelines';
import { companiesAPI, Company } from '@/lib/api/companies';
import { contactsAPI, Contact } from '@/lib/api/contacts';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';
import { Card, Button, Input, Textarea, Select, DatePicker, Badge } from '@/components/ui';
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  Save,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  Tag,
  User,
  Users,
  Globe,
  Link as LinkIcon,
  MapPin,
  FileText,
  Clock
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
  if (!amount) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
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

export function OpportunityOverviewEditor({
  opportunity: initialOpportunity,
  opportunityId,
  onUpdate,
  onError,
}: OpportunityOverviewEditorProps) {
  const {
    opportunity,
    updateField,
    updateFields,
    saveStatus,
    saveOpportunity,
    error,
    lastSavedAt,
    hasChanges,
  } = useOpportunityEditor({
    opportunityId,
    initialOpportunity,
    onSaveSuccess: onUpdate,
    onSaveError: onError,
  });

  // Fetch pipelines
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelinesAPI.list(0, 100, true), // Only active pipelines
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    queryFn: () => contactsAPI.list(0, 1000, true), // Skip photo URLs for performance
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

  // Handle pipeline change - reset stage if not in new pipeline
  const handlePipelineChange = (pipelineId: string) => {
    const newPipeline = pipelines.find(p => p.id === pipelineId);
    const currentStageId = opportunity.stage_id;
    
    updateField('pipeline_id', pipelineId);
    
    // Reset stage if it doesn't belong to the new pipeline
    if (newPipeline && currentStageId) {
      const stageExists = newPipeline.stages?.some(s => s.id === currentStageId);
      if (!stageExists) {
        updateField('stage_id', null);
      }
    } else {
      updateField('stage_id', null);
    }
  };

  // Handle amount change - parse currency
  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const amount = cleaned ? parseFloat(cleaned) : null;
    updateField('amount', amount);
  };

  // Handle contact IDs change
  const handleContactsChange = (contactIds: string[]) => {
    const ids = contactIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    updateField('contact_ids', ids);
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
        
        {hasChanges && saveStatus !== 'saving' && (
          <Button
            size="sm"
            variant="outline"
            onClick={saveOpportunity}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer maintenant
          </Button>
        )}
      </div>

      {/* Section 1: Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Informations principales
          </h3>
          <div className="space-y-4">
            <Input
              label="Nom de l'opportunité"
              value={opportunity.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              required
              fullWidth
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant"
                type="text"
                value={opportunity.amount ? formatCurrency(opportunity.amount) : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00 €"
                fullWidth
                icon={<DollarSign className="w-4 h-4" />}
              />
              
              <Input
                label="Probabilité"
                type="number"
                value={opportunity.probability || ''}
                onChange={(e) => updateField('probability', e.target.value ? parseInt(e.target.value, 10) : null)}
                min={0}
                max={100}
                placeholder="0-100"
                fullWidth
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>

            <DatePicker
              label="Date de clôture prévue"
              type="date"
              value={formatDateForInput(opportunity.expected_close_date)}
              onChange={(e) => updateField('expected_close_date', e.target.value || null)}
              fullWidth
            />

            <Select
              label="Statut"
              options={statusOptions}
              value={opportunity.status || ''}
              onChange={(e) => updateField('status', e.target.value || null)}
              placeholder="Sélectionner un statut"
              fullWidth
            />
          </div>
        </Card>

        {/* Section 2: Pipeline et assignation */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Pipeline et assignation
          </h3>
          <div className="space-y-4">
            <Select
              label="Pipeline"
              options={pipelineOptions}
              value={opportunity.pipeline_id || ''}
              onChange={(e) => handlePipelineChange(e.target.value)}
              placeholder="Sélectionner un pipeline"
              disabled={pipelinesLoading}
              fullWidth
              required
            />

            <Select
              label="Étape"
              options={stageOptions}
              value={opportunity.stage_id || ''}
              onChange={(e) => updateField('stage_id', e.target.value || null)}
              placeholder="Sélectionner une étape"
              disabled={!opportunity.pipeline_id || pipelinesLoading}
              fullWidth
            />

            <Select
              label="Assigné à"
              options={userOptions}
              value={opportunity.assigned_to_id ? String(opportunity.assigned_to_id) : ''}
              onChange={(e) => updateField('assigned_to_id', e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="Sélectionner un utilisateur"
              disabled={usersLoading}
              fullWidth
            />

            <Input
              label="Région"
              value={opportunity.region || ''}
              onChange={(e) => updateField('region', e.target.value || null)}
              placeholder="Ex: Europe, Amérique du Nord..."
              fullWidth
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>
        </Card>
      </div>

      {/* Section 3: Relations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Entreprise
          </h3>
          <Select
            label="Entreprise"
            options={companyOptions}
            value={opportunity.company_id ? String(opportunity.company_id) : ''}
            onChange={(e) => updateField('company_id', e.target.value ? parseInt(e.target.value, 10) : null)}
            placeholder="Sélectionner une entreprise"
            disabled={companiesLoading}
            fullWidth
          />
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
            Contacts ({selectedContactIds.length})
          </h3>
          <MultiSelect
            label="Contacts"
            options={contactOptions}
            value={selectedContactIds}
            onChange={handleContactsChange}
            placeholder="Sélectionner des contacts"
            disabled={contactsLoading}
            fullWidth
          />
        </Card>
      </div>

      {/* Section 4: Informations complémentaires */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
          Informations complémentaires
        </h3>
        <div className="space-y-4">
          <Textarea
            label="Description"
            value={opportunity.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value || null)}
            placeholder="Description de l'opportunité..."
            rows={4}
            fullWidth
          />

          <Input
            label="Lien service offer"
            type="url"
            value={opportunity.service_offer_link || ''}
            onChange={(e) => updateField('service_offer_link', e.target.value || null)}
            placeholder="https://..."
            fullWidth
            icon={<LinkIcon className="w-4 h-4" />}
          />

          <Input
            label="Segment"
            value={opportunity.segment || ''}
            onChange={(e) => updateField('segment', e.target.value || null)}
            placeholder="Ex: B2B, B2C, Public..."
            fullWidth
            icon={<Tag className="w-4 h-4" />}
          />
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

          <DatePicker
            label="Date d'ouverture"
            type="date"
            value={formatDateForInput(opportunity.opened_at)}
            onChange={(e) => updateField('opened_at', e.target.value || null)}
            fullWidth
          />

          <DatePicker
            label="Date de clôture"
            type="date"
            value={formatDateForInput(opportunity.closed_at)}
            onChange={(e) => updateField('closed_at', e.target.value || null)}
            fullWidth
          />

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
