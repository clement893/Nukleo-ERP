'use client';

import { useState, useEffect } from 'react';
import { Quote, QuoteCreate, QuoteUpdate } from '@/lib/api/quotes';
import { Company } from '@/lib/api/companies';
import { companiesAPI } from '@/lib/api/companies';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { Building2, Calendar } from 'lucide-react';

interface QuoteFormProps {
  quote?: Quote | null;
  onSubmit: (data: QuoteCreate | QuoteUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'expired', label: 'Expiré' },
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
];

export default function QuoteForm({
  quote,
  onSubmit,
  onCancel,
  loading = false,
}: QuoteFormProps) {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [formData, setFormData] = useState<QuoteCreate>({
    title: quote?.title || '',
    description: quote?.description || null,
    company_id: quote?.company_id || null,
    amount: quote?.amount || null,
    currency: quote?.currency || 'EUR',
    status: quote?.status || 'draft',
    valid_until: quote?.valid_until || null,
    notes: quote?.notes || null,
  });

  // Load companies
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const data = await companiesAPI.list(0, 1000);
        setCompanies(data);
      } catch (error) {
        showToast({
          message: 'Erreur lors du chargement des entreprises',
          type: 'error',
        });
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast({
        message: 'Le titre est requis',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titre */}
      <Input
        label="Titre du devis *"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        fullWidth
        placeholder="Ex: Devis pour projet X"
      />

      {/* Entreprise */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Client
        </label>
        <Select
          value={formData.company_id?.toString() || ''}
          onChange={(e) => setFormData({
            ...formData,
            company_id: e.target.value ? parseInt(e.target.value) : null,
          })}
          options={[
            { value: '', label: 'Aucun client' },
            ...companies.map(c => ({ value: c.id.toString(), label: c.name })),
          ]}
          fullWidth
          disabled={loadingCompanies}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
          placeholder="Description détaillée du devis..."
          rows={4}
        />
      </div>

      {/* Montant et Devise */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Montant"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value;
            setFormData({
              ...formData,
              amount: value ? parseFloat(value) : null,
            });
          }}
          placeholder="0.00"
          fullWidth
        />
        <Select
          label="Devise"
          value={formData.currency || 'EUR'}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={CURRENCY_OPTIONS}
          fullWidth
        />
      </div>

      {/* Statut et Date d'expiration */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Statut"
          value={formData.status || 'draft'}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={STATUS_OPTIONS}
          fullWidth
        />
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            Valide jusqu'au
          </label>
          <Input
            type="date"
            value={formData.valid_until ? new Date(formData.valid_until).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                valid_until: value ? new Date(value).toISOString() : null,
              });
            }}
            fullWidth
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Notes internes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
          placeholder="Notes internes (non visibles par le client)..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          size="sm"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title.trim()}
          size="sm"
        >
          {loading ? 'Enregistrement...' : quote ? 'Enregistrer' : 'Créer le devis'}
        </Button>
      </div>
    </form>
  );
}
