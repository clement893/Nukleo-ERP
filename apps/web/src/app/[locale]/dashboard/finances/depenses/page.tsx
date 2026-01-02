'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingDown, FileText, Upload, Download, 
  Building2, Repeat, Receipt, Calendar, Search,
  Plus, Edit, Eye, CheckCircle, XCircle, Clock,
  AlertCircle, Info
} from 'lucide-react';
import { Card, Button, Badge, Input, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

// Types
interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  supplier_id?: number;
  supplier_name?: string;
  status: 'paid' | 'pending' | 'projected' | 'cancelled';
  invoice_number?: string;
  is_recurring: boolean;
  recurring_id?: number;
  payment_date?: string;
  notes?: string;
}

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'projected'>('all');
  const [categoryFilter] = useState<string>('all');
  const [dateRange] = useState<{ start?: string; end?: string }>({});
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    try {
      // TODO: Load from API
      // For now, using mock data
      setExpenses([]);
      setSuppliers([]);
      setRecurringExpenses([]);
      setInvoices([]);
    } catch (error) {
      logger.error('Error loading expenses data', error);
      showToast({
        message: 'Erreur lors du chargement des données',
        type: 'error',
      });
    }
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
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('format', 'auto');
      formData.append('has_headers', 'true');

      // TODO: Use expenses-specific import endpoint
      await apiClient.post('/api/v1/imports/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast({
        message: 'Fichier importé avec succès',
        type: 'success',
      });
      
      setShowUploadModal(false);
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadData();
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

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { label: 'Payé', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      projected: { label: 'Prévisionnel', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Calendar },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      received: { label: 'Reçue', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Receipt },
      overdue: { label: 'En retard', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertCircle },
    };
    return badges[status as keyof typeof badges] || badges.pending;
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
    if (dateRange.start && expense.date < dateRange.start) {
      return false;
    }
    if (dateRange.end && expense.date > dateRange.end) {
      return false;
    }
    return true;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

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
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="paid">Payé</option>
                      <option value="pending">En attente</option>
                      <option value="projected">Prévisionnel</option>
                    </select>
                    <Button
                      variant="primary"
                      onClick={() => {
                        // TODO: Open expense modal
                        showToast({
                          message: 'Fonctionnalité à venir',
                          type: 'info',
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle dépense
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune dépense trouvée</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // TODO: Open expense modal
                          showToast({
                            message: 'Fonctionnalité à venir',
                            type: 'info',
                          });
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
                              {expense.is_recurring && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  Récurrente
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatDate(expense.date)}</span>
                              <span>•</span>
                              <span>{expense.category}</span>
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
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-bold text-red-600">
                                {formatCurrency(expense.amount, expense.currency)}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // TODO: Open expense details
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
