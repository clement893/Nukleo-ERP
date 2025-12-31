'use client';

import { useState } from 'react';
import { Project, ProjectCreate, ProjectUpdate } from '@/lib/api/projects';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  companies?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; first_name: string; last_name: string }>;
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'ARCHIVED', label: 'Archivé' },
  { value: 'COMPLETED', label: 'Complété' },
];

export default function ProjectForm({
  project,
  onSubmit,
  onCancel,
  loading = false,
  companies = [],
  employees = [],
}: ProjectFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ProjectCreate>({
    name: project?.name || '',
    description: project?.description || null,
    status: project?.status || 'ACTIVE',
    client_id: project?.client_id || null,
    client_name: project?.client_name || null,
    responsable_id: project?.responsable_id || null,
    start_date: project?.start_date || null,
    end_date: project?.end_date || null,
    deadline: project?.deadline || null,
  });
  
  // Track company name input separately for better UX
  const [companyNameInput, setCompanyNameInput] = useState<string>(
    project?.client_name || project?.client_id 
      ? companies.find(c => c.id === project?.client_id)?.name || ''
      : ''
  );

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
      {/* Nom du projet */}
      <Input
        label="Nom du projet *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        fullWidth
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={4}
        />
      </div>

      {/* Statut */}
      <Select
        label="Statut"
        value={formData.status || 'ACTIVE'}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'ARCHIVED' | 'COMPLETED' })}
        options={STATUS_OPTIONS}
        fullWidth
      />

      {/* Client */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Client
        </label>
        {companies.length > 0 ? (
          <Select
            value={formData.client_id?.toString() || ''}
            onChange={(e) => {
              const selectedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedCompany = companies.find(c => c.id === selectedId);
              setFormData({
                ...formData,
                client_id: selectedId,
                client_name: selectedCompany?.name || null,
              });
              setCompanyNameInput(selectedCompany?.name || '');
            }}
            options={[
              { value: '', label: 'Aucun' },
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
                client_id: null,
                client_name: name || null,
              });
            }}
            placeholder="Nom du client (sera automatiquement lié si elle existe)"
            fullWidth
          />
        )}
        {companyNameInput && !formData.client_id && (
          <p className="mt-1 text-xs text-muted-foreground">
            Le client sera automatiquement lié si l'entreprise existe dans la base de données.
          </p>
        )}
      </div>

      {/* Responsable */}
      {employees.length > 0 && (
        <Select
          label="Responsable"
          value={formData.responsable_id?.toString() || ''}
          onChange={(e) => setFormData({
            ...formData,
            responsable_id: e.target.value ? parseInt(e.target.value) : null,
          })}
          options={[
            { value: '', label: 'Aucun' },
            ...employees.map(e => ({ 
              value: e.id.toString(), 
              label: `${e.first_name} ${e.last_name}` 
            })),
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
          {project ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
