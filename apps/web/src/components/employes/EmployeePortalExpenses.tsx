'use client';

import { useEffect, useState } from 'react';
import { expenseAccountsAPI, type ExpenseAccount, type ExpenseAccountCreate } from '@/lib/api/finances/expenseAccounts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Card, Loading, Alert, Button } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ExpenseAccountForm from '@/components/finances/ExpenseAccountForm';
import { Receipt, DollarSign, Plus } from 'lucide-react';
import ExpenseAccountStatusBadge from '@/components/finances/ExpenseAccountStatusBadge';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee } from '@/lib/api/employees';

interface EmployeePortalExpensesProps {
  employee: Employee;
}

export default function EmployeePortalExpenses({ employee }: EmployeePortalExpensesProps) {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);

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

  const handleCreate = async (data: ExpenseAccountCreate | ExpenseAccountUpdate) => {
    try {
      setCreating(true);
      // Ensure employee_id is set to the current employee
      const expenseData: ExpenseAccountCreate = {
        ...data,
        employee_id: employee.id,
      } as ExpenseAccountCreate;
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

  const columns: Column<ExpenseAccount>[] = [
    {
      key: 'account_number',
      label: 'Numéro',
      sortable: true,
      render: (value) => (
        <div className="font-mono text-sm">{String(value)}</div>
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
          />
        </Card>
      )}

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
    </div>
  );
}
