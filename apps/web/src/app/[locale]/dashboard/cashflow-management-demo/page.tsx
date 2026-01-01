'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, 
  ArrowUp, ArrowDown, AlertTriangle, CheckCircle, Info,
  Wallet, CreditCard, Building, Users, Package, Zap, RefreshCw
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

type Scenario = 'optimistic' | 'realistic' | 'pessimistic';

interface CashflowMonth {
  month: string;
  monthNumber: number;
  openingBalance: number;
  inflows: {
    sales: number;
    services: number;
    investments: number;
    other: number;
  };
  outflows: {
    salaries: number;
    rent: number;
    supplies: number;
    marketing: number;
    utilities: number;
    taxes: number;
    other: number;
  };
  netCashflow: number;
  closingBalance: number;
  scenarios: {
    optimistic: { inflows: number; outflows: number; closing: number };
    realistic: { inflows: number; outflows: number; closing: number };
    pessimistic: { inflows: number; outflows: number; closing: number };
  };
}

const generateCashflowData = (): CashflowMonth[] => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  let openingBalance = 250000;
  const data: CashflowMonth[] = [];

  months.forEach((month, index) => {
    const baseInflows = {
      sales: 120000 + Math.random() * 40000,
      services: 45000 + Math.random() * 15000,
      investments: index % 3 === 0 ? 50000 : 0,
      other: 5000 + Math.random() * 5000
    };

    const baseOutflows = {
      salaries: 80000 + Math.random() * 10000,
      rent: 15000,
      supplies: 8000 + Math.random() * 4000,
      marketing: 12000 + Math.random() * 8000,
      utilities: 3000 + Math.random() * 1000,
      taxes: index % 4 === 0 ? 25000 : 5000,
      other: 3000 + Math.random() * 2000
    };

    const totalInflows = Object.values(baseInflows).reduce((a, b) => a + b, 0);
    const totalOutflows = Object.values(baseOutflows).reduce((a, b) => a + b, 0);
    const netCashflow = totalInflows - totalOutflows;
    const closingBalance = openingBalance + netCashflow;

    // Scenarios
    const optimisticInflows = totalInflows * 1.15;
    const optimisticOutflows = totalOutflows * 0.95;
    const realisticInflows = totalInflows;
    const realisticOutflows = totalOutflows;
    const pessimisticInflows = totalInflows * 0.85;
    const pessimisticOutflows = totalOutflows * 1.05;

    data.push({
      month: `${month} 2026`,
      monthNumber: index + 1,
      openingBalance,
      inflows: baseInflows,
      outflows: baseOutflows,
      netCashflow,
      closingBalance,
      scenarios: {
        optimistic: {
          inflows: optimisticInflows,
          outflows: optimisticOutflows,
          closing: openingBalance + (optimisticInflows - optimisticOutflows)
        },
        realistic: {
          inflows: realisticInflows,
          outflows: realisticOutflows,
          closing: closingBalance
        },
        pessimistic: {
          inflows: pessimisticInflows,
          outflows: pessimisticOutflows,
          closing: openingBalance + (pessimisticInflows - pessimisticOutflows)
        }
      }
    });

    openingBalance = closingBalance;
  });

  return data;
};

export default function CashflowManagementDemo() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('realistic');
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '12m'>('6m');
  
  const cashflowData = generateCashflowData();
  
  const periodData = cashflowData.slice(0, selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const currentBalance = periodData[periodData.length - 1]?.scenarios[selectedScenario].closing || 0;
  const totalInflows = periodData.reduce((sum, month) => sum + month.scenarios[selectedScenario].inflows, 0);
  const totalOutflows = periodData.reduce((sum, month) => sum + month.scenarios[selectedScenario].outflows, 0);
  const netCashflow = totalInflows - totalOutflows;
  
  const minBalance = Math.min(...periodData.map(m => m.scenarios[selectedScenario].closing));
  const maxBalance = Math.max(...periodData.map(m => m.scenarios[selectedScenario].closing));
  
  const lowBalanceMonths = periodData.filter(m => m.scenarios[selectedScenario].closing < 100000).length;
  const negativeMonths = periodData.filter(m => (m.scenarios[selectedScenario].inflows - m.scenarios[selectedScenario].outflows) < 0).length;

  const avgMonthlyInflow = totalInflows / periodData.length;
  const avgMonthlyOutflow = totalOutflows / periodData.length;

  const maxCashflow = Math.max(...periodData.map(m => Math.max(m.scenarios[selectedScenario].inflows, m.scenarios[selectedScenario].outflows)));

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
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Gestion du Cashflow
                  </h1>
                  <p className="text-white/80 text-sm">Projection et analyse de trésorerie avancée</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Scénario:</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={selectedScenario === 'optimistic' ? 'primary' : 'outline'}
                  onClick={() => setSelectedScenario('optimistic')}
                  className={selectedScenario === 'optimistic' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Optimiste
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedScenario === 'realistic' ? 'primary' : 'outline'}
                  onClick={() => setSelectedScenario('realistic')}
                >
                  Réaliste
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedScenario === 'pessimistic' ? 'primary' : 'outline'}
                  onClick={() => setSelectedScenario('pessimistic')}
                  className={selectedScenario === 'pessimistic' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Pessimiste
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Période:</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={selectedPeriod === '3m' ? 'primary' : 'outline'}
                  onClick={() => setSelectedPeriod('3m')}
                >
                  3 mois
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedPeriod === '6m' ? 'primary' : 'outline'}
                  onClick={() => setSelectedPeriod('6m')}
                >
                  6 mois
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedPeriod === '12m' ? 'primary' : 'outline'}
                  onClick={() => setSelectedPeriod('12m')}
                >
                  12 mois
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Alerts */}
        {(lowBalanceMonths > 0 || negativeMonths > 0) && (
          <Card className="glass-card p-4 rounded-xl border border-orange-500/30 bg-orange-50 dark:bg-orange-900/10 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Alertes de trésorerie
                </h3>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  {lowBalanceMonths > 0 && (
                    <li>• {lowBalanceMonths} mois avec un solde inférieur à 100 000 $</li>
                  )}
                  {negativeMonths > 0 && (
                    <li>• {negativeMonths} mois avec un cashflow négatif</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${currentBalance >= 100000 ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                <Wallet className={`w-5 h-5 ${currentBalance >= 100000 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Solde actuel</div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${currentBalance >= 100000 ? 'text-green-600' : 'text-orange-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(currentBalance)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Min: {formatCurrency(minBalance)} | Max: {formatCurrency(maxBalance)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <ArrowDown className="w-5 h-5 text-green-600 transform rotate-180" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Entrées totales</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalInflows)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Moy: {formatCurrency(avgMonthlyInflow)}/mois
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <ArrowUp className="w-5 h-5 text-red-600 transform rotate-180" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sorties totales</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalOutflows)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Moy: {formatCurrency(avgMonthlyOutflow)}/mois
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${netCashflow >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                {netCashflow >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cashflow net</div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {netCashflow >= 0 ? '+' : ''}{formatCurrency(netCashflow)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {netCashflow >= 0 ? 'Excédent' : 'Déficit'}
            </div>
          </Card>
        </div>

        {/* Cashflow Chart */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h3 className="font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Projection du cashflow - Scénario {selectedScenario === 'optimistic' ? 'Optimiste' : selectedScenario === 'realistic' ? 'Réaliste' : 'Pessimiste'}
          </h3>
          <div className="space-y-6">
            {periodData.map((month) => {
              const monthInflows = month.scenarios[selectedScenario].inflows;
              const monthOutflows = month.scenarios[selectedScenario].outflows;
              const monthNet = monthInflows - monthOutflows;
              const monthClosing = month.scenarios[selectedScenario].closing;

              return (
                <div key={month.monthNumber}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium">{month.month}</span>
                      <Badge className={`${monthNet >= 0 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                        {monthNet >= 0 ? '+' : ''}{formatCurrency(monthNet)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Solde final</div>
                      <div className={`text-sm font-bold ${monthClosing >= 100000 ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatCurrency(monthClosing)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Inflows Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3 transform rotate-180" />
                        Entrées
                      </span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(monthInflows)}</span>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-green-500 flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${(monthInflows / maxCashflow) * 100}%` }}
                      >
                        <span className="text-xs font-medium text-white">+</span>
                      </div>
                    </div>
                  </div>

                  {/* Outflows Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 transform rotate-180" />
                        Sorties
                      </span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(monthOutflows)}</span>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-red-500 flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${(monthOutflows / maxCashflow) * 100}%` }}
                      >
                        <span className="text-xs font-medium text-white">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Inflows Breakdown */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <ArrowDown className="w-5 h-5 text-green-600 transform rotate-180" />
              Détail des entrées
            </h3>
            <div className="space-y-3">
              {[
                { key: 'sales', label: 'Ventes', icon: DollarSign, color: 'bg-green-500' },
                { key: 'services', label: 'Services', icon: Users, color: 'bg-blue-500' },
                { key: 'investments', label: 'Investissements', icon: Building, color: 'bg-purple-500' },
                { key: 'other', label: 'Autres', icon: Package, color: 'bg-gray-500' }
              ].map(({ key, label, icon: Icon, color }) => {
                const total = periodData.reduce((sum, m) => sum + m.inflows[key as keyof typeof m.inflows], 0);
                const percentage = (total / totalInflows) * 100;
                
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatCurrency(total)}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Outflows Breakdown */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <ArrowUp className="w-5 h-5 text-red-600 transform rotate-180" />
              Détail des sorties
            </h3>
            <div className="space-y-3">
              {[
                { key: 'salaries', label: 'Salaires', icon: Users, color: 'bg-purple-500' },
                { key: 'rent', label: 'Loyer', icon: Building, color: 'bg-blue-500' },
                { key: 'marketing', label: 'Marketing', icon: TrendingUp, color: 'bg-orange-500' },
                { key: 'supplies', label: 'Fournitures', icon: Package, color: 'bg-green-500' },
                { key: 'utilities', label: 'Services', icon: Zap, color: 'bg-cyan-500' },
                { key: 'taxes', label: 'Taxes', icon: CreditCard, color: 'bg-red-500' }
              ].map(({ key, label, icon: Icon, color }) => {
                const total = periodData.reduce((sum, m) => sum + m.outflows[key as keyof typeof m.outflows], 0);
                const percentage = (total / totalOutflows) * 100;
                
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatCurrency(total)}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Scenario Comparison */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Comparaison des scénarios
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Mois</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-green-600">Optimiste</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-blue-600">Réaliste</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-red-600">Pessimiste</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Écart</th>
                </tr>
              </thead>
              <tbody>
                {periodData.map((month) => {
                  const optimistic = month.scenarios.optimistic.closing;
                  const realistic = month.scenarios.realistic.closing;
                  const pessimistic = month.scenarios.pessimistic.closing;
                  const spread = optimistic - pessimistic;

                  return (
                    <tr key={month.monthNumber} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-2 font-medium">{month.month}</td>
                      <td className="py-3 px-2 text-right text-green-600 font-medium">{formatCurrency(optimistic)}</td>
                      <td className="py-3 px-2 text-right text-blue-600 font-medium">{formatCurrency(realistic)}</td>
                      <td className="py-3 px-2 text-right text-red-600 font-medium">{formatCurrency(pessimistic)}</td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(spread)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
