'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Calendar, AlertTriangle, DollarSign, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { tresorerieAPI, type InvoiceToBill, type RevenueForecast, type Transaction } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import ForecastChart from './ForecastChart';
import CalendarView from './CalendarView';
import TransactionTimeline from './TransactionTimeline';

export default function TresorerieForecastTab() {
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');
  const [forecastPeriod, setForecastPeriod] = useState<'3m' | '6m' | '12m'>('6m');
  const [invoicesToBill, setInvoicesToBill] = useState<InvoiceToBill[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast[]>([]);
  const [upcomingTransactions, setUpcomingTransactions] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    loadForecastData();
  }, [forecastPeriod]);

  const loadForecastData = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const weeksCount = forecastPeriod === '3m' ? 12 : forecastPeriod === '6m' ? 24 : 52;
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + (weeksCount * 7));

      const [invoicesData, forecastData, transactionsData, statsData] = await Promise.all([
        tresorerieAPI.getInvoicesToBill({ days_ahead: weeksCount * 7 }),
        tresorerieAPI.getRevenueForecast({ weeks: weeksCount }),
        tresorerieAPI.listTransactions({ 
          date_from: today.toISOString().split('T')[0],
          date_to: futureDate.toISOString().split('T')[0],
          limit: 1000
        }),
        tresorerieAPI.getStats({ period_days: 30 })
      ]);

      setInvoicesToBill(invoicesData);
      setRevenueForecast(forecastData);
      
      // Filtrer les transactions futures
      const futureTransactions = transactionsData.filter(t => new Date(t.date) >= today);
      setUpcomingTransactions(futureTransactions);
      
      setCurrentBalance(Number(statsData.current_balance));

    } catch (error) {
      logger.error('Erreur lors du chargement des prévisions', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les données de prévisions',
        type: 'error'
      });
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

  // Préparer les données pour ForecastChart
  const prepareForecastData = () => {
    // Grouper par mois pour les projections
    const monthlyData: Record<string, { optimistic: number; realistic: number; pessimistic: number }> = {};

    revenueForecast.forEach((forecast) => {
      const monthKey = forecast.week_start.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { optimistic: 0, realistic: 0, pessimistic: 0 };
      }
      
      // Calculer les scénarios basés sur les probabilités
      monthlyData[monthKey].realistic += forecast.confirmed_amount + (forecast.probable_amount * 0.7);
      monthlyData[monthKey].optimistic += forecast.confirmed_amount + forecast.probable_amount + (forecast.projected_amount * 0.5);
      monthlyData[monthKey].pessimistic += forecast.confirmed_amount + (forecast.probable_amount * 0.3);
    });

    // Ajouter les sorties prévues (simplifié - basé sur les transactions)
    const exitsByMonth: Record<string, number> = {};
    upcomingTransactions
      .filter(t => t.type === 'exit')
      .forEach(t => {
        const monthKey = t.date.substring(0, 7);
        exitsByMonth[monthKey] = (exitsByMonth[monthKey] || 0) + Number(t.amount);
      });

    // Calculer les soldes projetés avec cumul
    let optimisticBalance = currentBalance;
    let realisticBalance = currentBalance;
    let pessimisticBalance = currentBalance;
    
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, forecastPeriod === '3m' ? 3 : forecastPeriod === '6m' ? 6 : 12)
      .map(([monthKey, inflows]) => {
        const exits = exitsByMonth[monthKey] || 0;
        
        optimisticBalance += inflows.optimistic - (exits * 0.95);
        realisticBalance += inflows.realistic - exits;
        pessimisticBalance += inflows.pessimistic - (exits * 1.05);
        
        return {
          date: `${monthKey}-01`,
          optimistic: optimisticBalance,
          realistic: realisticBalance,
          pessimistic: pessimisticBalance
        };
      });
  };

  // Préparer les revenus à venir
  const prepareUpcomingRevenues = () => {
    const revenues: Array<{
      id: number;
      date: string;
      type: 'entry';
      amount: number;
      description: string;
      category?: string;
      status: 'confirmed' | 'pending' | 'projected';
      probability?: number;
    }> = [];

    // Ajouter les factures à facturer
    invoicesToBill.forEach((invoice) => {
      revenues.push({
        id: invoice.id,
        date: invoice.due_date || new Date().toISOString(),
        type: 'entry',
        amount: invoice.amount_due,
        description: `Facture ${invoice.invoice_number || `#${invoice.id}`}`,
        status: invoice.is_overdue ? 'confirmed' : invoice.probability >= 80 ? 'confirmed' : invoice.probability >= 50 ? 'pending' : 'projected',
        probability: invoice.probability
      });
    });

    // Ajouter les transactions d'entrée futures
    upcomingTransactions
      .filter(t => t.type === 'entry' && t.status !== 'cancelled')
      .forEach(t => {
        revenues.push({
          id: t.id,
          date: t.date,
          type: 'entry',
          amount: Number(t.amount),
          description: t.description,
          status: t.status === 'cancelled' ? 'pending' : t.status as 'pending' | 'confirmed' | 'projected',
        });
      });

    return revenues.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Préparer les dépenses à venir
  const prepareUpcomingExpenses = () => {
    return upcomingTransactions
      .filter(t => t.type === 'exit')
      .map(t => ({
        id: t.id,
        date: t.date,
        type: 'exit' as const,
        amount: Number(t.amount),
        description: t.description,
        status: t.status,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Calculer les métriques
  const totalUpcomingRevenues = prepareUpcomingRevenues().reduce((sum, r) => sum + r.amount, 0);
  const totalUpcomingExpenses = prepareUpcomingExpenses().reduce((sum, e) => sum + e.amount, 0);
  const netForecast = totalUpcomingRevenues - totalUpcomingExpenses;
  const daysOfCash = currentBalance > 0 && totalUpcomingExpenses > 0 
    ? Math.floor((currentBalance / (totalUpcomingExpenses / 30))) 
    : 0;

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </MotionDiv>
    );
  }

  const forecastData = prepareForecastData();
  const upcomingRevenues = prepareUpcomingRevenues();
  const upcomingExpenses = prepareUpcomingExpenses();

  // Préparer les données pour CalendarView
  const calendarTransactions = [
    ...upcomingRevenues.map(r => ({
      date: r.date,
      type: 'entry' as const,
      amount: r.amount,
      description: r.description,
      id: r.id
    })),
    ...upcomingExpenses.map(e => ({
      date: e.date,
      type: 'exit' as const,
      amount: e.amount,
      description: e.description,
      id: e.id
    }))
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Filtres et Scénarios */}
      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium">Période:</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={forecastPeriod === '3m' ? 'primary' : 'outline'}
                onClick={() => setForecastPeriod('3m')}
              >
                3 mois
              </Button>
              <Button 
                size="sm" 
                variant={forecastPeriod === '6m' ? 'primary' : 'outline'}
                onClick={() => setForecastPeriod('6m')}
              >
                6 mois
              </Button>
              <Button 
                size="sm" 
                variant={forecastPeriod === '12m' ? 'primary' : 'outline'}
                onClick={() => setForecastPeriod('12m')}
              >
                12 mois
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
      </Card>

      {/* Métriques de Prévision */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenus Prévus</div>
          </div>
          <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatCurrency(totalUpcomingRevenues)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {invoicesToBill.length} facture{invoicesToBill.length > 1 ? 's' : ''} à facturer
          </div>
        </Card>

        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses Prévues</div>
          </div>
          <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatCurrency(totalUpcomingExpenses)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {upcomingExpenses.length} transaction{upcomingExpenses.length > 1 ? 's' : ''}
          </div>
        </Card>

        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${netForecast >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <DollarSign className={`w-5 h-5 ${netForecast >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cashflow Net</div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${netForecast >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {netForecast >= 0 ? '+' : ''}{formatCurrency(netForecast)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {netForecast >= 0 ? 'Excédent' : 'Déficit'} prévu
          </div>
        </Card>

        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${daysOfCash >= 90 ? 'bg-green-500/10 border-green-500/30' : daysOfCash >= 30 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <AlertTriangle className={`w-5 h-5 ${daysOfCash >= 90 ? 'text-green-600' : daysOfCash >= 30 ? 'text-orange-600' : 'text-red-600'}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jours de Trésorerie</div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${daysOfCash >= 90 ? 'text-green-600' : daysOfCash >= 30 ? 'text-orange-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {daysOfCash}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {daysOfCash >= 90 ? 'Sain' : daysOfCash >= 30 ? 'Attention' : 'Critique'}
          </div>
        </Card>
      </div>

      {/* Graphique de Projection */}
      {forecastData.length > 0 && (
        <div className="mb-6">
          <ForecastChart data={forecastData} currentBalance={currentBalance} />
        </div>
      )}

      {/* Calendrier et Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Calendrier */}
        {calendarTransactions.length > 0 && (
          <CalendarView transactions={calendarTransactions} />
        )}

        {/* Analyse de Solvabilité */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Analyse de Solvabilité
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Solde actuel</span>
                <span className="font-bold">{formatCurrency(currentBalance)}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${currentBalance >= 100000 ? 'bg-green-500' : currentBalance >= 50000 ? 'bg-orange-500' : 'bg-red-500'} transition-all`}
                  style={{ width: `${Math.min((currentBalance / 200000) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dépenses mensuelles moyennes</span>
                <span className="font-bold">{formatCurrency(totalUpcomingExpenses / (forecastPeriod === '3m' ? 3 : forecastPeriod === '6m' ? 6 : 12))}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Jours de trésorerie restants</span>
                <span className={`font-bold ${daysOfCash >= 90 ? 'text-green-600' : daysOfCash >= 30 ? 'text-orange-600' : 'text-red-600'}`}>
                  {daysOfCash} jours
                </span>
              </div>
            </div>

            {daysOfCash < 90 && (
              <div className="mt-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      Recommandations
                    </div>
                    <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                      {daysOfCash < 30 && (
                        <li>• Accélérer le recouvrement des factures en attente</li>
                      )}
                      <li>• Réduire les dépenses non essentielles</li>
                      <li>• Négocier des délais de paiement avec les fournisseurs</li>
                      {totalUpcomingRevenues > totalUpcomingExpenses && (
                        <li>• Les revenus prévus dépassent les dépenses - situation favorable</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Timeline des Revenus et Dépenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionTimeline
          transactions={upcomingRevenues}
          title="Revenus à Venir"
          type="entry"
        />
        <TransactionTimeline
          transactions={upcomingExpenses}
          title="Dépenses à Venir"
          type="exit"
        />
      </div>
    </MotionDiv>
  );
}
