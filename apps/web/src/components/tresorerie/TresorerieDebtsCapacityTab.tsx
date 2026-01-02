'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Badge, Input, Select, Textarea, Modal, Switch } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  CreditCard, Plus, Edit, Trash2, 
  Loader2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { tresorerieAPI, type BankAccount, type BankAccountCreate } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

// Types de dettes et capacité prédéfinis
const PREDEFINED_DEBT_TYPES = [
  { name: 'Marge de crédit', icon: '📊', type: 'credit' as const },
  { name: 'Carte de crédit', icon: '💳', type: 'credit' as const },
];

export default function TresorerieDebtsCapacityTab() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [selectedDebtType, setSelectedDebtType] = useState<string | null>(null);
  const [formData, setFormData] = useState<BankAccountCreate>({
    name: '',
    account_type: 'credit',
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
      // Charger uniquement les comptes de type crédit
      const allAccounts = await tresorerieAPI.listBankAccounts();
      const creditAccounts = allAccounts.filter(acc => acc.account_type === 'credit');
      setAccounts(creditAccounts);
    } catch (error) {
      logger.error('Erreur lors du chargement des dettes', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les dettes et capacité',
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
        message: 'Dette/capacité créée avec succès',
        type: 'success'
      });
      setShowCreateModal(false);
      resetForm();
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la création', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de créer la dette/capacité',
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
        message: 'Dette/capacité modifiée avec succès',
        type: 'success'
      });
      setEditingAccount(null);
      resetForm();
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la modification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de modifier la dette/capacité',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dette/capacité ?')) return;
    try {
      await tresorerieAPI.deleteBankAccount(id);
      showToast({
        title: 'Succès',
        message: 'Dette/capacité supprimée avec succès',
        type: 'success'
      });
      await loadAccounts();
    } catch (error) {
      logger.error('Erreur lors de la suppression', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la dette/capacité',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      account_type: 'credit',
      bank_name: null,
      account_number: null,
      initial_balance: 0,
      currency: 'CAD',
      is_active: true,
      notes: null
    });
    setSelectedDebtType(null);
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
    setSelectedDebtType(account.name);
    setShowCreateModal(true);
  };

  const openCreateModalForDebtType = (debtTypeName: string) => {
    const debtType = PREDEFINED_DEBT_TYPES.find(d => d.name === debtTypeName);
    resetForm();
    setSelectedDebtType(debtTypeName);
    setFormData({
      name: debtTypeName,
      account_type: debtType?.type || 'credit',
      bank_name: null,
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

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </MotionDiv>
    );
  }

  // Filtrer les comptes par type prédéfini
  const marginAccounts = accounts.filter(acc => acc.name.includes('Marge de crédit') || acc.name.includes('marge'));
  const cardAccounts = accounts.filter(acc => acc.name.includes('Carte de crédit') || acc.name.includes('carte'));
  const otherDebtAccounts = accounts.filter(acc => 
    !acc.name.includes('Marge de crédit') && 
    !acc.name.includes('marge') &&
    !acc.name.includes('Carte de crédit') &&
    !acc.name.includes('carte')
  );

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Actions */}
      <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-nukleo">
            Dettes et Capacité ({accounts.length})
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAccounts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Types Prédéfinis */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Types de Dettes et Capacité
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREDEFINED_DEBT_TYPES.map((debtType) => {
            const relatedAccounts = debtType.name === 'Marge de crédit' 
              ? marginAccounts 
              : cardAccounts;
            const hasAccounts = relatedAccounts.length > 0;

            return (
              <Card
                key={debtType.name}
                className={`glass-card p-4 rounded-xl border ${
                  hasAccounts 
                    ? 'border-nukleo-lavender/20 hover:border-primary-500/50 transition-colors' 
                    : 'border-dashed border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{debtType.icon}</span>
                    <div>
                      <h5 className="font-bold text-sm font-nukleo">{debtType.name}</h5>
                      {hasAccounts && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border text-xs mt-1">
                          {relatedAccounts.length} configuré{relatedAccounts.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {hasAccounts ? (
                  <div className="space-y-2">
                    {relatedAccounts.map((account) => {
                      const currentBalance = account.current_balance ?? account.initial_balance ?? 0;
                      const isNegative = currentBalance < 0;
                      return (
                        <div key={account.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-xs font-medium">{account.name}</div>
                              {account.bank_name && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">{account.bank_name}</div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(account)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(account.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Solde/Capacité</div>
                              <div className={`text-lg font-bold font-nukleo ${isNegative ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                                {formatCurrency(Math.abs(currentBalance))}
                              </div>
                            </div>
                            {isNegative && (
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/30 border text-xs">
                                Dette
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateModalForDebtType(debtType.name)}
                      className="w-full mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter {debtType.name}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateModalForDebtType(debtType.name)}
                    className="w-full mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter {debtType.name}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Autres Dettes */}
      {otherDebtAccounts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Autres Dettes et Capacité ({otherDebtAccounts.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherDebtAccounts.map((account) => {
              const currentBalance = account.current_balance ?? account.initial_balance ?? 0;
              const isNegative = currentBalance < 0;
              return (
                <Card
                  key={account.id}
                  className="glass-card p-4 rounded-xl border border-nukleo-lavender/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <CreditCard className="w-5 h-5 text-red-600" />
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
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Solde/Capacité</div>
                    <div className={`text-lg font-bold font-nukleo ${isNegative ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatCurrency(Math.abs(currentBalance))}
                    </div>
                    {isNegative && (
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Dette active</span>
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

      {/* Message si aucune dette */}
      {accounts.length === 0 && (
        <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2 font-nukleo">
            Aucune dette ou capacité configurée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ajoutez vos marges de crédit et cartes de crédit pour suivre vos dettes et capacité
          </p>
          <div className="flex gap-2 justify-center">
            {PREDEFINED_DEBT_TYPES.map((debtType) => (
              <Button
                key={debtType.name}
                variant="primary"
                onClick={() => openCreateModalForDebtType(debtType.name)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {debtType.name}
              </Button>
            ))}
          </div>
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
        title={editingAccount ? 'Modifier la Dette/Capacité' : selectedDebtType ? `Ajouter ${selectedDebtType}` : 'Nouvelle Dette/Capacité'}
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
            <label className="block text-sm font-medium mb-2">Nom *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={selectedDebtType || "Ex: Marge de crédit BMO, Carte Visa"}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <Select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as BankAccount['account_type'] })}
                options={[
                  { value: 'credit', label: 'Crédit' },
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
            <label className="block text-sm font-medium mb-2">Institution financière</label>
            <Input
              value={formData.bank_name || ''}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value || null })}
              placeholder="Ex: BMO, Desjardins, RBC, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Numéro de compte/carte</label>
            <Input
              value={formData.account_number || ''}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value || null })}
              placeholder="**** **** ****"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {selectedDebtType?.includes('Marge') ? 'Montant utilisé / Capacité totale' : 'Solde actuel / Limite'}
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.initial_balance || 0}
              onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedDebtType?.includes('Marge') 
                ? 'Pour une marge de crédit : utilisez un montant négatif pour la dette, positif pour la capacité disponible'
                : 'Pour une carte de crédit : utilisez un montant négatif pour le solde dû, positif pour la limite disponible'}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className="text-sm font-medium">Actif</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              placeholder="Notes supplémentaires (taux d'intérêt, date d'échéance, etc.)..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}
