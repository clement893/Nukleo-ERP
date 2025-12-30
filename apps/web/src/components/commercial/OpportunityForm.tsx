'use client';

import { useState, useEffect } from 'react';
import { Opportunity, OpportunityCreate, OpportunityUpdate } from '@/lib/api/opportunities';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui';
import { pipelinesAPI, type Pipeline } from '@/lib/api/pipelines';
import { companiesAPI, type Company } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';

interface OpportunityFormProps {
  opportunity?: Opportunity | null;
  onSubmit: (data: OpportunityCreate | OpportunityUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Ouverte' },
  { value: 'qualified', label: 'Qualifiée' },
  { value: 'proposal', label: 'Proposition' },
  { value: 'negotiation', label: 'Négociation' },
  { value: 'won', label: 'Gagnée' },
  { value: 'lost', label: 'Perdue' },
  { value: 'cancelled', label: 'Annulée' },
];

export default function OpportunityForm({
  opportunity,
  onSubmit,
  onCancel,
  loading = false,
}: OpportunityFormProps) {
  const { showToast } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState<OpportunityCreate>({
    name: opportunity?.name || '',
    description: opportunity?.description || null,
    amount: opportunity?.amount || null,
    probability: opportunity?.probability || null,
    expected_close_date: opportunity?.expected_close_date || null,
    status: opportunity?.status || 'open',
    segment: opportunity?.segment || null,
    region: opportunity?.region || null,
    service_offer_link: opportunity?.service_offer_link || null,
    notes: opportunity?.notes || null,
    pipeline_id: opportunity?.pipeline_id || '',
    stage_id: opportunity?.stage_id || null,
    company_id: opportunity?.company_id || null,
    assigned_to_id: opportunity?.assigned_to_id || null,
    opened_at: opportunity?.opened_at || null,
    closed_at: opportunity?.closed_at || null,
    contact_ids: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [pipelinesData, companiesData] = await Promise.all([
          pipelinesAPI.list(0, 1000, true),
          companiesAPI.list(0, 1000)
        ]);
        setPipelines(pipelinesData);
        setCompanies(companiesData);
        
        // Find selected pipeline
        if (formData.pipeline_id) {
          const pipeline = pipelinesData.find(p => p.id === formData.pipeline_id);
          setSelectedPipeline(pipeline || null);
        }
      } catch (err) {
        const appError = handleApiError(err);
        showToast({
          message: appError.message || 'Erreur lors du chargement des données',
          type: 'error',
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.pipeline_id) {
      const pipeline = pipelines.find(p => p.id === formData.pipeline_id);
      setSelectedPipeline(pipeline || null);
      // Reset stage if pipeline changes
      if (!pipeline || !pipeline.stages.find(s => s.id === formData.stage_id)) {
        setFormData(prev => ({ ...prev, stage_id: null }));
      }
    }
  }, [formData.pipeline_id, pipelines]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast({
        message: 'Le nom de l\'opportunité est requis',
        type: 'error',
      });
      return;
    }

    if (!formData.pipeline_id) {
      showToast({
        message: 'Le pipeline est requis',
        type: 'error',
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nom de l'opportunité *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            rows={3}
          />
        </div>

        <Input
          label="Montant (€)"
          type="number"
          step="0.01"
          value={formData.amount?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
        />

        <Input
          label="Probabilité (%)"
          type="number"
          min="0"
          max="100"
          value={formData.probability?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              probability: e.target.value ? parseInt(e.target.value) : null,
            })
          }
        />

        <Select
          label="Statut"
          value={formData.status || 'open'}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={STATUS_OPTIONS}
        />

        <Select
          label="Pipeline *"
          value={formData.pipeline_id}
          onChange={(e) => setFormData({ ...formData, pipeline_id: e.target.value, stage_id: null })}
          required
          options={[
            { value: '', label: 'Sélectionner un pipeline' },
            ...pipelines.map(p => ({ value: p.id, label: p.name }))
          ]}
          disabled={loadingData}
        />

        <Select
          label="Stade du pipeline"
          value={formData.stage_id || ''}
          onChange={(e) => setFormData({ ...formData, stage_id: e.target.value || null })}
          options={[
            { value: '', label: 'Aucun stade' },
            ...(selectedPipeline?.stages.map(s => ({ value: s.id, label: s.name })) || [])
          ]}
          disabled={!selectedPipeline || loadingData}
        />

        <Select
          label="Entreprise"
          value={formData.company_id?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              company_id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          options={[
            { value: '', label: 'Aucune entreprise' },
            ...companies.map(c => ({ value: c.id.toString(), label: c.name }))
          ]}
          disabled={loadingData}
        />

        <Input
          label="Segment"
          value={formData.segment || ''}
          onChange={(e) => setFormData({ ...formData, segment: e.target.value || null })}
        />

        <Input
          label="Région"
          value={formData.region || ''}
          onChange={(e) => setFormData({ ...formData, region: e.target.value || null })}
        />

        <Input
          label="Lien offre de service"
          type="url"
          value={formData.service_offer_link || ''}
          onChange={(e) => setFormData({ ...formData, service_offer_link: e.target.value || null })}
        />

        <Input
          label="Date de fermeture prévue"
          type="datetime-local"
          value={formData.expected_close_date ? new Date(formData.expected_close_date).toISOString().slice(0, 16) : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              expected_close_date: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />

        <div className="md:col-span-2">
          <Textarea
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : opportunity ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
