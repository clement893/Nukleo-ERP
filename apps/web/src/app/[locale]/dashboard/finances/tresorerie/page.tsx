'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Wallet, Download, Plus, Loader2, Upload, X, CheckCircle2, AlertCircle,
  RefreshCw, LayoutDashboard, Calendar, FileText, BarChart3, Building2, Tag, Bell,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { tresorerieAPI, type CashflowWeek, type Transaction, type TreasuryStats, type TransactionCategory } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import TresorerieOverviewTab from '@/components/tresorerie/TresorerieOverviewTab';
import TresorerieForecastTab from '@/components/tresorerie/TresorerieForecastTab';
import TresorerieTransactionsTab from '@/components/tresorerie/TresorerieTransactionsTab';
import TresorerieAnalyticsTab from '@/components/tresorerie/TresorerieAnalyticsTab';
import TresorerieAccountsTab from '@/components/tresorerie/TresorerieAccountsTab';
import TresorerieCategoriesTab from '@/components/tresorerie/TresorerieCategoriesTab';
import TresorerieAlertsTab from '@/components/tresorerie/TresorerieAlertsTab';

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

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </PageContainer>
    );
  }

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
    <PageContainer maxWidth="full">
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
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

        {/* Tabs System */}
        <Tabs defaultTab="overview" className="mt-6">
          <TabList className="flex-wrap border-b border-gray-200 dark:border-gray-700">
            <Tab value="overview">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </Tab>
            <Tab value="forecast">
              <Calendar className="w-4 h-4 mr-2" />
              Prévisions
            </Tab>
            <Tab value="transactions">
              <FileText className="w-4 h-4 mr-2" />
              Transactions
            </Tab>
            <Tab value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyse
            </Tab>
            <Tab value="accounts">
              <Building2 className="w-4 h-4 mr-2" />
              Comptes
            </Tab>
            <Tab value="categories">
              <Tag className="w-4 h-4 mr-2" />
              Catégories
            </Tab>
            <Tab value="alerts">
              <Bell className="w-4 h-4 mr-2" />
              Alertes
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="overview">
              <TresorerieOverviewTab
                soldeActuel={soldeActuel}
                stats={stats}
                soldesHebdo={soldesHebdo}
                transactions={transactions}
                categories={categories}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                onRefresh={loadTresorerie}
                onExport={handleExport}
              />
            </TabPanel>

            <TabPanel value="forecast">
              <TresorerieForecastTab />
            </TabPanel>

            <TabPanel value="transactions">
              <TresorerieTransactionsTab />
            </TabPanel>

            <TabPanel value="analytics">
              <TresorerieAnalyticsTab />
            </TabPanel>

            <TabPanel value="accounts">
              <TresorerieAccountsTab />
            </TabPanel>

            <TabPanel value="categories">
              <TresorerieCategoriesTab />
            </TabPanel>

            <TabPanel value="alerts">
              <TresorerieAlertsTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
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
