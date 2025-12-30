'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Textarea } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type ExpenseAccount, type ExpenseAccountCreate, type ExpenseAccountUpdate, type ExpenseAccountStatus, type ExpenseAccountAction } from '@/lib/api/finances/expenseAccounts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ExpenseAccountForm from '@/components/finances/ExpenseAccountForm';
import ExpenseAccountStatusBadge from '@/components/finances/ExpenseAccountStatusBadge';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelect from '@/components/ui/MultiSelect';
import { 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  FileText,
} from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  useInfiniteExpenseAccounts, 
  useCreateExpenseAccount, 
  useUpdateExpenseAccount, 
  useDeleteExpenseAccount,
  useSubmitExpenseAccount,
  useApproveExpenseAccount,
  useRejectExpenseAccount,
  useRequestClarification,
} from '@/lib/query/expenseAccounts';
import { employeesAPI, type Employee } from '@/lib/api/employees';

function CompteDepensesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // React Query hooks for expense accounts
  const {
    data: expenseAccountsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteExpenseAccounts(20);
  
  // Mutations
  const createExpenseAccountMutation = useCreateExpenseAccount();
  const updateExpenseAccountMutation = useUpdateExpenseAccount();
  const deleteExpenseAccountMutation = useDeleteExpenseAccount();
  const submitExpenseAccountMutation = useSubmitExpenseAccount();
  const approveExpenseAccountMutation = useApproveExpenseAccount();
  const rejectExpenseAccountMutation = useRejectExpenseAccount();
  const requestClarificationMutation = useRequestClarification();
  
  // Flatten pages into single array
  const expenseAccounts = useMemo(() => {
    return expenseAccountsData?.pages.flat() || [];
  }, [expenseAccountsData]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState<ExpenseAccount | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'clarification' | null>(null);
  const [actionData, setActionData] = useState<ExpenseAccountAction>({ notes: null, rejection_reason: null, clarification_request: null });
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  
  // Load employees for filters and form
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeesData = await employeesAPI.list(0, 1000);
        setEmployees(employeesData);
      } catch (err) {
        console.warn('Could not load employees:', err);
        setEmployees([]);
      }
    };
    loadEmployees();
  }, []);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  const statusOptions: ExpenseAccountStatus[] = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_clarification'];

  // Load more expense accounts for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered expense accounts with debounced search
  const filteredExpenseAccounts = useMemo(() => {
    return expenseAccounts.filter((account) => {
      // Status filter
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(account.status);
      
      // Employee filter
      const matchesEmployee = filterEmployee.length === 0 || 
        filterEmployee.includes(account.employee_id.toString());
      
      // Search filter
      const matchesSearch = !debouncedSearchQuery || 
        account.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        account.account_number.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        account.employee_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      return matchesStatus && matchesEmployee && matchesSearch;
    });
  }, [expenseAccounts, filterStatus, filterEmployee, debouncedSearchQuery]);
  
  // Check if any filters are active
  const hasActiveFilters = !!(filterStatus.length > 0 || filterEmployee.length > 0 || debouncedSearchQuery);
  
  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterStatus([]);
    setFilterEmployee([]);
    setSearchQuery('');
  }, []);

  // Handle create
  const handleCreate = async (data: ExpenseAccountCreate | ExpenseAccountUpdate) => {
    try {
      await createExpenseAccountMutation.mutateAsync(data as ExpenseAccountCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Compte de dépenses créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du compte de dépenses',
        type: 'error',
      });
    }
  };

  // Handle update
  const handleUpdate = async (data: ExpenseAccountCreate | ExpenseAccountUpdate) => {
    if (!selectedExpenseAccount) return;

    try {
      await updateExpenseAccountMutation.mutateAsync({
        id: selectedExpenseAccount.id,
        data: data as ExpenseAccountUpdate,
      });
      setShowEditModal(false);
      setSelectedExpenseAccount(null);
      showToast({
        message: 'Compte de dépenses modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du compte de dépenses',
        type: 'error',
      });
    }
  };

  // Handle delete
  const handleDelete = async (expenseAccountId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte de dépenses ?')) {
      return;
    }

    try {
      await deleteExpenseAccountMutation.mutateAsync(expenseAccountId);
      showToast({
        message: 'Compte de dépenses supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du compte de dépenses',
        type: 'error',
      });
    }
  };

  // Handle submit
  const handleSubmit = async (expenseAccountId: number) => {
    try {
      await submitExpenseAccountMutation.mutateAsync(expenseAccountId);
      showToast({
        message: 'Compte de dépenses soumis avec succès',
        type: 'success',
      });
      setShowActionsMenu(null);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la soumission du compte de dépenses',
        type: 'error',
      });
    }
  };

  // Handle approve/reject/clarification
  const handleAction = async () => {
    if (!selectedExpenseAccount || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approveExpenseAccountMutation.mutateAsync({
          id: selectedExpenseAccount.id,
          action: actionData,
        });
        showToast({
          message: 'Compte de dépenses approuvé avec succès',
          type: 'success',
        });
      } else if (actionType === 'reject') {
        if (!actionData.rejection_reason) {
          showToast({
            message: 'La raison du rejet est requise',
            type: 'error',
          });
          return;
        }
        await rejectExpenseAccountMutation.mutateAsync({
          id: selectedExpenseAccount.id,
          action: actionData,
        });
        showToast({
          message: 'Compte de dépenses rejeté',
          type: 'success',
        });
      } else if (actionType === 'clarification') {
        if (!actionData.clarification_request) {
          showToast({
            message: 'La demande de précisions est requise',
            type: 'error',
          });
          return;
        }
        await requestClarificationMutation.mutateAsync({
          id: selectedExpenseAccount.id,
          action: actionData,
        });
        showToast({
          message: 'Demande de précisions envoyée',
          type: 'success',
        });
      }
      setShowActionModal(false);
      setSelectedExpenseAccount(null);
      setActionType(null);
      setActionData({ notes: null, rejection_reason: null, clarification_request: null });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'action',
        type: 'error',
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency || 'EUR' 
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Open action modal
  const openActionModal = (account: ExpenseAccount, type: 'approve' | 'reject' | 'clarification') => {
    setSelectedExpenseAccount(account);
    setActionType(type);
    setActionData({ notes: null, rejection_reason: null, clarification_request: null });
    setShowActionModal(true);
    setShowActionsMenu(null);
  };

  // Table columns
  const columns: Column<ExpenseAccount>[] = [
    {
      key: 'account_number',
      label: 'Numéro',
      sortable: true,
      render: (_value, account) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium">{account.account_number}</div>
            <div className="text-sm text-muted-foreground">{account.title}</div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExpenseAccount(account);
                setShowViewModal(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'employee_name',
      label: 'Employé',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <ExpenseAccountStatusBadge status={value as ExpenseAccountStatus} />
      ),
    },
    {
      key: 'total_amount',
      label: 'Montant',
      sortable: true,
      render: (_value, account) => (
        <span className="font-medium">{formatCurrency(account.total_amount, account.currency)}</span>
      ),
    },
    {
      key: 'expense_period_start',
      label: 'Période',
      sortable: true,
      render: (_value, account) => (
        <div className="text-sm">
          <div>{formatDate(account.expense_period_start)}</div>
          {account.expense_period_end && (
            <div className="text-muted-foreground">→ {formatDate(account.expense_period_end)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Soumis le',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{formatDate(value as string | null)}</span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Compte de dépenses"
        description={`Gérez vos comptes de dépenses${expenseAccounts.length > 0 ? ` - ${expenseAccounts.length} compte${expenseAccounts.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Finances', href: '/dashboard/finances' },
          { label: 'Compte de dépenses' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Expense account count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters ? (
                <span>
                  {filteredExpenseAccounts.length} sur {expenseAccounts.length} compte{expenseAccounts.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {expenseAccounts.length} compte{expenseAccounts.length > 1 ? 's' : ''} au total
                </span>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par numéro, titre, employé..."
            className="w-full"
          />
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut */}
            <MultiSelect
              options={statusOptions.map((status) => ({
                label: status === 'draft' ? 'Brouillon' : 
                       status === 'submitted' ? 'Soumis' :
                       status === 'under_review' ? 'En révision' :
                       status === 'approved' ? 'Approuvé' :
                       status === 'rejected' ? 'Rejeté' :
                       status === 'needs_clarification' ? 'Précisions requises' : status,
                value: status,
              }))}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filtrer par statut"
              className="min-w-[180px]"
            />

            {/* Employé */}
            {employees.length > 0 && (
              <MultiSelect
                options={employees.map((emp) => ({
                  label: `${emp.first_name} ${emp.last_name}`,
                  value: emp.id.toString(),
                }))}
                value={filterEmployee}
                onChange={setFilterEmployee}
                placeholder="Filtrer par employé"
                className="min-w-[180px]"
              />
            )}

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Nouveau compte de dépenses
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading && expenseAccounts.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredExpenseAccounts as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun compte de dépenses trouvé"
            loading={loading}
            infiniteScroll={!hasActiveFilters}
            hasMore={hasMore && !hasActiveFilters}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            onRowClick={(row) => {
              setSelectedExpenseAccount(row as unknown as ExpenseAccount);
              setShowViewModal(true);
            }}
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau compte de dépenses"
        size="lg"
      >
        <ExpenseAccountForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createExpenseAccountMutation.isPending}
          employees={employees}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedExpenseAccount !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpenseAccount(null);
        }}
        title="Modifier le compte de dépenses"
        size="lg"
      >
        {selectedExpenseAccount && (
          <ExpenseAccountForm
            expenseAccount={selectedExpenseAccount}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedExpenseAccount(null);
            }}
            loading={updateExpenseAccountMutation.isPending}
            employees={employees}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal && selectedExpenseAccount !== null}
        onClose={() => {
          setShowViewModal(false);
          setSelectedExpenseAccount(null);
        }}
        title={`Compte de dépenses - ${selectedExpenseAccount?.account_number}`}
        size="lg"
      >
        {selectedExpenseAccount && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employé</label>
                <p className="mt-1">{selectedExpenseAccount.employee_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut</label>
                <div className="mt-1">
                  <ExpenseAccountStatusBadge status={selectedExpenseAccount.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Montant total</label>
                <p className="mt-1 font-medium">{formatCurrency(selectedExpenseAccount.total_amount, selectedExpenseAccount.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Période</label>
                <p className="mt-1">
                  {formatDate(selectedExpenseAccount.expense_period_start)} → {formatDate(selectedExpenseAccount.expense_period_end)}
                </p>
              </div>
              {selectedExpenseAccount.submitted_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Soumis le</label>
                  <p className="mt-1">{formatDate(selectedExpenseAccount.submitted_at)}</p>
                </div>
              )}
              {selectedExpenseAccount.reviewed_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Révisé le</label>
                  <p className="mt-1">{formatDate(selectedExpenseAccount.reviewed_at)}</p>
                </div>
              )}
            </div>
            
            {selectedExpenseAccount.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{selectedExpenseAccount.description}</p>
              </div>
            )}

            {selectedExpenseAccount.review_notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes de révision</label>
                <p className="mt-1 text-sm">{selectedExpenseAccount.review_notes}</p>
              </div>
            )}

            {selectedExpenseAccount.rejection_reason && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Raison du rejet</label>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{selectedExpenseAccount.rejection_reason}</p>
              </div>
            )}

            {selectedExpenseAccount.clarification_request && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Demande de précisions</label>
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">{selectedExpenseAccount.clarification_request}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {selectedExpenseAccount.status === 'draft' && (
                <>
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
                    onClick={() => handleSubmit(selectedExpenseAccount.id)}
                    disabled={submitExpenseAccountMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    Soumettre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedExpenseAccount.id)}
                    disabled={deleteExpenseAccountMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Supprimer
                  </Button>
                </>
              )}
              {(selectedExpenseAccount.status === 'submitted' || selectedExpenseAccount.status === 'under_review') && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openActionModal(selectedExpenseAccount, 'approve')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Approuver
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openActionModal(selectedExpenseAccount, 'reject')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Rejeter
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openActionModal(selectedExpenseAccount, 'clarification')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Demander précisions
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal (Approve/Reject/Clarification) */}
      <Modal
        isOpen={showActionModal && selectedExpenseAccount !== null && actionType !== null}
        onClose={() => {
          setShowActionModal(false);
          setSelectedExpenseAccount(null);
          setActionType(null);
          setActionData({ notes: null, rejection_reason: null, clarification_request: null });
        }}
        title={
          actionType === 'approve' ? 'Approuver le compte de dépenses' :
          actionType === 'reject' ? 'Rejeter le compte de dépenses' :
          'Demander des précisions'
        }
        size="md"
      >
        <div className="space-y-4">
          {actionType === 'reject' && (
            <div>
              <Textarea
                label="Raison du rejet *"
                value={actionData.rejection_reason || ''}
                onChange={(e) => setActionData({ ...actionData, rejection_reason: e.target.value || null })}
                rows={4}
                fullWidth
                placeholder="Expliquez la raison du rejet..."
              />
            </div>
          )}
          {actionType === 'clarification' && (
            <div>
              <Textarea
                label="Demande de précisions *"
                value={actionData.clarification_request || ''}
                onChange={(e) => setActionData({ ...actionData, clarification_request: e.target.value || null })}
                rows={4}
                fullWidth
                placeholder="Quelles informations supplémentaires sont nécessaires ?"
              />
            </div>
          )}
          <div>
            <Textarea
              label="Notes (optionnel)"
              value={actionData.notes || ''}
              onChange={(e) => setActionData({ ...actionData, notes: e.target.value || null })}
              rows={3}
              fullWidth
              placeholder="Notes additionnelles..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowActionModal(false);
                setSelectedExpenseAccount(null);
                setActionType(null);
                setActionData({ notes: null, rejection_reason: null, clarification_request: null });
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAction}
              className={
                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                'bg-yellow-600 hover:bg-yellow-700 text-white'
              }
              disabled={
                approveExpenseAccountMutation.isPending ||
                rejectExpenseAccountMutation.isPending ||
                requestClarificationMutation.isPending ||
                (actionType === 'reject' && !actionData.rejection_reason) ||
                (actionType === 'clarification' && !actionData.clarification_request)
              }
            >
              {actionType === 'approve' ? 'Approuver' : actionType === 'reject' ? 'Rejeter' : 'Envoyer la demande'}
            </Button>
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}

export default function CompteDepensesPage() {
  return <CompteDepensesContent />;
}
