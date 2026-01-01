'use client';

export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { TrendingUp, AlertTriangle, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge, Card } from '@/components/ui';

const cashflowData = [
  { month: 'Janvier 2026', inflow: 125000, outflow: 78500, balance: 46500, cumulative: 246500 },
  { month: 'Février 2026', inflow: 130000, outflow: 82000, balance: 48000, cumulative: 294500 },
  { month: 'Mars 2026', inflow: 135000, outflow: 85000, balance: 50000, cumulative: 344500 },
  { month: 'Avril 2026', inflow: 128000, outflow: 88000, balance: 40000, cumulative: 384500 },
  { month: 'Mai 2026', inflow: 140000, outflow: 90000, balance: 50000, cumulative: 434500 },
  { month: 'Juin 2026', inflow: 145000, outflow: 92000, balance: 53000, cumulative: 487500 }
];

const upcomingPayments = [
  { id: 1, description: 'Salaires Équipe', amount: -45000, date: '2026-01-31', category: 'RH', priority: 'high' },
  { id: 2, description: 'Loyer Bureau', amount: -8000, date: '2026-02-01', category: 'Opérations', priority: 'high' },
  { id: 3, description: 'Serveurs Cloud', amount: -2300, date: '2026-02-05', category: 'Infrastructure', priority: 'medium' },
  { id: 4, description: 'Licences Logiciels', amount: -1200, date: '2026-02-10', category: 'Outils', priority: 'low' }
];

const upcomingRevenue = [
  { id: 1, description: 'Facture ABC Corp', amount: 15000, date: '2026-02-05', client: 'ABC Corp', probability: 95 },
  { id: 2, description: 'Contrat XYZ Ltd', amount: 22000, date: '2026-02-15', client: 'XYZ Ltd', probability: 80 },
  { id: 3, description: 'Projet Tech Solutions', amount: 12000, date: '2026-02-20', client: 'Tech Solutions', probability: 90 }
];

export default function PrevisionFinanciereDemo() {
  const currentBalance = cashflowData[0]?.cumulative ?? 0;
  const projectedBalance = cashflowData[cashflowData.length - 1]?.cumulative ?? 0;
  const totalUpcomingPayments = upcomingPayments.reduce((sum, p) => sum + Math.abs(p.amount), 0);
  const totalUpcomingRevenue = upcomingRevenue.reduce((sum, r) => sum + r.amount, 0);
  const netCashflow = totalUpcomingRevenue - totalUpcomingPayments;

  const priorityConfig = {
    high: { label: 'Haute', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
    medium: { label: 'Moyenne', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    low: { label: 'Basse', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' }
  };

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
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Prévision Financière
                </h1>
                <p className="text-white/80 text-sm">Gérez votre cashflow et anticipez vos besoins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(currentBalance)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Solde Actuel</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border">
                +{((projectedBalance - currentBalance) / currentBalance * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(projectedBalance)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projection 6 mois</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <ArrowDownRight className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(totalUpcomingPayments)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Paiements à venir</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <ArrowUpRight className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(totalUpcomingRevenue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenus attendus</div>
          </Card>
        </div>

        {/* Net Cashflow Alert */}
        <Card className={`glass-card p-4 rounded-xl border mb-6 ${netCashflow >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div className="flex-1">
              <span className="font-semibold">Cashflow Net Projeté: </span>
              <span className={`font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(netCashflow)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {netCashflow >= 0 ? '(Positif - Situation saine)' : '(Négatif - Attention requise)'}
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Payments */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Paiements à Venir
            </h2>
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{payment.description}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(payment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                        <span>•</span>
                        <span>{payment.category}</span>
                      </div>
                    </div>
                    <Badge className={`${priorityConfig[payment.priority as keyof typeof priorityConfig].color} border text-xs`}>
                      {priorityConfig[payment.priority as keyof typeof priorityConfig].label}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Revenue */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Revenus Attendus
            </h2>
            <div className="space-y-3">
              {upcomingRevenue.map((revenue) => (
                <div key={revenue.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{revenue.description}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(revenue.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                        <span>•</span>
                        <span>{revenue.client}</span>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border text-xs">
                      {revenue.probability}%
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(revenue.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Cashflow Projection */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Projection Cashflow (6 mois)
          </h2>
          <div className="space-y-4">
            {cashflowData.map((data, index) => {
              const maxValue = Math.max(...cashflowData.map(d => Math.max(d.inflow, d.outflow)));
              const inflowPercent = (data.inflow / maxValue) * 100;
              const outflowPercent = (data.outflow / maxValue) * 100;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{data.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        Solde: <strong className={data.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.balance)}
                        </strong>
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Cumulatif: {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.cumulative)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Entrées</span>
                        <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.inflow)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                          style={{ width: `${inflowPercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Sorties</span>
                        <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(data.outflow)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                          style={{ width: `${outflowPercent}%` }}
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
