'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, Download, Plus, ArrowUpRight, ArrowDownRight,
  Building2, Loader2, Upload, X, CheckCircle2, AlertCircle,
  Filter, RefreshCw, ArrowUp, ArrowDown, Users, Package, Zap, CreditCard
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { tresorerieAPI, type CashflowWeek, type Transaction, type TreasuryStats, type TransactionCategory } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

interface SoldeHebdomadaire {
  semaine: string;
  entrees: number;
  sorties: number;
  solde: number;
  projete: boolean;
}

type PeriodFilter = '4w' | '8w' | '12w';

export default function TresoreriePage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [soldesHebdo, setSoldesHebdo] = useState<SoldeHebdomadaire[]>([]);
  const [soldeActuel, setSoldeActuel] = useState(0);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('12w');
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadTresorerie();
  }, [selectedPeriod]);

  const loadTresorerie = async () => {
    try {
      setLoading(true);
      
      // Calculer les dates selon la période sélectionnée
      const today = new Date();
      const weeksCount = selectedPeriod === '4w' ? 4 : selectedPeriod === '8w' ? 8 : 12;
      const weeksAgo = new Date(today);
      weeksAgo.setDate(today.getDate() - (weeksCount * 7));
      const dateFrom = weeksAgo.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];

      // Charger les données réelles depuis l'API
      const [cashflowData, transactionsData, statsData, categoriesData] = await Promise.all([
        tresorerieAPI.getWeeklyCashflow({ date_from: dateFrom, date_to: dateTo }),
        tresorerieAPI.listTransactions({ limit: 1000, date_from: dateFrom, date_to: dateTo }),
        tresorerieAPI.getStats({ period_days: weeksCount * 7 }),
        tresorerieAPI.listCategories()
      ]);

      // Convertir les données de cashflow en format SoldeHebdomadaire
      const soldesParSemaine: SoldeHebdomadaire[] = cashflowData.weeks.map((week: CashflowWeek) => ({
        semaine: week.week_start,
        entrees: Number(week.entries),
        sorties: Number(week.exits),
        solde: Number(week.balance),
        projete: week.is_projected
      }));

      setSoldesHebdo(soldesParSemaine);
      setTransactions(transactionsData);
      setSoldeActuel(Number(statsData.current_balance));
      setStats(statsData);
      setCategories(categoriesData);

    } catch (error) {
      logger.error('Erreur lors du chargement de la trésorerie', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les données de trésorerie',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </PageContainer>
    );
  }

  const soldeAvecMarge = soldeActuel * 0.8; // 20% de marge
  const projection30j = stats?.projected_balance_30d || soldesHebdo[4]?.solde || soldeActuel;
  
  const variation = stats?.variation_percent ? Number(stats.variation_percent) : (soldesHebdo[1] ? ((soldesHebdo[1].solde - soldeActuel) / soldeActuel) * 100 : 0);
  const alerteNiveau = soldeAvecMarge < 50000 ? 'rouge' : soldeAvecMarge < 100000 ? 'orange' : 'vert';

  // Filtrer les données selon la période sélectionnée
  const periodData = soldesHebdo.slice(0, selectedPeriod === '4w' ? 4 : selectedPeriod === '8w' ? 8 : 12);

  // Prochaines entrées (transactions futures)
  const today = new Date();
  const prochainesEntrees = transactions
    .filter(t => t.type === 'entry' && new Date(t.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  // Prochaines sorties (transactions futures)
  const prochainesSorties = transactions
    .filter(t => t.type === 'exit' && new Date(t.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const totalEntrees = periodData.reduce((sum, s) => sum + s.entrees, 0);
  const totalSorties = periodData.reduce((sum, s) => sum + s.sorties, 0);
  const netCashflow = totalEntrees - totalSorties;

  // Calculer les alertes
  const lowBalanceWeeks = periodData.filter(s => s.solde < 100000).length;
  const negativeWeeks = periodData.filter(s => (s.entrees - s.sorties) < 0).length;

  // Calculer les totaux par catégorie
  const entryCategories = categories.filter(c => c.type === 'entry');
  const exitCategories = categories.filter(c => c.type === 'exit');
  
  const entriesByCategory = entryCategories.map(cat => ({
    category: cat,
    total: transactions
      .filter(t => t.type === 'entry' && t.category_id === cat.id)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }));

  const exitsByCategory = exitCategories.map(cat => ({
    category: cat,
    total: transactions
      .filter(t => t.type === 'exit' && t.category_id === cat.id)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }));

  const maxCashflow = Math.max(
    ...(periodData.length > 0 ? periodData.map(s => Math.max(s.entrees, s.sorties)) : [0]),
    ...(entriesByCategory.length > 0 ? entriesByCategory.map(e => e.total) : [0]),
    ...(exitsByCategory.length > 0 ? exitsByCategory.map(e => e.total) : [0]),
    1 // Minimum de 1 pour éviter division par zéro
  );

  const handleExport = async () => {
    try {
      // Créer un CSV des transactions
      const csvHeaders = ['Date', 'Type', 'Description', 'Montant', 'Catégorie', 'Statut'];
      const csvRows = transactions.map(t => [
        t.date,
        t.type === 'entry' ? 'Entrée' : 'Sortie',
        t.description,
        t.amount.toString(),
        categories.find(c => c.id === t.category_id)?.name || '',
        t.status
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tresorerie_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast({
        title: 'Export réussi',
        message: 'Les données ont été exportées avec succès',
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Erreur',
        message: 'Impossible d\'exporter les données',
        type: 'error'
      });
    }
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Trésorerie
                  </h1>
                  <p className="text-white/80 text-sm">Suivez votre flux de trésorerie en temps réel</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={loadTresorerie}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={async () => {
                    try {
                      const blob = await tresorerieAPI.downloadImportTemplate('zip');
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'template_import_tresorerie.zip';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      showToast({
                        title: 'Téléchargement',
                        message: 'Modèle d\'import téléchargé',
                        type: 'success'
                      });
                    } catch (error) {
                      showToast({
                        title: 'Erreur',
                        message: 'Impossible de télécharger le modèle',
                        type: 'error'
                      });
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Modèle Import
                </Button>
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => setShowImportModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Transaction
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
              <span className="text-sm font-medium">Période:</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={selectedPeriod === '4w' ? 'primary' : 'outline'}
                  onClick={() => setSelectedPeriod('4w')}
                >
                  4 semaines
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedPeriod === '8w' ? 'primary' : 'outline'}
                  onClick={() => setSelectedPeriod('8w')}
                >
                  8 semaines
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedPeriod === '12w' ? 'primary' : 'outline'}
                  onClick={() => setSelectedPeriod('12w')}
                >
                  12 semaines
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Alerts */}
        {(lowBalanceWeeks > 0 || negativeWeeks > 0) && (
          <Card className="glass-card p-4 rounded-xl border border-orange-500/30 bg-orange-50 dark:bg-orange-900/10 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Alertes de trésorerie
                </h3>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  {lowBalanceWeeks > 0 && (
                    <li>• {lowBalanceWeeks} semaine(s) avec un solde inférieur à 100 000 $</li>
                  )}
                  {negativeWeeks > 0 && (
                    <li>• {negativeWeeks} semaine(s) avec un cashflow négatif</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                alerteNiveau === 'vert' ? 'bg-green-500/10 border border-green-500/30' :
                alerteNiveau === 'orange' ? 'bg-orange-500/10 border border-orange-500/30' :
                'bg-red-500/10 border border-red-500/30'
              }`}>
                <Wallet className={`w-5 h-5 ${
                  alerteNiveau === 'vert' ? 'text-green-600' :
                  alerteNiveau === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Solde Actuel</div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(soldeActuel)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {variation >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={variation >= 0 ? 'text-green-600' : 'text-red-600'}>
                {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">vs semaine prochaine</span>
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avec Marge (20%)</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(soldeAvecMarge)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Seuil de sécurité
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
              {netCashflow >= 0 ? 'Excédent' : 'Déficit'} sur la période
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                alerteNiveau === 'vert' ? 'bg-green-500/10 border border-green-500/30' :
                alerteNiveau === 'orange' ? 'bg-orange-500/10 border border-orange-500/30' :
                'bg-red-500/10 border border-red-500/30'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  alerteNiveau === 'vert' ? 'text-green-600' :
                  alerteNiveau === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Alerte</div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {alerteNiveau === 'vert' ? 'Sain' : alerteNiveau === 'orange' ? 'Attention' : 'Critique'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {alerteNiveau === 'vert' ? 'Trésorerie saine' : 
               alerteNiveau === 'orange' ? 'Surveiller de près' : 
               'Action requise'}
            </div>
          </Card>
        </div>

        {/* Graphique Évolution */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Évolution du cashflow - {selectedPeriod === '4w' ? '4 semaines' : selectedPeriod === '8w' ? '8 semaines' : '12 semaines'}
          </h3>
          <div className="space-y-6 mb-6">
            {periodData.map((solde, index) => {
              const weekNet = solde.entrees - solde.sorties;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium">Semaine {index + 1}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(solde.semaine)}</span>
                      <Badge className={`${weekNet >= 0 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                        {weekNet >= 0 ? '+' : ''}{formatCurrency(weekNet)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Solde final</div>
                      <div className={`text-sm font-bold ${solde.solde >= 100000 ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatCurrency(solde.solde)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Entrées Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3 transform rotate-180" />
                        Entrées
                      </span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(solde.entrees)}</span>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-green-500 flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${maxCashflow > 0 ? (solde.entrees / maxCashflow) * 100 : 0}%` }}
                      >
                        <span className="text-xs font-medium text-white">+</span>
                      </div>
                    </div>
                  </div>

                  {/* Sorties Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 transform rotate-180" />
                        Sorties
                      </span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(solde.sorties)}</span>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-red-500 flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${maxCashflow > 0 ? (solde.sorties / maxCashflow) * 100 : 0}%` }}
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

        {/* Entrées et Sorties Prévues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Entrées Prévues */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <ArrowUpRight className="w-5 h-5 text-green-600" />
                Entrées Prévues
              </h3>
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(totalEntrees)}
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {prochainesEntrees.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">{t.description}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(t.date)}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        t.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        t.status === 'pending' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                        'bg-gray-500/10 text-gray-600 border-gray-500/30'
                      }`}>
                        {t.status === 'confirmed' ? 'Confirmé' : 
                         t.status === 'pending' ? 'En attente' : 'Projeté'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(Number(t.amount))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sorties Prévues */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <ArrowDownRight className="w-5 h-5 text-red-600" />
                Sorties Prévues
              </h3>
              <div className="text-sm font-bold text-red-600">
                {formatCurrency(totalSorties)}
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {prochainesSorties.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-sm">{t.description}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(t.date)}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        t.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        t.status === 'pending' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                        'bg-gray-500/10 text-gray-600 border-gray-500/30'
                      }`}>
                        {t.status === 'confirmed' ? 'Confirmé' : 
                         t.status === 'pending' ? 'En attente' : 'Projeté'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(Number(t.amount))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Détail par Catégorie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Entrées par Catégorie */}
          {entriesByCategory.length > 0 && (
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <ArrowDown className="w-5 h-5 text-green-600 transform rotate-180" />
                Détail des entrées par catégorie
              </h3>
              <div className="space-y-3">
                {entriesByCategory
                  .filter(e => e.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map(({ category, total }) => {
                    const percentage = totalEntrees > 0 ? (total / totalEntrees) * 100 : 0;
                    return (
                      <div key={category.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{formatCurrency(total)}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Sorties par Catégorie */}
          {exitsByCategory.length > 0 && (
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <ArrowUp className="w-5 h-5 text-red-600 transform rotate-180" />
                Détail des sorties par catégorie
              </h3>
              <div className="space-y-3">
                {exitsByCategory
                  .filter(e => e.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map(({ category, total }) => {
                    const percentage = totalSorties > 0 ? (total / totalSorties) * 100 : 0;
                    return (
                      <div key={category.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{formatCurrency(total)}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}
        </div>

        {/* Tableau Détaillé par Semaine */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Détail par Semaine
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Semaine</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-green-600">Entrées</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-red-600">Sorties</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Solde</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {periodData.map((solde, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">Semaine {index + 1}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{formatDate(solde.semaine)}</div>
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-green-600">
                      {formatCurrency(solde.entrees)}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-medium text-red-600">
                      {formatCurrency(solde.sorties)}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-bold">
                      {formatCurrency(solde.solde)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {solde.projete ? (
                        <Badge className="text-xs bg-gray-500/10 text-gray-600 border-gray-500/30">
                          Projeté
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                          Réel
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </MotionDiv>

      {/* Modal d'Import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Importer des Transactions
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Importez vos transactions depuis un fichier CSV, Excel ou ZIP. 
                    Téléchargez d'abord le modèle pour voir le format attendu.
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.zip"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setImporting(true);
                          setImportResult(null);

                          // Dry run first
                          const dryRunResult = await tresorerieAPI.importTransactions(file, { dry_run: true });
                          setImportResult(dryRunResult);

                          if (dryRunResult.invalid_rows > 0) {
                            showToast({
                              title: 'Attention',
                              message: `${dryRunResult.invalid_rows} ligne(s) avec erreurs détectées`,
                              type: 'warning'
                            });
                          }
                        } catch (error: unknown) {
                          const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'import';
                          showToast({
                            title: 'Erreur',
                            message: errorMessage,
                            type: 'error'
                          });
                        } finally {
                          setImporting(false);
                        }
                      }}
                      className="hidden"
                      id="import-file-input"
                    />
                    <div
                      className="cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cliquez pour sélectionner un fichier
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        CSV, Excel (.xlsx, .xls) ou ZIP (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>

                {importResult && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Total lignes</div>
                          <div className="font-bold text-lg">{importResult.total_rows}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Valides</div>
                          <div className="font-bold text-lg text-green-600">{importResult.valid_rows}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Erreurs</div>
                          <div className="font-bold text-lg text-red-600">{importResult.invalid_rows}</div>
                        </div>
                      </div>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <h3 className="font-semibold text-red-900 dark:text-red-200">Erreurs</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          {importResult.errors.slice(0, 5).map((err: any, idx: number) => (
                            <div key={idx} className="text-red-700 dark:text-red-300">
                              <strong>Ligne {err.row}:</strong> {err.error}
                            </div>
                          ))}
                          {importResult.errors.length > 5 && (
                            <div className="text-red-600 dark:text-red-400 text-xs">
                              ... et {importResult.errors.length - 5} autre(s) erreur(s)
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {importResult.warnings && importResult.warnings.length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Avertissements</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          {importResult.warnings.slice(0, 5).map((warn: any, idx: number) => (
                            <div key={idx} className="text-yellow-700 dark:text-yellow-300">
                              <strong>Ligne {warn.row}:</strong> {warn.warning}
                            </div>
                          ))}
                          {importResult.warnings.length > 5 && (
                            <div className="text-yellow-600 dark:text-yellow-400 text-xs">
                              ... et {importResult.warnings.length - 5} autre(s) avertissement(s)
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!importResult.dry_run && importResult.created_count > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-900 dark:text-green-200">
                            {importResult.created_count} transaction(s) importée(s) avec succès
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {importResult.dry_run && (
                        <Button
                          className="flex-1"
                          onClick={async () => {
                            const file = fileInputRef.current?.files?.[0];
                            if (!file) return;

                            try {
                              setImporting(true);
                              const result = await tresorerieAPI.importTransactions(file, { dry_run: false });
                              setImportResult(result);
                              
                              if (result.created_count > 0) {
                                showToast({
                                  title: 'Succès',
                                  message: `${result.created_count} transaction(s) importée(s)`,
                                  type: 'success'
                                });
                                // Recharger les données
                                await loadTresorerie();
                                setTimeout(() => {
                                  setShowImportModal(false);
                                  setImportResult(null);
                                }, 2000);
                              }
                            } catch (error: unknown) {
                              const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'import';
                              showToast({
                                title: 'Erreur',
                                message: errorMessage,
                                type: 'error'
                              });
                            } finally {
                              setImporting(false);
                            }
                          }}
                          disabled={importing || importResult.invalid_rows > 0}
                        >
                          {importing ? 'Importation...' : 'Confirmer l\'Import'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowImportModal(false);
                          setImportResult(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        {importResult.dry_run ? 'Annuler' : 'Fermer'}
                      </Button>
                    </div>
                  </div>
                )}

                {importing && !importResult && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#523DC9]" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Validation du fichier...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
