'use client';

export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

const monthlyData = [
  { month: 'Janvier', revenue: 125000, expenses: 78500, profit: 46500 },
  { month: 'Décembre', revenue: 118000, expenses: 75000, profit: 43000 },
  { month: 'Novembre', revenue: 112000, expenses: 72000, profit: 40000 },
  { month: 'Octobre', revenue: 108000, expenses: 70000, profit: 38000 }
];

export default function RapportDemo() {
  const currentMonth = monthlyData[0];
  const previousMonth = monthlyData[1];
  const revenueGrowth = currentMonth && previousMonth 
    ? ((((currentMonth?.revenue ?? 0) - (previousMonth?.revenue ?? 0)) / (previousMonth?.revenue ?? 1)) * 100).toFixed(1)
    : '0.0';

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
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Rapports Financiers
                  </h1>
                  <p className="text-white/80 text-sm">Analyses et tendances financières</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</h3>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border">
                +{revenueGrowth}%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(currentMonth?.revenue ?? 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ce mois</p>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses</h3>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(currentMonth?.expenses ?? 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ce mois</p>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Net</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(currentMonth?.profit ?? 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ce mois</p>
          </Card>
        </div>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Évolution Mensuelle
          </h2>
          <div className="space-y-4">
            {monthlyData.map((data, index) => {
              const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
              const revenuePercent = (data.revenue / maxRevenue) * 100;
              const expensesPercent = (data.expenses / maxRevenue) * 100;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{data.month}</span>
                    <span className="text-sm font-bold">
                      Profit: {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.profit)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Revenus</span>
                        <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.revenue)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                          style={{ width: `${revenuePercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Dépenses</span>
                        <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.expenses)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                          style={{ width: `${expensesPercent}%` }}
                        />
                      </div>
                    </div>
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
