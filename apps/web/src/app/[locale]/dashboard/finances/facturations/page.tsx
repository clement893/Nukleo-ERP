'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  FileText, Plus, Search, Send, Edit, 
  DollarSign, Calendar, User, Building, Clock, AlertCircle,
  CheckCircle, XCircle, Mail, Phone, MapPin, CreditCard, Loader2
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { projectsAPI } from '@/lib/api/projects';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  reference?: string;
}

interface Invoice {
  id: string;
  number: string;
  projectId: number;
  projectName: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  payments: Payment[];
  notes?: string;
  terms?: string;
  lastReminderDate?: string;
}

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
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const projects = await projectsAPI.list(0, 1000);
      
      // Générer des factures depuis les projets avec budget
      const projectsWithBudget = projects.filter(p => p.budget && p.budget > 0);
      
      const generatedInvoices: Invoice[] = projectsWithBudget.map((project, index) => {
        const subtotal = project.budget || 0;
        const taxRate = 14.975; // TPS + TVQ Québec
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        
        // Déterminer le statut basé sur le statut du projet
        let status: Invoice['status'] = 'sent';
        let amountPaid = 0;
        let payments: Payment[] = [];
        
        if (project.status === 'COMPLETED') {
          status = 'paid';
          amountPaid = total;
          payments = [{
            id: '1',
            date: project.updated_at,
            amount: total,
            method: 'bank_transfer',
            reference: `WIRE-${new Date(project.updated_at).getFullYear()}-${String(index + 1).padStart(3, '0')}`
          }];
        } else if (project.status === 'ACTIVE') {
          // 30% des projets actifs ont un paiement partiel
          if (Math.random() > 0.7) {
            status = 'partial';
            amountPaid = total * 0.5;
            payments = [{
              id: '1',
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              amount: amountPaid,
              method: 'credit_card',
              reference: 'CC-****-1234'
            }];
          }
        } else if (project.status === 'ARCHIVED') {
          // Les projets archivés sont considérés en retard s'ils ont un budget
          status = 'overdue';
        }
        
        const issueDate = new Date(project.created_at);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30); // Net 30 jours
        
        return {
          id: `${project.id}`,
          number: `INV-${new Date(project.created_at).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          projectId: project.id,
          projectName: project.name,
          client: {
            name: project.client_name || 'Client non spécifié',
            email: `contact@${(project.client_name || 'client').toLowerCase().replace(/\s+/g, '-')}.com`,
            phone: '+1 514-555-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
            address: '123 Rue Example, Montréal, QC'
          },
          issueDate: project.created_at,
          dueDate: dueDate.toISOString(),
          status,
          lineItems: [
            {
              id: '1',
              description: project.name,
              quantity: 1,
              unitPrice: subtotal,
              total: subtotal
            }
          ],
          subtotal,
          taxRate,
          taxAmount,
          total,
          amountPaid,
          amountDue: total - amountPaid,
          payments,
          terms: 'Paiement net 30 jours',
          notes: project.description || undefined
        };
      });
      
      setInvoices(generatedInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery ||
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amountPaid, 0),
    pending: invoices.filter(i => ['sent', 'partial'].includes(i.status)).reduce((sum, inv) => sum + inv.amountDue, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + inv.amountDue, 0),
    count: {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    }
  };

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

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </PageContainer>
    );
  }

  if (viewMode === 'detail' && selectedInvoice) {
    const StatusIcon = statusConfig[selectedInvoice.status].icon;
    const daysOverdue = selectedInvoice.status === 'overdue' ? getDaysOverdue(selectedInvoice.dueDate) : 0;

    return (
      <PageContainer>
        <MotionDiv variant="slideUp" duration="normal">
          {/* Back Button */}
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => {
              setViewMode('list');
              setSelectedInvoice(null);
            }}
          >
            ← Retour à la liste
          </Button>

          {/* Invoice Detail Header */}
          <div className="relative mb-6 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
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
                      {selectedInvoice.number}
                    </h1>
                    <p className="text-white/80 text-sm">{selectedInvoice.projectName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig[selectedInvoice.status].color} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[selectedInvoice.status].label}
                  </Badge>
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
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations client
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Nom</div>
                  <div className="font-medium">{selectedInvoice.client.name}</div>
                </div>
                {selectedInvoice.client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedInvoice.client.email}</span>
                  </div>
                )}
                {selectedInvoice.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedInvoice.client.phone}</span>
                  </div>
                )}
                {selectedInvoice.client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{selectedInvoice.client.address}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Dates */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates importantes
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Date d'émission</div>
                  <div className="font-medium">{formatDate(selectedInvoice.issueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Date d'échéance</div>
                  <div className="font-medium">{formatDate(selectedInvoice.dueDate)}</div>
                </div>
                {selectedInvoice.lastReminderDate && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Dernier rappel</div>
                    <div className="font-medium">{formatDate(selectedInvoice.lastReminderDate)}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Summary */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Résumé des paiements
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Montant total</div>
                  <div className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatCurrency(selectedInvoice.total)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Montant payé</div>
                  <div className="font-medium text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Montant dû</div>
                  <div className="font-medium text-orange-600">{formatCurrency(selectedInvoice.amountDue)}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Line Items */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
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
                  {selectedInvoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
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
                    <td className="py-3 px-2 text-right font-medium">{formatCurrency(selectedInvoice.subtotal)}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="py-3 px-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      Taxes ({selectedInvoice.taxRate}%)
                    </td>
                    <td className="py-3 px-2 text-right">{formatCurrency(selectedInvoice.taxAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-3 px-2 text-right font-bold text-lg">Total</td>
                    <td className="py-3 px-2 text-right font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(selectedInvoice.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Payments */}
          {selectedInvoice.payments.length > 0 && (
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
              <h3 className="font-semibold mb-4">Historique des paiements</h3>
              <div className="space-y-3">
                {selectedInvoice.payments.map((payment) => {
                  const PaymentIcon = paymentMethodConfig[payment.method].icon;
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                          <PaymentIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{paymentMethodConfig[payment.method].label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(payment.date)}
                            {payment.reference && ` • ${payment.reference}`}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-green-600">{formatCurrency(payment.amount)}</div>
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
                <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                  <h3 className="font-semibold mb-2">Conditions de paiement</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.terms}</p>
                </Card>
              )}
              {selectedInvoice.notes && (
                <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
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
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
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
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total facturé</div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.total)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.total} facture{stats.count.total > 1 ? 's' : ''}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Payé</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.paid)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.paid} facture{stats.count.paid > 1 ? 's' : ''}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.pending)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.sent} facture{stats.count.sent > 1 ? 's' : ''}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En retard</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.overdue)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.count.overdue} facture{stats.count.overdue > 1 ? 's' : ''}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
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
            const StatusIcon = statusConfig[invoice.status].icon;
            return (
              <Card 
                key={invoice.id} 
                className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9] transition-all cursor-pointer"
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setViewMode('detail');
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{invoice.number}</span>
                        <Badge className={`${statusConfig[invoice.status].color} border text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {invoice.client.name} • {invoice.projectName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Émise: {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</span>
                        <span>•</span>
                        <span>Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(invoice.total)}
                    </div>
                    {invoice.amountDue > 0 && (
                      <div className="text-sm text-orange-600">
                        Dû: {formatCurrency(invoice.amountDue)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredInvoices.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune facture trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Créez votre première facture pour commencer'}
            </p>
          </Card>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
