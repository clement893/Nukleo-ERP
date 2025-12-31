'use client';

import { useState } from 'react';
import { Client, ClientCreate, ClientUpdate, ClientStatus } from '@/lib/api/clients';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: ClientCreate | ClientUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
  loading = false,
}: ClientFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ClientCreate>({
    company_name: client?.company_name || '',
    type: client?.type || 'company',
    portal_url: client?.portal_url || null,
    status: client?.status || 'ACTIVE',
  });
  



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name?.trim()) {
      showToast({
        message: 'Le nom de l\'entreprise est requis',
        type: 'error',
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom de l'entreprise */}
      <Input
        label="Nom de l'entreprise *"
        value={formData.company_name || ''}
        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
        required
        fullWidth
      />

      {/* Type */}
      <Input
        label="Type"
        value={formData.type || 'company'}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        fullWidth
      />

      {/* Statut */}
      <Select
        label="Statut"
        value={formData.status || 'ACTIVE'}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
        options={[
          { value: 'ACTIVE', label: 'Actif' },
          { value: 'INACTIVE', label: 'Inactif' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
        ]}
        fullWidth
      />

      {/* URL du portail */}
      <Input
        label="URL du portail"
        type="url"
        value={formData.portal_url || ''}
        onChange={(e) => setFormData({ ...formData, portal_url: e.target.value || null })}
        placeholder="https://..."
        fullWidth
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          {client ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
