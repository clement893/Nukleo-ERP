'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectCreate, ProjectUpdate } from '@/lib/api/projects';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { companiesAPI, type Company } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' },
];

export default function ProjectForm({
  project,
  onSubmit,
  onCancel,
  loading = false,
}: ProjectFormProps) {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState<ProjectCreate>({
    name: project?.name || '',
    description: project?.description || null,
    status: project?.status || 'active',
    client_id: project?.client_id || null,
    equipe: project?.equipe || null,
    etape: project?.etape || null,
    annee_realisation: project?.annee_realisation || null,
    contact: project?.contact || null,
    budget: project?.budget || null,
    proposal_url: project?.proposal_url || null,
    drive_url: project?.drive_url || null,
    slack_url: project?.slack_url || null,
    echeancier_url: project?.echeancier_url || null,
    start_date: project?.start_date || null,
    end_date: project?.end_date || null,
    deadline: project?.deadline || null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const companiesData = await companiesAPI.list(0, 1000);
        setCompanies(companiesData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast({
        message: 'Le nom du projet est requis',
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
            label="Nom du projet *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            rows={3}
            disabled={loading}
          />
        </div>

        <Select
          label="Statut"
          value={formData.status || 'active'}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          options={STATUS_OPTIONS}
          disabled={loading || loadingData}
        />

        <Select
          label="Client"
          value={formData.client_id?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              client_id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          options={[
            { value: '', label: 'Aucun client' },
            ...companies.map(c => ({ value: c.id.toString(), label: c.name }))
          ]}
          disabled={loading || loadingData}
        />

        <Input
          label="Équipe"
          value={formData.equipe || ''}
          onChange={(e) => setFormData({ ...formData, equipe: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Étape"
          value={formData.etape || ''}
          onChange={(e) => setFormData({ ...formData, etape: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Année de réalisation"
          value={formData.annee_realisation || ''}
          onChange={(e) => setFormData({ ...formData, annee_realisation: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Contact"
          value={formData.contact || ''}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Budget ($)"
          type="number"
          step="0.01"
          value={formData.budget?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              budget: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Date de début"
          type="date"
          value={formData.start_date ? new Date(formData.start_date).toISOString().split('T')[0] : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              start_date: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Date de fin"
          type="date"
          value={formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              end_date: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Deadline"
          type="date"
          value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              deadline: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          disabled={loading}
        />

        <div className="md:col-span-2">
          <Input
            label="Lien proposition"
            type="url"
            value={formData.proposal_url || ''}
            onChange={(e) => setFormData({ ...formData, proposal_url: e.target.value || null })}
            disabled={loading}
          />
        </div>

        <Input
          label="Lien Drive"
          type="url"
          value={formData.drive_url || ''}
          onChange={(e) => setFormData({ ...formData, drive_url: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Lien Slack"
          type="url"
          value={formData.slack_url || ''}
          onChange={(e) => setFormData({ ...formData, slack_url: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Lien échéancier"
          type="url"
          value={formData.echeancier_url || ''}
          onChange={(e) => setFormData({ ...formData, echeancier_url: e.target.value || null })}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : project ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
