'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  FileText, Plus, Search, Send, Edit, 
  DollarSign, Calendar, User, Building, Clock, AlertCircle,
  CheckCircle, XCircle, Mail, Phone, MapPin, CreditCard, Loader2, Trash2
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, useToast } from '@/components/ui';
import { 
  useFacturations, 
  useFacturation, 
  useDeleteFacturation, 
  useSendFacturation 
} from '@/lib/query/queries';
import { projectsAPI } from '@/lib/api/projects';
import { useQuery } from '@tanstack/react-query';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
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
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.label || selectedInvoice.status}
                  </Badge>
                  {selectedInvoice.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendInvoice(selectedInvoice.id)}
                      disabled={sendMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer
                    </Button>
                  )}
                  {selectedInvoice.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(selectedInvoice.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
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

        {/* Create Invoice Modal - Placeholder */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouvelle facture"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Le formulaire de création de facture sera implémenté prochainement.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
