'use client';

export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { FileText, Plus, Search, Download, Send } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

const mockInvoices = [
  { id: 1, number: 'INV-2026-001', client: 'ABC Corp', amount: 15000, status: 'paid', date: '2026-01-10', dueDate: '2026-01-25' },
  { id: 2, number: 'INV-2026-002', client: 'XYZ Ltd', amount: 8500, status: 'pending', date: '2026-01-12', dueDate: '2026-01-27' },
  { id: 3, number: 'INV-2026-003', client: 'Tech Solutions', amount: 12000, status: 'paid', date: '2026-01-13', dueDate: '2026-01-28' },
  { id: 4, number: 'INV-2026-004', client: 'Global Inc', amount: 6500, status: 'overdue', date: '2025-12-20', dueDate: '2026-01-04' },
  { id: 5, number: 'INV-2026-005', client: 'Startup Co', amount: 9200, status: 'pending', date: '2026-01-14', dueDate: '2026-01-29' }
];

const statusConfig = {
  paid: { label: 'Payée', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  pending: { label: 'En attente', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  overdue: { label: 'En retard', color: 'bg-red-500/10 text-red-600 border-red-500/30' }
};

export default function FacturationsDemo() {
  const stats = {
    total: mockInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: mockInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: mockInvoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: mockInvoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  };

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
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
                  <p className="text-white/80 text-sm">Gérez vos factures clients</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(stats.total)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </Card>
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(stats.paid)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Payées</div>
          </Card>
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(stats.pending)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">En attente</div>
          </Card>
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(stats.overdue)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">En retard</div>
          </Card>
        </div>

        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input type="text" placeholder="Rechercher une facture..." className="pl-10" />
          </div>
        </Card>

        <div className="space-y-3">
          {mockInvoices.map((invoice) => (
            <Card key={invoice.id} className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.number}</h3>
                    <Badge className={`${statusConfig[invoice.status as keyof typeof statusConfig].color} border`}>
                      {statusConfig[invoice.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Client: <strong>{invoice.client}</strong></span>
                    <span>Date: {new Date(invoice.date).toLocaleDateString('fr-FR')}</span>
                    <span>Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(invoice.amount)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline"><Send className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
