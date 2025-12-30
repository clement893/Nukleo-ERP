'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { type ExpenseAccount, type ExpenseAccountCreate, type ExpenseAccountUpdate } from '@/lib/api/finances/expenseAccounts';

interface ExpenseAccountFormProps {
  expenseAccount?: ExpenseAccount | null;
  onSubmit: (data: ExpenseAccountCreate | ExpenseAccountUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  employees?: Array<{ id: number; first_name: string; last_name: string }>;
}

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export default function ExpenseAccountForm({
  expenseAccount,
  onSubmit,
  onCancel,
  loading = false,
  employees = [],
}: ExpenseAccountFormProps) {
  const [formData, setFormData] = useState<ExpenseAccountCreate>({
    employee_id: expenseAccount?.employee_id || 0,
    title: expenseAccount?.title || '',
    description: expenseAccount?.description || null,
    expense_period_start: expenseAccount?.expense_period_start 
      ? expenseAccount.expense_period_start.split('T')[0] 
      : null,
    expense_period_end: expenseAccount?.expense_period_end 
      ? expenseAccount.expense_period_end.split('T')[0] 
      : null,
    total_amount: expenseAccount?.total_amount || '0',
    currency: expenseAccount?.currency || 'EUR',
    metadata: expenseAccount?.metadata || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!formData.employee_id || formData.employee_id === 0) {
      newErrors.employee_id = 'L\'employé est requis';
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = 'Le montant doit être supérieur à 0';
    }
    if (formData.expense_period_start && formData.expense_period_end) {
      if (new Date(formData.expense_period_start) > new Date(formData.expense_period_end)) {
        newErrors.expense_period_end = 'La date de fin doit être après la date de début';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Convert dates to ISO format
    const submitData = {
      ...formData,
      expense_period_start: formData.expense_period_start 
        ? new Date(formData.expense_period_start).toISOString() 
        : null,
      expense_period_end: formData.expense_period_end 
        ? new Date(formData.expense_period_end).toISOString() 
        : null,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Employé */}
      <div>
        <Select
          label="Employé *"
          value={formData.employee_id?.toString() || ''}
          onChange={(e) => {
            const employeeId = e.target.value ? parseInt(e.target.value) : 0;
            setFormData({ ...formData, employee_id: employeeId });
            setErrors({ ...errors, employee_id: '' });
          }}
          options={[
            { value: '', label: 'Sélectionner un employé' },
            ...employees.map(emp => ({
              value: emp.id.toString(),
              label: `${emp.first_name} ${emp.last_name}`,
            })),
          ]}
          error={errors.employee_id}
          fullWidth
        />
      </div>

      {/* Titre */}
      <Input
        label="Titre *"
        value={formData.title}
        onChange={(e) => {
          setFormData({ ...formData, title: e.target.value });
          setErrors({ ...errors, title: '' });
        }}
        error={errors.title}
        fullWidth
        placeholder="Ex: Frais de déplacement - Janvier 2025"
      />

      {/* Description */}
      <Textarea
        label="Description"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
        rows={4}
        fullWidth
        placeholder="Description détaillée des dépenses..."
      />

      {/* Période de dépenses */}
      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          label="Date de début"
          type="date"
          value={formData.expense_period_start || ''}
          onChange={(e) => {
            setFormData({ ...formData, expense_period_start: e.target.value || null });
            setErrors({ ...errors, expense_period_start: '', expense_period_end: '' });
          }}
          error={errors.expense_period_start}
          fullWidth
        />
        <DatePicker
          label="Date de fin"
          type="date"
          value={formData.expense_period_end || ''}
          onChange={(e) => {
            setFormData({ ...formData, expense_period_end: e.target.value || null });
            setErrors({ ...errors, expense_period_end: '' });
          }}
          error={errors.expense_period_end}
          fullWidth
        />
      </div>

      {/* Montant et devise */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Montant total *"
          type="number"
          step="0.01"
          min="0"
          value={formData.total_amount}
          onChange={(e) => {
            setFormData({ ...formData, total_amount: e.target.value });
            setErrors({ ...errors, total_amount: '' });
          }}
          error={errors.total_amount}
          fullWidth
          placeholder="0.00"
        />
        <Select
          label="Devise"
          value={formData.currency || 'EUR'}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          options={CURRENCY_OPTIONS}
          fullWidth
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
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
          {loading ? 'Enregistrement...' : expenseAccount ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
