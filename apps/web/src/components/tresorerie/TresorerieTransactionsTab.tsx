'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, Button, Badge, Input, Select, Modal } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  FileText, Plus, Search, Download, RefreshCw, 
  ArrowUpDown, Eye, Edit, Calendar, Building2
} from 'lucide-react';
import { tresorerieAPI, type Transaction, type BankAccount, type TransactionCategory, type TransactionCreate, type TransactionUpdate } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import TransactionForm from './TransactionForm';
import TransactionDrawer from './TransactionDrawer';

export default function TresorerieTransactionsTab() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entry' | 'exit'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'projected' | 'cancelled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Tri
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        tresorerieAPI.listTransactions({ limit: 1000 }),
        tresorerieAPI.listBankAccounts({ is_active: true }),
        tresorerieAPI.listCategories()
      ]);
      setTransactions(transactionsData);
      setBankAccounts(accountsData);
      setCategories(categoriesData);
    } catch (error) {
      logger.error('Erreur lors du chargement des transactions', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les transactions',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: TransactionCreate) => {
    try {
      await tresorerieAPI.createTransaction(data);
      showToast({
        title: 'Succès',
        message: 'Transaction créée avec succès',
        type: 'success'
      });
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      logger.error('Erreur lors de la création', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de créer la transaction',
        type: 'error'
      });
      throw error;
    }
  };

  const handleUpdate = async (data: TransactionUpdate) => {
    if (!editingTransaction) return;
    try {
      await tresorerieAPI.updateTransaction(editingTransaction.id, data);
      showToast({
        title: 'Succès',
        message: 'Transaction modifiée avec succès',
        type: 'success'
      });
      setEditingTransaction(null);
      await loadData();
    } catch (error) {
      logger.error('Erreur lors de la modification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de modifier la transaction',
        type: 'error'
      });
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tresorerieAPI.deleteTransaction(id);
      showToast({
        title: 'Succès',
        message: 'Transaction supprimée avec succès',
        type: 'success'
      });
      setShowDrawer(false);
      setSelectedTransaction(null);
      await loadData();
    } catch (error) {
      logger.error('Erreur lors de la suppression', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la transaction',
        type: 'error'
      });
    }
  };

  const handleDuplicate = (transaction: Transaction) => {
    setEditingTransaction({
      ...transaction,
      id: 0, // Nouvelle transaction
      description: `${transaction.description} (copie)`,
      date: new Date().toISOString().split('T')[0]
    } as Transaction);
    setShowCreateModal(true);
    setShowDrawer(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Filtrer et trier les transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      // Recherche textuelle
      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filtre type
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }
      
      // Filtre statut
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      
      // Filtre catégorie
      if (categoryFilter !== 'all' && t.category_id?.toString() !== categoryFilter) {
        return false;
      }
      
      // Filtre compte
      if (accountFilter !== 'all' && t.bank_account_id.toString() !== accountFilter) {
        return false;
      }
      
      // Filtre date
      if (dateFrom && t.date < dateFrom) {
        return false;
      }
      if (dateTo && t.date > dateTo) {
        return false;
      }
      
      return true;
    });

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = Number(a.amount) - Number(b.amount);
      } else {
        comparison = a.description.localeCompare(b.description);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, typeFilter, statusFilter, categoryFilter, accountFilter, dateFrom, dateTo, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    const csvHeaders = ['Date', 'Type', 'Description', 'Montant', 'Catégorie', 'Compte', 'Statut'];
    const csvRows = filteredAndSortedTransactions.map(t => [
      t.date,
      t.type === 'entry' ? 'Entrée' : 'Sortie',
      t.description,
      t.amount.toString(),
      categories.find(c => c.id === t.category_id)?.name || '',
      bankAccounts.find(a => a.id === t.bank_account_id)?.name || '',
      t.status
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast({
      title: 'Export réussi',
      message: 'Les transactions ont été exportées',
      type: 'success'
    });
  };

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#523DC9]" />
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Actions et Filtres */}
      <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'entry', label: 'Entrées' },
                { value: 'exit', label: 'Sorties' }
              ]}
              className="w-32"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              options={[
                { value: 'all', label: 'Tous statuts' },
                { value: 'confirmed', label: 'Confirmés' },
                { value: 'pending', label: 'En attente' },
                { value: 'projected', label: 'Projetés' },
                { value: 'cancelled', label: 'Annulés' }
              ]}
              className="w-36"
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Toutes catégories' },
                ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name }))
              ]}
              className="w-40"
            />
            <Select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous comptes' },
                ...bankAccounts.map(acc => ({ value: acc.id.toString(), label: acc.name }))
              ]}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="De"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
            <Input
              type="date"
              placeholder="À"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button variant="primary" size="sm" onClick={() => {
              setEditingTransaction(null);
              setShowCreateModal(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des Transactions */}
      <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Transactions ({filteredAndSortedTransactions.length})
          </h3>
        </div>

        {filteredAndSortedTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-primary-500"
                    >
                      Date
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    <button
                      onClick={() => handleSort('description')}
                      className="flex items-center gap-1 hover:text-primary-500"
                    >
                      Description
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 hover:text-[#523DC9] ml-auto"
                    >
                      Montant
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Catégorie</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Compte</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Statut</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.category_id);
                  const account = bankAccounts.find(a => a.id === transaction.bank_account_id);
                  
                  return (
                    <tr 
                      key={transaction.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDrawer(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(transaction.date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm">{transaction.description}</div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                            {transaction.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${
                          transaction.type === 'entry' 
                            ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                            : 'bg-red-500/10 text-red-600 border-red-500/30'
                        } border`}>
                          {transaction.type === 'entry' ? 'Entrée' : 'Sortie'}
                        </Badge>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        transaction.type === 'entry' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'entry' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                      </td>
                      <td className="py-3 px-4">
                        {category ? (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                            {category.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{account?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${
                          transaction.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                          transaction.status === 'pending' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                          transaction.status === 'projected' ? 'bg-gray-500/10 text-gray-600 border-gray-500/30' :
                          'bg-red-500/10 text-red-600 border-red-500/30'
                        } border`}>
                          {transaction.status === 'confirmed' ? 'Confirmé' :
                           transaction.status === 'pending' ? 'En attente' :
                           transaction.status === 'projected' ? 'Projeté' : 'Annulé'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDrawer(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setShowCreateModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Aucune transaction trouvée</p>
            <p className="text-sm">Créez votre première transaction pour commencer</p>
          </div>
        )}
      </Card>

      {/* Modal de Création/Édition */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Modifier la Transaction' : 'Nouvelle Transaction'}
        size="lg"
      >
        <TransactionForm
          transaction={editingTransaction || undefined}
          bankAccounts={bankAccounts}
          categories={categories}
          onSubmit={editingTransaction ? handleUpdate : (data) => handleCreate(data as TransactionCreate)}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingTransaction(null);
          }}
          loading={false}
        />
      </Modal>

      {/* Drawer de Détail */}
      <TransactionDrawer
        transaction={selectedTransaction}
        bankAccounts={bankAccounts}
        categories={categories}
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setSelectedTransaction(null);
        }}
        onEdit={(t) => {
          setShowDrawer(false);
          setEditingTransaction(t);
          setShowCreateModal(true);
        }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </MotionDiv>
  );
}
