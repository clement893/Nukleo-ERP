'use client';

import { useState, useRef } from 'react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react';
import { type ExpenseAccount, type ExpenseAccountCreate, type ExpenseAccountUpdate, expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';

interface ExpenseAccountFormProps {
  expenseAccount?: ExpenseAccount | null;
  onSubmit: (data: ExpenseAccountCreate | ExpenseAccountUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  employees?: Array<{ id: number; first_name: string; last_name: string }>;
  defaultEmployeeId?: number; // Optional default employee ID to pre-fill
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
  defaultEmployeeId,
}: ExpenseAccountFormProps) {
  const [formData, setFormData] = useState<ExpenseAccountCreate>({
    employee_id: expenseAccount?.employee_id || defaultEmployeeId || 0,
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showToast({
        message: 'Type de fichier non supporté. Utilisez une image (JPEG, PNG, GIF, WebP) ou un PDF.',
        type: 'error',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast({
        message: 'Le fichier est trop volumineux. Taille maximale: 10MB',
        type: 'error',
      });
      return;
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExtractWithAI = async () => {
    if (!uploadedFile) return;

    setIsExtracting(true);
    try {
      const extracted = await expenseAccountsAPI.extractFromDocument(uploadedFile);
      
      // Update form with extracted data
      if (extracted.title) {
        setFormData(prev => ({ ...prev, title: extracted.title || prev.title }));
      }
      if (extracted.description) {
        setFormData(prev => ({ ...prev, description: extracted.description || prev.description }));
      }
      if (extracted.total_amount) {
        setFormData(prev => ({ ...prev, total_amount: extracted.total_amount || prev.total_amount }));
      }
      if (extracted.currency) {
        setFormData(prev => ({ ...prev, currency: extracted.currency || prev.currency }));
      }
      if (extracted.expense_period_start) {
        // Convert ISO date to YYYY-MM-DD format for date input
        const date = new Date(extracted.expense_period_start);
        const dateStr = date.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, expense_period_start: dateStr }));
      }
      if (extracted.expense_period_end) {
        const date = new Date(extracted.expense_period_end);
        const dateStr = date.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, expense_period_end: dateStr }));
      }
      if (extracted.metadata) {
        setFormData(prev => ({ ...prev, metadata: extracted.metadata }));
      }

      showToast({
        message: `Données extraites avec succès (confiance: ${Math.round(extracted.confidence * 100)}%)`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error extracting expense data:', error);
      showToast({
        message: error instanceof Error ? error.message : 'Erreur lors de l\'extraction des données. Vous pouvez remplir le formulaire manuellement.',
        type: 'error',
      });
    } finally {
      setIsExtracting(false);
    }
  };

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
      {/* Upload de document */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Importer une facture/reçu (optionnel)
        </label>
        <div className="space-y-2">
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="expense-document-upload"
                disabled={isExtracting}
              />
              <label
                htmlFor="expense-document-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Extraction en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium text-primary">Cliquez pour téléverser</span>
                      <span className="text-sm text-muted-foreground block">ou glissez-déposez un fichier</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Images (JPEG, PNG, GIF, WebP) ou PDF • Max 10MB
                    </span>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isExtracting}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleExtractWithAI}
                disabled={isExtracting}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extraction en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Importer avec IA
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Téléversez un fichier puis cliquez sur "Importer avec IA" pour extraire automatiquement les détails
        </p>
      </div>

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
          disabled={!!defaultEmployeeId && !expenseAccount} // Disable if defaultEmployeeId is provided and not editing
        />
        {defaultEmployeeId && !expenseAccount && (
          <p className="text-xs text-muted-foreground mt-1">
            Le compte de dépense sera créé pour cet employé
          </p>
        )}
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
