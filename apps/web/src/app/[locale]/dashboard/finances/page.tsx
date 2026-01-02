'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  DollarSign, TrendingUp, TrendingDown, FileText, 
  ArrowUpRight, ArrowDownRight,
  CreditCard, Wallet, Building, Package, Users, Zap, Loader2
} from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import Link from 'next/link';
import { projectsAPI } from '@/lib/api/projects';
import { timeEntriesAPI } from '@/lib/api/time-entries';
import { employeesAPI } from '@/lib/api/employees';

interface FinancialStats {
  revenue: number;
  revenueChange: number;
  expenses: number;
  expensesChange: number;
  profit: number;
  profitChange: number;
  invoices: number;
  invoicesChange: number;
}

interface Transaction {
  id: string;
  type: 'in' | 'out';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface InvoiceStatus {
  status: string;
  label: string;
  count: number;
  amount: number;
  color: string;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  icon: any;
  color: string;
}

export default function FinancesPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    revenue: 0,
    revenueChange: 0,
    expenses: 0,
    expensesChange: 0,
    profit: 0,
    profitChange: 0,
    invoices: 0,
    invoicesChange: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [invoicesByStatus, setInvoicesByStatus] = useState<InvoiceStatus[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Charger les données des APIs
      const [projects, , employees] = await Promise.all([
        projectsAPI.list(0, 1000),
        timeEntriesAPI.list({ limit: 1000 }),
        employeesAPI.list(0, 1000)
      ]);

      // Calculer les revenus depuis les budgets des projets
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const projectsThisMonth = projects.filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      });

      const projectsLastMonth = projects.filter(p => {
        const createdDate = new Date(p.created_at);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return createdDate.getMonth() === lastMonth && 
               createdDate.getFullYear() === lastMonthYear;
      });

      const revenueThisMonth = projectsThisMonth.reduce((sum, p) => sum + (p.budget || 0), 0);
      const revenueLastMonth = projectsLastMonth.reduce((sum, p) => sum + (p.budget || 0), 0);
      const revenueChange = revenueLastMonth > 0 
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
        : 0;

      // Calculer les dépenses (salaires estimés)
      const avgSalaryPerEmployee = 5000; // Estimation
      const expensesThisMonth = employees.length * avgSalaryPerEmployee;
      const expensesLastMonth = expensesThisMonth * 0.95; // Simulation
      const expensesChange = ((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100;

      // Calculer le profit
      const profitThisMonth = revenueThisMonth - expensesThisMonth;
      const profitLastMonth = revenueLastMonth - expensesLastMonth;
      const profitChange = profitLastMonth !== 0
        ? ((profitThisMonth - profitLastMonth) / Math.abs(profitLastMonth)) * 100
        : 0;

      // Nombre de factures (projets actifs avec budget)
      const invoicesThisMonth = projectsThisMonth.filter(p => p.budget && p.budget > 0).length;
      const invoicesLastMonth = projectsLastMonth.filter(p => p.budget && p.budget > 0).length;

      setStats({
        revenue: revenueThisMonth,
        revenueChange: Number(revenueChange.toFixed(1)),
        expenses: expensesThisMonth,
        expensesChange: Number(expensesChange.toFixed(1)),
        profit: profitThisMonth,
        profitChange: Number(profitChange.toFixed(1)),
        invoices: invoicesThisMonth,
        invoicesChange: invoicesThisMonth - invoicesLastMonth
      });

      // Générer les transactions récentes depuis les projets
      const transactions: Transaction[] = projectsThisMonth
        .filter(p => p.budget && p.budget > 0)
        .slice(0, 4)
        .map((p) => ({
          id: `${p.id}`,
          type: 'in' as const,
          description: `Paiement projet: ${p.name}`,
          amount: p.budget || 0,
          date: p.created_at,
          category: 'Ventes'
        }));

      // Ajouter des dépenses simulées
      transactions.push({
        id: 'salary-1',
        type: 'out',
        description: `Salaires ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        amount: -expensesThisMonth,
        date: new Date().toISOString(),
        category: 'Salaires'
      });

      transactions.push({
        id: 'infra-1',
        type: 'out',
        description: 'Infrastructure cloud et serveurs',
        amount: -15000,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Infrastructure'
      });

      setRecentTransactions(transactions.slice(0, 6));

      // Statuts des factures (basé sur les projets)
      const activeProjects = projects.filter(p => p.status === 'ACTIVE' && p.budget);
      const completedProjects = projects.filter(p => p.status === 'COMPLETED' && p.budget);
      const archivedProjects = projects.filter(p => p.status === 'ARCHIVED' && p.budget);

      setInvoicesByStatus([
        { 
          status: 'paid', 
          label: 'Payées', 
          count: completedProjects.length, 
          amount: completedProjects.reduce((sum, p) => sum + (p.budget || 0), 0), 
          color: 'bg-green-500' 
        },
        { 
          status: 'pending', 
          label: 'En attente', 
          count: activeProjects.length, 
          amount: activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0), 
          color: 'bg-orange-500' 
        },
        { 
          status: 'overdue', 
          label: 'En retard', 
          count: archivedProjects.length, 
          amount: archivedProjects.reduce((sum, p) => sum + (p.budget || 0), 0), 
          color: 'bg-red-500' 
        }
      ]);

      // Catégories de dépenses
      const totalExpenses = expensesThisMonth + 15000 + 8000 + 5000 + 3000;
      setExpensesByCategory([
        { 
          category: 'Salaires', 
          amount: expensesThisMonth, 
          percentage: (expensesThisMonth / totalExpenses) * 100, 
          icon: Users, 
          color: 'bg-purple-500' 
        },
        { 
          category: 'Infrastructure', 
          amount: 15000, 
          percentage: (15000 / totalExpenses) * 100, 
          icon: Building, 
          color: 'bg-blue-500' 
        },
        { 
          category: 'Marketing', 
          amount: 8000, 
          percentage: (8000 / totalExpenses) * 100, 
          icon: TrendingUp, 
          color: 'bg-orange-500' 
        },
        { 
          category: 'Fournitures', 
          amount: 5000, 
          percentage: (5000 / totalExpenses) * 100, 
          icon: Package, 
          color: 'bg-green-500' 
        },
        { 
          category: 'Services', 
          amount: 3000, 
          percentage: (3000 / totalExpenses) * 100, 
          icon: Zap, 
          color: 'bg-cyan-500' 
        }
      ]);

    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
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
          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
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
              {stats.revenueChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600" />
              )}
              <span className={`font-medium ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
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
              {stats.expensesChange <= 0 ? (
                <ArrowDownRight className="w-3 h-3 text-green-600" />
              ) : (
                <ArrowUpRight className="w-3 h-3 text-red-600" />
              )}
              <span className={`font-medium ${stats.expensesChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.expensesChange >= 0 ? '+' : ''}{stats.expensesChange}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
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
              {stats.profitChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600" />
              )}
              <span className={`font-medium ${stats.profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.profitChange >= 0 ? '+' : ''}{stats.profitChange}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
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
              {stats.invoicesChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-600" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600" />
              )}
              <span className={`font-medium ${stats.invoicesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.invoicesChange >= 0 ? '+' : ''}{stats.invoicesChange}
              </span>
              <span className="text-gray-600 dark:text-gray-400">ce mois</span>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/fr/dashboard/finances/tresorerie">
            <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500/20 transition-all">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Trésorerie</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Suivi du cashflow</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/fr/dashboard/finances/facturations">
            <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 group-hover:bg-blue-500/20 transition-all">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Facturations</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gérer les factures</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/fr/dashboard/finances/rapport">
            <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 group-hover:bg-green-500/20 transition-all">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Rapports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyses financières</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/fr/dashboard/finances/compte-depenses">
            <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 group-hover:bg-orange-500/20 transition-all">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Dépenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Comptes de dépenses</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-all" />
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Transactions */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Transactions récentes
              </h3>
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
                      <Badge variant="default" className="text-xs px-1.5 py-0">
                        {transaction.category}
                      </Badge>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invoices by Status */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Factures par statut
            </h3>
            <div className="space-y-4">
              {invoicesByStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {item.count} facture{item.count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expenses by Category */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Dépenses par catégorie
          </h3>
          <div className="space-y-4">
            {expensesByCategory.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${item.color}/10 border border-${item.color}/30`}>
                        <Icon className={`w-4 h-4 text-${item.color.replace('bg-', '')}`} />
                      </div>
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {formatCurrency(item.amount)}
                      <span className="text-gray-600 dark:text-gray-400 ml-2 text-xs">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
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
