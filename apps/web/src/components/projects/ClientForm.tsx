'use client';

import { useState, useEffect } from 'react';
import { Client, ClientCreate, ClientUpdate, ClientStatus } from '@/lib/api/clients';
import { companiesAPI, Company } from '@/lib/api/companies';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: ClientCreate | ClientUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: ClientStatus.ACTIVE, label: 'Actif' },
  { value: ClientStatus.INACTIVE, label: 'Inactif' },
  { value: ClientStatus.MAINTENANCE, label: 'Maintenance' },
];

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
  loading = false,
}: ClientFormProps) {
  const { showToast } = useToast();
  
  // Fetch companies and users for dropdowns
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.list(0, 1000),
  });

  const [formData, setFormData] = useState<ClientCreate>({
    company_id: client?.company_id || null,
    company_name: client?.company_name || null,
    status: client?.status || ClientStatus.ACTIVE,
    responsable_id: client?.responsable_id || null,
    notes: client?.notes || null,
    comments: client?.comments || null,
    portal_url: client?.portal_url || null,
  });

  const [companyNameInput, setCompanyNameInput] = useState<string>(
    client?.company_name || ''
  );

  useEffect(() => {
    if (client) {
      setFormData({
        company_id: client.company_id,
        company_name: client.company_name,
        status: client.status,
        responsible_id: client.responsible_id,
        notes: client.notes,
        comments: client.comments,
        portal_url: client.portal_url,
      });
      setCompanyNameInput(client.company_name || '');
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleCompanySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value ? parseInt(e.target.value) : null;
    const selectedCompany = companies.find((c: Company) => c.id === companyId);
    setFormData((prev) => ({
      ...prev,
      company_id: companyId,
      company_name: selectedCompany?.name || null,
    }));
    setCompanyNameInput(selectedCompany?.name || '');
  };

  const handleCompanyNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanyNameInput(value);
    setFormData((prev) => ({
      ...prev,
      company_name: value || null,
      company_id: null, // Clear company_id when typing new name
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id && !formData.company_name) {
      showToast({
        message: 'Le nom de l\'entreprise est requis',
        type: 'error',
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Entreprise <span className="text-destructive">*</span>
        </label>
        <div className="space-y-2">
          <Select
            name="company_id"
            value={formData.company_id?.toString() || ''}
            onChange={handleCompanySelect}
            options={[
              { value: '', label: 'Sélectionner une entreprise existante' },
              ...companies.map((c: Company) => ({
                value: c.id.toString(),
                label: c.name,
              })),
            ]}
          />
          <div className="text-sm text-muted-foreground text-center">ou</div>
          <Input
            name="company_name"
            value={companyNameInput}
            onChange={handleCompanyNameInput}
            placeholder="Nom de la nouvelle entreprise"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-2">Statut</label>
        <Select
          name="status"
          value={formData.status || ClientStatus.ACTIVE}
          onChange={handleChange}
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Responsible */}
      <div>
        <label className="block text-sm font-medium mb-2">Responsable</label>
        <Input
          name="responsable_id"
          type="number"
          value={formData.responsable_id?.toString() || ''}
          onChange={handleChange}
          placeholder="ID de l'employé responsable"
        />
      </div>

      {/* Portal URL */}
      <div>
        <label className="block text-sm font-medium mb-2">URL du portail client</label>
        <Input
          name="portal_url"
          type="url"
          value={formData.portal_url || ''}
          onChange={handleChange}
          placeholder="https://portail.client.com"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <Textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Notes sur le client"
          rows={4}
        />
      </div>

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium mb-2">Commentaires</label>
        <Textarea
          name="comments"
          value={formData.comments || ''}
          onChange={handleChange}
          placeholder="Commentaires sur le client"
          rows={4}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {client ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
