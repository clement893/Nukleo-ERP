'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Bell, AlertTriangle, AlertCircle, CheckCircle2, 
  Calendar, 
  RefreshCw, Loader2, X, Eye
} from 'lucide-react';
import { tresorerieAPI, type Transaction, type BankAccount, type CashflowWeek, type TreasuryStats } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  date: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function TresorerieAlertsTab() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashflowData, setCashflowData] = useState<CashflowWeek[]>([]);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 90);

      const [transactionsData, accountsData, cashflowResponse, statsData] = await Promise.all([
        tresorerieAPI.listTransactions({ 
          date_from: dateFrom.toISOString().split('T')[0],
          limit: 10000
        }),
        tresorerieAPI.listBankAccounts({ is_active: true }),
        tresorerieAPI.getWeeklyCashflow({
          date_from: dateFrom.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        }),
        tresorerieAPI.getStats({ period_days: 90 })
      ]);

      setTransactions(transactionsData);
      setBankAccounts(accountsData);
      setCashflowData(cashflowResponse.weeks);
      setStats(statsData);
    } catch (error) {
      logger.error('Erreur lors du chargement des alertes', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les alertes',
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

  // Générer les alertes basées sur les données
  const alerts = useMemo(() => {
    const generatedAlerts: Alert[] = [];

    // 1. Alertes de solde faible
    bankAccounts.forEach(account => {
      const accountTransactions = transactions.filter(t => t.bank_account_id === account.id);
      const totalEntries = accountTransactions
        .filter(t => t.type === 'entry')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExits = accountTransactions
        .filter(t => t.type === 'exit')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const currentBalance = account.initial_balance + totalEntries - totalExits;

      if (currentBalance < 10000) {
        generatedAlerts.push({
          id: `low-balance-${account.id}`,
          type: 'critical',
          title: 'Solde faible',
          message: `Le compte "${account.name}" a un solde de ${formatCurrency(currentBalance)}.`,
          date: new Date().toISOString(),
          action: {
            label: 'Voir le compte',
            onClick: () => {
              // Navigation vers le compte
              showToast({
                title: 'Navigation',
                message: `Affichage du compte ${account.name}`,
                type: 'info'
              });
            }
          }
        });
      } else if (currentBalance < 50000) {
        generatedAlerts.push({
          id: `warning-balance-${account.id}`,
          type: 'warning',
          title: 'Solde à surveiller',
          message: `Le compte "${account.name}" a un solde de ${formatCurrency(currentBalance)}.`,
          date: new Date().toISOString()
        });
      }
    });

    // 2. Alertes de cashflow négatif
    const recentWeeks = cashflowData.slice(-4);
    const negativeWeeks = recentWeeks.filter(w => (Number(w.entries) - Number(w.exits)) < 0);
    if (negativeWeeks.length >= 2) {
      generatedAlerts.push({
        id: 'negative-cashflow',
        type: 'critical',
        title: 'Cashflow négatif',
        message: `${negativeWeeks.length} semaines sur les 4 dernières ont un cashflow négatif.`,
        date: new Date().toISOString()
      });
    }

    // 3. Alertes de transactions importantes non confirmées
    const largePendingTransactions = transactions.filter(t => 
      t.status === 'pending' && Number(t.amount) > 10000
    );
    if (largePendingTransactions.length > 0) {
      generatedAlerts.push({
        id: 'large-pending',
        type: 'warning',
        title: 'Transactions importantes en attente',
        message: `${largePendingTransactions.length} transaction(s) de plus de ${formatCurrency(10000)} en attente de confirmation.`,
        date: new Date().toISOString()
      });
    }

    // 4. Alertes de dépenses anormales
    const avgExit = transactions
      .filter(t => t.type === 'exit')
      .reduce((sum, t) => sum + Number(t.amount), 0) / Math.max(transactions.filter(t => t.type === 'exit').length, 1);
    const highExits = transactions.filter(t => 
      t.type === 'exit' && Number(t.amount) > avgExit * 3
    );
    if (highExits.length > 0) {
      generatedAlerts.push({
        id: 'unusual-expenses',
        type: 'warning',
        title: 'Dépenses anormales détectées',
        message: `${highExits.length} transaction(s) de sortie significativement plus élevées que la moyenne.`,
        date: new Date().toISOString()
      });
    }

    // 5. Alertes de revenus manquants (projections)
    const today = new Date();
    const projectedEntries = transactions.filter(t => 
      t.type === 'entry' && t.status === 'projected' && new Date(t.date) >= today
    );
    const overdueProjected = projectedEntries.filter(t => new Date(t.date) < today);
    if (overdueProjected.length > 0) {
      generatedAlerts.push({
        id: 'overdue-projections',
        type: 'warning',
        title: 'Revenus projetés en retard',
        message: `${overdueProjected.length} revenu(s) projeté(s) n'ont pas encore été confirmés.`,
        date: new Date().toISOString()
      });
    }

    // 6. Alertes de variation importante
    if (stats && stats.variation_percent) {
      const variation = Number(stats.variation_percent);
      if (variation < -20) {
        generatedAlerts.push({
          id: 'large-decrease',
          type: 'critical',
          title: 'Baisse importante du solde',
          message: `Le solde a diminué de ${Math.abs(variation).toFixed(1)}% sur la période.`,
          date: new Date().toISOString()
        });
      } else if (variation > 50) {
        generatedAlerts.push({
          id: 'large-increase',
          type: 'info',
          title: 'Augmentation importante du solde',
          message: `Le solde a augmenté de ${variation.toFixed(1)}% sur la période.`,
          date: new Date().toISOString()
        });
      }
    }

    // 7. Alertes de comptes inactifs
    const inactiveAccounts = bankAccounts.filter(acc => !acc.is_active);
    if (inactiveAccounts.length > 0) {
      generatedAlerts.push({
        id: 'inactive-accounts',
        type: 'info',
        title: 'Comptes inactifs',
        message: `${inactiveAccounts.length} compte(s) bancaire(s) marqué(s) comme inactif(s).`,
        date: new Date().toISOString()
      });
    }

    return generatedAlerts.sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2 };
      return priority[a.type] - priority[b.type];
    });
  }, [transactions, bankAccounts, cashflowData, stats]);

  const activeAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'info':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertBadge = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Critique</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">Avertissement</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Information</Badge>;
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* En-tête */}
      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Alertes de Trésorerie
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} active{activeAlerts.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="glass-card p-4 rounded-xl border border-red-500/30 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Critiques</div>
              <div className="text-xl font-bold text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeAlerts.filter(a => a.type === 'critical').length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4 rounded-xl border border-orange-500/30 bg-orange-50/50 dark:bg-orange-900/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avertissements</div>
              <div className="text-xl font-bold text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeAlerts.filter(a => a.type === 'warning').length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Informations</div>
              <div className="text-xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {activeAlerts.filter(a => a.type === 'info').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des Alertes */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-4">
          {activeAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`glass-card p-5 rounded-xl border ${
                alert.type === 'critical' ? 'border-red-500/30 bg-red-50/30 dark:bg-red-900/10' :
                alert.type === 'warning' ? 'border-orange-500/30 bg-orange-50/30 dark:bg-orange-900/10' :
                'border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-lg mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {alert.title}
                      </h4>
                      {getAlertBadge(alert.type)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{alert.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(alert.date).toLocaleDateString('fr-CA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {alert.action && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={alert.action.onClick}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {alert.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Aucune alerte active
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Toutes vos alertes sont à jour. Votre trésorerie semble en bonne santé !
          </p>
        </Card>
      )}

      {/* Alertes rejetées */}
      {dismissedAlerts.size > 0 && (
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {dismissedAlerts.size} alerte{dismissedAlerts.size > 1 ? 's' : ''} rejetée{dismissedAlerts.size > 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissedAlerts(new Set())}
            >
              Réafficher toutes les alertes
            </Button>
          </div>
        </Card>
      )}
    </MotionDiv>
  );
}
