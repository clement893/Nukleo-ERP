'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingUp, Plus, Edit, Trash2, Search, Calendar,
  DollarSign, Filter, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button, Badge, Input, Select, Modal, Textarea, Loading, useToast } from '@/components/ui';
import { transactionsAPI, type Transaction, type TransactionCreate, type TransactionUpdate, type TransactionStatus } from '@/lib/api/finances/transactions';
import { handleApiError } from '@/lib/errors/api';

const CATEGORIES = [
  'Ventes',
  'Services',
  'Consultation',
  'Abonnements',
  'Licences',
  'Autre',
];

const STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payé' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function RevenusPage() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<TransactionCreate>({
    type: 'revenue',
    description: '',
    amount: '',
    tax_amount: null,
    currency: 'CAD',
    category: null,
    transaction_date: new Date().toISOString().split('T')[0] as string,
    expected_payment_date: null,
    payment_date: null,
    status: 'pending',
    client_id: null,
    client_name: null,
    invoice_number: null,
    notes: null,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionsAPI.list({ 
        type: 'revenue',
        limit: 1000 
      });
      setTransactions(data);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ 
        message: appError.message || 'Erreur de chargement', 
        type: 'error' 
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
        tax_amount: formData.tax_amount ? (typeof formData.tax_amount === 'string' ? parseFloat(formData.tax_amount) : formData.tax_amount) : null,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        expected_payment_date: formData.expected_payment_date ? new Date(formData.expected_payment_date).toISOString() : null,
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
      };

      await transactionsAPI.create(transactionData);
      await loadTransactions();
      setShowCreateModal(false);
      resetForm();
      showToast({ 
        message: 'Revenu créé avec succès', 
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
    if (!selectedTransaction) return;
    
    try {
      setIsSubmitting(true);
      const updateData: TransactionUpdate = {
        description: formData.description,
        amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
        tax_amount: formData.tax_amount ? (typeof formData.tax_amount === 'string' ? parseFloat(formData.tax_amount) : formData.tax_amount) : null,
        currency: formData.currency,
        category: formData.category,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        expected_payment_date: formData.expected_payment_date ? new Date(formData.expected_payment_date).toISOString() : null,
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        status: formData.status,
        client_id: formData.client_id,
        client_name: formData.client_name,
        invoice_number: formData.invoice_number,
        notes: formData.notes,
      };

      await transactionsAPI.update(selectedTransaction.id, updateData);
      await loadTransactions();
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      showToast({ 
        message: 'Revenu modifié avec succès', 
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce revenu ?')) return;
    
    try {
      await transactionsAPI.delete(id);
      await loadTransactions();
      showToast({ 
        message: 'Revenu supprimé avec succès', 
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

  const handleOpenEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      type: 'revenue',
      description: transaction.description,
      amount: parseFloat(transaction.amount),
      tax_amount: transaction.tax_amount ? parseFloat(transaction.tax_amount) : null,
      currency: transaction.currency,
      category: transaction.category || null,
      transaction_date: (transaction.transaction_date ? transaction.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0]) || '',
      expected_payment_date: transaction.expected_payment_date ? transaction.expected_payment_date.split('T')[0] : null,
      payment_date: transaction.payment_date ? transaction.payment_date.split('T')[0] : null,
      status: transaction.status,
      client_id: transaction.client_id || null,
      client_name: transaction.client_name || null,
      invoice_number: transaction.invoice_number || null,
      notes: transaction.notes || null,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'revenue',
      description: '',
      amount: '',
      tax_amount: null,
      currency: 'CAD',
      category: null,
      transaction_date: new Date().toISOString().split('T')[0] as string,
      expected_payment_date: null,
      payment_date: null,
      status: 'pending',
      client_id: null,
      client_name: null,
      invoice_number: null,
      notes: null,
    });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [transactions, searchQuery, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = filteredTransactions
      .filter(t => t.status !== 'cancelled')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pending = filteredTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const paid = filteredTransactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return { total, pending, paid, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      paid: { label: 'Payé', color: 'bg-green-100 text-green-700 border-green-300' },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-300' },
    };
    return badges[status];
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-1 font-nukleo">
                Revenus
              </h1>
              <p className="text-white/80 text-sm">Gérez tous vos revenus et recettes</p>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau revenu
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total revenus</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600 font-nukleo">
              {formatCurrency(stats.total)}
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-yellow-600 font-nukleo">
              {formatCurrency(stats.pending)}
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Payés</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-blue-600 font-nukleo">
              {formatCurrency(stats.paid)}
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Nombre</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-purple-600 font-nukleo">
              {stats.count}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un revenu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                ...CATEGORIES.map(c => ({ label: c, value: c })),
              ]}
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {transactions.length === 0 ? 'Aucun revenu enregistré' : 'Aucun revenu ne correspond à votre recherche'}
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un revenu
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const badge = getStatusBadge(transaction.status);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{transaction.description}</h3>
                        <Badge className={badge.color}>{badge.label}</Badge>
                        {transaction.category && (
                          <Badge variant="default">{transaction.category}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Émis: {formatDate(transaction.transaction_date)}</span>
                        {transaction.client_name && (
                          <>
                            <span>•</span>
                            <span>{transaction.client_name}</span>
                          </>
                        )}
                        {transaction.invoice_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{transaction.invoice_number}</span>
                          </>
                        )}
                        {transaction.expected_payment_date && (
                          <>
                            <span>•</span>
                            <span>Prévu: {formatDate(transaction.expected_payment_date)}</span>
                          </>
                        )}
                        {transaction.payment_date && (
                          <>
                            <span>•</span>
                            <span>Reçu: {formatDate(transaction.payment_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(
                            parseFloat(transaction.amount) + (transaction.tax_amount ? parseFloat(transaction.tax_amount) : 0)
                          )}
                        </div>
                        {transaction.tax_amount && parseFloat(transaction.tax_amount) > 0 && (
                          <div className="text-xs text-gray-500">
                            HT: {formatCurrency(transaction.amount)} + Taxes: {formatCurrency(transaction.tax_amount)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">{transaction.currency}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(transaction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(transaction.id)}
                          className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Nouveau revenu"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Vente de services de consultation"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant HT *"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
              <Input
                label="Montant des taxes"
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_amount || ''}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value || null })}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Montant total TTC
                </label>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-semibold">
                  {formatCurrency(
                    (typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount || 0) +
                    (formData.tax_amount ? (typeof formData.tax_amount === 'string' ? parseFloat(formData.tax_amount) || 0 : formData.tax_amount || 0) : 0)
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Date d'émission *"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
              <Input
                label="Date de réception prévue"
                type="date"
                value={formData.expected_payment_date || ''}
                onChange={(e) => setFormData({ ...formData, expected_payment_date: e.target.value || null })}
              />
              <Input
                label="Date de réception réelle"
                type="date"
                value={formData.payment_date || ''}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value || null })}
              />
            </div>

            <Input
              label="Client"
              value={formData.client_name || ''}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value || null })}
              placeholder="Nom du client"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                options={[
                  { label: 'Aucune', value: '' },
                  ...CATEGORIES.map(c => ({ label: c, value: c })),
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

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTransaction(null);
            resetForm();
          }}
          title="Modifier le revenu"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Vente de services de consultation"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Montant HT *"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
              <Input
                label="Montant des taxes"
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_amount || ''}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value || null })}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Montant total TTC
                </label>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-semibold">
                  {formatCurrency(
                    (typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount || 0) +
                    (formData.tax_amount ? (typeof formData.tax_amount === 'string' ? parseFloat(formData.tax_amount) || 0 : formData.tax_amount || 0) : 0)
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Date d'émission *"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
              <Input
                label="Date de réception prévue"
                type="date"
                value={formData.expected_payment_date || ''}
                onChange={(e) => setFormData({ ...formData, expected_payment_date: e.target.value || null })}
              />
              <Input
                label="Date de réception réelle"
                type="date"
                value={formData.payment_date || ''}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value || null })}
              />
            </div>

            <Input
              label="Client"
              value={formData.client_name || ''}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value || null })}
              placeholder="Nom du client"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                options={[
                  { label: 'Aucune', value: '' },
                  ...CATEGORIES.map(c => ({ label: c, value: c })),
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
                  setSelectedTransaction(null);
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

        {/* Import Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportFile(null);
            setImportResult(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          title="Importer des revenus"
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
                    <li>Colonnes optionnelles: Montant Taxes, Client, Date Reception Prevue, etc.</li>
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
                    setImportFile(file);
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
              <div className={`p-4 rounded-lg border ${
                importResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${
                      importResult.success 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {importResult.success ? 'Import réussi' : 'Erreurs lors de l\'import'}
                    </h3>
                    <div className="text-sm space-y-1">
                      <p className={importResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                        {importResult.success 
                          ? `${importResult.created_count} transaction(s) créée(s)`
                          : `${importResult.error_count} erreur(s) trouvée(s)`
                        }
                      </p>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold mb-1">Erreurs:</p>
                          <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                            {importResult.errors.slice(0, 10).map((error: any, idx: number) => (
                              <li key={idx} className="text-xs">
                                Ligne {error.row}: {error.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResult(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={importing}
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  if (!importFile) {
                    showToast({ 
                      message: 'Veuillez sélectionner un fichier', 
                      type: 'error' 
                    });
                    return;
                  }

                  try {
                    setImporting(true);
                    const result = await transactionsAPI.import(importFile, false);
                    setImportResult(result);
                    
                    if (result.success && result.created_count > 0) {
                      await loadTransactions();
                      showToast({ 
                        message: `${result.created_count} transaction(s) importée(s) avec succès`, 
                        type: 'success' 
                      });
                    } else if (result.error_count > 0) {
                      showToast({ 
                        message: `${result.error_count} erreur(s) lors de l'import`, 
                        type: 'error' 
                      });
                    }
                  } catch (err) {
                    const appError = handleApiError(err);
                    showToast({ 
                      message: appError.message || 'Erreur lors de l\'import', 
                      type: 'error' 
                    });
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={!importFile || importing}
              >
                {importing ? 'Import en cours...' : 'Importer'}
              </Button>
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
