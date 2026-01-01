'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  FileText, Plus, Search, Download, Send, Eye, Edit, Trash2, 
  DollarSign, Calendar, User, Building, Clock, AlertCircle,
  CheckCircle, XCircle, Mail, Phone, MapPin, CreditCard, MoreVertical
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

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
  client: {
    name: string;
    email: string;
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

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2026-001',
    client: {
      name: 'ABC Corporation',
      email: 'contact@abc-corp.com',
      phone: '+1 514-555-0101',
      address: '123 Rue Saint-Jacques, Montréal, QC H2Y 1L6'
    },
    issueDate: '2026-01-05',
    dueDate: '2026-02-04',
    status: 'paid',
    lineItems: [
      { id: '1', description: 'Développement site web', quantity: 1, unitPrice: 12000, total: 12000 },
      { id: '2', description: 'Design UI/UX', quantity: 40, unitPrice: 150, total: 6000 }
    ],
    subtotal: 18000,
    taxRate: 14.975,
    taxAmount: 2695.50,
    total: 20695.50,
    amountPaid: 20695.50,
    amountDue: 0,
    payments: [
      { id: '1', date: '2026-01-20', amount: 20695.50, method: 'bank_transfer', reference: 'WIRE-2026-001' }
    ],
    terms: 'Paiement net 30 jours',
    notes: 'Merci pour votre confiance'
  },
  {
    id: '2',
    number: 'INV-2026-002',
    client: {
      name: 'XYZ Technologies',
      email: 'billing@xyz-tech.com',
      phone: '+1 514-555-0102',
      address: '456 Boulevard René-Lévesque, Montréal, QC H3B 1R6'
    },
    issueDate: '2026-01-10',
    dueDate: '2026-02-09',
    status: 'partial',
    lineItems: [
      { id: '1', description: 'Consultation stratégique', quantity: 20, unitPrice: 200, total: 4000 },
      { id: '2', description: 'Formation équipe', quantity: 2, unitPrice: 1500, total: 3000 }
    ],
    subtotal: 7000,
    taxRate: 14.975,
    taxAmount: 1048.25,
    total: 8048.25,
    amountPaid: 4000,
    amountDue: 4048.25,
    payments: [
      { id: '1', date: '2026-01-15', amount: 4000, method: 'credit_card', reference: 'CC-****-1234' }
    ],
    terms: 'Paiement net 30 jours',
    notes: 'Paiement partiel reçu'
  },
  {
    id: '3',
    number: 'INV-2026-003',
    client: {
      name: 'Global Solutions Inc',
      email: 'accounts@globalsolutions.com',
      phone: '+1 514-555-0103',
      address: '789 Rue University, Montréal, QC H3A 2A7'
    },
    issueDate: '2026-01-12',
    dueDate: '2026-02-11',
    status: 'sent',
    lineItems: [
      { id: '1', description: 'Maintenance mensuelle', quantity: 1, unitPrice: 2500, total: 2500 },
      { id: '2', description: 'Support technique', quantity: 10, unitPrice: 120, total: 1200 }
    ],
    subtotal: 3700,
    taxRate: 14.975,
    taxAmount: 554.08,
    total: 4254.08,
    amountPaid: 0,
    amountDue: 4254.08,
    payments: [],
    terms: 'Paiement net 30 jours',
    lastReminderDate: '2026-01-20'
  },
  {
    id: '4',
    number: 'INV-2025-045',
    client: {
      name: 'Startup Innovante',
      email: 'finance@startup-innovante.com',
      phone: '+1 514-555-0104'
    },
    issueDate: '2025-12-15',
    dueDate: '2026-01-14',
    status: 'overdue',
    lineItems: [
      { id: '1', description: 'Développement MVP', quantity: 1, unitPrice: 15000, total: 15000 }
    ],
    subtotal: 15000,
    taxRate: 14.975,
    taxAmount: 2246.25,
    total: 17246.25,
    amountPaid: 0,
    amountDue: 17246.25,
    payments: [],
    terms: 'Paiement net 30 jours',
    notes: 'En retard - relance envoyée',
    lastReminderDate: '2026-01-15'
  },
  {
    id: '5',
    number: 'INV-2026-004',
    client: {
      name: 'Tech Consulting Group',
      email: 'billing@techconsulting.com',
      phone: '+1 514-555-0105',
      address: '321 Avenue McGill College, Montréal, QC H3A 1G1'
    },
    issueDate: '2026-01-15',
    dueDate: '2026-02-14',
    status: 'sent',
    lineItems: [
      { id: '1', description: 'Audit sécurité', quantity: 1, unitPrice: 5000, total: 5000 },
      { id: '2', description: 'Rapport détaillé', quantity: 1, unitPrice: 1000, total: 1000 },
      { id: '3', description: 'Recommandations', quantity: 8, unitPrice: 150, total: 1200 }
    ],
    subtotal: 7200,
    taxRate: 14.975,
    taxAmount: 1078.20,
    total: 8278.20,
    amountPaid: 0,
    amountDue: 8278.20,
    payments: [],
    terms: 'Paiement net 30 jours'
  },
  {
    id: '6',
    number: 'DRAFT-2026-001',
    client: {
      name: 'Entreprise Locale',
      email: 'contact@entreprise-locale.com'
    },
    issueDate: '2026-01-18',
    dueDate: '2026-02-17',
    status: 'draft',
    lineItems: [
      { id: '1', description: 'Services à définir', quantity: 1, unitPrice: 0, total: 0 }
    ],
    subtotal: 0,
    taxRate: 14.975,
    taxAmount: 0,
    total: 0,
    amountPaid: 0,
    amountDue: 0,
    payments: [],
    terms: 'À définir'
  }
];

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

export default function FacturationsDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = !searchQuery ||
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockInvoices.reduce((sum, inv) => sum + inv.total, 0),
    paid: mockInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amountPaid, 0),
    pending: mockInvoices.filter(i => ['sent', 'partial'].includes(i.status)).reduce((sum, inv) => sum + inv.amountDue, 0),
    overdue: mockInvoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + inv.amountDue, 0),
    count: {
      total: mockInvoices.length,
      draft: mockInvoices.filter(i => i.status === 'draft').length,
      sent: mockInvoices.filter(i => i.status === 'sent').length,
      paid: mockInvoices.filter(i => i.status === 'paid').length,
      overdue: mockInvoices.filter(i => i.status === 'overdue').length
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

          {/* Invoice Header */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {selectedInvoice.number}
                </h1>
                <Badge className={`${statusConfig[selectedInvoice.status].color} border flex items-center gap-1 w-fit`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[selectedInvoice.status].label}
                </Badge>
                {selectedInvoice.status === 'overdue' && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    En retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Info */}
              <div>
                <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3">CLIENT</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedInvoice.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.client.email}</span>
                  </div>
                  {selectedInvoice.client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.client.phone}</span>
                    </div>
                  )}
                  {selectedInvoice.client.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Info */}
              <div>
                <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3">DÉTAILS</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date d'émission:</span>
                    <span className="text-sm font-medium">{formatDate(selectedInvoice.issueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date d'échéance:</span>
                    <span className="text-sm font-medium">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Conditions:</span>
                    <span className="text-sm font-medium">{selectedInvoice.terms}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Articles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Qté</th>
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
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="py-3 px-2 text-right font-medium">Sous-total:</td>
                    <td className="py-3 px-2 text-right font-medium">{formatCurrency(selectedInvoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      Taxes ({selectedInvoice.taxRate}%):
                    </td>
                    <td className="py-2 px-2 text-right">{formatCurrency(selectedInvoice.taxAmount)}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="py-3 px-2 text-right text-lg font-bold">TOTAL:</td>
                    <td className="py-3 px-2 text-right text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {formatCurrency(selectedInvoice.total)}
                    </td>
                  </tr>
                  {selectedInvoice.amountPaid > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-right text-sm text-gray-600 dark:text-gray-400">
                          Montant payé:
                        </td>
                        <td className="py-2 px-2 text-right text-green-600 font-medium">
                          -{formatCurrency(selectedInvoice.amountPaid)}
                        </td>
                      </tr>
                      <tr className="border-t border-gray-200 dark:border-gray-700">
                        <td colSpan={3} className="py-3 px-2 text-right font-bold">Solde dû:</td>
                        <td className="py-3 px-2 text-right font-bold text-orange-600">
                          {formatCurrency(selectedInvoice.amountDue)}
                        </td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Payments History */}
          {selectedInvoice.payments.length > 0 && (
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
              <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Historique des paiements
              </h3>
              <div className="space-y-3">
                {selectedInvoice.payments.map((payment) => {
                  const PaymentIcon = paymentMethodConfig[payment.method].icon;
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
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
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Notes */}
          {selectedInvoice.notes && (
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Notes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedInvoice.notes}</p>
            </Card>
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
                    Gestion des Factures
                  </h1>
                  <p className="text-white/80 text-sm">Créez, envoyez et suivez vos factures clients</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(stats.total)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total facturé</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(stats.paid)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Payé</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(stats.pending)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En attente</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(stats.overdue)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En retard</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="glass-card p-3 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.count.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total factures</div>
          </Card>
          <Card className="glass-card p-3 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-gray-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.count.draft}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Brouillons</div>
          </Card>
          <Card className="glass-card p-3 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.count.sent}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Envoyées</div>
          </Card>
          <Card className="glass-card p-3 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.count.paid}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Payées</div>
          </Card>
          <Card className="glass-card p-3 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.count.overdue}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">En retard</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par numéro ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={statusFilter === 'all' ? 'primary' : 'outline'} onClick={() => setStatusFilter('all')}>
                Toutes
              </Button>
              <Button size="sm" variant={statusFilter === 'draft' ? 'primary' : 'outline'} onClick={() => setStatusFilter('draft')}>
                Brouillons
              </Button>
              <Button size="sm" variant={statusFilter === 'sent' ? 'primary' : 'outline'} onClick={() => setStatusFilter('sent')}>
                Envoyées
              </Button>
              <Button size="sm" variant={statusFilter === 'paid' ? 'primary' : 'outline'} onClick={() => setStatusFilter('paid')}>
                Payées
              </Button>
              <Button size="sm" variant={statusFilter === 'partial' ? 'primary' : 'outline'} onClick={() => setStatusFilter('partial')}>
                Partielles
              </Button>
              <Button size="sm" variant={statusFilter === 'overdue' ? 'primary' : 'outline'} onClick={() => setStatusFilter('overdue')}>
                En retard
              </Button>
            </div>
          </div>
        </Card>

        {/* Invoices List */}
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const StatusIcon = statusConfig[invoice.status].icon;
            const daysOverdue = invoice.status === 'overdue' ? getDaysOverdue(invoice.dueDate) : 0;

            return (
              <Card 
                key={invoice.id} 
                className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setViewMode('detail');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {invoice.number}
                      </h3>
                      <Badge className={`${statusConfig[invoice.status].color} border flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[invoice.status].label}
                      </Badge>
                      {invoice.status === 'overdue' && (
                        <span className="text-xs text-red-600 font-medium">
                          +{daysOverdue}j
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{invoice.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>Échéance: {formatDate(invoice.dueDate)}</span>
                      </div>
                      {invoice.lineItems.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>{invoice.lineItems.length} article{invoice.lineItems.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatCurrency(invoice.total)}
                      </div>
                      {invoice.amountDue > 0 && invoice.amountDue < invoice.total && (
                        <div className="text-sm text-orange-600 font-medium">
                          Dû: {formatCurrency(invoice.amountDue)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download action
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Send action
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                          setViewMode('detail');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
