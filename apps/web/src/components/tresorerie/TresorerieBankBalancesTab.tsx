'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Badge, Input, Select, Textarea, Modal, Switch } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, Edit, Trash2, Building2, 
  Loader2, RefreshCw, Check, X
} from 'lucide-react';
import { tresorerieAPI, type BankAccount, type BankAccountCreate } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

// Types de comptes bancaires prédéfinis
const PREDEFINED_BANKS = [
  { name: 'Stripe', icon: '💳', type: 'checking' as const },
  { name: 'BMO', icon: '🏦', type: 'checking' as const },
  { name: 'DESJ', icon: '🏦', type: 'checking' as const },
  { name: 'WISE', icon: '🌍', type: 'checking' as const },
];

export default function TresorerieBankBalancesTab() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [editingBalanceId, setEditingBalanceId] = useState<number | null>(null);
  const [editingBalanceValue, setEditingBalanceValue] = useState<string>('');
  const [creatingAccountId, setCreatingAccountId] = useState<string | null>(null);
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
      const accountsData = await tresorerieAPI.listBankAccounts();
      setAccounts(accountsData);
    } catch (error) {
      logger.error('Erreur lors du chargement des comptes', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les comptes bancaires',
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
        message: 'Compte bancaire créé avec succès',
        type: 'success'
      });
      setShowCreateModal(false);
      resetForm();
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la création', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de créer le compte bancaire',
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
        message: 'Compte bancaire modifié avec succès',
        type: 'success'
      });
      setEditingAccount(null);
      resetForm();
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la modification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de modifier le compte bancaire',
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
        message: 'Compte bancaire supprimé avec succès',
        type: 'success'
      });
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la suppression', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer le compte bancaire',
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
    setSelectedBank(null);
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
    setSelectedBank(account.bank_name || null);
    setShowCreateModal(true);
  };

  const openCreateModalForBank = (bankName: string) => {
    const bank = PREDEFINED_BANKS.find(b => b.name === bankName);
    resetForm();
    setSelectedBank(bankName);
    setFormData({
      name: bankName,
      account_type: bank?.type || 'checking',
      bank_name: bankName,
      account_number: null,
      initial_balance: 0,
      currency: 'CAD',
      is_active: true,
      notes: null
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

  const handleBalanceEdit = (account: BankAccount) => {
    setEditingBalanceId(account.id);
    setEditingBalanceValue((account.current_balance ?? account.initial_balance ?? 0).toString());
  };

  const handleBalanceSave = async (accountId: number) => {
    try {
      const newBalance = parseFloat(editingBalanceValue) || 0;
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      await tresorerieAPI.updateBankAccount(accountId, {
        initial_balance: newBalance
      });
      
      showToast({
        title: 'Succès',
        message: 'Solde mis à jour avec succès',
        type: 'success'
      });
      
      setEditingBalanceId(null);
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du solde', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le solde',
        type: 'error'
      });
    }
  };

  const handleBalanceCancel = () => {
    setEditingBalanceId(null);
    setEditingBalanceValue('');
  };

  const handleQuickCreate = async (bankName: string) => {
    const bank = PREDEFINED_BANKS.find(b => b.name === bankName);
    try {
      await tresorerieAPI.createBankAccount({
        name: bankName,
        account_type: bank?.type || 'checking',
        bank_name: bankName,
        account_number: null,
        initial_balance: formData.initial_balance || 0,
        currency: 'CAD',
        is_active: true,
        notes: null
      });
      
      showToast({
        title: 'Succès',
        message: 'Compte créé avec succès',
        type: 'success'
      });
      
      setCreatingAccountId(null);
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

  // Calculer le total des soldes
  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = acc.current_balance ?? acc.initial_balance ?? 0;
    return sum + balance;
  }, 0);

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </MotionDiv>
    );
  }

  // Filtrer les comptes qui correspondent aux banques prédéfinies
  // const predefinedAccounts = PREDEFINED_BANKS.map(bank => {
  //   const account = accounts.find(acc => acc.bank_name === bank.name);
  //   return { bank, account };
  // });

  // Autres comptes (non prédéfinis)
  const otherAccounts = accounts.filter(acc => 
    !PREDEFINED_BANKS.some(bank => bank.name === acc.bank_name)
  );

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Total des Soldes */}
      <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 mb-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total des Soldes Bancaires
            </h3>
            <div className={`text-3xl font-black font-nukleo ${totalBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {accounts.length} compte{accounts.length > 1 ? 's' : ''} configuré{accounts.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAccounts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Actions */}
      <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-nukleo">
            Soldes Bancaires ({accounts.length})
          </h3>
        </div>
      </Card>

      {/* Banques Prédéfinies */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Comptes Bancaires Principaux
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PREDEFINED_BANKS.map((bank) => {
            const account = accounts.find(acc => acc.bank_name === bank.name);
            const hasAccount = !!account;
            const currentBalance = account?.current_balance ?? account?.initial_balance ?? 0;

            return (
              <Card
                key={bank.name}
                className={`glass-card p-4 rounded-xl border ${
                  hasAccount 
                    ? 'border-nukleo-lavender/20 hover:border-primary-500/50 transition-colors' 
                    : 'border-dashed border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{bank.icon}</span>
                    <div>
                      <h5 className="font-bold text-sm font-nukleo">{bank.name}</h5>
                      {hasAccount && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border text-xs mt-1">
                          Configuré
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {hasAccount ? (
                  <>
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Solde actuel</div>
                      {editingBalanceId === account.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingBalanceValue}
                            onChange={(e) => setEditingBalanceValue(e.target.value)}
                            className="flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleBalanceSave(account.id);
                              } else if (e.key === 'Escape') {
                                handleBalanceCancel();
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBalanceSave(account.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBalanceCancel}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className={`text-xl font-bold font-nukleo cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 transition-colors ${currentBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600'}`}
                          onClick={() => handleBalanceEdit(account)}
                          title="Cliquez pour modifier le solde"
                        >
                          {formatCurrency(currentBalance)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(account)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                ) : (
                  creatingAccountId === bank.name ? (
                    <div className="space-y-2 mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Solde initial"
                        value={formData.initial_balance || 0}
                        onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                        className="w-full"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleQuickCreate(bank.name)}
                          className="flex-1"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Créer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCreatingAccountId(null);
                            resetForm();
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreatingAccountId(bank.name);
                        const bankData = PREDEFINED_BANKS.find(b => b.name === bank.name);
                        setFormData({
                          name: bank.name,
                          account_type: bankData?.type || 'checking',
                          bank_name: bank.name,
                          account_number: null,
                          initial_balance: 0,
                          currency: 'CAD',
                          is_active: true,
                          notes: null
                        });
                      }}
                      className="w-full mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter le solde
                    </Button>
                  )
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Autres Comptes */}
      {otherAccounts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Autres Comptes ({otherAccounts.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherAccounts.map((account) => {
              const currentBalance = account.current_balance ?? account.initial_balance ?? 0;
              return (
                <Card
                  key={account.id}
                  className="glass-card p-4 rounded-xl border border-nukleo-lavender/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm font-nukleo">{account.name}</h5>
                        {account.bank_name && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">{account.bank_name}</div>
                        )}
                      </div>
                    </div>
                    <Badge className={`${account.is_active ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border text-xs`}>
                      {account.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Solde actuel</div>
                    {editingBalanceId === account.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editingBalanceValue}
                          onChange={(e) => setEditingBalanceValue(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleBalanceSave(account.id);
                            } else if (e.key === 'Escape') {
                              handleBalanceCancel();
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBalanceSave(account.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBalanceCancel}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className={`text-lg font-bold font-nukleo cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 transition-colors ${currentBalance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600'}`}
                        onClick={() => handleBalanceEdit(account)}
                        title="Cliquez pour modifier le solde"
                      >
                        {formatCurrency(currentBalance)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(account)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Création/Édition */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAccount(null);
          resetForm();
        }}
        title={editingAccount ? 'Modifier le Solde Bancaire' : selectedBank ? `Ajouter le solde - ${selectedBank}` : 'Nouveau Compte Bancaire'}
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
              placeholder="Ex: Stripe, BMO, DESJ, WISE"
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
            <label className="block text-sm font-medium mb-2">Solde actuel *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.initial_balance || 0}
              onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Entrez le solde actuel de ce compte bancaire
            </p>
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
