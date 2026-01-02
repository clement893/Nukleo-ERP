'use client';

import { Card, Badge, Button } from '@/components/ui';
import { X, Calendar, DollarSign, Building2, FileText, Edit, Trash2, Copy } from 'lucide-react';
import type { Transaction, BankAccount, TransactionCategory } from '@/lib/api/tresorerie';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  bankAccounts: BankAccount[];
  categories: TransactionCategory[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  onDuplicate: (transaction: Transaction) => void;
}

export default function TransactionDrawer({
  transaction,
  bankAccounts,
  categories,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}: TransactionDrawerProps) {
  if (!isOpen || !transaction) return null;

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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const bankAccount = bankAccounts.find(acc => acc.id === transaction.bank_account_id);
  const category = categories.find(cat => cat.id === transaction.category_id);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Confirmé', className: 'bg-green-500/10 text-green-600 border-green-500/30' },
      pending: { label: 'En attente', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      projected: { label: 'Projeté', className: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
      cancelled: { label: 'Annulé', className: 'bg-red-500/10 text-red-600 border-red-500/30' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Détails de la Transaction
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* En-tête avec montant */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {transaction.type === 'entry' ? 'Entrée' : 'Sortie'}
                </div>
                <div className={`text-3xl font-bold ${transaction.type === 'entry' ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {transaction.type === 'entry' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                </div>
              </div>
              {getStatusBadge(transaction.status)}
            </div>
          </Card>

          {/* Informations principales */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Informations
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Description</div>
                  <div className="font-medium">{transaction.description}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Date</div>
                  <div className="font-medium">{formatDate(transaction.date)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compte bancaire</div>
                  <div className="font-medium">{bankAccount?.name || 'Non spécifié'}</div>
                  {bankAccount && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {bankAccount.account_type} • {bankAccount.bank_name || 'Banque non spécifiée'}
                    </div>
                  )}
                </div>
              </div>

              {category && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Catégorie</div>
                    <Badge className="mt-1 bg-purple-500/10 text-purple-600 border-purple-500/30">
                      {category.name}
                    </Badge>
                  </div>
                </div>
              )}

              {transaction.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Notes</div>
                    <div className="text-sm mt-1">{transaction.notes}</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Informations supplémentaires */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Détails supplémentaires
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Méthode de paiement</div>
                <div className="font-medium">{transaction.payment_method || 'Non spécifié'}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Numéro de référence</div>
                <div className="font-medium">{transaction.reference_number || 'Aucun'}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Transaction récurrente</div>
                <div className="font-medium">
                  {transaction.is_recurring ? (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                      Oui
                    </Badge>
                  ) : (
                    'Non'
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Créée le</div>
                <div className="font-medium">{formatDate(transaction.created_at)}</div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => onEdit(transaction)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              onClick={() => onDuplicate(transaction)}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
                  onDelete(transaction.id);
                }
              }}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
