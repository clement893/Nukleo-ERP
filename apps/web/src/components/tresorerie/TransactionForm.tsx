'use client';

import { useState, useEffect } from 'react';
import { Input, Select, Textarea, Button } from '@/components/ui';
import { Calendar, DollarSign } from 'lucide-react';
import type { TransactionCreate, TransactionUpdate, BankAccount, TransactionCategory } from '@/lib/api/tresorerie';

interface TransactionFormProps {
  transaction?: {
    id: number;
    bank_account_id: number;
    type: 'entry' | 'exit';
    amount: number;
    date: string;
    description: string;
    notes: string | null;
    category_id: number | null;
    status: 'confirmed' | 'pending' | 'projected' | 'cancelled';
  } | null;
  bankAccounts: BankAccount[];
  categories: TransactionCategory[];
  onSubmit: (data: TransactionCreate | TransactionUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function TransactionForm({
  transaction,
  bankAccounts,
  categories,
  onSubmit,
  onCancel,
  loading = false
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionCreate>({
    bank_account_id: bankAccounts[0]?.id || 0,
    type: 'entry',
    amount: 0,
    date: new Date().toISOString().split('T')[0] || '',
    description: '',
    notes: null,
    category_id: null,
    status: 'pending',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        bank_account_id: transaction.bank_account_id,
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date ? (transaction.date.split('T')[0] || '') : (new Date().toISOString().split('T')[0] || ''),
        description: transaction.description || '',
        notes: transaction.notes || null,
        category_id: transaction.category_id || null,
        status: transaction.status,
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type de Transaction */}
      <div>
        <label className="block text-sm font-medium mb-2">Type de transaction *</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'entry', category_id: null })}
            className={`p-3 rounded-lg border-2 transition-all ${
              formData.type === 'entry'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${formData.type === 'entry' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium">Entrée</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'exit', category_id: null })}
            className={`p-3 rounded-lg border-2 transition-all ${
              formData.type === 'exit'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${formData.type === 'exit' ? 'bg-red-500' : 'bg-gray-300'}`} />
              <span className="font-medium">Sortie</span>
            </div>
          </button>
        </div>
      </div>

      {/* Compte Bancaire */}
      <div>
        <label className="block text-sm font-medium mb-2">Compte bancaire *</label>
        <Select
          value={formData.bank_account_id.toString()}
          onChange={(e) => setFormData({ ...formData, bank_account_id: parseInt(e.target.value) })}
          options={bankAccounts.map(acc => ({
            value: acc.id.toString(),
            label: `${acc.name} (${acc.account_type})`
          }))}
          required
        />
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium mb-2">Montant *</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-2">Date *</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de la transaction"
          required
        />
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium mb-2">Catégorie</label>
        <Select
          value={formData.category_id?.toString() || ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            category_id: e.target.value ? parseInt(e.target.value) : null 
          })}
          options={[
            { value: '', label: 'Aucune catégorie' },
            ...filteredCategories.map(cat => ({
              value: cat.id.toString(),
              label: cat.name
            }))
          ]}
        />
      </div>

      {/* Statut */}
      <div>
        <label className="block text-sm font-medium mb-2">Statut *</label>
        <Select
          value={formData.status}
          onChange={(e) => setFormData({ 
            ...formData, 
            status: e.target.value as 'confirmed' | 'pending' | 'projected' | 'cancelled'
          })}
          options={[
            { value: 'confirmed', label: 'Confirmé' },
            { value: 'pending', label: 'En attente' },
            { value: 'projected', label: 'Projeté' },
            { value: 'cancelled', label: 'Annulé' }
          ]}
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
          placeholder="Notes supplémentaires..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : transaction ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
