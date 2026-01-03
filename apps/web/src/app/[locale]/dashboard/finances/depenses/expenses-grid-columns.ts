import { type EditableColumn } from '@/components/finances/EditableDataGrid';
import { type Transaction, type TransactionStatus } from '@/lib/api/finances/transactions';

const EXPENSE_CATEGORIES = [
  'Fournitures',
  'Marketing',
  'Infrastructure',
  'Salaires',
  'Services',
  'Transport',
  'Formation',
  'Autre',
];

const STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payé' },
  { value: 'cancelled', label: 'Annulé' },
];

export function createExpenseColumns(
  suppliers: Array<{ name: string }>
): EditableColumn<Transaction>[] {
  return [
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      editable: true,
      required: true,
      width: 250,
      validate: (value) => {
        if (!value || String(value).trim() === '') {
          return 'La description est requise';
        }
        return null;
      },
    },
    {
      key: 'amount',
      label: 'Montant',
      type: 'currency',
      editable: true,
      required: true,
      width: 120,
      align: 'right',
      validate: (value) => {
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(num) || num < 0) {
          return 'Le montant doit être un nombre positif';
        }
        return null;
      },
    },
    // Note: tax_amount n'existe pas dans Transaction, on le commente pour l'instant
    // {
    //   key: 'tax_amount',
    //   label: 'Taxes',
    //   type: 'currency',
    //   editable: true,
    //   required: false,
    //   width: 100,
    //   align: 'right',
    //   validate: (value) => {
    //     if (value !== null && value !== undefined && value !== '') {
    //       const num = typeof value === 'number' ? value : parseFloat(String(value));
    //       if (isNaN(num) || num < 0) {
    //         return 'Les taxes doivent être un nombre positif';
    //       }
    //     }
    //     return null;
    //   },
    // },
    {
      key: 'transaction_date',
      label: 'Date transaction',
      type: 'date',
      editable: true,
      required: true,
      width: 140,
    },
    {
      key: 'expected_payment_date',
      label: 'Date paiement prévue',
      type: 'date',
      editable: true,
      required: false,
      width: 150,
    },
    {
      key: 'payment_date',
      label: 'Date paiement réelle',
      type: 'date',
      editable: true,
      required: false,
      width: 150,
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      editable: true,
      required: true,
      width: 130,
      options: STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label })),
    },
    {
      key: 'category',
      label: 'Catégorie',
      type: 'select',
      editable: true,
      required: false,
      width: 140,
      options: [
        { value: '', label: '—' },
        ...EXPENSE_CATEGORIES.map(c => ({ value: c, label: c })),
      ],
    },
    {
      key: 'supplier_name',
      label: 'Fournisseur',
      type: 'select',
      editable: true,
      required: false,
      width: 180,
      options: [
        { value: '', label: '—' },
        ...suppliers.map(s => ({ value: s.name, label: s.name })),
      ],
    },
    {
      key: 'invoice_number',
      label: 'Numéro facture',
      type: 'text',
      editable: true,
      required: false,
      width: 140,
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'text',
      editable: true,
      required: false,
      width: 200,
    },
  ];
}
