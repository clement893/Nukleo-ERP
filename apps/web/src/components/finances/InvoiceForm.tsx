'use client';

import { useState, useEffect } from 'react';
import { FinanceInvoiceCreate, FinanceInvoiceUpdate, InvoiceLineItem, ClientData } from '@/lib/api/finances/facturations';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Autocomplete, { type AutocompleteOption } from '@/components/ui/Autocomplete';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import { contactsAPI, type Contact } from '@/lib/api/contacts';
import { useQuery } from '@tanstack/react-query';

interface InvoiceFormProps {
  invoice?: any | null;
  onSubmit: (data: FinanceInvoiceCreate | FinanceInvoiceUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  projects?: Array<{ id: number; name: string }>;
}

export default function InvoiceForm({ invoice, onSubmit, onCancel, loading, projects = [] }: InvoiceFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    invoice_number: '',
    project_id: null as number | null,
    client_data: {
      name: '',
      email: '',
      phone: '',
      address: '',
    } as ClientData,
    line_items: [
      { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 },
    ] as InvoiceLineItem[],
    tax_rate: 0,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    notes: '',
    terms: '',
  });
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Fetch contacts for client selection (only clients, not all contacts)
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts', 'for-invoice', 'clients'],
    queryFn: () => contactsAPI.list(0, 1000, true), // Skip photo URLs for performance
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter to only clients (circle='client') and convert to autocomplete options
  const clientOptions: AutocompleteOption[] = contacts
    .filter((contact: Contact) => contact.circle === 'client')
    .map((contact: Contact) => {
      const fullName = `${contact.first_name} ${contact.last_name}`.trim();
      const displayName = contact.company_name 
        ? `${fullName} (${contact.company_name})`
        : fullName;
      return {
        value: contact.id.toString(),
        label: displayName,
      };
    });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        project_id: invoice.project_id || null,
        client_data: invoice.client_data || { name: '', email: '', phone: '', address: '' },
        line_items: invoice.line_items && invoice.line_items.length > 0 
          ? invoice.line_items 
          : [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
        tax_rate: invoice.tax_rate || 0,
        issue_date: invoice.issue_date ? invoice.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: invoice.notes || '',
        terms: invoice.terms || '',
      });
      // Initialize client search term with existing client name
      if (invoice.client_data?.name) {
        setClientSearchTerm(invoice.client_data.name);
      }
    } else {
      // Reset client search term when creating new invoice
      setClientSearchTerm('');
    }
  }, [invoice]);

  const calculateLineItemTotal = (quantity: number, unitPrice: number): number => {
    return quantity * unitPrice;
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => sum + calculateLineItemTotal(item.quantity, item.unitPrice), 0);
    const tax_amount = (subtotal * formData.tax_rate) / 100;
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newLineItems = [...formData.line_items];
    const item = { ...newLineItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice') {
      const numValue = Number(value) || 0;
      item[field] = numValue;
      item.total = calculateLineItemTotal(item.quantity ?? 0, item.unitPrice ?? 0);
    } else {
      item[field] = value;
    }
    
    // Ensure id is always a string
    if (!item.id) {
      item.id = String(Date.now() + index);
    }
    
    newLineItems[index] = item as InvoiceLineItem;
    setFormData({ ...formData, line_items: newLineItems });
  };

  const addLineItem = () => {
    const newId = String(Date.now());
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        { id: newId, description: '', quantity: 1, unitPrice: 0, total: 0 },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length > 1) {
      const newLineItems = formData.line_items.filter((_, i) => i !== index);
      setFormData({ ...formData, line_items: newLineItems });
    } else {
      showToast({
        message: 'Une facture doit avoir au moins un article',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.client_data.name) {
      showToast({
        message: 'Le nom du client est requis',
        type: 'error',
      });
      return;
    }

    if (formData.line_items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      showToast({
        message: 'Tous les articles doivent avoir une description, une quantité et un prix unitaire valides',
        type: 'error',
      });
      return;
    }

    const { subtotal, tax_amount, total } = calculateTotals();

    const invoiceData: FinanceInvoiceCreate | FinanceInvoiceUpdate = {
      invoice_number: formData.invoice_number || undefined,
      project_id: formData.project_id || null,
      client_data: formData.client_data,
      line_items: formData.line_items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: calculateLineItemTotal(item.quantity, item.unitPrice),
      })),
      subtotal,
      tax_rate: formData.tax_rate,
      tax_amount,
      total,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      notes: formData.notes || null,
      terms: formData.terms || null,
      status: 'draft',
    };

    await onSubmit(invoiceData);
  };

  const { subtotal, tax_amount, total } = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du client *</label>
            <Autocomplete
              options={clientOptions}
              value={clientSearchTerm}
              onChange={(value) => {
                setClientSearchTerm(value);
                // Update client name if user types manually
                setFormData({
                  ...formData,
                  client_data: { ...formData.client_data, name: value },
                });
              }}
              onSelect={(option) => {
                // Find contact from all contacts (not just filtered clients)
                const selectedContact = contacts.find((c: Contact) => c.id.toString() === option.value && c.circle === 'client');
                if (selectedContact) {
                  const fullName = `${selectedContact.first_name} ${selectedContact.last_name}`.trim();
                  const addressParts = [
                    selectedContact.city,
                    selectedContact.country,
                  ].filter(Boolean);
                  
                  setFormData({
                    ...formData,
                    client_data: {
                      name: fullName,
                      email: selectedContact.email || '',
                      phone: selectedContact.phone || '',
                      address: addressParts.join(', ') || '',
                    },
                  });
                  setClientSearchTerm(option.label);
                }
              }}
              placeholder="Rechercher un client existant ou saisir un nom..."
              label=""
              loading={loadingContacts}
              minChars={0}
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.client_data.email}
              onChange={(e) => setFormData({
                ...formData,
                client_data: { ...formData.client_data, email: e.target.value },
              })}
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <Input
              type="tel"
              value={formData.client_data.phone}
              onChange={(e) => setFormData({
                ...formData,
                client_data: { ...formData.client_data, phone: e.target.value },
              })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Projet</label>
            <Select
              value={formData.project_id?.toString() || ''}
              onChange={(e) => setFormData({
                ...formData,
                project_id: e.target.value ? parseInt(e.target.value) : null,
              })}
              options={[
                { value: '', label: 'Aucun projet' },
                ...projects.map(p => ({ value: p.id.toString(), label: p.name })),
              ]}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Adresse</label>
          <Textarea
            value={formData.client_data.address}
            onChange={(e) => setFormData({
              ...formData,
              client_data: { ...formData.client_data, address: e.target.value },
            })}
            placeholder="Adresse complète du client"
            rows={2}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Date d'émission *</label>
          <Input
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date d'échéance *</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Articles facturés</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un article
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.line_items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="col-span-12 md:col-span-5">
                <label className="block text-xs font-medium mb-1">Description *</label>
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  placeholder="Description de l'article"
                  required
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium mb-1">Quantité *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium mb-1">Prix unitaire *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium mb-1">Total</label>
                <Input
                  type="number"
                  value={item.total.toFixed(2)}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  disabled={formData.line_items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax and Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Taux de taxe (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.tax_rate}
            onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Sous-total:</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Taxes ({formData.tax_rate}%):</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(tax_amount)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total:</span>
            <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes internes (non visibles sur la facture)"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Conditions de paiement</label>
          <Textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            placeholder="Conditions de paiement (visibles sur la facture)"
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {invoice ? 'Modifier la facture' : 'Créer la facture'}
        </Button>
      </div>
    </form>
  );
}
