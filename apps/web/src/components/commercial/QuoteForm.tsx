'use client';

import { useState, useEffect } from 'react';
import { Quote, QuoteCreate, QuoteUpdate, QuoteLineItem } from '@/lib/api/quotes';
import { Company, CompanyCreate } from '@/lib/api/companies';
import { companiesAPI } from '@/lib/api/companies';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { Building2, Calendar, Plus, Trash2, DollarSign, Clock } from 'lucide-react';
import CompanyForm from './CompanyForm';

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

const PRICING_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Prix fixe' },
  { value: 'hourly', label: 'Taux horaire' },
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
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [pricingType, setPricingType] = useState<'fixed' | 'hourly'>(
    (quote?.pricing_type as 'fixed' | 'hourly') || 'fixed'
  );
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(
    quote?.line_items || []
  );
  const [formData, setFormData] = useState<QuoteCreate>({
    title: quote?.title || '',
    description: quote?.description || null,
    company_id: quote?.company_id || null,
    amount: quote?.amount || null,
    currency: quote?.currency || 'EUR',
    pricing_type: pricingType,
    status: quote?.status || 'draft',
    valid_until: quote?.valid_until || null,
    notes: quote?.notes || null,
    line_items: lineItems,
  });

  // Load companies
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

  useEffect(() => {
    loadCompanies();
  }, [showToast]);

  // Handle create company
  const handleCreateCompany = async (companyData: CompanyCreate) => {
    try {
      setCreatingCompany(true);
      const newCompany = await companiesAPI.create({
        ...companyData,
        is_client: true, // Automatically mark as client when created from quote form
      });
      
      // Reload companies list
      await loadCompanies();
      
      // Select the newly created company
      setFormData({
        ...formData,
        company_id: newCompany.id,
      });
      
      // Close modal
      setShowCreateCompanyModal(false);
      
      showToast({
        message: 'Client créé avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de la création du client',
        type: 'error',
      });
    } finally {
      setCreatingCompany(false);
    }
  };

  // Calculate total from line items
  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      if (item.total_price) {
        return sum + item.total_price;
      }
      if (item.quantity && item.unit_price) {
        return sum + (item.quantity * item.unit_price);
      }
      return sum;
    }, 0);
  };

  // Update formData when pricingType changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      pricing_type: pricingType,
    }));
  }, [pricingType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast({
        message: 'Le titre est requis',
        type: 'error',
      });
      return;
    }

    // Validate line items for hourly quotes
    if (pricingType === 'hourly' && lineItems.length === 0) {
      showToast({
        message: 'Veuillez ajouter au moins une ligne budgétaire pour un devis à taux horaire',
        type: 'error',
      });
      return;
    }

    try {
      await onSubmit({
        ...formData,
        pricing_type: pricingType,
        line_items: lineItems.length > 0 ? lineItems : undefined,
        amount: calculateTotal() || formData.amount,
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const addLineItem = () => {
    const newItem: QuoteLineItem = {
      description: '',
      quantity: pricingType === 'hourly' ? 1 : null,
      unit_price: null,
      total_price: null,
      line_order: lineItems.length,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: any) => {
    const updated = [...lineItems];
    const currentItem = updated[index];
    
    if (!currentItem) {
      return; // Safety check
    }
    
    // Ensure description is always a string
    if (field === 'description') {
      updated[index] = { ...currentItem, [field]: value ?? '' };
    } else {
      updated[index] = { ...currentItem, [field]: value };
    }
    
    // Calculate total_price if quantity and unit_price are provided
    if (field === 'quantity' || field === 'unit_price') {
      const updatedItem = updated[index];
      if (!updatedItem) {
        return; // Safety check
      }
      
      const quantity = field === 'quantity' ? value : updatedItem.quantity;
      const unitPrice = field === 'unit_price' ? value : updatedItem.unit_price;
      if (quantity && unitPrice) {
        updatedItem.total_price = quantity * unitPrice;
      } else {
        updatedItem.total_price = null;
      }
    }
    
    setLineItems(updated);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
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
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-foreground">
            <Building2 className="w-4 h-4 inline mr-1.5" />
            Client
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateCompanyModal(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer un client
          </Button>
        </div>
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

      {/* Type de tarification */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Type de tarification *
        </label>
        <div className="flex gap-4">
          {PRICING_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${
                pricingType === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name="pricing_type"
                value={option.value}
                checked={pricingType === option.value}
                onChange={(e) => setPricingType(e.target.value as 'fixed' | 'hourly')}
                className="sr-only"
              />
              {option.value === 'fixed' ? (
                <DollarSign className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Lignes budgétaires */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Lignes budgétaires
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </Button>
        </div>

        {lineItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <p>Aucune ligne budgétaire</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter une ligne" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg bg-muted/30 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Ligne {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  label="Description *"
                  value={item.description || ''}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  required
                  fullWidth
                  placeholder="Description de la ligne budgétaire"
                />

                <div className="grid grid-cols-3 gap-3">
                  {pricingType === 'hourly' ? (
                    <>
                      <Input
                        label="Heures estimées"
                        type="number"
                        step="0.5"
                        min="0"
                        value={item.quantity?.toString() || ''}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                        fullWidth
                        placeholder="0"
                      />
                      <Input
                        label="Taux horaire"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price?.toString() || ''}
                        onChange={(e) => updateLineItem(index, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                        fullWidth
                        placeholder="0.00"
                      />
                      <Input
                        label="Total"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.total_price?.toString() || ''}
                        onChange={(e) => updateLineItem(index, 'total_price', e.target.value ? parseFloat(e.target.value) : null)}
                        fullWidth
                        placeholder="0.00"
                        disabled={!!(item.quantity && item.unit_price)}
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        label="Quantité"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity?.toString() || ''}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                        fullWidth
                        placeholder="0"
                      />
                      <Input
                        label="Prix unitaire"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price?.toString() || ''}
                        onChange={(e) => updateLineItem(index, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                        fullWidth
                        placeholder="0.00"
                      />
                      <Input
                        label="Total"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.total_price?.toString() || ''}
                        onChange={(e) => updateLineItem(index, 'total_price', e.target.value ? parseFloat(e.target.value) : null)}
                        fullWidth
                        placeholder="0.00"
                        disabled={!!(item.quantity && item.unit_price)}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {lineItems.length > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total:</span>
              <span className="font-bold text-lg text-primary">
                {calculateTotal().toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Montant total (pour prix fixe) */}
      {pricingType === 'fixed' && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Montant total"
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
      )}

      {/* Devise (pour taux horaire) */}
      {pricingType === 'hourly' && (
        <Select
          label="Devise"
          value={formData.currency || 'EUR'}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={CURRENCY_OPTIONS}
          fullWidth
        />
      )}

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
      <div className="flex justify-end gap-2 pt-4 border-t border-border sticky bottom-0 bg-background">
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

    {/* Create Company Modal */}
    <Modal
      isOpen={showCreateCompanyModal}
      onClose={() => setShowCreateCompanyModal(false)}
      title="Créer un nouveau client"
      size="lg"
    >
      <CompanyForm
        onSubmit={handleCreateCompany}
        onCancel={() => setShowCreateCompanyModal(false)}
        loading={creatingCompany}
      />
    </Modal>
  </>
  );
}
