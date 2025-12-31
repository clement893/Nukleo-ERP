'use client';

import { useEffect, useState } from 'react';
import { expenseAccountsAPI, type ExpenseAccount, type ExpenseAccountCreate, type ExpenseAccountUpdate } from '@/lib/api/finances/expenseAccounts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Card, Loading, Alert, Button } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ExpenseAccountForm from '@/components/finances/ExpenseAccountForm';
import { Receipt, DollarSign, Plus, Send, Eye, CheckCircle, XCircle, MessageSquare, Edit, Trash2 } from 'lucide-react';
import ExpenseAccountStatusBadge from '@/components/finances/ExpenseAccountStatusBadge';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee } from '@/lib/api/employees';
import { useSubmitExpenseAccount, useUpdateExpenseAccount, useDeleteExpenseAccount } from '@/lib/query/expenseAccounts';

interface EmployeePortalExpensesProps {
  employee: Employee;
}

export default function EmployeePortalExpenses({ employee }: EmployeePortalExpensesProps) {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  const submitMutation = useSubmitExpenseAccount();
  const updateMutation = useUpdateExpenseAccount();
  const deleteMutation = useDeleteExpenseAccount();

  useEffect(() => {
    loadExpenses();
    loadEmployees();
  }, [employee.id]);

  const loadEmployees = async () => {
    try {
      const data = await employeesAPI.list(0, 1000);
      setEmployees(data.map(emp => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
      })));
    } catch (err) {
      console.error('Failed to load employees:', err);
      // Don't show error, just use empty list
      setEmployees([]);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseAccountsAPI.list(0, 100, undefined, employee.id);
      setExpenses(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des comptes de dépenses');
      showToast({
        message: appError.message || 'Erreur lors du chargement des comptes de dépenses',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: ExpenseAccountCreate | ExpenseAccountUpdate): Promise<void> => {
    try {
      setCreating(true);
      // Ensure employee_id is set to the current employee
      // Convert to ExpenseAccountCreate format (all fields required for creation)
      const expenseData: ExpenseAccountCreate = {
        employee_id: employee.id,
        title: data.title || '',
        description: data.description ?? null,
        expense_period_start: data.expense_period_start ?? null,
        expense_period_end: data.expense_period_end ?? null,
        total_amount: data.total_amount || '0',
        currency: data.currency || 'EUR',
        metadata: data.metadata ?? null,
      };
      await expenseAccountsAPI.create(expenseData);
      setShowCreateModal(false);
      showToast({
        message: 'Compte de dépense créé avec succès',
        type: 'success',
      });
      // Reload expenses
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du compte de dépense',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (data: ExpenseAccountCreate | ExpenseAccountUpdate): Promise<void> => {
    if (!selectedExpense) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedExpense.id,
        data: data as ExpenseAccountUpdate,
      });
      setShowEditModal(false);
      setSelectedExpense(null);
      showToast({
        message: 'Compte de dépenses modifié avec succès',
        type: 'success',
      });
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du compte de dépenses',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (expenseId: number) => {
    try {
      await submitMutation.mutateAsync(expenseId);
      // React Query invalide déjà les queries, pas besoin de recharger manuellement
      showToast({
        message: 'Compte de dépenses soumis avec succès',
        type: 'success',
      });
      // Fermer la modal après succès
      setShowViewModal(false);
      setSelectedExpense(null);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la soumission',
        type: 'error',
      });
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte de dépenses ?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(expenseId);
      setShowViewModal(false);
      setSelectedExpense(null);
      showToast({
        message: 'Compte de dépenses supprimé avec succès',
        type: 'success',
      });
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du compte de dépenses',
        type: 'error',
      });
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency || 'EUR' 
    }).format(numAmount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const columns: Column<ExpenseAccount>[] = [
    {
      key: 'account_number',
      label: 'Numéro',
      sortable: true,
      render: (value, expense) => (
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm">{String(value)}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedExpense(expense);
              setShowViewModal(true);
            }}
            className="h-6 w-6 p-0"
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (value, expense) => (
        <div>
          <div className="font-medium">{String(value)}</div>
          {expense.description && (
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {expense.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <ExpenseAccountStatusBadge status={value as ExpenseAccount['status']} />
      ),
    },
    {
      key: 'total_amount',
      label: 'Montant',
      sortable: true,
      render: (value, expense) => (
        <div className="font-semibold">
          {parseFloat(String(value)).toFixed(2)} {expense.currency || 'EUR'}
        </div>
      ),
    },
    {
      key: 'expense_period_start',
      label: 'Période',
      sortable: true,
      render: (_value, expense) => {
        if (!expense.expense_period_start && !expense.expense_period_end) {
          return <span className="text-muted-foreground">-</span>;
        }
        const start = expense.expense_period_start 
          ? new Date(expense.expense_period_start).toLocaleDateString('fr-FR')
          : '';
        const end = expense.expense_period_end
          ? new Date(expense.expense_period_end).toLocaleDateString('fr-FR')
          : '';
        return (
          <div className="text-sm">
            {start && end ? `${start} - ${end}` : start || end || '-'}
          </div>
        );
      },
    },
    {
      key: 'submitted_at',
      label: 'Soumis le',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        return <span>{new Date(String(value)).toLocaleDateString('fr-FR')}</span>;
      },
    },
  ];

  const totalAmount = expenses.reduce((sum, expense) => {
    return sum + parseFloat(expense.total_amount);
  }, 0);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">{error}</Alert>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mes comptes de dépenses ({expenses.length})
        </h3>
        <div className="flex items-center gap-3">
          {expenses.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-primary-600" />
              <span className="font-semibold text-primary-600">
                Total: {totalAmount.toFixed(2)} {expenses[0]?.currency || 'EUR'}
              </span>
            </div>
          )}
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs px-3 py-1.5 h-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Aucun compte de dépenses</p>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une demande de compte de dépense
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={expenses as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            emptyMessage="Aucun compte de dépenses trouvé"
            onRowClick={(row) => {
              setSelectedExpense(row as unknown as ExpenseAccount);
              setShowViewModal(true);
            }}
          />
        </Card>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal && selectedExpense !== null}
        onClose={() => {
          setShowViewModal(false);
          setSelectedExpense(null);
        }}
        title={`Compte de dépenses - ${selectedExpense?.account_number}`}
        size="lg"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut</label>
                <div className="mt-1">
                  <ExpenseAccountStatusBadge status={selectedExpense.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Montant total</label>
                <p className="mt-1 font-medium">{formatCurrency(selectedExpense.total_amount, selectedExpense.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Période</label>
                <p className="mt-1">
                  {formatDate(selectedExpense.expense_period_start)} → {formatDate(selectedExpense.expense_period_end)}
                </p>
              </div>
              {selectedExpense.submitted_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Soumis le</label>
                  <p className="mt-1">{formatDate(selectedExpense.submitted_at)}</p>
                </div>
              )}
              {selectedExpense.reviewed_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Révisé le</label>
                  <p className="mt-1">{formatDate(selectedExpense.reviewed_at)}</p>
                </div>
              )}
            </div>
            
            {selectedExpense.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{selectedExpense.description}</p>
              </div>
            )}

            {selectedExpense.status === 'approved' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Compte de dépenses approuvé</span>
                </div>
                {selectedExpense.review_notes && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-300">{selectedExpense.review_notes}</p>
                )}
              </div>
            )}

            {selectedExpense.status === 'rejected' && selectedExpense.rejection_reason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Compte de dépenses rejeté</span>
                </div>
                <p className="mt-2 text-sm text-red-600 dark:text-red-300">{selectedExpense.rejection_reason}</p>
              </div>
            )}

            {selectedExpense.status === 'needs_clarification' && selectedExpense.clarification_request && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">Précisions demandées</span>
                </div>
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-300">{selectedExpense.clarification_request}</p>
              </div>
            )}

            {/* Actions */}
            {selectedExpense.status === 'draft' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Modifier
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSubmit(selectedExpense.id)}
                  disabled={submitMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Soumettre pour validation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedExpense.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            )}
            {/* Allow deletion for non-approved accounts (not draft) */}
            {selectedExpense.status !== 'draft' && selectedExpense.status !== 'approved' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedExpense.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une demande de compte de dépense"
        size="lg"
      >
        <ExpenseAccountForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={creating}
          employees={employees}
          defaultEmployeeId={employee.id}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedExpense !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
        }}
        title="Modifier le compte de dépenses"
        size="lg"
      >
        {selectedExpense && (
          <ExpenseAccountForm
            expenseAccount={selectedExpense}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedExpense(null);
            }}
            loading={updateMutation.isPending}
            employees={employees}
            defaultEmployeeId={employee.id}
          />
        )}
      </Modal>
    </div>
  );
}
