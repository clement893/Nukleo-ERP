'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingDown, FileText, Upload, Download, 
  Building2, Repeat, Receipt, Calendar, Search,
  Plus, Edit, Eye, CheckCircle, XCircle, Clock,
  AlertCircle, Info, Trash2
} from 'lucide-react';
import { Card, Button, Badge, Input, Tabs, TabList, Tab, TabPanels, TabPanel, Select, Textarea, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/logger';
import { transactionsAPI, type Transaction, type TransactionCreate, type TransactionUpdate, type TransactionStatus } from '@/lib/api/finances/transactions';
import { handleApiError } from '@/lib/errors/api';

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
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TransactionCreate>({
    type: 'expense',
    description: '',
    amount: '',
    currency: 'CAD',
    category: null,
    transaction_date: new Date().toISOString().split('T')[0],
    payment_date: null,
    status: 'pending',
    supplier_id: null,
    supplier_name: null,
    invoice_number: null,
    notes: null,
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
        setExpenses(data);
      } else {
        // TODO: Load suppliers, recurring expenses, invoices
        setSuppliers([]);
        setRecurringExpenses([]);
        setInvoices([]);
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
      if (!formData.description.trim() || !formData.amount) {
        showToast({ 
          message: 'Veuillez remplir tous les champs requis', 
          type: 'error' 
        });
        return;
      }

      const transactionData: TransactionCreate = {
        ...formData,
        amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
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
      const updateData: TransactionUpdate = {
        description: formData.description,
        amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
        currency: formData.currency,
        category: formData.category,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
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
      transaction_date: expense.transaction_date.split('T')[0],
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
      transaction_date: new Date().toISOString().split('T')[0],
      payment_date: null,
      status: 'pending',
      supplier_id: null,
      supplier_name: null,
      invoice_number: null,
      notes: null,
    });
  };

  const handleDownloadTemplate = () => {
    // Create Excel template
    const templateData = [
      ['Description', 'Montant', 'Devise', 'Date', 'Catégorie', 'Fournisseur', 'Statut', 'Numéro facture', 'Notes'],
      ['Exemple: Frais de bureau', '150.00', 'EUR', '2025-01-15', 'Fournitures', 'Fournisseur ABC', 'pending', 'FAC-2025-001', 'Notes optionnelles'],
    ];

    // Convert to CSV for now (Excel would require a library)
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_depenses.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      message: 'Modèle téléchargé avec succès',
      type: 'success',
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showToast({
        message: 'Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv',
        type: 'error',
      });
      return;
    }

    setUploadFile(file);
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
      // TODO: Implement Excel import for expenses
      // For now, show a message
      showToast({
        message: 'Import Excel à venir prochainement',
        type: 'info',
      });
      
      setShowUploadModal(false);
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Error uploading file', error);
      showToast({
        message: 'Erreur lors de l\'import du fichier',
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
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Modèle Excel
                </Button>
                <Button
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
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
                      variant="primary"
                      onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle dépense
                    </Button>
                  </div>
                </div>

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
                      // TODO: Open supplier modal
                      showToast({
                        message: 'Fonctionnalité à venir',
                        type: 'info',
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau fournisseur
                  </Button>
                </div>

                <div className="space-y-3">
                  {suppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun fournisseur</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // TODO: Open supplier modal
                          showToast({
                            message: 'Fonctionnalité à venir',
                            type: 'info',
                          });
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
                      // TODO: Open recurring expense modal
                      showToast({
                        message: 'Fonctionnalité à venir',
                        type: 'info',
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle dépense récurrente
                  </Button>
                </div>

                <div className="space-y-3">
                  {recurringExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <Repeat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune dépense récurrente</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // TODO: Open recurring expense modal
                          showToast({
                            message: 'Fonctionnalité à venir',
                            type: 'info',
                          });
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
                      // TODO: Open invoice modal
                      showToast({
                        message: 'Fonctionnalité à venir',
                        type: 'info',
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle facture
                  </Button>
                </div>

                <div className="space-y-3">
                  {invoices.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune facture</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // TODO: Open invoice modal
                          showToast({
                            message: 'Fonctionnalité à venir',
                            type: 'info',
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une facture
                      </Button>
                    </div>
                  ) : (
                    invoices.map((invoice) => {
                      const badge = getStatusBadge(invoice.status);
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
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setUploadFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          title="Importer des dépenses depuis Excel"
          size="lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
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
            </>
          }
        >
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Instructions d'import
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Le fichier doit contenir une ligne d'en-tête avec les colonnes suivantes :</li>
                    <li className="ml-4">Description, Montant, Devise, Date, Catégorie, Fournisseur, Statut, Numéro facture, Notes</li>
                    <li>Les dates doivent être au format YYYY-MM-DD (ex: 2025-01-15)</li>
                    <li>Les montants doivent être des nombres (ex: 150.00)</li>
                    <li>Les statuts valides sont : paid, pending, projected, cancelled</li>
                    <li>Les colonnes Fournisseur, Numéro facture et Notes sont optionnelles</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sélectionner un fichier Excel (.xlsx, .xls) ou CSV
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
              />
              {uploadFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Fichier sélectionné : {uploadFile.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Download className="w-4 h-4" />
              <button
                onClick={handleDownloadTemplate}
                className="text-primary-500 hover:text-primary-600 underline"
              >
                Télécharger le modèle Excel
              </button>
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
