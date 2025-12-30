'use client';

import { SubmissionWizardData } from '../SubmissionWizard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Plus, Trash2, DollarSign } from 'lucide-react';

interface BudgetProps {
  data: SubmissionWizardData;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
];

export default function SubmissionBudget({
  data,
  onChange,
}: BudgetProps) {
  const addBudgetItem = () => {
    onChange({
      budgetItems: [
        ...data.budgetItems,
        { description: '', quantity: 1, unitPrice: 0, total: 0 },
      ],
    });
  };

  const updateBudgetItem = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const newItems = [...data.budgetItems];
    const item = { ...newItems[index] };
    
    if (field === 'description') {
      item.description = value as string;
    } else if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'unitPrice') {
      item.unitPrice = Number(value);
    }
    
    // Ensure quantity and unitPrice are numbers
    const quantity = item.quantity ?? 0;
    const unitPrice = item.unitPrice ?? 0;
    item.total = quantity * unitPrice;
    
    // Ensure all required fields are present
    newItems[index] = {
      description: item.description || '',
      quantity: quantity,
      unitPrice: unitPrice,
      total: item.total,
    };
    
    const total = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    onChange({
      budgetItems: newItems,
      budgetTotal: total,
    });
  };

  const removeBudgetItem = (index: number) => {
    const newItems = data.budgetItems.filter((_, i) => i !== index);
    const total = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    onChange({
      budgetItems: newItems,
      budgetTotal: total,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Budget détaillé</h2>
        <p className="text-muted-foreground">
          Définissez le budget détaillé du projet
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Devise"
          value={data.currency}
          onChange={(e) => onChange({ currency: e.target.value })}
          options={CURRENCY_OPTIONS}
          fullWidth
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Lignes budgétaires
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBudgetItem}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter une ligne
          </Button>
        </div>

        {data.budgetItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <p>Aucune ligne budgétaire</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter une ligne" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.budgetItems.map((item, index) => (
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
                    onClick={() => removeBudgetItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  label="Description"
                  value={item.description}
                  onChange={(e) => updateBudgetItem(index, 'description', e.target.value)}
                  fullWidth
                  placeholder="Description de la ligne budgétaire"
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Quantité"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.quantity.toString()}
                    onChange={(e) => updateBudgetItem(index, 'quantity', e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Prix unitaire"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice.toString()}
                    onChange={(e) => updateBudgetItem(index, 'unitPrice', e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Total"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.total.toString()}
                    disabled
                    fullWidth
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.budgetItems.length > 0 && (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Total:</span>
            <span className="font-bold text-lg text-primary flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {data.budgetTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
