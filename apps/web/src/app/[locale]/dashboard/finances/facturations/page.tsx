'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  FileText, Plus, Search, Send, Edit, 
  DollarSign, Calendar, User, Building, Clock, AlertCircle,
  CheckCircle, XCircle, Mail, Phone, MapPin, CreditCard, Loader2, Trash2,
  Download, Copy, X, Bell, Upload, FileDown
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, useToast, Select } from '@/components/ui';
import { 
  useFacturations, 
  useFacturation, 
  useDeleteFacturation, 
  useSendFacturation,
  useCreateFacturation,
  useUpdateFacturation
} from '@/lib/query/queries';
import { facturationsAPI } from '@/lib/api/finances/facturations';
import { useMutation } from '@tanstack/react-query';
import { projectsAPI } from '@/lib/api/projects';
import { useQuery } from '@tanstack/react-query';
import InvoiceForm from '@/components/finances/InvoiceForm';
import { type FinanceInvoiceCreate, type FinanceInvoiceUpdate } from '@/lib/api/finances/facturations';
import { handleApiError } from '@/lib/errors/api';

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: Edit },
  sent: { label: 'Envoyée', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Send },
  paid: { label: 'Payée', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  partial: { label: 'Partiel', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Clock },
  overdue: { label: 'En retard', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle },
  cancelled: { label: 'Annulée', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: XCircle }
};

const paymentMethodConfig = {
  credit_card: { label: 'Carte de crédit', icon: CreditCard },
  bank_transfer: { label: 'Virement bancaire', icon: Building },
  check: { label: 'Chèque', icon: FileText },
  cash: { label: 'Comptant', icon: DollarSign }
};

export default function FacturationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<any | null>(null);
  const { showToast } = useToast();

  // Fetch invoices
  const { data: invoicesData, isLoading } = useFacturations({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Fetch selected invoice details
  const { data: selectedInvoice } = useFacturation(
    selectedInvoiceId || 0,
    !!selectedInvoiceId && viewMode === 'detail'
  );

  // Fetch projects for project name lookup
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list(0, 1000),
  });

  // Mutations
  const deleteMutation = useDeleteFacturation();
  const sendMutation = useSendFacturation();
  const createMutation = useCreateFacturation();
  const updateMutation = useUpdateFacturation();
  
  // Additional mutations
  const pdfMutation = useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.generatePDF(invoiceId),
    onSuccess: () => {
      showToast({ message: 'PDF généré avec succès', type: 'success' });
    },
    onError: () => {
      showToast({ message: 'Erreur lors de la génération du PDF', type: 'error' });
    },
  });
  
  const emailMutation = useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.sendEmail(invoiceId),
    onSuccess: () => {
      showToast({ message: 'Email envoyé avec succès', type: 'success' });
    },
    onError: () => {
      showToast({ message: 'Erreur lors de l\'envoi de l\'email', type: 'error' });
    },
  });
  
  const duplicateMutation = useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.duplicate(invoiceId),
    onSuccess: () => {
      showToast({ message: 'Facture dupliquée avec succès', type: 'success' });
    },
    onError: () => {
      showToast({ message: 'Erreur lors de la duplication', type: 'error' });
    },
  });
  
  const cancelMutation = useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.cancel(invoiceId),
    onSuccess: () => {
      showToast({ message: 'Facture annulée avec succès', type: 'success' });
    },
    onError: () => {
      showToast({ message: 'Erreur lors de l\'annulation', type: 'error' });
    },
  });
  
  const remindMutation = useMutation({
    mutationFn: (invoiceId: number) => facturationsAPI.remind(invoiceId),
    onSuccess: () => {
      showToast({ message: 'Rappel envoyé avec succès', type: 'success' });
    },
    onError: () => {
      showToast({ message: 'Erreur lors de l\'envoi du rappel', type: 'error' });
    },
  });
  
  const exportMutation = useMutation({
    mutationFn: (format: 'csv' | 'excel') => facturationsAPI.export({ format }),
    onSuccess: () => {
      showToast({ message: 'Export réussi', type: 'success' });
    },
    onError: () => {
      showToast({ message: 'Erreur lors de l\'export', type: 'error' });
    },
  });

  const invoices = invoicesData?.items || [];

  // Filter invoices by search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    
    const query = searchQuery.toLowerCase();
    return invoices.filter(invoice => {
      const projectName = projects?.find(p => p.id === invoice.project_id)?.name || '';
      return (
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.client_data?.name?.toLowerCase().includes(query) ||
        projectName.toLowerCase().includes(query)
      );
    });
  }, [invoices, searchQuery, projects]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const paid = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
    const pending = invoices
      .filter(i => ['sent', 'partial'].includes(i.status))
      .reduce((sum, inv) => sum + Number(inv.amount_due), 0);
    const overdue = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.amount_due), 0);

    return {
      total,
      paid,
      pending,
      overdue,
      count: {
        total: invoices.length,
        draft: invoices.filter(i => i.status === 'draft').length,
        sent: invoices.filter(i => i.status === 'sent').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
      },
    };
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleViewInvoice = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedInvoiceId(null);
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      await sendMutation.mutateAsync(invoiceId);
      showToast({
        title: 'Facture envoyée',
        message: 'La facture a été envoyée avec succès.',
        type: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Erreur',
        message: 'Impossible d\'envoyer la facture.',
        type: 'error',
      });
    }
  };

  const handleDeleteClick = (invoiceId: number) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(invoiceToDelete);
      showToast({
        title: 'Facture supprimée',
        message: 'La facture a été supprimée avec succès.',
        type: 'success',
      });
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      if (selectedInvoiceId === invoiceToDelete) {
        handleBackToList();
      }
    } catch (error) {
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la facture.',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </PageContainer>
    );
  }

  if (viewMode === 'detail' && selectedInvoice) {
    const StatusIcon = statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.icon || Edit;
    const projectName = projects?.find(p => p.id === selectedInvoice.project_id)?.name || 'Projet non spécifié';
    const daysOverdue = selectedInvoice.status === 'overdue' ? getDaysOverdue(selectedInvoice.due_date) : 0;

    return (
      <PageContainer maxWidth="full">
        <MotionDiv variant="slideUp" duration="normal">
          {/* Back Button */}
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={handleBackToList}
          >
            ← Retour à la liste
          </Button>

          {/* Invoice Detail Header */}
          <div className="relative mb-6 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
              backgroundSize: '200px 200px'
            }} />
            <div className="relative px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white mb-1 font-nukleo">
                      {selectedInvoice.invoice_number}
                    </h1>
                    <p className="text-white/80 text-sm">{projectName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.label || selectedInvoice.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pdfMutation.mutate(selectedInvoice.id)}
                    disabled={pdfMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  {selectedInvoice.client_data?.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => emailMutation.mutate(selectedInvoice.id)}
                      disabled={emailMutation.isPending}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                  {selectedInvoice.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInvoiceToEdit(selectedInvoice);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendInvoice(selectedInvoice.id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(selectedInvoice.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </>
                  )}
                  {selectedInvoice.status !== 'draft' && selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Paiement
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => remindMutation.mutate(selectedInvoice.id)}
                        disabled={remindMutation.isPending}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Rappel
                      </Button>
                    </>
                  )}
                  {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate(selectedInvoice.id)}
                      disabled={cancelMutation.isPending}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateMutation.mutate(selectedInvoice.id)}
                    disabled={duplicateMutation.isPending}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Dupliquer
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {daysOverdue > 0 && (
            <Card className="glass-card p-4 rounded-xl border border-red-500/30 bg-red-500/5 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-600">Facture en retard</div>
                  <div className="text-sm text-red-600/80">
                    En retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Client Info */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations client
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Nom</div>
                  <div className="font-medium">{selectedInvoice.client_data?.name || 'Non spécifié'}</div>
                </div>
                {selectedInvoice.client_data?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedInvoice.client_data.email}</span>
                  </div>
                )}
                {selectedInvoice.client_data?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedInvoice.client_data.phone}</span>
                  </div>
                )}
                {selectedInvoice.client_data?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{selectedInvoice.client_data.address}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Dates */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates importantes
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Date d'émission</div>
                  <div className="font-medium">{formatDate(selectedInvoice.issue_date)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Date d'échéance</div>
                  <div className="font-medium">{formatDate(selectedInvoice.due_date)}</div>
                </div>
                {selectedInvoice.last_reminder_date && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Dernier rappel</div>
                    <div className="font-medium">{formatDate(selectedInvoice.last_reminder_date)}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Summary */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Résumé des paiements
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Montant total</div>
                  <div className="text-xl font-bold font-nukleo">
                    {formatCurrency(Number(selectedInvoice.total))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Montant payé</div>
                  <div className="font-medium text-green-600">{formatCurrency(Number(selectedInvoice.amount_paid))}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Montant dû</div>
                  <div className="font-medium text-orange-600">{formatCurrency(Number(selectedInvoice.amount_due))}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Line Items */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 mb-6">
            <h3 className="font-semibold mb-4">Articles facturés</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Quantité</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Prix unitaire</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.line_items?.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-2">{item.description}</td>
                      <td className="py-3 px-2 text-right">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="py-3 px-2 text-right font-medium">Sous-total</td>
                    <td className="py-3 px-2 text-right font-medium">{formatCurrency(Number(selectedInvoice.subtotal))}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="py-3 px-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      Taxes ({selectedInvoice.tax_rate}%)
                    </td>
                    <td className="py-3 px-2 text-right">{formatCurrency(Number(selectedInvoice.tax_amount))}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-3 px-2 text-right font-bold text-lg">Total</td>
                    <td className="py-3 px-2 text-right font-bold text-lg font-nukleo">
                      {formatCurrency(Number(selectedInvoice.total))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Payments */}
          {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 mb-6">
              <h3 className="font-semibold mb-4">Historique des paiements</h3>
              <div className="space-y-3">
                {selectedInvoice.payments.map((payment) => {
                  const PaymentIcon = paymentMethodConfig[payment.payment_method as keyof typeof paymentMethodConfig]?.icon || CreditCard;
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                          <PaymentIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{paymentMethodConfig[payment.payment_method as keyof typeof paymentMethodConfig]?.label || payment.payment_method}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(payment.payment_date)}
                            {payment.reference && ` • ${payment.reference}`}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-green-600">{formatCurrency(Number(payment.amount))}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Notes & Terms */}
          {(selectedInvoice.notes || selectedInvoice.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedInvoice.terms && (
                <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                  <h3 className="font-semibold mb-2">Conditions de paiement</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.terms}</p>
                </Card>
              )}
              {selectedInvoice.notes && (
                <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.notes}</p>
                </Card>
              )}
            </div>
          )}
        </MotionDiv>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full">
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Facturations
                  </h1>
                  <p className="text-white/80 text-sm">Gestion complète de vos factures</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => setShowImportModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => exportMutation.mutate('csv')}
                  disabled={exportMutation.isPending}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle facture
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total facturé</div>
            </div>
            <div className="text-2xl font-bold mb-1 font-nukleo">
              {formatCurrency(stats.total)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.total} facture{stats.count.total > 1 ? 's' : ''}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Payé</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600 font-nukleo">
              {formatCurrency(stats.paid)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.paid} facture{stats.count.paid > 1 ? 's' : ''}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-orange-600 font-nukleo">
              {formatCurrency(stats.pending)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.sent} facture{stats.count.sent > 1 ? 's' : ''}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En retard</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600 font-nukleo">
              {formatCurrency(stats.overdue)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.overdue} facture{stats.count.overdue > 1 ? 's' : ''}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par numéro, client ou projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Toutes ({stats.count.total})
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('sent')}
              >
                Envoyées ({stats.count.sent})
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('paid')}
              >
                Payées ({stats.count.paid})
              </Button>
              <Button
                variant={statusFilter === 'overdue' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('overdue')}
              >
                En retard ({stats.count.overdue})
              </Button>
            </div>
          </div>
        </Card>

        {/* Invoices List */}
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const StatusIcon = statusConfig[invoice.status as keyof typeof statusConfig]?.icon || Edit;
            const projectName = projects?.find(p => p.id === invoice.project_id)?.name || '';
            return (
              <Card 
                key={invoice.id} 
                className="glass-card p-5 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500 transition-all cursor-pointer"
                onClick={() => handleViewInvoice(invoice.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{invoice.invoice_number}</span>
                        <Badge className={`${statusConfig[invoice.status as keyof typeof statusConfig]?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {invoice.client_data?.name || 'Client non spécifié'} • {projectName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Émise: {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</span>
                        <span>•</span>
                        <span>Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold mb-1 font-nukleo">
                      {formatCurrency(Number(invoice.total))}
                    </div>
                    {Number(invoice.amount_due) > 0 && (
                      <div className="text-sm text-orange-600">
                        Dû: {formatCurrency(Number(invoice.amount_due))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredInvoices.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune facture trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Créez votre première facture pour commencer'}
            </p>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setInvoiceToDelete(null);
          }}
          title="Supprimer la facture"
        >
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setInvoiceToDelete(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Invoice Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouvelle facture"
          size="lg"
        >
          <InvoiceForm
            invoice={null}
            onSubmit={async (data: FinanceInvoiceCreate | FinanceInvoiceUpdate) => {
              try {
                await createMutation.mutateAsync(data as FinanceInvoiceCreate);
                showToast({
                  message: 'Facture créée avec succès',
                  type: 'success',
                });
                setShowCreateModal(false);
              } catch (error) {
                const appError = handleApiError(error);
                showToast({
                  message: appError.message || 'Erreur lors de la création de la facture',
                  type: 'error',
                });
                throw error;
              }
            }}
            onCancel={() => setShowCreateModal(false)}
            loading={createMutation.isPending}
            projects={projects || []}
          />
        </Modal>

        {/* Edit Invoice Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setInvoiceToEdit(null);
          }}
          title="Modifier la facture"
          size="lg"
        >
          {invoiceToEdit && (
            <InvoiceForm
              invoice={invoiceToEdit}
              onSubmit={async (data: FinanceInvoiceCreate | FinanceInvoiceUpdate) => {
                try {
                  await updateMutation.mutateAsync({ id: invoiceToEdit.id, data: data as FinanceInvoiceUpdate });
                  showToast({
                    message: 'Facture modifiée avec succès',
                    type: 'success',
                  });
                  setShowEditModal(false);
                  setInvoiceToEdit(null);
                  if (selectedInvoiceId === invoiceToEdit.id) {
                    // Refresh selected invoice
                    window.location.reload();
                  }
                } catch (error) {
                  const appError = handleApiError(error);
                  showToast({
                    message: appError.message || 'Erreur lors de la modification de la facture',
                    type: 'error',
                  });
                  throw error;
                }
              }}
              onCancel={() => {
                setShowEditModal(false);
                setInvoiceToEdit(null);
              }}
              loading={updateMutation.isPending}
              projects={projects || []}
            />
          )}
        </Modal>

        {/* Payment Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Enregistrer un paiement"
          size="md"
        >
          {selectedInvoice && (
            <PaymentForm
              invoice={selectedInvoice}
              onSubmit={async (paymentData) => {
                try {
                  await facturationsAPI.createPayment(selectedInvoice.id, paymentData);
                  showToast({
                    message: 'Paiement enregistré avec succès',
                    type: 'success',
                  });
                  setShowPaymentModal(false);
                  // Refresh invoice
                  window.location.reload();
                } catch (error) {
                  const appError = handleApiError(error);
                  showToast({
                    message: appError.message || 'Erreur lors de l\'enregistrement du paiement',
                    type: 'error',
                  });
                }
              }}
              onCancel={() => setShowPaymentModal(false)}
            />
          )}
        </Modal>

        {/* Import Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Importer des factures"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Téléchargez d'abord le template pour voir le format attendu, puis importez votre fichier CSV ou Excel.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => facturationsAPI.downloadTemplate('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger template CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => facturationsAPI.downloadTemplate('excel')}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger template Excel
              </Button>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium mb-2">Note: L'import de factures n'est pas encore implémenté côté backend.</p>
              <p className="text-xs text-gray-500">Cette fonctionnalité sera disponible prochainement.</p>
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}

// Payment Form Component
function PaymentForm({ invoice, onSubmit, onCancel }: { invoice: any; onSubmit: (data: any) => Promise<void>; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    amount: invoice.amount_due || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer' as 'credit_card' | 'bank_transfer' | 'check' | 'cash',
    reference: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Montant *</label>
        <Input
          type="number"
          min="0"
          step="0.01"
          max={invoice.amount_due}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Montant dû: {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(invoice.amount_due)}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Date de paiement *</label>
        <Input
          type="date"
          value={formData.payment_date}
          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Méthode de paiement *</label>
        <Select
          value={formData.payment_method}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
          options={[
            { value: 'bank_transfer', label: 'Virement bancaire' },
            { value: 'credit_card', label: 'Carte de crédit' },
            { value: 'check', label: 'Chèque' },
            { value: 'cash', label: 'Comptant' },
          ]}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Référence</label>
        <Input
          type="text"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          placeholder="Numéro de transaction, chèque, etc."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <Input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes additionnelles"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
