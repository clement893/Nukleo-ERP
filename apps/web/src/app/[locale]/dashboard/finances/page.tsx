'use client';

export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  DollarSign, TrendingUp, TrendingDown, FileText, 
  ArrowUpRight, ArrowDownRight, Calendar, AlertCircle,
  CreditCard, Wallet, Building, Package, Users, Zap
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Link from 'next/link';

export default function FinancesPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Mock data - à remplacer par vraies données API
  const stats = {
    revenue: 985000,
    revenueChange: 12.5,
    expenses: 740000,
    expensesChange: -8.3,
    profit: 245000,
    profitChange: 45.2,
    invoices: 42,
    invoicesChange: 5
  };

  const recentTransactions = [
    { id: '1', type: 'in', description: 'Paiement facture #INV-2026-001', amount: 45000, date: '2026-01-01', category: 'Ventes' },
    { id: '2', type: 'out', description: 'Salaires janvier 2026', amount: -78000, date: '2026-01-01', category: 'Salaires' },
    { id: '3', type: 'in', description: 'Paiement facture #INV-2025-198', amount: 32000, date: '2025-12-31', category: 'Services' },
    { id: '4', type: 'out', description: 'Loyer janvier 2026', amount: -15000, date: '2025-12-30', category: 'Bureau' },
    { id: '5', type: 'in', description: 'Paiement facture #INV-2025-195', amount: 28000, date: '2025-12-29', category: 'Ventes' },
    { id: '6', type: 'out', description: 'Campagne marketing Q1', amount: -12000, date: '2025-12-28', category: 'Marketing' }
  ];

  const invoicesByStatus = [
    { status: 'paid', label: 'Payées', count: 28, amount: 420000, color: 'bg-green-500' },
    { status: 'pending', label: 'En attente', count: 8, amount: 120000, color: 'bg-orange-500' },
    { status: 'overdue', label: 'En retard', count: 6, amount: 90000, color: 'bg-red-500' }
  ];

  const expensesByCategory = [
    { category: 'Salaires', amount: 468000, percentage: 63.2, icon: Users, color: 'bg-purple-500' },
    { category: 'Infrastructure', amount: 102000, percentage: 13.8, icon: Building, color: 'bg-blue-500' },
    { category: 'Marketing', amount: 74000, percentage: 10.0, icon: TrendingUp, color: 'bg-orange-500' },
    { category: 'Fournitures', amount: 52000, percentage: 7.0, icon: Package, color: 'bg-green-500' },
    { category: 'Services', amount: 44000, percentage: 6.0, icon: Zap, color: 'bg-cyan-500' }
  ];

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

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Revenus</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.revenue)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.revenueChange}%</span>
              <span className="text-gray-600 dark:text-gray-400">vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.expenses)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowDownRight className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">{stats.expensesChange}%</span>
              <span className="text-gray-600 dark:text-gray-400">vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Profit</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.profit)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.profitChange}%</span>
              <span className="text-gray-600 dark:text-gray-400">vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Factures</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.invoices}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">+{stats.invoicesChange}</span>
              <span className="text-gray-600 dark:text-gray-400">ce mois</span>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/dashboard/finances/facturations">
            <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9] transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 group-hover:bg-blue-500/20 transition-all">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Facturations</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les factures</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/finances/rapport">
            <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9] transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 group-hover:bg-green-500/20 transition-all">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Rapports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyses financières</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/finances/compte-depenses">
            <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9] transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 group-hover:bg-orange-500/20 transition-all">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Dépenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Comptes de dépenses</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-all" />
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Transactions */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Transactions récentes
              </h3>
              <Button size="sm" variant="outline">Voir tout</Button>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                  <div className={`p-2 rounded-lg ${transaction.type === 'in' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    {transaction.type === 'in' ? (
                      <ArrowDownRight className="w-4 h-4 text-green-600 transform rotate-180" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-600 transform rotate-180" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{transaction.description}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {transaction.date}
                      <Badge className="text-xs">{transaction.category}</Badge>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'in' ? '+' : ''}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invoices by Status */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Factures par statut
              </h3>
              <Button size="sm" variant="outline">Gérer</Button>
            </div>
            <div className="space-y-4">
              {invoicesByStatus.map((status) => (
                <div key={status.status}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="text-xs">{status.count}</Badge>
                      <span className="text-sm font-bold">{formatCurrency(status.amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${status.color} transition-all duration-500`}
                      style={{ width: `${(status.amount / 630000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expenses by Category */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Dépenses par catégorie
            </h3>
            <Button size="sm" variant="outline">Détails</Button>
          </div>
          <div className="space-y-4">
            {expensesByCategory.map((expense) => {
              const Icon = expense.icon;
              return (
                <div key={expense.category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium">{expense.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{expense.percentage.toFixed(1)}%</span>
                      <span className="text-sm font-bold">{formatCurrency(expense.amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${expense.color} transition-all duration-500`}
                      style={{ width: `${expense.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
