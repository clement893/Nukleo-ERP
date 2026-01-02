'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  DollarSign, Calendar, FileText, Loader2, CheckCircle, Clock, XCircle, 
  AlertCircle, Upload, Edit, Trash2, Send, Reply, Paperclip, Download,
  Eye
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui';
import { expenseAccountsAPI, type ExpenseAccount, type ExpenseAccountStatus, type ExpenseAccountCreate, type ExpenseAccountUpdate } from '@/lib/api/finances/expenseAccounts';
import ExpenseAccountForm from '@/components/finances/ExpenseAccountForm';
import ExpenseAccountStatusBadge from '@/components/finances/ExpenseAccountStatusBadge';
import { employeesAPI } from '@/lib/api/employees';
import {
  useCreateExpenseAccount,
  useUpdateExpenseAccount,
  useDeleteExpenseAccount,
  useSubmitExpenseAccount,
  useApproveExpenseAccount,
  useRejectExpenseAccount,
  useRequestClarification,
  useRespondClarification,
  useSetUnderReview,
} from '@/lib/query/expenseAccounts';
import { handleApiError } from '@/lib/errors/api';
import { useAuthStore } from '@/lib/store';
import { logger } from '@/lib/logger';

export default function MesDepenses() {
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get('employee_id');
  const employeeId = employeeIdParam ? parseInt(employeeIdParam) : undefined;
  const { user } = useAuthStore();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExpenseAccountStatus | 'all'>('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  
  // Selected expense
  const [selectedExpense, setSelectedExpense] = useState<ExpenseAccount | null>(null);
  
  // Form states
  const [clarificationResponse, setClarificationResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [clarificationRequest, setClarificationRequest] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  
  // Current user's employee ID
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | undefined>(undefined);
  
  // Mutations
  const createMutation = useCreateExpenseAccount();
  const updateMutation = useUpdateExpenseAccount();
  const deleteMutation = useDeleteExpenseAccount();
  const submitMutation = useSubmitExpenseAccount();
  const approveMutation = useApproveExpenseAccount();
  const rejectMutation = useRejectExpenseAccount();
  const requestClarificationMutation = useRequestClarification();
  const respondClarificationMutation = useRespondClarification();
  const setUnderReviewMutation = useSetUnderReview();

  useEffect(() => {
    loadExpenses();
    loadEmployees();
    loadCurrentEmployee();
  }, [employeeId, statusFilter]);

  const loadCurrentEmployee = async () => {
    if (!user?.id) return;
    try {
      const allEmployees = await employeesAPI.list(0, 1000);
      const userIdNumber = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const currentEmployee = allEmployees.find(emp => emp.user_id !== null && emp.user_id !== undefined && emp.user_id === userIdNumber);
      if (currentEmployee) {
        setCurrentEmployeeId(currentEmployee.id);
      }
    } catch (error) {
      logger.error('Error loading current employee', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeesAPI.list(0, 1000);
      setEmployees(data.map(emp => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
      })));
    } catch (err) {
      logger.error('Failed to load employees', err);
      setEmployees([]);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseAccountsAPI.list(
        0, 
        100, 
        statusFilter === 'all' ? undefined : statusFilter,
        employeeId || currentEmployeeId
      );
      setExpenses(data);
    } catch (error) {
      logger.error('Error loading expenses', error);
      const appError = handleApiError(error);
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
      const expenseData: ExpenseAccountCreate = {
        employee_id: currentEmployeeId || (data as ExpenseAccountCreate).employee_id || 0,
        title: data.title || '',
        description: data.description ?? null,
        expense_period_start: data.expense_period_start ?? null,
        expense_period_end: data.expense_period_end ?? null,
        total_amount: data.total_amount || '0',
        currency: data.currency || 'EUR',
        metadata: data.metadata ?? null,
      };
      
      const createdExpense = await createMutation.mutateAsync(expenseData);
      
      // Upload attachment if provided
      if (pendingFile && createdExpense) {
        try {
          await expenseAccountsAPI.uploadAttachment(createdExpense.id, pendingFile);
          showToast({
            message: 'Compte de dépense créé avec succès et pièce jointe téléversée',
            type: 'success',
          });
        } catch (uploadErr) {
          const uploadError = handleApiError(uploadErr);
          showToast({
            message: 'Compte créé mais erreur lors du téléversement: ' + uploadError.message,
            type: 'warning',
          });
        }
        setPendingFile(null);
      } else {
        showToast({
          message: 'Compte de dépense créé avec succès',
          type: 'success',
        });
      }
      
      setShowCreateModal(false);
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du compte de dépense',
        type: 'error',
      });
    }
  };

  const handleUpdate = async (data: ExpenseAccountCreate | ExpenseAccountUpdate): Promise<void> => {
    if (!selectedExpense) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedExpense.id,
        data: data as ExpenseAccountUpdate,
      });
      
      // Upload attachment if provided
      if (pendingFile) {
        try {
          await expenseAccountsAPI.uploadAttachment(selectedExpense.id, pendingFile);
          showToast({
            message: 'Compte modifié avec succès et pièce jointe téléversée',
            type: 'success',
          });
        } catch (uploadErr) {
          const uploadError = handleApiError(uploadErr);
          showToast({
            message: 'Compte modifié mais erreur lors du téléversement: ' + uploadError.message,
            type: 'warning',
          });
        }
        setPendingFile(null);
      } else {
        showToast({
          message: 'Compte de dépenses modifié avec succès',
          type: 'success',
        });
      }
      
      setShowEditModal(false);
      setSelectedExpense(null);
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification',
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
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (expenseId: number) => {
    if (submitMutation.isPending) return;

    try {
      await submitMutation.mutateAsync(expenseId);
      showToast({
        message: 'Compte de dépenses soumis avec succès',
        type: 'success',
      });
      setShowViewModal(false);
      setSelectedExpense(null);
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la soumission',
        type: 'error',
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;

    try {
      await approveMutation.mutateAsync({
        id: selectedExpense.id,
        action: {
          notes: adminNotes || null,
        },
      });
      showToast({
        message: 'Compte de dépenses approuvé avec succès',
        type: 'success',
      });
      setShowApproveModal(false);
      setShowViewModal(false);
      setSelectedExpense(null);
      setAdminNotes('');
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'approbation',
        type: 'error',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedExpense || !rejectionReason.trim()) {
      showToast({
        message: 'Veuillez saisir une raison de rejet',
        type: 'error',
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: selectedExpense.id,
        action: {
          notes: adminNotes || null,
          rejection_reason: rejectionReason,
        },
      });
      showToast({
        message: 'Compte de dépenses rejeté',
        type: 'success',
      });
      setShowRejectModal(false);
      setShowViewModal(false);
      setSelectedExpense(null);
      setRejectionReason('');
      setAdminNotes('');
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du rejet',
        type: 'error',
      });
    }
  };

  const handleRequestClarification = async () => {
    if (!selectedExpense || !clarificationRequest.trim()) {
      showToast({
        message: 'Veuillez saisir une demande de clarification',
        type: 'error',
      });
      return;
    }

    try {
      await requestClarificationMutation.mutateAsync({
        id: selectedExpense.id,
        action: {
          notes: adminNotes || null,
          clarification_request: clarificationRequest,
        },
      });
      showToast({
        message: 'Demande de clarification envoyée',
        type: 'success',
      });
      setShowClarificationModal(false);
      setShowViewModal(false);
      setSelectedExpense(null);
      setClarificationRequest('');
      setAdminNotes('');
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la demande de clarification',
        type: 'error',
      });
    }
  };

  const handleRespondClarification = async () => {
    if (!selectedExpense || !clarificationResponse.trim()) {
      showToast({
        message: 'Veuillez saisir une réponse',
        type: 'error',
      });
      return;
    }

    try {
      await respondClarificationMutation.mutateAsync({
        id: selectedExpense.id,
        response: clarificationResponse.trim(),
      });
      setShowRespondModal(false);
      setShowViewModal(false);
      setSelectedExpense(null);
      setClarificationResponse('');
      showToast({
        message: 'Réponse envoyée avec succès. Le compte a été resoumis pour validation.',
        type: 'success',
      });
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'envoi de la réponse',
        type: 'error',
      });
    }
  };

  const handleSetUnderReview = async (expenseId: number) => {
    try {
      await setUnderReviewMutation.mutateAsync(expenseId);
      showToast({
        message: 'Compte mis en révision',
        type: 'success',
      });
      setShowViewModal(false);
      setSelectedExpense(null);
      await loadExpenses();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise en révision',
        type: 'error',
      });
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

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '-';
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: currency || 'CAD' 
    }).format(numAmount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isAdmin = user?.is_admin || false;
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
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 font-nukleo">
                {isAdmin ? 'Gestion des comptes de dépenses' : 'Mes Comptes de Dépenses'}
              </h1>
              <p className="text-white/80 text-lg">
                {isAdmin ? 'Gérez et approuvez les comptes de dépenses de tous les employés' : 'Gérez vos notes de frais et remboursements'}
              </p>
            </div>
            <Button 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Upload className="w-5 h-5 mr-2" />
              Nouveau compte
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 font-nukleo">
            {formatCurrency(totalAmount.toString(), expenses[0]?.currency || 'CAD')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total demandé</div>
        </Card>

        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-green-600 font-nukleo">
            {formatCurrency(approvedAmount.toString(), expenses[0]?.currency || 'CAD')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Approuvé</div>
        </Card>

        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-yellow-600 font-nukleo">
            {pendingCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">En attente</div>
        </Card>

        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-purple-600 font-nukleo">
            {expenses.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total comptes</div>
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
                  ? 'bg-primary-500 text-white'
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
            <Card key={expense.id} className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <FileText className="w-4 h-4 text-primary-500" />
                    <h3 className="text-base font-bold font-nukleo">
                      {expense.title}
                    </h3>
                    <Badge className={`${badge.class} flex items-center gap-1 text-xs`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </Badge>
                  </div>
                  {expense.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {expense.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                    <span className="font-mono">{expense.account_number}</span>
                    {expense.expense_period_start && expense.expense_period_end && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(expense.expense_period_start)} - {formatDate(expense.expense_period_end)}
                        </div>
                      </>
                    )}
                    {expense.submitted_at && (
                      <>
                        <span>•</span>
                        <span>Soumis le {formatDate(expense.submitted_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600 font-nukleo">
                      {formatCurrency(expense.total_amount, expense.currency)}
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

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-gray-500">
                  Créé le {formatDate(expense.created_at)}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Actions admin rapides directement sur la carte */}
                  {isAdmin && (expense.status === 'submitted' || expense.status === 'under_review') && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowApproveModal(true);
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approuver
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-auto"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowRejectModal(true);
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejeter
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowClarificationModal(true);
                        }}
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Clarifier
                      </Button>
                    </>
                  )}
                  {expense.status === 'draft' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                  )}
                  {(expense.status === 'submitted' || expense.status === 'under_review' || expense.status === 'needs_clarification') && !isAdmin && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                  )}
                  {expense.status === 'needs_clarification' && !isAdmin && (
                    <Button 
                      size="sm" 
                      className="bg-primary-500 hover:bg-nukleo-violet text-white text-xs px-2 py-1 h-auto"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowRespondModal(true);
                      }}
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Répondre
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => {
                      setSelectedExpense(expense);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Détails
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {expenses.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun compte de dépenses</p>
            <Button 
              className="bg-primary-500 hover:bg-nukleo-violet text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Créer votre premier compte
            </Button>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPendingFile(null);
        }}
        title="Créer un nouveau compte de dépenses"
        size="lg"
      >
        <ExpenseAccountForm
          onSubmit={handleCreate}
          onCancel={() => {
            setShowCreateModal(false);
            setPendingFile(null);
          }}
          loading={createMutation.isPending}
          employees={employees}
          defaultEmployeeId={currentEmployeeId}
          onFileSelected={setPendingFile}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedExpense !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
          setPendingFile(null);
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
              setPendingFile(null);
            }}
            loading={updateMutation.isPending}
            employees={employees}
            defaultEmployeeId={currentEmployeeId}
            onFileSelected={setPendingFile}
          />
        )}
      </Modal>

      {/* View Details Modal */}
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
              {selectedExpense.reviewer_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Révisé par</label>
                  <p className="mt-1">{selectedExpense.reviewer_name}</p>
                </div>
              )}
            </div>
            
            {selectedExpense.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{selectedExpense.description}</p>
              </div>
            )}

            {/* Attachments */}
            {selectedExpense.metadata && (selectedExpense.metadata as any).attachments && Array.isArray((selectedExpense.metadata as any).attachments) && (selectedExpense.metadata as any).attachments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Pièces jointes</label>
                <div className="space-y-2">
                  {(selectedExpense.metadata as any).attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.filename || 'Fichier'}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ''}
                            {attachment.uploaded_at ? ` • ${formatDate(attachment.uploaded_at)}` : ''}
                          </p>
                        </div>
                      </div>
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-600 flex items-center gap-1 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </a>
                      )}
                    </div>
                  ))}
                </div>
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
                  <AlertCircle className="w-5 h-5" />
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
            
            {(selectedExpense.status === 'submitted' || selectedExpense.status === 'under_review' || selectedExpense.status === 'needs_clarification') && (
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
                {selectedExpense.status === 'needs_clarification' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowRespondModal(true);
                    }}
                  >
                    <Reply className="w-4 h-4 mr-1.5" />
                    Répondre et renvoyer
                  </Button>
                )}
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
            
            {selectedExpense.status === 'rejected' && (
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

            {/* Admin Actions */}
            {isAdmin && (selectedExpense.status === 'submitted' || selectedExpense.status === 'under_review') && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setShowApproveModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setShowRejectModal(true);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Rejeter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setShowClarificationModal(true);
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  Demander clarification
                </Button>
                {selectedExpense.status === 'submitted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetUnderReview(selectedExpense.id)}
                    disabled={setUnderReviewMutation.isPending}
                  >
                    Mettre en révision
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Respond to Clarification Modal */}
      <Modal
        isOpen={showRespondModal && selectedExpense !== null}
        onClose={() => {
          setShowRespondModal(false);
          setClarificationResponse('');
        }}
        title="Répondre à la demande de précisions"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRespondModal(false);
                setClarificationResponse('');
              }}
              disabled={respondClarificationMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleRespondClarification}
              disabled={respondClarificationMutation.isPending || !clarificationResponse.trim()}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Envoyer la réponse et resoumettre
            </Button>
          </>
        }
      >
        {selectedExpense && (
          <div className="space-y-4">
            {selectedExpense.clarification_request && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Demande de précisions</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">{selectedExpense.clarification_request}</p>
              </div>
            )}
            
            <Textarea
              label="Votre réponse"
              placeholder="Saisissez votre réponse aux précisions demandées..."
              value={clarificationResponse}
              onChange={(e) => setClarificationResponse(e.target.value)}
              rows={6}
              required
              fullWidth
            />
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal && selectedExpense !== null}
        onClose={() => {
          setShowApproveModal(false);
          setAdminNotes('');
        }}
        title="Approuver le compte de dépenses"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setAdminNotes('');
              }}
              disabled={approveMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Approuver
            </Button>
          </>
        }
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Montant: <strong>{formatCurrency(selectedExpense.total_amount, selectedExpense.currency)}</strong>
              </p>
            </div>
            <Textarea
              label="Notes (optionnel)"
              placeholder="Ajoutez des notes pour cette approbation..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              fullWidth
            />
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal && selectedExpense !== null}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setAdminNotes('');
        }}
        title="Rejeter le compte de dépenses"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setAdminNotes('');
              }}
              disabled={rejectMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Rejeter
            </Button>
          </>
        }
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                Montant: <strong>{formatCurrency(selectedExpense.total_amount, selectedExpense.currency)}</strong>
              </p>
            </div>
            <Textarea
              label="Raison du rejet *"
              placeholder="Expliquez pourquoi ce compte de dépenses est rejeté..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
              fullWidth
            />
            <Textarea
              label="Notes additionnelles (optionnel)"
              placeholder="Ajoutez des notes supplémentaires..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              fullWidth
            />
          </div>
        )}
      </Modal>

      {/* Request Clarification Modal */}
      <Modal
        isOpen={showClarificationModal && selectedExpense !== null}
        onClose={() => {
          setShowClarificationModal(false);
          setClarificationRequest('');
          setAdminNotes('');
        }}
        title="Demander des précisions"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowClarificationModal(false);
                setClarificationRequest('');
                setAdminNotes('');
              }}
              disabled={requestClarificationMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestClarification}
              disabled={requestClarificationMutation.isPending || !clarificationRequest.trim()}
            >
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Envoyer la demande
            </Button>
          </>
        }
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Montant: <strong>{formatCurrency(selectedExpense.total_amount, selectedExpense.currency)}</strong>
              </p>
            </div>
            <Textarea
              label="Demande de précisions *"
              placeholder="Quelles informations supplémentaires avez-vous besoin ?"
              value={clarificationRequest}
              onChange={(e) => setClarificationRequest(e.target.value)}
              rows={4}
              required
              fullWidth
            />
            <Textarea
              label="Notes additionnelles (optionnel)"
              placeholder="Ajoutez des notes supplémentaires..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              fullWidth
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
