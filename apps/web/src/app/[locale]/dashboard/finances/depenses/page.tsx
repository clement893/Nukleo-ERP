'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingDown, FileText, Upload, Download, 
  Building2, Repeat, Receipt, Search,
  Plus, Edit, Eye, CheckCircle, XCircle, Clock,
  Trash2, AlertCircle, CheckCircle2, AlertTriangle, Info
} from 'lucide-react';
import { Card, Button, Badge, Input, Tabs, TabList, Tab, TabPanels, TabPanel, Select, Textarea, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/logger';
import { transactionsAPI, type Transaction, type TransactionCreate, type TransactionUpdate, type TransactionStatus } from '@/lib/api/finances/transactions';
import { handleApiError } from '@/lib/errors/api';
import { createLog } from '@/lib/monitoring/logs';
import ImportLogsViewer from '@/components/finances/ImportLogsViewer';
import EditableDataGrid, { type CellUpdate } from '@/components/finances/EditableDataGrid';
import { createExpenseColumns } from './expenses-grid-columns';

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

interface Supplier {
  id: number;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  total_expenses: number;
  expense_count: number;
}

interface RecurringExpense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  supplier_id?: number;
  supplier_name?: string;
  category: string;
  is_active: boolean;
  next_occurrence: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier_name: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: 'received' | 'paid' | 'overdue' | 'projected';
  category: string;
  description?: string;
}

export default function DepensesPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange] = useState<{ start?: string; end?: string }>({});
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload/Import
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Editable grid state
  const [useGridView, setUseGridView] = useState(true); // Toggle between grid and list view
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<Map<number, Partial<TransactionUpdate>>>(new Map());

  // Prepare suppliers list for select dropdown
  const suppliersList = useMemo(() => {
    const supplierSet = new Set<string>();
    expenses.forEach(exp => {
      if (exp.supplier_name) {
        supplierSet.add(exp.supplier_name);
      }
    });
    return Array.from(supplierSet).map(name => ({ name }));
  }, [expenses]);

  // Create columns for editable grid
  const expenseColumns = useMemo(() => createExpenseColumns(suppliersList), [suppliersList]);

  // Handle cell change with debounce
  const handleCellChange = useCallback((rowId: string | number, columnKey: string, value: any) => {
    const expenseId = typeof rowId === 'string' ? parseInt(rowId) : rowId;
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Prepare update data
    const updateData: Partial<TransactionUpdate> = {};
    
    switch (columnKey) {
      case 'description':
        updateData.description = String(value);
        break;
      case 'amount':
        updateData.amount = typeof value === 'number' ? value : parseFloat(String(value));
        break;
      // case 'tax_amount':
      //   updateData.tax_amount = value ? (typeof value === 'number' ? value : parseFloat(String(value))) : null;
      //   break;
      case 'transaction_date':
        updateData.transaction_date = value ? new Date(value as string).toISOString() : new Date().toISOString();
        break;
      case 'expected_payment_date':
        updateData.expected_payment_date = value ? new Date(value as string).toISOString() : null;
        break;
      case 'payment_date':
        updateData.payment_date = value ? new Date(value as string).toISOString() : null;
        break;
      case 'status':
        updateData.status = value as TransactionStatus;
        break;
      case 'category':
        updateData.category = value || null;
        break;
      case 'supplier_name':
        updateData.supplier_name = value || null;
        break;
      case 'invoice_number':
        updateData.invoice_number = value || null;
        break;
      case 'notes':
        updateData.notes = value || null;
        break;
    }

    // Store in pending updates
    const existingUpdate = pendingUpdates.current.get(expenseId) || {};
    pendingUpdates.current.set(expenseId, { ...existingUpdate, ...updateData });

    // Debounce the API call (500ms)
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const finalUpdate = pendingUpdates.current.get(expenseId);
        if (finalUpdate) {
          await transactionsAPI.update(expenseId, finalUpdate);
          pendingUpdates.current.delete(expenseId);
          // Refresh data
          loadData();
        }
      } catch (err) {
        const appError = handleApiError(err);
        showToast({
          message: appError.message || 'Erreur lors de la mise à jour',
          type: 'error',
        });
        // Revert optimistic update
        loadData();
      }
    }, 500);
  }, [expenses, showToast]);

  // Handle row add
  const handleRowAdd = useCallback(async () => {
    try {
      const newExpense: TransactionCreate = {
        type: 'expense',
        description: 'Nouvelle dépense',
        amount: 0,
        currency: 'CAD',
        category: null,
        transaction_date: new Date().toISOString(),
        payment_date: null,
        status: 'pending',
        supplier_id: null,
        supplier_name: null,
        invoice_number: null,
        notes: null,
      };
      await transactionsAPI.create(newExpense);
      loadData();
      showToast({
        message: 'Nouvelle dépense créée',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création',
        type: 'error',
      });
    }
  }, []);

  // Handle bulk update
  const handleBulkUpdate = useCallback(async (updates: CellUpdate[]) => {
    try {
      // Group updates by row ID
      const updatesByRow = new Map<number, Partial<TransactionUpdate>>();
      updates.forEach(update => {
        const rowId = typeof update.rowId === 'string' ? parseInt(update.rowId) : update.rowId;
        const existing = updatesByRow.get(rowId) || {};
        updatesByRow.set(rowId, { ...existing, [update.columnKey]: update.value });
      });

      // Apply all updates
      await Promise.all(
        Array.from(updatesByRow.entries()).map(([id, update]) =>
          transactionsAPI.update(id, update)
        )
      );

      loadData();
      showToast({
        message: `${updatesByRow.size} dépense(s) mise(s) à jour`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour en lot',
        type: 'error',
      });
      loadData();
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Form state
  const [formData, setFormData] = useState<TransactionCreate>({
    type: 'expense',
    description: '',
    amount: '',
    currency: 'CAD',
    category: null,
    transaction_date: new Date().toISOString().split('T')[0] as string,
    payment_date: null,
    status: 'pending',
    supplier_id: null,
    supplier_name: null,
    invoice_number: null,
    notes: null,
  });

  // Invoice form state
  const [invoiceFormData, setInvoiceFormData] = useState({
    invoice_number: '',
    supplier_name: '',
    amount: '',
    currency: 'CAD',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    category: '',
    description: '',
    status: 'pending' as TransactionStatus,
  });

  // Supplier form state
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });

  // Recurring expense form state
  const [recurringFormData, setRecurringFormData] = useState({
    description: '',
    amount: '',
    currency: 'CAD',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    supplier_name: '',
    category: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'expenses') {
        const data = await transactionsAPI.list({ 
          type: 'expense',
          limit: 1000,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        logger.info(`Loaded ${data.length} expenses from API (filter: status=${statusFilter})`);
        setExpenses(data);
      } else if (activeTab === 'invoices') {
        // Load invoices (expenses with invoice_number)
        const data = await transactionsAPI.list({ 
          type: 'expense',
          limit: 1000,
        });
        const invoiceTransactions = data.filter(t => t.invoice_number);
        const invoiceList: Invoice[] = invoiceTransactions.map(t => ({
          id: t.id,
          invoice_number: t.invoice_number || '',
          supplier_id: t.supplier_id || 0,
          supplier_name: t.supplier_name || 'Fournisseur inconnu',
          amount: parseFloat(t.amount),
          currency: t.currency,
          issue_date: t.transaction_date,
          due_date: t.expected_payment_date || t.transaction_date,
          status: t.status === 'paid' ? 'paid' : 
                  t.status === 'cancelled' ? 'overdue' :
                  new Date(t.expected_payment_date || t.transaction_date) < new Date() ? 'overdue' : 'received',
          category: t.category || 'Autre',
          description: t.description,
        }));
        setInvoices(invoiceList);
      } else if (activeTab === 'suppliers') {
        // Load suppliers (aggregate from transactions)
        const data = await transactionsAPI.list({ 
          type: 'expense',
          limit: 1000,
        });
        const supplierMap = new Map<string, Supplier>();
        data.forEach(t => {
          if (t.supplier_name) {
            const name = t.supplier_name;
            if (!supplierMap.has(name)) {
              // Parse metadata if available
              let metadata: any = {};
              if (t.transaction_metadata) {
                try {
                  metadata = typeof t.transaction_metadata === 'string' 
                    ? JSON.parse(t.transaction_metadata) 
                    : t.transaction_metadata;
                } catch (e) {
                  // Ignore parse errors
                }
              }
              supplierMap.set(name, {
                id: supplierMap.size + 1,
                name: name,
                contact_email: metadata.contact_email || undefined,
                contact_phone: metadata.contact_phone || undefined,
                address: metadata.address || undefined,
                total_expenses: 0,
                expense_count: 0,
              });
            }
            const supplier = supplierMap.get(name)!;
            supplier.total_expenses += parseFloat(t.amount);
            supplier.expense_count += 1;
          }
        });
        setSuppliers(Array.from(supplierMap.values()));
      } else if (activeTab === 'recurring') {
        // Load recurring expenses (transactions with is_recurring='true')
        const data = await transactionsAPI.list({ 
          type: 'expense',
          limit: 1000,
        });
        const recurringTransactions = data.filter(t => t.is_recurring === 'true');
        const recurringList: RecurringExpense[] = recurringTransactions.map(t => {
          let metadata: any = {};
          if (t.transaction_metadata) {
            try {
              metadata = typeof t.transaction_metadata === 'string' 
                ? JSON.parse(t.transaction_metadata) 
                : t.transaction_metadata;
            } catch (e) {
              // Ignore parse errors
            }
          }
          const frequency = metadata.frequency || 'monthly';
          const startDate = new Date(t.transaction_date);
          const endDate = metadata.end_date ? new Date(metadata.end_date) : undefined;
          // Calculate next occurrence
          let nextOccurrence = new Date(startDate);
          const now = new Date();
          while (nextOccurrence < now) {
            if (frequency === 'daily') {
              nextOccurrence.setDate(nextOccurrence.getDate() + 1);
            } else if (frequency === 'weekly') {
              nextOccurrence.setDate(nextOccurrence.getDate() + 7);
            } else if (frequency === 'monthly') {
              nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
            } else if (frequency === 'yearly') {
              nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
            }
          }
          return {
            id: t.id,
            description: t.description,
            amount: parseFloat(t.amount),
            currency: t.currency,
            frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
            start_date: t.transaction_date,
            end_date: endDate?.toISOString().split('T')[0],
            supplier_id: t.supplier_id || undefined,
            supplier_name: t.supplier_name || undefined,
            category: t.category || 'Autre',
            is_active: !endDate || endDate > now,
            next_occurrence: nextOccurrence.toISOString().split('T')[0] as string,
          };
        });
        setRecurringExpenses(recurringList);
      }
    } catch (error) {
      logger.error('Error loading expenses data', error);
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors du chargement des données',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.description.trim()) {
        showToast({ 
          message: 'Veuillez remplir la description', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate and convert amount
      let amountValue: number;
      if (typeof formData.amount === 'string') {
        const parsed = parseFloat(formData.amount);
        if (isNaN(parsed) || parsed <= 0) {
          showToast({ 
            message: 'Le montant doit être supérieur à 0', 
            type: 'error' 
          });
          setIsSubmitting(false);
          return;
        }
        amountValue = parsed;
      } else if (typeof formData.amount === 'number') {
        if (formData.amount <= 0) {
          showToast({ 
            message: 'Le montant doit être supérieur à 0', 
            type: 'error' 
          });
          setIsSubmitting(false);
          return;
        }
        amountValue = formData.amount;
      } else {
        showToast({ 
          message: 'Veuillez entrer un montant valide', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      const transactionData: TransactionCreate = {
        ...formData,
        amount: amountValue,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date as string).toISOString() : null,
      };

      await transactionsAPI.create(transactionData);
      await loadData();
      setShowCreateModal(false);
      resetForm();
      showToast({ 
        message: 'Dépense créée avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors de la création', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedExpense) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate and convert amount if provided
      let amountValue: number | undefined = undefined;
      if (formData.amount !== undefined && formData.amount !== null && formData.amount !== '') {
        if (typeof formData.amount === 'string') {
          const parsed = parseFloat(formData.amount);
          if (isNaN(parsed) || parsed <= 0) {
            showToast({ 
              message: 'Le montant doit être supérieur à 0', 
              type: 'error' 
            });
            setIsSubmitting(false);
            return;
          }
          amountValue = parsed;
        } else if (typeof formData.amount === 'number') {
          if (formData.amount <= 0) {
            showToast({ 
              message: 'Le montant doit être supérieur à 0', 
              type: 'error' 
            });
            setIsSubmitting(false);
            return;
          }
          amountValue = formData.amount;
        }
      }
      
      const updateData: TransactionUpdate = {
        description: formData.description,
        ...(amountValue !== undefined && { amount: amountValue }),
        currency: formData.currency,
        category: formData.category,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date as string).toISOString() : null,
        status: formData.status,
        supplier_id: formData.supplier_id,
        supplier_name: formData.supplier_name,
        invoice_number: formData.invoice_number,
        notes: formData.notes,
      };

      await transactionsAPI.update(selectedExpense.id, updateData);
      await loadData();
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();
      showToast({ 
        message: 'Dépense modifiée avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors de la modification', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
    
    try {
      await transactionsAPI.delete(id);
      await loadData();
      showToast({ 
        message: 'Dépense supprimée avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors de la suppression', 
        type: 'error' 
      });
    }
  };

  const handleOpenEdit = (expense: Transaction) => {
    setSelectedExpense(expense);
    setFormData({
      type: 'expense',
      description: expense.description,
      amount: parseFloat(expense.amount),
      currency: expense.currency,
      category: expense.category || null,
      transaction_date: (expense.transaction_date ? expense.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0]) || '',
      payment_date: expense.payment_date ? expense.payment_date.split('T')[0] : null,
      status: expense.status,
      supplier_id: expense.supplier_id || null,
      supplier_name: expense.supplier_name || null,
      invoice_number: expense.invoice_number || null,
      notes: expense.notes || null,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      description: '',
      amount: '',
      currency: 'CAD',
      category: null,
      transaction_date: new Date().toISOString().split('T')[0] as string,
      payment_date: null,
      status: 'pending',
      supplier_id: null,
      supplier_name: null,
      invoice_number: null,
      notes: null,
    });
  };

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      invoice_number: '',
      supplier_name: '',
      amount: '',
      currency: 'CAD',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      category: '',
      description: '',
      status: 'pending',
    });
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
    });
  };

  const resetRecurringForm = () => {
    setRecurringFormData({
      description: '',
      amount: '',
      currency: 'CAD',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      supplier_name: '',
      category: '',
    });
  };

  const handleCreateInvoice = async () => {
    try {
      setIsSubmitting(true);
      if (!invoiceFormData.invoice_number.trim() || !invoiceFormData.supplier_name.trim()) {
        showToast({ 
          message: 'Veuillez remplir tous les champs requis (numéro de facture, fournisseur, montant)', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate and convert amount
      const amountValue = parseFloat(invoiceFormData.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        showToast({ 
          message: 'Le montant doit être supérieur à 0', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      const transactionData: TransactionCreate = {
        type: 'expense',
        description: invoiceFormData.description || `Facture ${invoiceFormData.invoice_number} - ${invoiceFormData.supplier_name}`,
        amount: amountValue,
        currency: invoiceFormData.currency,
        category: invoiceFormData.category || null,
        transaction_date: new Date(invoiceFormData.issue_date as string).toISOString(),
        payment_date: invoiceFormData.status === 'paid' ? new Date().toISOString() : null,
        expected_payment_date: invoiceFormData.due_date ? new Date(invoiceFormData.due_date as string).toISOString() : null,
        status: invoiceFormData.status,
        supplier_name: invoiceFormData.supplier_name,
        invoice_number: invoiceFormData.invoice_number,
        notes: null,
      };

      await transactionsAPI.create(transactionData);
      await loadData();
      setShowInvoiceModal(false);
      resetInvoiceForm();
      showToast({ 
        message: 'Facture ajoutée avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors de la création de la facture', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      setIsSubmitting(true);
      if (!supplierFormData.name.trim()) {
        showToast({ 
          message: 'Veuillez remplir le nom du fournisseur', 
          type: 'error' 
        });
        return;
      }

      // Create a transaction with metadata to store supplier info
      const metadata = {
        contact_email: supplierFormData.contact_email || undefined,
        contact_phone: supplierFormData.contact_phone || undefined,
        address: supplierFormData.address || undefined,
        is_supplier_record: true, // Flag to identify supplier records
      };

      // For supplier records, we use a minimal amount (0.01) since the schema requires gt=0
      // This is a workaround - ideally we'd have a separate supplier table
      const transactionData: TransactionCreate = {
        type: 'expense',
        description: `Fournisseur: ${supplierFormData.name}`,
        amount: 0.01, // Minimal amount for supplier record (schema requires gt=0)
        currency: 'CAD',
        category: null,
        transaction_date: new Date().toISOString(),
        status: 'paid',
        supplier_name: supplierFormData.name,
        notes: 'Enregistrement de fournisseur',
        transaction_metadata: JSON.stringify(metadata),
      };

      await transactionsAPI.create(transactionData);
      await loadData();
      setShowSupplierModal(false);
      resetSupplierForm();
      showToast({ 
        message: 'Fournisseur ajouté avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors de la création du fournisseur', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRecurring = async () => {
    try {
      setIsSubmitting(true);
      if (!recurringFormData.description.trim()) {
        showToast({ 
          message: 'Veuillez remplir la description', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate and convert amount
      const amountValue = parseFloat(recurringFormData.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        showToast({ 
          message: 'Le montant doit être supérieur à 0', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return;
      }

      const metadata = {
        frequency: recurringFormData.frequency,
        end_date: recurringFormData.end_date || undefined,
      };

      const transactionData: TransactionCreate = {
        type: 'expense',
        description: recurringFormData.description,
        amount: amountValue,
        currency: recurringFormData.currency,
        category: recurringFormData.category || null,
        transaction_date: new Date(recurringFormData.start_date as string).toISOString(),
        status: 'pending',
        supplier_name: recurringFormData.supplier_name || null,
        is_recurring: 'true',
        transaction_metadata: JSON.stringify(metadata),
      };

      await transactionsAPI.create(transactionData);
      await loadData();
      setShowRecurringModal(false);
      resetRecurringForm();
      showToast({ 
        message: 'Dépense récurrente ajoutée avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors de la création de la dépense récurrente', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await transactionsAPI.downloadTemplate('zip');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_depenses.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast({ 
        message: 'Modèle téléchargé avec succès', 
        type: 'success' 
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur lors du téléchargement', 
        type: 'error' 
      });
    }
  };
  


  const handleUpload = async () => {
    if (!uploadFile) {
      showToast({
        message: 'Veuillez sélectionner un fichier',
        type: 'error',
      });
      return;
    }

    try {
      setUploading(true);
      createLog('info', `Début de l'import du fichier: ${uploadFile.name}`, { filename: uploadFile.name, size: uploadFile.size }, 'import-transactions');
      
      const result = await transactionsAPI.import(uploadFile, false);
      setImportResult(result);
      
      // Logs d'import
      const totalRows = result.created_count + result.error_count;
      createLog('info', `Import terminé: ${totalRows} ligne(s) traitée(s)`, {
        total_rows: totalRows,
        valid_rows: result.created_count,
        invalid_rows: result.error_count,
        created_count: result.created_count,
        error_count: result.error_count
      }, 'import-transactions');
      
      if (result.success && result.created_count > 0) {
        createLog('info', `${result.created_count} transaction(s) créée(s) avec succès`, {
          created_count: result.created_count
        }, 'import-transactions');
        // Force a complete refresh by resetting filters and reloading
        setStatusFilter('all');
        setCategoryFilter('all');
        setSearchQuery('');
        // Wait a bit to ensure backend has committed the transactions
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadData();
        showToast({
          message: `${result.created_count} transaction(s) importée(s) avec succès`,
          type: 'success',
        });
      } else if (result.created_count === 0) {
        const totalRows = result.created_count + result.error_count;
        createLog('warn', 'Aucune transaction créée lors de l\'import', {
          total_rows: totalRows,
          valid_rows: result.created_count,
          invalid_rows: result.error_count,
          error_count: result.error_count,
          warnings_count: result.warnings?.length || 0
        }, 'import-transactions');
      }
      
      if (result.error_count > 0) {
        createLog('error', `${result.error_count} erreur(s) lors de l'import`, {
          error_count: result.error_count,
          errors: result.errors
        }, 'import-transactions');
        showToast({
          message: `${result.error_count} erreur(s) lors de l'import`,
          type: 'error',
        });
      }
      
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: any, idx: number) => {
          const warningMsg = typeof warning === 'string' 
            ? warning 
            : warning.message || warning.warning || `Avertissement ligne ${warning.row || idx + 1}`;
          createLog('warn', warningMsg, { warning, row: warning.row }, 'import-transactions');
        });
      }
      
      if (result.errors && result.errors.length > 0) {
        result.errors.slice(0, 10).forEach((error: any) => {
          createLog('error', `Ligne ${error.row}: ${error.error || error.message}`, { error, row: error.row }, 'import-transactions');
        });
        if (result.errors.length > 10) {
          createLog('error', `... et ${result.errors.length - 10} autre(s) erreur(s)`, { total_errors: result.errors.length }, 'import-transactions');
        }
      }
    } catch (error) {
      logger.error('Error uploading file', error);
      const appError = handleApiError(error);
      createLog('error', `Erreur lors de l'import: ${appError.message || 'Erreur inconnue'}`, { error: appError }, 'import-transactions');
      showToast({
        message: appError.message || 'Erreur lors de l\'import du fichier',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const badges = {
      paid: { label: 'Payé', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    };
    return badges[status];
  };

  const getInvoiceStatusBadge = (status: 'received' | 'paid' | 'overdue' | 'projected') => {
    const badges = {
      paid: { label: 'Payé', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      received: { label: 'Reçue', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: FileText },
      overdue: { label: 'En retard', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      projected: { label: 'Projetée', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
    };
    return badges[status];
  };

  const filteredExpenses = expenses.filter(expense => {
    if (searchQuery && !expense.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && expense.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false;
    }
    if (dateRange.start && expense.transaction_date < dateRange.start) {
      return false;
    }
    if (dateRange.end && expense.transaction_date > dateRange.end) {
      return false;
    }
    return true;
  });

  const totalExpenses = expenses
    .filter(e => e.status !== 'cancelled')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const pendingExpenses = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const paidExpenses = expenses
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <PageContainer maxWidth="full">
      <MotionDiv variant="slideUp" duration="normal">
        {/* Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1 font-nukleo">
                    Dépenses
                  </h1>
                  <p className="text-white/80 text-sm">Gérez toutes vos dépenses, fournisseurs et factures</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 !text-white border-white/30 backdrop-blur-sm"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Modèle Excel
                </Button>
                <Button
                  className="bg-white/20 hover:bg-white/30 !text-white border-white/30 backdrop-blur-sm"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer Excel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total dépenses</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600 font-nukleo">
              {formatCurrency(totalExpenses)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-yellow-600 font-nukleo">
              {formatCurrency(pendingExpenses)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Payées</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600 font-nukleo">
              {formatCurrency(paidExpenses)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fournisseurs</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-purple-600 font-nukleo">
              {suppliers.length}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className="mb-6">
            <Tab value="expenses">
              <Receipt className="w-4 h-4 mr-2" />
              Toutes les dépenses
            </Tab>
            <Tab value="suppliers">
              <Building2 className="w-4 h-4 mr-2" />
              Fournisseurs
            </Tab>
            <Tab value="recurring">
              <Repeat className="w-4 h-4 mr-2" />
              Dépenses récurrentes
            </Tab>
            <Tab value="invoices">
              <FileText className="w-4 h-4 mr-2" />
              Factures reçues
            </Tab>
          </TabList>

          <TabPanels>
            {/* Expenses Tab */}
            <TabPanel value="expenses">
              <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher une dépense..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
                      options={[
                        { label: 'Tous les statuts', value: 'all' },
                        ...STATUS_OPTIONS.map(s => ({ label: s.label, value: s.value })),
                      ]}
                    />
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      options={[
                        { label: 'Toutes les catégories', value: 'all' },
                        ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
                      ]}
                    />
                    <Button
                      variant={useGridView ? 'outline' : 'primary'}
                      onClick={() => setUseGridView(!useGridView)}
                      size="sm"
                      className={useGridView ? '!text-white' : ''}
                    >
                      {useGridView ? 'Vue liste' : 'Vue tableau'}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={useGridView ? handleRowAdd : () => {
                        resetForm();
                        setShowCreateModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle dépense
                    </Button>
                  </div>
                </div>

                {useGridView ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <EditableDataGrid<Transaction>
                      data={filteredExpenses}
                      columns={expenseColumns}
                      onCellChange={handleCellChange}
                      onRowAdd={handleRowAdd}
                      onBulkUpdate={handleBulkUpdate}
                      rowKey={(row) => row.id}
                      loading={loading}
                      className="min-h-[400px]"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      </div>
                    ) : filteredExpenses.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {expenses.length === 0 ? 'Aucune dépense trouvée' : 'Aucune dépense ne correspond à votre recherche'}
                        </p>
                        {expenses.length === 0 && importResult && importResult.created_count > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4 max-w-md mx-auto">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <AlertCircle className="w-4 h-4 inline mr-2" />
                              {importResult.created_count} dépense(s) importée(s) mais non visible. Vérifiez les filtres ou rafraîchissez la page.
                            </p>
                          </div>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une dépense
                        </Button>
                      </div>
                    ) : (
                      filteredExpenses.map((expense) => {
                        const badge = getStatusBadge(expense.status);
                        const Icon = badge.icon;
                        return (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">{expense.description}</h3>
                                <Badge className={`${badge.color} flex items-center gap-1`}>
                                  <Icon className="w-3 h-3" />
                                  {badge.label}
                                </Badge>
                                {expense.category && (
                                  <Badge variant="default">{expense.category}</Badge>
                                )}
                                {expense.is_recurring === 'true' && (
                                  <Badge className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1">
                                    <Repeat className="w-3 h-3" />
                                    Récurrente
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>{formatDate(expense.transaction_date)}</span>
                                {expense.category && (
                                  <>
                                    <span>•</span>
                                    <span>{expense.category}</span>
                                  </>
                                )}
                                {expense.supplier_name && (
                                  <>
                                    <span>•</span>
                                    <span>{expense.supplier_name}</span>
                                  </>
                                )}
                                {expense.invoice_number && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{expense.invoice_number}</span>
                                  </>
                                )}
                                {expense.payment_date && (
                                  <>
                                    <span>•</span>
                                    <span>Payé le: {formatDate(expense.payment_date)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xl font-bold text-red-600">
                                  {formatCurrency(parseFloat(expense.amount), expense.currency)}
                                </div>
                                <div className="text-xs text-gray-500">{expense.currency}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEdit(expense)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(expense.id)}
                                  className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            </TabPanel>

            {/* Suppliers Tab */}
            <TabPanel value="suppliers">
              <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-nukleo">Fournisseurs</h2>
                  <Button
                    variant="primary"
                    onClick={() => {
                      resetSupplierForm();
                      setShowSupplierModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau fournisseur
                  </Button>
                </div>

                <div className="space-y-3">
                  {loading && activeTab === 'suppliers' ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun fournisseur</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          resetSupplierForm();
                          setShowSupplierModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un fournisseur
                      </Button>
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{supplier.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {supplier.contact_email && <span>{supplier.contact_email}</span>}
                            {supplier.contact_phone && (
                              <>
                                {supplier.contact_email && <span>•</span>}
                                <span>{supplier.contact_phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total dépenses</div>
                            <div className="text-lg font-bold">
                              {formatCurrency(supplier.total_expenses)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {supplier.expense_count} dépense{supplier.expense_count > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // TODO: Open supplier edit modal
                                showToast({
                                  message: 'Fonctionnalité à venir',
                                  type: 'info',
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabPanel>

            {/* Recurring Expenses Tab */}
            <TabPanel value="recurring">
              <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-nukleo">Dépenses récurrentes</h2>
                  <Button
                    variant="primary"
                    onClick={() => {
                      resetRecurringForm();
                      setShowRecurringModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle dépense récurrente
                  </Button>
                </div>

                <div className="space-y-3">
                  {loading && activeTab === 'recurring' ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                  ) : recurringExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <Repeat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune dépense récurrente</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          resetRecurringForm();
                          setShowRecurringModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une dépense récurrente
                      </Button>
                    </div>
                  ) : (
                    recurringExpenses.map((recurring) => (
                      <div
                        key={recurring.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{recurring.description}</h3>
                            <Badge className={recurring.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {recurring.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{formatCurrency(recurring.amount, recurring.currency)}</span>
                            <span>•</span>
                            <span>
                              {recurring.frequency === 'daily' && 'Quotidien'}
                              {recurring.frequency === 'weekly' && 'Hebdomadaire'}
                              {recurring.frequency === 'monthly' && 'Mensuel'}
                              {recurring.frequency === 'yearly' && 'Annuel'}
                            </span>
                            <span>•</span>
                            <span>Prochaine: {formatDate(recurring.next_occurrence)}</span>
                            {recurring.supplier_name && (
                              <>
                                <span>•</span>
                                <span>{recurring.supplier_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-600">
                              {formatCurrency(recurring.amount, recurring.currency)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // TODO: Open recurring expense edit modal
                                showToast({
                                  message: 'Fonctionnalité à venir',
                                  type: 'info',
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabPanel>

            {/* Invoices Tab */}
            <TabPanel value="invoices">
              <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-nukleo">Factures reçues</h2>
                  <Button
                    variant="primary"
                    onClick={() => {
                      resetInvoiceForm();
                      setShowInvoiceModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle facture
                  </Button>
                </div>

                <div className="space-y-3">
                  {loading && activeTab === 'invoices' ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune facture</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          resetInvoiceForm();
                          setShowInvoiceModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une facture
                      </Button>
                    </div>
                  ) : (
                    invoices.map((invoice) => {
                      const badge = getInvoiceStatusBadge(invoice.status);
                      const Icon = badge.icon;
                      return (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{invoice.supplier_name}</h3>
                              <Badge className={`${badge.color} flex items-center gap-1`}>
                                <Icon className="w-3 h-3" />
                                {badge.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-mono">{invoice.invoice_number}</span>
                              <span>•</span>
                              <span>Émise: {formatDate(invoice.issue_date)}</span>
                              <span>•</span>
                              <span>Échéance: {formatDate(invoice.due_date)}</span>
                              <span>•</span>
                              <span>{invoice.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-bold text-red-600">
                                {formatCurrency(invoice.amount, invoice.currency)}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // TODO: Open invoice details
                                  showToast({
                                    message: 'Fonctionnalité à venir',
                                    type: 'info',
                                  });
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Create Expense Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Nouvelle dépense"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Achat de fournitures de bureau"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant *"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for user input, but validate on submit
                  setFormData({ ...formData, amount: value });
                }}
                placeholder="0.00"
                required
              />
              <Select
                label="Devise"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { label: 'CAD', value: 'CAD' },
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date de transaction *"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
              <Input
                label="Date de paiement"
                type="date"
                value={formData.payment_date || ''}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value || null })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                options={[
                  { label: 'Aucune', value: '' },
                  ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
                ]}
              />
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                options={STATUS_OPTIONS.map(s => ({ label: s.label, value: s.value }))}
              />
            </div>

            <Input
              label="Fournisseur"
              value={formData.supplier_name || ''}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value || null })}
              placeholder="Nom du fournisseur"
            />

            <Input
              label="Numéro de facture"
              value={formData.invoice_number || ''}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value || null })}
              placeholder="Ex: FAC-2025-001"
            />

            <Textarea
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              placeholder="Notes additionnelles..."
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Expense Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExpense(null);
            resetForm();
          }}
          title="Modifier la dépense"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Achat de fournitures de bureau"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant *"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for user input, but validate on submit
                  setFormData({ ...formData, amount: value });
                }}
                placeholder="0.00"
                required
              />
              <Select
                label="Devise"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { label: 'CAD', value: 'CAD' },
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date de transaction *"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
              <Input
                label="Date de paiement"
                type="date"
                value={formData.payment_date || ''}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value || null })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                options={[
                  { label: 'Aucune', value: '' },
                  ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
                ]}
              />
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
                options={STATUS_OPTIONS.map(s => ({ label: s.label, value: s.value }))}
              />
            </div>

            <Input
              label="Fournisseur"
              value={formData.supplier_name || ''}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value || null })}
              placeholder="Nom du fournisseur"
            />

            <Input
              label="Numéro de facture"
              value={formData.invoice_number || ''}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value || null })}
              placeholder="Ex: FAC-2025-001"
            />

            <Textarea
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              placeholder="Notes additionnelles..."
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedExpense(null);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Supplier Modal */}
        <Modal
          isOpen={showSupplierModal}
          onClose={() => {
            setShowSupplierModal(false);
            resetSupplierForm();
          }}
          title="Ajouter un fournisseur"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Nom du fournisseur *"
              value={supplierFormData.name}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
              placeholder="Nom du fournisseur"
              required
            />

            <Input
              label="Email"
              type="email"
              value={supplierFormData.contact_email}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_email: e.target.value })}
              placeholder="email@exemple.com"
            />

            <Input
              label="Téléphone"
              value={supplierFormData.contact_phone}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />

            <Textarea
              label="Adresse"
              value={supplierFormData.address}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
              placeholder="Adresse complète du fournisseur"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSupplierModal(false);
                  resetSupplierForm();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateSupplier}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Ajouter le fournisseur'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Recurring Expense Modal */}
        <Modal
          isOpen={showRecurringModal}
          onClose={() => {
            setShowRecurringModal(false);
            resetRecurringForm();
          }}
          title="Ajouter une dépense récurrente"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Description *"
              value={recurringFormData.description}
              onChange={(e) => setRecurringFormData({ ...recurringFormData, description: e.target.value })}
              placeholder="Ex: Abonnement mensuel"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant *"
                type="number"
                step="0.01"
                min="0.01"
                value={recurringFormData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setRecurringFormData({ ...recurringFormData, amount: value });
                }}
                placeholder="0.00"
                required
              />
              <Select
                label="Devise"
                value={recurringFormData.currency}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, currency: e.target.value })}
                options={[
                  { label: 'CAD', value: 'CAD' },
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Fréquence *"
                value={recurringFormData.frequency}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' })}
                options={[
                  { label: 'Quotidienne', value: 'daily' },
                  { label: 'Hebdomadaire', value: 'weekly' },
                  { label: 'Mensuelle', value: 'monthly' },
                  { label: 'Annuelle', value: 'yearly' },
                ]}
              />
              <Input
                label="Date de début *"
                type="date"
                value={recurringFormData.start_date}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, start_date: e.target.value })}
                required
              />
            </div>

            <Input
              label="Date de fin (optionnel)"
              type="date"
              value={recurringFormData.end_date}
              onChange={(e) => setRecurringFormData({ ...recurringFormData, end_date: e.target.value })}
              placeholder="Laissez vide pour récurrente indéfiniment"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={recurringFormData.category}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, category: e.target.value })}
                options={[
                  { label: 'Aucune', value: '' },
                  ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
                ]}
              />
              <Input
                label="Fournisseur"
                value={recurringFormData.supplier_name}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, supplier_name: e.target.value })}
                placeholder="Nom du fournisseur (optionnel)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRecurringModal(false);
                  resetRecurringForm();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateRecurring}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Ajouter la dépense récurrente'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Invoice Modal */}
        <Modal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            resetInvoiceForm();
          }}
          title="Ajouter une facture reçue"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Numéro de facture *"
              value={invoiceFormData.invoice_number}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoice_number: e.target.value })}
              placeholder="Ex: FAC-2025-001"
              required
            />

            <Input
              label="Fournisseur *"
              value={invoiceFormData.supplier_name}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, supplier_name: e.target.value })}
              placeholder="Nom du fournisseur"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant *"
                type="number"
                step="0.01"
                min="0.01"
                value={invoiceFormData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setInvoiceFormData({ ...invoiceFormData, amount: value });
                }}
                placeholder="0.00"
                required
              />
              <Select
                label="Devise"
                value={invoiceFormData.currency}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, currency: e.target.value })}
                options={[
                  { label: 'CAD', value: 'CAD' },
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date d'émission *"
                type="date"
                value={invoiceFormData.issue_date}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, issue_date: e.target.value })}
                required
              />
              <Input
                label="Date d'échéance"
                type="date"
                value={invoiceFormData.due_date}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={invoiceFormData.category}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, category: e.target.value })}
                options={[
                  { label: 'Aucune', value: '' },
                  ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
                ]}
              />
              <Select
                label="Statut"
                value={invoiceFormData.status}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, status: e.target.value as TransactionStatus })}
                options={STATUS_OPTIONS.map(s => ({ label: s.label, value: s.value }))}
              />
            </div>

            <Textarea
              label="Description"
              value={invoiceFormData.description}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
              placeholder="Description de la facture (optionnel)"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInvoiceModal(false);
                  resetInvoiceForm();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Ajouter la facture'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Upload/Import Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setUploadFile(null);
            setImportResult(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          title="Importer des dépenses"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Téléchargez le modèle pour voir le format attendu</li>
                    <li>Remplissez le fichier CSV ou Excel avec vos données</li>
                    <li>Colonnes requises: Type, Description, Montant HT, Date Emission</li>
                    <li>Colonnes optionnelles: Montant Taxes, Fournisseur, Date Reception Prevue, etc.</li>
                    <li>Formats acceptés: CSV, Excel (.xlsx, .xls), ou ZIP</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fichier à importer
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.zip"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    setImportResult(null);
                  }
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-500 file:text-white
                  hover:file:bg-primary-600
                  file:cursor-pointer"
              />
            </div>

            {importResult && (
              <div className="space-y-3">
                {/* Résumé principal */}
                <div className={`p-4 rounded-lg border ${
                  importResult.success 
                    ? importResult.created_count > 0
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {importResult.success ? (
                      importResult.created_count > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      )
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${
                        importResult.success 
                          ? importResult.created_count > 0
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-yellow-900 dark:text-yellow-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {importResult.success 
                          ? importResult.created_count > 0
                            ? 'Import réussi'
                            : 'Import terminé - Aucune transaction créée'
                          : 'Erreurs lors de l\'import'
                        }
                      </h3>
                      <div className="text-sm space-y-2">
                        <div className="flex flex-wrap gap-4">
                          {importResult.created_count !== undefined && (
                            <p className={importResult.created_count > 0 ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}>
                              <span className="font-semibold">{importResult.created_count}</span> transaction(s) créée(s)
                            </p>
                          )}
                          {importResult.error_count !== undefined && importResult.error_count > 0 && (
                            <p className="text-red-800 dark:text-red-200">
                              <span className="font-semibold">{importResult.error_count}</span> erreur(s)
                            </p>
                          )}
                          {importResult.warnings && importResult.warnings.length > 0 && (
                            <p className="text-yellow-800 dark:text-yellow-200">
                              <span className="font-semibold">{importResult.warnings.length}</span> avertissement(s)
                            </p>
                          )}
                          {importResult.created_count !== undefined && importResult.error_count !== undefined && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">{importResult.created_count + importResult.error_count}</span> ligne(s) traitée(s)
                            </p>
                          )}
                        </div>
                        {importResult.success && importResult.created_count === 0 && (
                          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-2">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              <Info className="w-4 h-4 inline mr-1" />
                              Aucune transaction n'a été créée. Vérifiez que votre fichier contient des données valides et que les colonnes requises sont présentes.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {importResult.warnings && importResult.warnings.length > 0 && (
                  <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                          Avertissements ({importResult.warnings.length})
                        </h4>
                        <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                          {importResult.warnings.slice(0, 20).map((warning: any, idx: number) => (
                            <li key={idx} className="text-xs text-yellow-800 dark:text-yellow-200">
                              {typeof warning === 'string' 
                                ? warning 
                                : warning.row 
                                  ? `Ligne ${warning.row}: ${warning.message || warning.warning || JSON.stringify(warning)}`
                                  : warning.message || warning.warning || JSON.stringify(warning)
                              }
                            </li>
                          ))}
                          {importResult.warnings.length > 20 && (
                            <li className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                              ... et {importResult.warnings.length - 20} autre(s) avertissement(s)
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Erreurs */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Erreurs ({importResult.errors.length})
                        </h4>
                        <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                          {importResult.errors.slice(0, 20).map((error: any, idx: number) => (
                            <li key={idx} className="text-xs text-red-800 dark:text-red-200">
                              {error.row 
                                ? `Ligne ${error.row}: ${error.error || error.message || JSON.stringify(error)}`
                                : error.error || error.message || JSON.stringify(error)
                              }
                            </li>
                          ))}
                          {importResult.errors.length > 20 && (
                            <li className="text-xs text-red-600 dark:text-red-400 italic">
                              ... et {importResult.errors.length - 20} autre(s) erreur(s)
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logs d'import - Toujours visible */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Logs d'import en temps réel</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clear logs
                    const { logStore } = require('@/lib/monitoring/logs');
                    logStore.clearLogs();
                  }}
                >
                  Effacer
                </Button>
              </div>
              <div className="max-h-96 overflow-hidden border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                <ImportLogsViewer />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setImportResult(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={uploading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Import en cours...' : 'Importer'}
              </Button>
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
