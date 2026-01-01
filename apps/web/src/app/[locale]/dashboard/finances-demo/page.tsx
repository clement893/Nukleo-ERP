'use client';

export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge, Card } from '@/components/ui';

const mockData = {
  revenue: 125000,
  expenses: 78500,
  profit: 46500,
  invoices: 24,
  recentTransactions: [
    { id: 1, type: 'income', description: 'Paiement Client ABC', amount: 15000, date: '2026-01-14', category: 'Ventes' },
    { id: 2, type: 'expense', description: 'Salaires Équipe', amount: -25000, date: '2026-01-13', category: 'Ressources Humaines' },
    { id: 3, type: 'income', description: 'Contrat Maintenance XYZ', amount: 8500, date: '2026-01-12', category: 'Services' },
    { id: 4, type: 'expense', description: 'Serveurs Cloud', amount: -2300, date: '2026-01-11', category: 'Infrastructure' },
    { id: 5, type: 'expense', description: 'Licences Logiciels', amount: -1200, date: '2026-01-10', category: 'Outils' }
  ],
  invoicesByStatus: [
    { status: 'Payées', count: 18, amount: 95000, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
    { status: 'En attente', count: 4, amount: 22000, color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    { status: 'En retard', count: 2, amount: 8000, color: 'bg-red-500/10 text-red-600 border-red-500/30' }
  ],
  expensesByCategory: [
    { category: 'Ressources Humaines', amount: 45000, percentage: 57 },
    { category: 'Infrastructure', amount: 18000, percentage: 23 },
    { category: 'Marketing', amount: 10500, percentage: 13 },
    { category: 'Outils', amount: 5000, percentage: 7 }
  ]
};

export default function FinancesDemo() {
  const profitMargin = ((mockData.profit / mockData.revenue) * 100).toFixed(1);

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="medium">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Finances
                </h1>
                <p className="text-white/80 text-sm">Vue d'ensemble de votre santé financière</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border">
                +12.5%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(mockData.revenue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenus</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <Badge className="bg-red-500/10 text-red-600 border-red-500/30 border">
                +8.2%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(mockData.expenses)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border">
                {profitMargin}%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(mockData.profit)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Profit Net</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockData.invoices}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Factures ce mois</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Transactions */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Transactions Récentes
            </h2>
            <div className="space-y-3">
              {mockData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{transaction.description}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invoices by Status */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Factures par Statut
            </h2>
            <div className="space-y-4">
              {mockData.invoicesByStatus.map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${item.color} border`}>
                        {item.status}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count} facture{item.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="font-bold">
                      {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(item.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expenses by Category */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Dépenses par Catégorie
          </h2>
          <div className="space-y-4">
            {mockData.expensesByCategory.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-sm font-bold">
                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(item.amount)}
                    <span className="text-gray-600 dark:text-gray-400 ml-2">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5F2B75] via-[#523DC9] to-[#6B1817] rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Facturations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les factures</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Rapports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyses financières</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dépenses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comptes de dépenses</p>
              </div>
            </div>
          </Card>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
