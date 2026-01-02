'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DollarSign, Calendar, FileText, Loader2, CheckCircle, Clock, XCircle, AlertCircle, Upload } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { expenseAccountsAPI, type ExpenseAccount, type ExpenseAccountStatus } from '@/lib/api/finances/expenseAccounts';

export default function MesDepenses() {
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employee_id');
  const employeeId = employeeIdParam ? parseInt(employeeIdParam) : undefined;
  
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExpenseAccountStatus | 'all'>('all');

  useEffect(() => {
    loadExpenses();
  }, [employeeId, statusFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseAccountsAPI.list(
        0, 
        100, 
        statusFilter === 'all' ? undefined : statusFilter,
        employeeId
      );
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ExpenseAccountStatus) => {
    const badges = {
      draft: { class: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileText, label: 'Brouillon' },
      submitted: { class: 'bg-blue-100 text-blue-700 border-blue-300', icon: Clock, label: 'Soumis' },
      under_review: { class: 'bg-purple-100 text-purple-700 border-purple-300', icon: AlertCircle, label: 'En révision' },
      approved: { class: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, label: 'Approuvé' },
      rejected: { class: 'bg-red-100 text-red-700 border-red-300', icon: XCircle, label: 'Rejeté' },
      needs_clarification: { class: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle, label: 'Clarification requise' },
    };
    return badges[status] || badges.draft;
  };

  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.total_amount || '0'), 0);
  const approvedAmount = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + parseFloat(e.total_amount || '0'), 0);
  const pendingCount = expenses.filter(e => 
    e.status === 'submitted' || e.status === 'under_review'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mes Comptes de Dépenses
              </h1>
              <p className="text-white/80 text-lg">Gérez vos notes de frais et remboursements</p>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
              <Upload className="w-5 h-5 mr-2" />
              Nouveau compte
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total demandé</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {approvedAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Approuvé</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {pendingCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {expenses.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total comptes</div>
        </Card>
      </div>

      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer :</span>
          {['all', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_clarification'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-[#523DC9] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? 'Tous' : getStatusBadge(status as ExpenseAccountStatus).label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {expenses.map((expense) => {
          const badge = getStatusBadge(expense.status);
          const Icon = badge.icon;
          
          return (
            <Card key={expense.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-[#523DC9]" />
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {expense.title}
                    </h3>
                    <Badge className={`${badge.class} flex items-center gap-1 text-xs`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </Badge>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {expense.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    <span className="font-mono text-xs">{expense.account_number}</span>
                    {expense.expense_period_start && expense.expense_period_end && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(expense.expense_period_start).toLocaleDateString('fr-FR')} - {new Date(expense.expense_period_end).toLocaleDateString('fr-FR')}
                        </div>
                      </>
                    )}
                    {expense.submitted_at && (
                      <>
                        <span>•</span>
                        <span>Soumis le {new Date(expense.submitted_at).toLocaleDateString('fr-FR')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {parseFloat(expense.total_amount).toLocaleString('fr-CA', { style: 'currency', currency: expense.currency })}
                    </span>
                  </div>
                </div>
              </div>

              {expense.review_notes && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Note du réviseur
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{expense.review_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {expense.clarification_request && (
                <div className="mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                        Clarification requise
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300">{expense.clarification_request}</p>
                    </div>
                  </div>
                </div>
              )}

              {expense.rejection_reason && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                        Raison du rejet
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">{expense.rejection_reason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Créé le {new Date(expense.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex gap-2">
                  {expense.status === 'draft' && (
                    <Button size="sm" variant="outline">Modifier</Button>
                  )}
                  {expense.status === 'needs_clarification' && (
                    <Button size="sm" className="bg-[#523DC9] hover:bg-[#5F2B75] text-white">
                      Répondre
                    </Button>
                  )}
                  <Button size="sm" variant="outline">Détails</Button>
                </div>
              </div>
            </Card>
          );
        })}

        {expenses.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun compte de dépenses</p>
            <Button className="bg-[#523DC9] hover:bg-[#5F2B75] text-white">
              <Upload className="w-4 h-4 mr-2" />
              Créer votre premier compte
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
