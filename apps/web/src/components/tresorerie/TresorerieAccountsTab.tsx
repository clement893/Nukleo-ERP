'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Badge, Input, Select, Textarea, Modal, Switch } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Building2, Plus, Edit, Trash2, Wallet, CreditCard, 
  AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { tresorerieAPI, type BankAccount, type BankAccountCreate, type Transaction } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

export default function TresorerieAccountsTab() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<BankAccountCreate>({
    name: '',
    account_type: 'checking',
    bank_name: null,
    account_number: null,
    initial_balance: 0,
    currency: 'CAD',
    is_active: true,
    notes: null
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([
        tresorerieAPI.listBankAccounts(),
        tresorerieAPI.listTransactions({ limit: 10000 })
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
    } catch (error) {
      logger.error('Erreur lors du chargement des comptes', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les comptes',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await tresorerieAPI.createBankAccount(formData);
      showToast({
        title: 'Succès',
        message: 'Compte créé avec succès',
        type: 'success'
      });
      setShowCreateModal(false);
      resetForm();
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la création', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de créer le compte',
        type: 'error'
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingAccount) return;
    try {
      await tresorerieAPI.updateBankAccount(editingAccount.id, formData);
      showToast({
        title: 'Succès',
        message: 'Compte modifié avec succès',
        type: 'success'
      });
      setEditingAccount(null);
      resetForm();
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la modification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de modifier le compte',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;
    try {
      await tresorerieAPI.deleteBankAccount(id);
      showToast({
        title: 'Succès',
        message: 'Compte supprimé avec succès',
        type: 'success'
      });
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la suppression', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer le compte',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      account_type: 'checking',
      bank_name: null,
      account_number: null,
      initial_balance: 0,
      currency: 'CAD',
      is_active: true,
      notes: null
    });
  };

  const openEditModal = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      account_type: account.account_type,
      bank_name: account.bank_name,
      account_number: account.account_number,
      initial_balance: account.initial_balance,
      currency: account.currency,
      is_active: account.is_active,
      notes: account.notes
    });
    setShowCreateModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculer le solde actuel pour chaque compte
  const accountsWithBalance = accounts.map(account => {
    const accountTransactions = transactions.filter(t => t.bank_account_id === account.id);
    const totalEntries = accountTransactions
      .filter(t => t.type === 'entry')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExits = accountTransactions
      .filter(t => t.type === 'exit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const currentBalance = account.initial_balance + totalEntries - totalExits;
    
    return { ...account, currentBalance };
  });

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Actions */}
      <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-nukleo">
            Comptes Bancaires ({accounts.length})
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAccounts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="primary" size="sm" onClick={() => {
              resetForm();
              setEditingAccount(null);
              setShowCreateModal(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Compte
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des Comptes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {accountsWithBalance.map((account) => {
          const isLowBalance = account.currentBalance < 10000;
          const accountTypeLabels = {
            checking: 'Chèque',
            savings: 'Épargne',
            credit: 'Crédit',
            investment: 'Investissement',
            other: 'Autre'
          };

          return (
            <Card 
              key={account.id} 
              className={`glass-card p-6 rounded-xl border ${
                isLowBalance ? 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-900/10' : 'border-nukleo-lavender/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    account.account_type === 'checking' ? 'bg-blue-500/10' :
                    account.account_type === 'savings' ? 'bg-green-500/10' :
                    account.account_type === 'credit' ? 'bg-red-500/10' :
                    'bg-purple-500/10'
                  }`}>
                    {account.account_type === 'credit' ? (
                      <CreditCard className="w-6 h-6 text-red-600" />
                    ) : (
                      <Wallet className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg font-nukleo">
                      {account.name}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {accountTypeLabels[account.account_type]}
                    </div>
                  </div>
                </div>
                <Badge className={`${account.is_active ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border`}>
                  {account.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Solde actuel</div>
                  <div className={`text-2xl font-bold font-nukleo ${account.currentBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600'}`}>
                    {formatCurrency(account.currentBalance)}
                  </div>
                </div>

                {account.bank_name && (
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Banque</div>
                    <div className="text-sm font-medium">{account.bank_name}</div>
                  </div>
                )}

                {isLowBalance && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Solde faible</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(account)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2 font-nukleo">
            Aucun compte bancaire
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez votre premier compte bancaire pour commencer
          </p>
          <Button variant="primary" onClick={() => {
            resetForm();
            setEditingAccount(null);
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un Compte
          </Button>
        </Card>
      )}

      {/* Modal Création/Édition */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAccount(null);
          resetForm();
        }}
        title={editingAccount ? 'Modifier le Compte' : 'Nouveau Compte Bancaire'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingAccount(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={editingAccount ? handleUpdate : handleCreate}
            >
              {editingAccount ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du compte *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Compte Principal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de compte *</label>
              <Select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as BankAccount['account_type'] })}
                options={[
                  { value: 'checking', label: 'Chèque' },
                  { value: 'savings', label: 'Épargne' },
                  { value: 'credit', label: 'Crédit' },
                  { value: 'investment', label: 'Investissement' },
                  { value: 'other', label: 'Autre' }
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Devise *</label>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { value: 'CAD', label: 'CAD - Dollar canadien' },
                  { value: 'USD', label: 'USD - Dollar américain' },
                  { value: 'EUR', label: 'EUR - Euro' }
                ]}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nom de la banque</label>
            <Input
              value={formData.bank_name || ''}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value || null })}
              placeholder="Ex: Banque Nationale"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Numéro de compte</label>
            <Input
              value={formData.account_number || ''}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value || null })}
              placeholder="**** **** ****"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Solde initial</label>
            <Input
              type="number"
              step="0.01"
              value={formData.initial_balance || 0}
              onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className="text-sm font-medium">Compte actif</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}
