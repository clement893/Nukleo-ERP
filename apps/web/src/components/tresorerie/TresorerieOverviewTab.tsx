'use client';

import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Building2, ArrowUp, ArrowDown, Filter
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import type { Transaction, TreasuryStats, TransactionCategory } from '@/lib/api/tresorerie';

interface SoldeHebdomadaire {
  semaine: string;
  entrees: number;
  sorties: number;
  solde: number;
  projete: boolean;
}

interface TresorerieOverviewTabProps {
  soldeActuel: number;
  stats: TreasuryStats | null;
  soldesHebdo: SoldeHebdomadaire[];
  transactions: Transaction[];
  categories: TransactionCategory[];
  selectedPeriod: '4w' | '8w' | '12w';
  onPeriodChange: (period: '4w' | '8w' | '12w') => void;
  onRefresh?: () => void;
  onExport?: () => void;
}

export default function TresorerieOverviewTab({
  soldeActuel,
  stats,
  soldesHebdo,
  transactions,
  categories,
  selectedPeriod,
  onPeriodChange,
}: TresorerieOverviewTabProps) {
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

  const soldeAvecMarge = soldeActuel * 0.8;
  const variation = stats?.variation_percent ? Number(stats.variation_percent) : (soldesHebdo[1] ? ((soldesHebdo[1].solde - soldeActuel) / soldeActuel) * 100 : 0);
  const alerteNiveau = soldeAvecMarge < 50000 ? 'rouge' : soldeAvecMarge < 100000 ? 'orange' : 'vert';

  const periodData = soldesHebdo.slice(0, selectedPeriod === '4w' ? 4 : selectedPeriod === '8w' ? 8 : 12);

  const today = new Date();
  const prochainesEntrees = transactions
    .filter(t => t.type === 'entry' && new Date(t.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const prochainesSorties = transactions
    .filter(t => t.type === 'exit' && new Date(t.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const totalEntrees = periodData.reduce((sum, s) => sum + s.entrees, 0);
  const totalSorties = periodData.reduce((sum, s) => sum + s.sorties, 0);
  const netCashflow = totalEntrees - totalSorties;

  const lowBalanceWeeks = periodData.filter(s => s.solde < 100000).length;
  const negativeWeeks = periodData.filter(s => (s.entrees - s.sorties) < 0).length;

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
    1
  );

  return (
    <MotionDiv variant="slideUp" duration="normal">
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
                onClick={() => onPeriodChange('4w')}
              >
                4 semaines
              </Button>
              <Button 
                size="sm" 
                variant={selectedPeriod === '8w' ? 'primary' : 'outline'}
                onClick={() => onPeriodChange('8w')}
              >
                8 semaines
              </Button>
              <Button 
                size="sm" 
                variant={selectedPeriod === '12w' ? 'primary' : 'outline'}
                onClick={() => onPeriodChange('12w')}
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
              alerteNiveau === 'vert' ? 'bg-green-500/10 border-green-500/30' :
              alerteNiveau === 'orange' ? 'bg-orange-500/10 border-orange-500/30' :
              'bg-red-500/10 border-red-500/30'
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
            {prochainesEntrees.length > 0 ? (
              prochainesEntrees.map((t) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                Aucune entrée prévue
              </div>
            )}
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
            {prochainesSorties.length > 0 ? (
              prochainesSorties.map((t) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                Aucune sortie prévue
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Détail par Catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Entrées par Catégorie */}
        {entriesByCategory.length > 0 && entriesByCategory.some(e => e.total > 0) && (
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
        {exitsByCategory.length > 0 && exitsByCategory.some(e => e.total > 0) && (
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
  );
}
