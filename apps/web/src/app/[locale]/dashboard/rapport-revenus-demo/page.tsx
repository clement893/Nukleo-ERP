'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingUp, DollarSign, Calendar, Filter, Download, 
  ArrowUp, ArrowDown, Target, CheckCircle, AlertCircle,
  Building, Users, Package, Briefcase
} from 'lucide-react';
import { Badge, Button, Card, Select } from '@/components/ui';

interface RevenueItem {
  id: string;
  month: string;
  monthNumber: number;
  planned: number;
  actual: number;
  difference: number;
  percentageAchieved: number;
  sources: {
    projects: number;
    services: number;
    products: number;
    consulting: number;
  };
}

const revenueData: RevenueItem[] = [
  {
    id: '1',
    month: 'Janvier 2026',
    monthNumber: 1,
    planned: 150000,
    actual: 165000,
    difference: 15000,
    percentageAchieved: 110,
    sources: {
      projects: 80000,
      services: 45000,
      products: 25000,
      consulting: 15000
    }
  },
  {
    id: '2',
    month: 'Février 2026',
    monthNumber: 2,
    planned: 140000,
    actual: 132000,
    difference: -8000,
    percentageAchieved: 94.3,
    sources: {
      projects: 70000,
      services: 35000,
      products: 20000,
      consulting: 7000
    }
  },
  {
    id: '3',
    month: 'Mars 2026',
    monthNumber: 3,
    planned: 160000,
    actual: 178000,
    difference: 18000,
    percentageAchieved: 111.3,
    sources: {
      projects: 95000,
      services: 48000,
      products: 22000,
      consulting: 13000
    }
  },
  {
    id: '4',
    month: 'Avril 2026',
    monthNumber: 4,
    planned: 155000,
    actual: 149000,
    difference: -6000,
    percentageAchieved: 96.1,
    sources: {
      projects: 75000,
      services: 42000,
      products: 20000,
      consulting: 12000
    }
  },
  {
    id: '5',
    month: 'Mai 2026',
    monthNumber: 5,
    planned: 170000,
    actual: 185000,
    difference: 15000,
    percentageAchieved: 108.8,
    sources: {
      projects: 100000,
      services: 50000,
      products: 22000,
      consulting: 13000
    }
  },
  {
    id: '6',
    month: 'Juin 2026',
    monthNumber: 6,
    planned: 165000,
    actual: 172000,
    difference: 7000,
    percentageAchieved: 104.2,
    sources: {
      projects: 90000,
      services: 48000,
      products: 21000,
      consulting: 13000
    }
  }
];

const sourceConfig = {
  projects: { label: 'Projets', color: 'bg-purple-500', icon: Briefcase },
  services: { label: 'Services', color: 'bg-blue-500', icon: Users },
  products: { label: 'Produits', color: 'bg-green-500', icon: Package },
  consulting: { label: 'Consulting', color: 'bg-orange-500', icon: Target }
};

export default function RapportRevenusDemo() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
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
    ? revenueData 
    : revenueData.filter(item => item.monthNumber === selectedMonth);

  const totalPlanned = filteredData.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = filteredData.reduce((sum, item) => sum + item.actual, 0);
  const totalDifference = totalActual - totalPlanned;
  const overallPercentage = (totalActual / totalPlanned) * 100;

  const monthsAboveTarget = filteredData.filter(item => item.percentageAchieved >= 100).length;
  const monthsBelowTarget = filteredData.filter(item => item.percentageAchieved < 100).length;

  const totalBySource = filteredData.reduce((acc, item) => {
    acc.projects += item.sources.projects;
    acc.services += item.sources.services;
    acc.products += item.sources.products;
    acc.consulting += item.sources.consulting;
    return acc;
  }, { projects: 0, services: 0, products: 0, consulting: 0 });

  const maxRevenue = Math.max(...filteredData.map(item => Math.max(item.planned, item.actual)));

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
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Rapport Revenus
                  </h1>
                  <p className="text-white/80 text-sm">Analyse des revenus prévus vs réalisés</p>
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
              {revenueData.map(item => (
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Prévu</div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalPlanned)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Réalisé</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalActual)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${totalDifference >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                {totalDifference >= 0 ? (
                  <ArrowUp className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Écart</div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalDifference >= 0 ? '+' : ''}{formatCurrency(totalDifference)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${overallPercentage >= 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                <CheckCircle className={`w-5 h-5 ${overallPercentage >= 100 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Atteinte</div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${overallPercentage >= 100 ? 'text-green-600' : 'text-orange-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {overallPercentage.toFixed(1)}%
            </div>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Performance mensuelle
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Objectifs atteints</span>
                </div>
                <span className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {monthsAboveTarget}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">Sous l'objectif</span>
                </div>
                <span className="text-2xl font-bold text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {monthsBelowTarget}
                </span>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Revenus par source
            </h3>
            <div className="space-y-3">
              {Object.entries(totalBySource).map(([key, value]) => {
                const config = sourceConfig[key as keyof typeof sourceConfig];
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
            Comparaison Prévu vs Réalisé
          </h3>
          <div className="space-y-6">
            {filteredData.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium">{item.month}</span>
                    <Badge className={`${item.percentageAchieved >= 100 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-orange-500/10 text-orange-600 border-orange-500/30'} border`}>
                      {item.percentageAchieved.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Écart</div>
                      <div className={`text-sm font-bold ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.difference >= 0 ? '+' : ''}{formatCurrency(item.difference)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Planned Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Prévu</span>
                    <span className="text-sm font-medium">{formatCurrency(item.planned)}</span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${(item.planned / maxRevenue) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Objectif</span>
                    </div>
                  </div>
                </div>

                {/* Actual Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Réalisé</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(item.actual)}</span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full ${item.actual >= item.planned ? 'bg-green-500' : 'bg-orange-500'} flex items-center justify-end px-3 transition-all duration-500`}
                      style={{ width: `${(item.actual / maxRevenue) * 100}%` }}
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
            Détail par mois et source
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Mois</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Projets</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Services</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Produits</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Consulting</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Objectif</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">Atteinte</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2 font-medium">{item.month}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(item.sources.projects)}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(item.sources.services)}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(item.sources.products)}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(item.sources.consulting)}</td>
                    <td className="py-3 px-2 text-right font-bold">{formatCurrency(item.actual)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.planned)}</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className={`${item.percentageAchieved >= 100 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-orange-500/10 text-orange-600 border-orange-500/30'} border`}>
                        {item.percentageAchieved.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-bold">
                  <td className="py-3 px-2">TOTAL</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalBySource.projects)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalBySource.services)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalBySource.products)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(totalBySource.consulting)}</td>
                  <td className="py-3 px-2 text-right text-green-600">{formatCurrency(totalActual)}</td>
                  <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(totalPlanned)}</td>
                  <td className="py-3 px-2 text-right">
                    <Badge className={`${overallPercentage >= 100 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-orange-500/10 text-orange-600 border-orange-500/30'} border`}>
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
