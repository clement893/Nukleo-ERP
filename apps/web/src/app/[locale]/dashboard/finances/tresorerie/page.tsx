'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, Download, Plus, ArrowUpRight, ArrowDownRight,
  Building2, Users, Loader2
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { projectsAPI } from '@/lib/api/projects';
import { employeesAPI } from '@/lib/api/employees';
import { useToast } from '@/lib/toast';

interface Transaction {
  id: string;
  type: 'entree' | 'sortie';
  categorie: string;
  description: string;
  montant: number;
  date: string;
  statut: 'confirme' | 'probable' | 'projete';
}

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
  const { showToast } = useToast();

  useEffect(() => {
    loadTresorerie();
  }, []);

  const loadTresorerie = async () => {
    try {
      setLoading(true);
      
      // Charger projets et employés
      const [projects, employees] = await Promise.all([
        projectsAPI.list(0, 100),
        employeesAPI.list(0, 100)
      ]);

      // Générer transactions depuis projets (entrées)
      const entreesTransactions: Transaction[] = projects
        .filter(p => p.budget && p.budget > 0)
        .map((p) => {
          // Répartir le budget sur 2-4 semaines
          const nbSemaines = Math.floor(Math.random() * 3) + 2;
          const montantParSemaine = p.budget! / nbSemaines;
          const dateDebut = p.start_date ? new Date(p.start_date) : new Date();
          
          return Array.from({ length: nbSemaines }, (_, i) => {
            const date = new Date(dateDebut);
            date.setDate(date.getDate() + (i * 7));
            
            return {
              id: `entree-${p.id}-${i}`,
              type: 'entree' as const,
              categorie: 'Projet',
              description: p.name,
              montant: montantParSemaine,
              date: date.toISOString().split('T')[0],
              statut: i === 0 ? 'confirme' as const : 'probable' as const
            };
          });
        })
        .flat();

      // Générer transactions depuis employés (sorties - salaires)
      const sortiesTransactions: Transaction[] = [];
      const today = new Date();
      
      // Salaires bi-hebdomadaires pour les 8 prochaines semaines
      // Utiliser un salaire moyen simulé de 60k par année
      const salaireAnnuelMoyen = 60000;
      const salaireBiHebdo = salaireAnnuelMoyen / 26;
      
      for (let semaine = 0; semaine < 8; semaine += 2) {
        const datePaie = new Date(today);
        datePaie.setDate(datePaie.getDate() + (semaine * 7));
        
        employees.forEach(emp => {
          sortiesTransactions.push({
            id: `sortie-salaire-${emp.id}-${semaine}`,
            type: 'sortie',
            categorie: 'Salaire',
            description: `Paie - ${emp.first_name} ${emp.last_name}`,
            montant: salaireBiHebdo,
            date: datePaie.toISOString().split('T')[0],
            statut: semaine === 0 ? 'confirme' : 'projete'
          });
        });
      }

      // Charges fixes mensuelles
      const chargesFixes = [
        { description: 'Loyer bureau', montant: 5000, jour: 1 },
        { description: 'Assurances', montant: 1200, jour: 1 },
        { description: 'Logiciels & licences', montant: 800, jour: 5 },
        { description: 'Internet & téléphonie', montant: 300, jour: 10 },
        { description: 'Comptabilité', montant: 500, jour: 15 }
      ];

      // Ajouter charges fixes pour les 3 prochains mois
      for (let mois = 0; mois < 3; mois++) {
        chargesFixes.forEach((charge, index) => {
          const dateCharge = new Date(today);
          dateCharge.setMonth(dateCharge.getMonth() + mois);
          dateCharge.setDate(charge.jour);
          const dateStr = dateCharge.toISOString().split('T')[0];
          
          sortiesTransactions.push({
            id: `sortie-charge-${index}-${mois}`,
            type: 'sortie',
            categorie: 'Charge fixe',
            description: charge.description,
            montant: charge.montant,
            date: dateStr,
            statut: mois === 0 ? 'confirme' : 'projete'
          });
        });
      }

      // Combiner toutes les transactions
      const allTransactions = [...entreesTransactions, ...sortiesTransactions]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTransactions(allTransactions);

      // Calculer soldes hebdomadaires
      const soldesParSemaine = calculerSoldesHebdomadaires(allTransactions);
      setSoldesHebdo(soldesParSemaine);

      // Solde actuel (simulé)
      const soldeInitial = 150000; // Solde de départ simulé
      setSoldeActuel(soldeInitial);

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

  const calculerSoldesHebdomadaires = (transactions: Transaction[]): SoldeHebdomadaire[] => {
    const soldes: SoldeHebdomadaire[] = [];
    const today = new Date();
    let soldeAccumule = 150000; // Solde de départ

    for (let i = 0; i < 12; i++) {
      const dateDebut = new Date(today);
      dateDebut.setDate(dateDebut.getDate() + (i * 7));
      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + 6);

      const transactionsSemaine = transactions.filter(t => {
        const dateT = new Date(t.date);
        return dateT >= dateDebut && dateT <= dateFin;
      });

      const entrees = transactionsSemaine
        .filter(t => t.type === 'entree')
        .reduce((sum, t) => sum + t.montant, 0);

      const sorties = transactionsSemaine
        .filter(t => t.type === 'sortie')
        .reduce((sum, t) => sum + t.montant, 0);

      soldeAccumule += (entrees - sorties);

      soldes.push({
        semaine: dateDebut.toISOString().split('T')[0],
        entrees,
        sorties,
        solde: soldeAccumule,
        projete: i > 0
      });
    }

    return soldes;
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
  const projection30j = soldesHebdo[4]?.solde || soldeActuel;
  
  const variation = soldesHebdo[1] ? ((soldesHebdo[1].solde - soldeActuel) / soldeActuel) * 100 : 0;
  const alerteNiveau = soldeAvecMarge < 50000 ? 'rouge' : soldeAvecMarge < 100000 ? 'orange' : 'vert';

  // Prochaines entrées (4 semaines)
  const prochainesEntrees = transactions
    .filter(t => t.type === 'entree')
    .slice(0, 10);

  // Prochaines sorties (4 semaines)
  const prochainesSorties = transactions
    .filter(t => t.type === 'sortie')
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
                        t.statut === 'confirme' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        t.statut === 'probable' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                        'bg-gray-500/10 text-gray-600 border-gray-500/30'
                      }`}>
                        {t.statut === 'confirme' ? 'Confirmé' : 
                         t.statut === 'probable' ? 'Probable' : 'Projeté'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(t.montant)}
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
                      {t.categorie === 'Salaire' ? (
                        <Users className="w-4 h-4 text-red-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{t.description}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(t.date)}
                      </span>
                      <Badge className="text-[10px] px-1.5 py-0 bg-gray-500/10 text-gray-600 border-gray-500/30">
                        {t.categorie}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(t.montant)}
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
