'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingDown, DollarSign, Calendar, Filter, Download, 
  ArrowUp, ArrowDown, Target, CheckCircle, AlertCircle,
  Users, Server, Home, Briefcase, ShoppingCart, Zap, Car, Coffee
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

interface ExpenseItem {
  id: string;
  month: string;
  monthNumber: number;
  budgeted: number;
  actual: number;
  difference: number;
  percentageUsed: number;
  categories: {
    salaries: number;
    infrastructure: number;
    office: number;
    marketing: number;
    supplies: number;
    utilities: number;
    transport: number;
    other: number;
  };
}

const expenseData: ExpenseItem[] = [
  {
    id: '1',
    month: 'Janvier 2026',
    monthNumber: 1,
    budgeted: 120000,
    actual: 115000,
    difference: -5000,
    percentageUsed: 95.8,
    categories: {
      salaries: 75000,
      infrastructure: 15000,
      office: 8000,
      marketing: 7000,
      supplies: 4000,
      utilities: 3000,
      transport: 2000,
      other: 1000
    }
  },
  {
    id: '2',
    month: 'Février 2026',
    monthNumber: 2,
    budgeted: 115000,
    actual: 122000,
    difference: 7000,
    percentageUsed: 106.1,
    categories: {
      salaries: 75000,
      infrastructure: 18000,
      office: 9000,
      marketing: 10000,
      supplies: 4500,
      utilities: 2500,
      transport: 2000,
      other: 1000
    }
  },
  {
    id: '3',
    month: 'Mars 2026',
    monthNumber: 3,
    budgeted: 125000,
    actual: 118000,
    difference: -7000,
    percentageUsed: 94.4,
    categories: {
      salaries: 75000,
      infrastructure: 16000,
      office: 8500,
      marketing: 8000,
      supplies: 4000,
      utilities: 3000,
      transport: 2500,
      other: 1000
    }
  },
  {
    id: '4',
    month: 'Avril 2026',
    monthNumber: 4,
    budgeted: 120000,
    actual: 128000,
    difference: 8000,
    percentageUsed: 106.7,
    categories: {
      salaries: 78000,
      infrastructure: 17000,
      office: 9000,
      marketing: 12000,
      supplies: 5000,
      utilities: 3500,
      transport: 2500,
      other: 1000
    }
  },
  {
    id: '5',
    month: 'Mai 2026',
    monthNumber: 5,
    budgeted: 130000,
    actual: 125000,
    difference: -5000,
    percentageUsed: 96.2,
    categories: {
      salaries: 78000,
      infrastructure: 16000,
      office: 9000,
      marketing: 11000,
      supplies: 4500,
      utilities: 3000,
      transport: 2500,
      other: 1000
    }
  },
  {
    id: '6',
    month: 'Juin 2026',
    monthNumber: 6,
    budgeted: 125000,
    actual: 132000,
    difference: 7000,
    percentageUsed: 105.6,
    categories: {
      salaries: 80000,
      infrastructure: 18000,
      office: 10000,
      marketing: 13000,
      supplies: 5000,
      utilities: 3000,
      transport: 2000,
      other: 1000
    }
  }
];

const categoryConfig = {
  salaries: { label: 'Salaires', color: 'bg-purple-500', icon: Users },
  infrastructure: { label: 'Infrastructure', color: 'bg-blue-500', icon: Server },
  office: { label: 'Bureau', color: 'bg-green-500', icon: Home },
  marketing: { label: 'Marketing', color: 'bg-orange-500', icon: Briefcase },
  supplies: { label: 'Fournitures', color: 'bg-pink-500', icon: ShoppingCart },
  utilities: { label: 'Services publics', color: 'bg-cyan-500', icon: Zap },
  transport: { label: 'Transport', color: 'bg-indigo-500', icon: Car },
  other: { label: 'Autres', color: 'bg-gray-500', icon: Coffee }
};

export default function RapportDepensesDemo() {
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredData = selectedMonth === 'all' 
    ? expenseData 
    : expenseData.filter(item => item.monthNumber === selectedMonth);

  const totalBudgeted = filteredData.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = filteredData.reduce((sum, item) => sum + item.actual, 0);
  const totalDifference = totalActual - totalBudgeted;
  const overallPercentage = (totalActual / totalBudgeted) * 100;

  const monthsUnderBudget = filteredData.filter(item => item.percentageUsed <= 100).length;
  const monthsOverBudget = filteredData.filter(item => item.percentageUsed > 100).length;

  const totalByCategory = filteredData.reduce((acc, item) => {
    Object.keys(item.categories).forEach(key => {
      acc[key as keyof typeof acc] += item.categories[key as keyof typeof item.categories];
    });
    return acc;
  }, { 
    salaries: 0, 
    infrastructure: 0, 
    office: 0, 
    marketing: 0, 
    supplies: 0, 
    utilities: 0, 
    transport: 0, 
    other: 0 
  });

  const maxExpense = Math.max(...filteredData.map(item => Math.max(item.budgeted, item.actual)));

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
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Rapport Dépenses
                  </h1>
                  <p className="text-white/80 text-sm">Analyse des dépenses budgétées vs réelles</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Période:</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={selectedMonth === 'all' ? 'primary' : 'outline'}
                onClick={() => setSelectedMonth('all')}
              >
                Tous les mois
              </Button>
              {expenseData.map(item => (
                <Button 
                  key={item.id}
                  size="sm" 
                  variant={selectedMonth === item.monthNumber ? 'primary' : 'outline'}
                  onClick={() => setSelectedMonth(item.monthNumber)}
                >
                  {item.month.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Budget</div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalBudgeted)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dépensé</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalActual)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${totalDifference <= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                {totalDifference <= 0 ? (
                  <ArrowDown className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowUp className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Écart</div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${totalDifference <= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalDifference > 0 ? '+' : ''}{formatCurrency(totalDifference)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${overallPercentage <= 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <CheckCircle className={`w-5 h-5 ${overallPercentage <= 100 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Utilisation</div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${overallPercentage <= 100 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {overallPercentage.toFixed(1)}%
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Performance budgétaire
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Sous le budget</span>
                </div>
                <span className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {monthsUnderBudget}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Dépassement</span>
                </div>
                <span className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {monthsOverBudget}
                </span>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Dépenses par catégorie
            </h3>
            <div className="space-y-3">
              {Object.entries(totalByCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([key, value]) => {
                  const config = categoryConfig[key as keyof typeof categoryConfig];
                  const Icon = config.icon;
                  const percentage = (value / totalActual) * 100;
                  
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatCurrency(value)}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${config.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {/* Monthly Comparison Chart */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h3 className="font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Comparaison Budget vs Dépenses Réelles
          </h3>
          <div className="space-y-6">
            {filteredData.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium">{item.month}</span>
                    <Badge className={`${item.percentageUsed <= 100 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                      {item.percentageUsed.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Écart</div>
                      <div className={`text-sm font-bold ${item.difference <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Budget Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Budget</span>
                    <span className="text-sm font-medium">{formatCurrency(item.budgeted)}</span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${(item.budgeted / maxExpense) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Limite</span>
                    </div>
                  </div>
                </div>

                {/* Actual Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Dépensé</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(item.actual)}</span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full ${item.actual <= item.budgeted ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-end px-3 transition-all duration-500`}
                      style={{ width: `${(item.actual / maxExpense) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Réel</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed Breakdown */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Détail par mois et catégorie
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Mois</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Salaires</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Infra</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Bureau</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Marketing</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Autres</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Budget</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const otherTotal = item.categories.supplies + item.categories.utilities + item.categories.transport + item.categories.other;
                  return (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-2 font-medium">{item.month}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.categories.salaries)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.categories.infrastructure)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.categories.office)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.categories.marketing)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(otherTotal)}</td>
                      <td className="py-3 px-2 text-right font-bold">{formatCurrency(item.actual)}</td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.budgeted)}</td>
                      <td className="py-3 px-2 text-right">
                        <Badge className={`${item.percentageUsed <= 100 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                          {item.percentageUsed.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-bold">
                  <td className="py-3 px-2">TOTAL</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalByCategory.salaries)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalByCategory.infrastructure)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalByCategory.office)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalByCategory.marketing)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalByCategory.supplies + totalByCategory.utilities + totalByCategory.transport + totalByCategory.other)}</td>
                  <td className="py-3 px-2 text-right text-red-600">{formatCurrency(totalActual)}</td>
                  <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(totalBudgeted)}</td>
                  <td className="py-3 px-2 text-right">
                    <Badge className={`${overallPercentage <= 100 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                      {overallPercentage.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
