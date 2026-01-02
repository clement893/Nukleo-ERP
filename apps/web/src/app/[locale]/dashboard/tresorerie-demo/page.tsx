'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, Download, Plus, ArrowUpRight, ArrowDownRight,
  Building2, Loader2
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { tresorerieAPI, type CashflowWeek, type Transaction, type TreasuryStats } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';

interface SoldeHebdomadaire {
  semaine: string;
  entrees: number;
  sorties: number;
  solde: number;
  projete: boolean;
}

export default function TresoreriePage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [soldesHebdo, setSoldesHebdo] = useState<SoldeHebdomadaire[]>([]);
  const [soldeActuel, setSoldeActuel] = useState(0);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadTresorerie();
  }, []);

  const loadTresorerie = async () => {
    try {
      setLoading(true);
      
      // Calculer les dates pour les 12 dernières semaines
      const today = new Date();
      const twelveWeeksAgo = new Date(today);
      twelveWeeksAgo.setDate(today.getDate() - (12 * 7));
      const dateFrom = twelveWeeksAgo.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];

      // Charger les données réelles depuis l'API
      const [cashflowData, transactionsData, statsData] = await Promise.all([
        tresorerieAPI.getWeeklyCashflow({ date_from: dateFrom, date_to: dateTo }),
        tresorerieAPI.listTransactions({ limit: 1000 }),
        tresorerieAPI.getStats({ period_days: 30 })
      ]);

      // Convertir les données de cashflow en format SoldeHebdomadaire
      const soldesParSemaine: SoldeHebdomadaire[] = cashflowData.weeks.map((week: CashflowWeek) => ({
        semaine: week.week_start,
        entrees: week.entries,
        sorties: week.exits,
        solde: week.balance,
        projete: week.is_projected
      }));

      setSoldesHebdo(soldesParSemaine);
      setTransactions(transactionsData);
      setSoldeActuel(statsData.current_balance);
      setStats(statsData);

    } catch (error) {
      console.error('Erreur lors du chargement de la trésorerie:', error);
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
  
  const variation = stats?.variation_percent || (soldesHebdo[1] ? ((soldesHebdo[1].solde - soldeActuel) / soldeActuel) * 100 : 0);
  const alerteNiveau = soldeAvecMarge < 50000 ? 'rouge' : soldeAvecMarge < 100000 ? 'orange' : 'vert';

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

  const totalEntrees4sem = soldesHebdo.slice(0, 4).reduce((sum, s) => sum + s.entrees, 0);
  const totalSorties4sem = soldesHebdo.slice(0, 4).reduce((sum, s) => sum + s.sorties, 0);

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
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>

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
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Projection 30j</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(projection30j)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {projection30j > soldeActuel ? 'En hausse' : 'En baisse'}
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
            Évolution sur 12 semaines
          </h3>
          <div className="space-y-3">
            {soldesHebdo.map((solde, index) => {
              const pourcentage = ((solde.solde - soldeActuel) / soldeActuel) * 100;
              const isPositif = solde.solde >= soldeAvecMarge;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-600 dark:text-gray-400">
                    Sem. {index + 1}
                    <div className="text-[10px]">{formatDate(solde.semaine)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 ${
                          isPositif ? 'bg-green-500' : 'bg-red-500'
                        } ${solde.projete ? 'opacity-50' : 'opacity-100'} transition-all`}
                        style={{ width: `${Math.min(Math.abs(pourcentage), 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-xs font-medium">
                          {formatCurrency(solde.solde)}
                        </span>
                        {solde.projete && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-gray-500/10 text-gray-600 border-gray-500/30">
                            Projeté
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-xs text-right">
                    <div className={isPositif ? 'text-green-600' : 'text-red-600'}>
                      {pourcentage >= 0 ? '+' : ''}{pourcentage.toFixed(1)}%
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
                {formatCurrency(totalEntrees4sem)}
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
                      {formatCurrency(t.amount)}
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
                {formatCurrency(totalSorties4sem)}
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
                      {formatCurrency(t.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
                {soldesHebdo.map((solde, index) => (
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
    </PageContainer>
  );
}
