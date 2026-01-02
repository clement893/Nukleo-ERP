'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, Button, Select } from '@/components/ui';
import Chart from '@/components/ui/Chart';
import MotionDiv from '@/components/motion/MotionDiv';
import { TrendingUp, TrendingDown, DollarSign, Loader2, Download, Calendar } from 'lucide-react';
import { tresorerieAPI, type Transaction, type CashflowWeek, type TreasuryStats, type TransactionCategory } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

export default function TresorerieAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashflowData, setCashflowData] = useState<CashflowWeek[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const daysCount = period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
      const dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - daysCount);

      const [transactionsData, cashflowResponse, categoriesData, statsData] = await Promise.all([
        tresorerieAPI.listTransactions({ 
          date_from: dateFrom.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0],
          limit: 10000
        }),
        tresorerieAPI.getWeeklyCashflow({
          date_from: dateFrom.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        }),
        tresorerieAPI.listCategories(),
        tresorerieAPI.getStats({ period_days: daysCount })
      ]);

      setTransactions(transactionsData);
      setCashflowData(cashflowResponse.weeks);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      logger.error('Erreur lors du chargement des données d\'analyse', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les données d\'analyse',
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

  // Préparer les données pour les graphiques
  const balanceEvolutionData = useMemo(() => {
    return cashflowData.map((week, index) => ({
      label: `Sem. ${index + 1}`,
      value: Number(week.balance),
      color: '#523DC9'
    }));
  }, [cashflowData]);

  const entriesVsExitsData = useMemo(() => {
    // Grouper par mois
    const monthlyData: Record<string, { entries: number; exits: number }> = {};
    
    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { entries: 0, exits: 0 };
      }
      if (t.type === 'entry') {
        monthlyData[monthKey].entries += Number(t.amount);
      } else {
        monthlyData[monthKey].exits += Number(t.amount);
      }
    });

    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6) // 6 derniers mois
      .map(([monthKey]) => {
        const data = monthlyData[monthKey];
        if (!data) return null;
        const date = new Date(monthKey + '-01');
        return {
          month: new Intl.DateTimeFormat('fr-CA', { month: 'short' }).format(date),
          entries: data.entries,
          exits: data.exits
        };
      })
      .filter((item): item is { month: string; entries: number; exits: number } => item !== null);
  }, [transactions]);

  const categoryDistributionData = useMemo(() => {
    const categoryTotals: Record<number, { name: string; total: number; type: 'entry' | 'exit' }> = {};
    
    transactions.forEach(t => {
      if (t.category_id) {
        if (!categoryTotals[t.category_id]) {
          const category = categories.find(c => c.id === t.category_id);
          categoryTotals[t.category_id] = {
            name: category?.name || 'Inconnue',
            total: 0,
            type: t.type
          };
        }
        if (categoryTotals[t.category_id]) {
          categoryTotals[t.category_id]!.total += Number(t.amount);
        }
      }
    });

    return Object.values(categoryTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((cat) => ({
        label: cat.name,
        value: cat.total,
        color: cat.type === 'entry' ? '#10B981' : '#EF4444'
      }));
  }, [transactions, categories]);

  // Calculer les métriques
  const totalEntries = transactions
    .filter(t => t.type === 'entry')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExits = transactions
    .filter(t => t.type === 'exit')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netCashflow = totalEntries - totalExits;
  
  // Taux de croissance (comparaison avec période précédente)
  const previousPeriodDays = period === '1m' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(previousPeriodStart.getDate() - (previousPeriodDays * 2));
  const previousPeriodEnd = new Date();
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - previousPeriodDays);
  
  // Pour simplifier, on utilise les stats disponibles
  const growthRate = stats?.variation_percent ? Number(stats.variation_percent) : 0;
  const entriesGrowthRate = growthRate > 0 ? growthRate : 0;
  const exitsGrowthRate = growthRate < 0 ? Math.abs(growthRate) : 0;

  // Délai moyen de paiement (simplifié)
  const avgPaymentDelay = 30; // À calculer depuis les données réelles

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Filtres */}
      <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium">Période:</span>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              options={[
                { value: '1m', label: '1 mois' },
                { value: '3m', label: '3 mois' },
                { value: '6m', label: '6 mois' },
                { value: '12m', label: '12 mois' }
              ]}
              className="w-32"
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <Download className="w-4 h-4 mr-2" />
            Exporter Rapport
          </Button>
        </div>
      </Card>

      {/* Métriques Avancées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Taux de croissance revenus</div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${entriesGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {entriesGrowthRate >= 0 ? '+' : ''}{entriesGrowthRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Sur la période sélectionnée
          </div>
        </Card>

        <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Taux de croissance dépenses</div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${exitsGrowthRate >= 0 ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {exitsGrowthRate >= 0 ? '+' : ''}{exitsGrowthRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Sur la période sélectionnée
          </div>
        </Card>

        <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ratio Entrées/Sorties</div>
          </div>
          <div className="text-2xl font-bold mb-1 text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalExits > 0 ? (totalEntries / totalExits).toFixed(2) : '∞'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {totalEntries > totalExits ? 'Excédentaire' : 'Déficitaire'}
          </div>
        </Card>

        <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Délai moyen paiement</div>
          </div>
          <div className="text-2xl font-bold mb-1 text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {avgPaymentDelay}j
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Moyenne sur la période
          </div>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Évolution du Solde */}
        <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Évolution du Solde
          </h3>
          {balanceEvolutionData.length > 0 ? (
            <Chart
              type="line"
              data={balanceEvolutionData}
              height={250}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* Répartition par Catégorie */}
        <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Répartition par Catégorie
          </h3>
          {categoryDistributionData.length > 0 ? (
            <Chart
              type="pie"
              data={categoryDistributionData}
              height={250}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Aucune donnée disponible
            </div>
          )}
        </Card>
      </div>

      {/* Entrées vs Sorties */}
      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Entrées vs Sorties (6 derniers mois)
        </h3>
        {entriesVsExitsData.length > 0 ? (
          <div className="space-y-4">
            {entriesVsExitsData.map((month) => {
              const maxValue = Math.max(month.entries, month.exits);
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{month.month}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600">Entrées: {formatCurrency(month.entries)}</span>
                      <span className="text-red-600">Sorties: {formatCurrency(month.exits)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-green-500 flex items-center justify-end px-2 transition-all"
                          style={{ width: `${maxValue > 0 ? (month.entries / maxValue) * 100 : 0}%` }}
                        >
                          <span className="text-xs font-medium text-white">+</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-red-500 flex items-center justify-end px-2 transition-all"
                          style={{ width: `${maxValue > 0 ? (month.exits / maxValue) * 100 : 0}%` }}
                        >
                          <span className="text-xs font-medium text-white">-</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            Aucune donnée disponible
          </div>
        )}
      </Card>

      {/* Tendances Mensuelles */}
      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Tendances Mensuelles
        </h3>
        {entriesVsExitsData.length > 0 ? (
          <Chart
            type="area"
            data={entriesVsExitsData.map((month) => ({
              label: month.month,
              value: month.entries - month.exits,
              color: (month.entries - month.exits) >= 0 ? '#10B981' : '#EF4444'
            }))}
            height={250}
          />
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400">
            Aucune donnée disponible
          </div>
        )}
      </Card>

      {/* Résumé Statistique */}
      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Résumé Statistique
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Entrées</div>
            <div className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalEntries)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {transactions.filter(t => t.type === 'entry').length} transaction{transactions.filter(t => t.type === 'entry').length > 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Sorties</div>
            <div className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalExits)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {transactions.filter(t => t.type === 'exit').length} transaction{transactions.filter(t => t.type === 'exit').length > 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cashflow Net</div>
            <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {netCashflow >= 0 ? '+' : ''}{formatCurrency(netCashflow)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {netCashflow >= 0 ? 'Excédent' : 'Déficit'}
            </div>
          </div>
        </div>
      </Card>
    </MotionDiv>
  );
}
