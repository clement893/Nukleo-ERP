'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useMemo, useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  TrendingUp, 
  Target, 
  FileText,
  Building2,
  UserPlus,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Badge, Button, Card, Loading, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { useInfiniteOpportunities, useCreateOpportunity } from '@/lib/query/opportunities';
import { useInfiniteQuotes, useInfiniteSubmissions, useCreateQuote } from '@/lib/query/commercial';
import { useCreateCompany, useInfiniteCompanies } from '@/lib/query/companies';
import { useCreateReseauContact } from '@/lib/query/reseau-contacts';
import { companiesAPI } from '@/lib/api/companies';
import { employeesAPI } from '@/lib/api';
import OpportunityForm from '@/components/commercial/OpportunityForm';
import QuoteForm from '@/components/commercial/QuoteForm';
import ContactForm from '@/components/reseau/ContactForm';
import CompanyForm from '@/components/commercial/CompanyForm';
import { handleApiError } from '@/lib/errors/api';
import { type OpportunityCreate } from '@/lib/api/opportunities';
import { type QuoteCreate } from '@/lib/api/quotes';
import { type CompanyCreate } from '@/lib/api/companies';
import { type ContactCreate } from '@/lib/api/contacts';

export default function CommercialPage() {
  const { showToast } = useToast();
  
  // Fetch real data - increase limit to get all data for accurate stats
  const { data: opportunitiesData, isLoading: loadingOpps } = useInfiniteOpportunities(1000);
  const { data: quotesData, isLoading: loadingQuotes } = useInfiniteQuotes(1000);
  const { data: submissionsData, isLoading: loadingSubmissions } = useInfiniteSubmissions(1000);
  
  // Mutations
  const createOpportunityMutation = useCreateOpportunity();
  const createQuoteMutation = useCreateQuote();
  const createCompanyMutation = useCreateCompany();
  const createContactMutation = useCreateReseauContact();
  
  // Modal states
  const [showCreateOpportunityModal, setShowCreateOpportunityModal] = useState(false);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  
  // Load companies and employees for forms
  const { data: companiesData } = useInfiniteCompanies(1000);
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([]);
  
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = companiesData?.pages.flat() || [];
        setCompanies(data.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        // Silent fail
      }
    };
    loadCompanies();
  }, [companiesData]);
  
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await employeesAPI.list(0, 1000);
        setEmployees(data.map(e => ({ 
          id: e.id, 
          name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.email || 'Sans nom'
        })));
      } catch (err) {
        // Silent fail
      }
    };
    loadEmployees();
  }, []);

  // Flatten data
  const opportunities = useMemo(() => opportunitiesData?.pages.flat() || [], [opportunitiesData]);
  const quotes = useMemo(() => quotesData?.pages.flat() || [], [quotesData]);
  const submissions = useMemo(() => submissionsData?.pages.flat() || [], [submissionsData]);

  const loading = loadingOpps || loadingQuotes || loadingSubmissions;

  // Helper function to check if opportunity has submission
  const hasSubmission = (opportunity: any) => {
    if (!opportunity.company_id) return false;
    return submissions.some((s: any) => s.company_id === opportunity.company_id);
  };

  // Helper function to get days until deadline
  const getDaysUntilDeadline = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper function to get action needed type
  const getActionNeeded = (opp: any): { type: 'submission' | 'followup' | 'deadline'; priority: 'high' | 'medium' | 'low'; label: string } => {
    const daysUntilDeadline = getDaysUntilDeadline(opp.expected_close_date);
    const hasDeadline = daysUntilDeadline !== null;
    const isDeadlineNear = hasDeadline && daysUntilDeadline <= 30 && daysUntilDeadline >= 0;
    const isDeadlineUrgent = hasDeadline && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
    // Check specifically for "05 - Soumission à faire" stage
    const isSubmissionToDoStage = opp.stage_name?.includes('05 - Soumission à faire') || 
                                   opp.stage_name?.includes('05 - Proposal to do');
    const hasHighProbability = opp.probability && opp.probability > 50;

    if (isDeadlineUrgent && !hasSubmission(opp)) {
      return { type: 'deadline', priority: 'high', label: 'Deadline urgente - Soumission nécessaire' };
    }
    if (isDeadlineNear && !hasSubmission(opp)) {
      return { type: 'deadline', priority: 'medium', label: 'Deadline approchante - Soumission nécessaire' };
    }
    if (isSubmissionToDoStage && !hasSubmission(opp)) {
      return { type: 'submission', priority: 'high', label: 'Soumission nécessaire' };
    }
    if (hasHighProbability && !hasSubmission(opp)) {
      return { type: 'submission', priority: 'medium', label: 'Soumission recommandée' };
    }
    return { type: 'followup', priority: 'low', label: 'Suivi recommandé' };
  };

  // Opportunities needing action - Only show opportunities in "05 - Soumission à faire" stage
  const opportunitiesNeedingAction = useMemo(() => {
    return opportunities
      .filter((opp: any) => {
        // Exclude closed opportunities
        const status = opp.status?.toLowerCase() || '';
        if (['won', 'lost', 'cancelled'].includes(status)) return false;

        // Only include opportunities in "05 - Soumission à faire" stage
        const isSubmissionToDoStage = opp.stage_name?.includes('05 - Soumission à faire') || 
                                      opp.stage_name?.includes('05 - Proposal to do');
        
        // Must be in the correct stage and not have a submission yet
        return isSubmissionToDoStage && !hasSubmission(opp);
      })
      .map((opp: any) => ({
        ...opp,
        actionNeeded: getActionNeeded(opp),
        daysUntilDeadline: getDaysUntilDeadline(opp.expected_close_date),
      }))
      .sort((a: any, b: any) => {
        // Sort by priority (high > medium > low)
        const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.actionNeeded.priority as 'high' | 'medium' | 'low'];
        const bPriority = priorityOrder[b.actionNeeded.priority as 'high' | 'medium' | 'low'];
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        // Then by deadline (sooner first)
        if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
          return a.daysUntilDeadline - b.daysUntilDeadline;
        }
        if (a.daysUntilDeadline !== null) return -1;
        if (b.daysUntilDeadline !== null) return 1;
        // Then by probability (higher first)
        if (a.probability !== b.probability) {
          return (b.probability || 0) - (a.probability || 0);
        }
        // Finally by amount (higher first)
        return (b.amount || 0) - (a.amount || 0);
      })
      .slice(0, 5); // Top 5 opportunities needing action
  }, [opportunities, submissions]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalOpportunities = opportunities.length;
    const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (opp.amount || 0), 0);
    // Pipelines are managed through opportunities, so we count unique pipeline_ids
    const uniquePipelines = new Set(opportunities.map((opp: any) => opp.pipeline_id).filter(Boolean));
    const totalPipelines = uniquePipelines.size;
    const activePipelines = totalPipelines; // Assume all are active for now
    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter((q: any) => q.status === 'sent' || q.status === 'pending').length;
    const totalSubmissions = submissions.length;
    const wonSubmissions = submissions.filter((s: any) => s.status === 'won' || s.status === 'accepted').length;
    const needingAction = opportunitiesNeedingAction.length;

    return {
      opportunities: {
        total: totalOpportunities,
        value: totalValue,
        needingAction,
      },
      pipelines: {
        total: totalPipelines,
        active: activePipelines,
      },
      quotes: {
        total: totalQuotes,
        pending: pendingQuotes,
      },
      submissions: {
        total: totalSubmissions,
        won: wonSubmissions,
      },
    };
  }, [opportunities, quotes, submissions, opportunitiesNeedingAction]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Handlers for quick actions
  const handleCreateOpportunity = async (data: OpportunityCreate) => {
    try {
      await createOpportunityMutation.mutateAsync(data);
      setShowCreateOpportunityModal(false);
      showToast({
        message: 'Opportunité créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création',
        type: 'error',
      });
    }
  };

  const handleCreateQuote = async (data: QuoteCreate) => {
    try {
      await createQuoteMutation.mutateAsync(data);
      setShowCreateQuoteModal(false);
      showToast({
        message: 'Devis créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création',
        type: 'error',
      });
    }
  };

  const handleCreateContact = async (data: ContactCreate) => {
    try {
      await createContactMutation.mutateAsync(data);
      setShowCreateContactModal(false);
      showToast({
        message: 'Contact créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création',
        type: 'error',
      });
    }
  };

  const handleCreateCompany = async (data: CompanyCreate) => {
    try {
      await createCompanyMutation.mutateAsync(data);
      setShowCreateCompanyModal(false);
      showToast({
        message: 'Entreprise créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Dashboard Commercial
                </h1>
                <p className="text-white/80 text-lg">
                  Vue d'ensemble de vos activités commerciales
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/commercial/opportunites">
                  <Button className="bg-white text-primary-500 hover:bg-white/90">
                    <Target className="w-4 h-4 mr-2" />
                    Opportunités
                  </Button>
                </Link>
                <Link href="/dashboard/commercial/pipeline-client">
                  <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Pipelines
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Target className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.opportunities.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Opportunités</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Valeur: {formatCurrency(stats.opportunities.value)}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/30">
                <AlertCircle className="w-6 h-6 text-danger-500" />
              </div>
              {stats.opportunities.needingAction > 0 && (
                <Badge className="bg-danger-500 text-white">{stats.opportunities.needingAction}</Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.opportunities.needingAction}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Nécessitent une action</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Soumissions ou suivi requis
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <TrendingUp className="w-6 h-6 text-success-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pipelines.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pipelines</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.pipelines.active} actifs
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <FileText className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.quotes.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Devis</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.quotes.pending} en attente
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Briefcase className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.submissions.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Soumissions</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.submissions.won} gagnées
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Opportunities Needing Action */}
          <div className="lg:col-span-2">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Opportunités nécessitant une action</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Opportunités nécessitant une soumission ou un suivi
                  </p>
                </div>
                {opportunitiesNeedingAction.length > 0 && (
                  <Badge className={`${
                    opportunitiesNeedingAction.some((opp: any) => opp.actionNeeded.priority === 'high')
                      ? 'bg-danger-500 text-white'
                      : 'bg-warning-500 text-white'
                  }`}>
                    {opportunitiesNeedingAction.length}
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                {opportunitiesNeedingAction.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p className="font-medium">Aucune action requise</p>
                    <p className="text-sm mt-1">Toutes vos opportunités sont à jour</p>
                  </div>
                ) : (
                  opportunitiesNeedingAction.map((opp: any) => {
                    const priorityColors = {
                      high: 'bg-danger-500/10 text-danger-500 border-danger-500/30',
                      medium: 'bg-warning-500/10 text-warning-500 border-warning-500/30',
                      low: 'bg-primary-500/10 text-primary-500 border-primary-500/30',
                    };
                    const deadlineColors = {
                      urgent: 'bg-danger-500/10 text-danger-500',
                      warning: 'bg-warning-500/10 text-warning-500',
                      normal: 'bg-gray-500/10 text-gray-500',
                    };
                    const getDeadlineColor = (days: number | null) => {
                      if (days === null) return deadlineColors.normal;
                      if (days <= 7) return deadlineColors.urgent;
                      if (days <= 30) return deadlineColors.warning;
                      return deadlineColors.normal;
                    };

                    return (
                      <div
                        key={opp.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <Link href={`/dashboard/commercial/opportunites/${opp.id}`}>
                                <h4 className="font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors">
                                  {opp.name}
                                </h4>
                              </Link>
                              <Badge className={`${priorityColors[opp.actionNeeded.priority as 'high' | 'medium' | 'low']} border text-xs`}>
                                {opp.actionNeeded.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {opp.company_name || 'Entreprise non définie'}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {opp.stage_name && (
                                <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30">
                                  {opp.stage_name}
                                </Badge>
                              )}
                              {opp.daysUntilDeadline !== null && (
                                <Badge className={`${getDeadlineColor(opp.daysUntilDeadline)} border text-xs flex items-center gap-1`}>
                                  <Clock className="w-3 h-3" />
                                  {opp.daysUntilDeadline === 0 && "Aujourd'hui"}
                                  {opp.daysUntilDeadline === 1 && 'Demain'}
                                  {opp.daysUntilDeadline > 1 && `${opp.daysUntilDeadline} jours`}
                                  {opp.daysUntilDeadline < 0 && 'Dépassé'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-success-500 font-nukleo">
                              {formatCurrency(opp.amount || 0)}
                            </div>
                            {opp.probability && (
                              <div className="text-xs text-gray-500">{opp.probability}% prob.</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Link href={`/dashboard/commercial/opportunites/${opp.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Voir détails
                            </Button>
                          </Link>
                          {opp.actionNeeded.type === 'submission' && opp.company_id && (
                            <Link href={`/dashboard/commercial/soumissions?company_id=${opp.company_id}&opportunity_id=${opp.id}`}>
                              <Button size="sm" className="text-xs bg-primary-500 hover:bg-primary-600">
                                <FileText className="w-3 h-3 mr-1" />
                                Créer soumission
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full justify-start hover-nukleo" 
                  variant="outline"
                  onClick={() => setShowCreateOpportunityModal(true)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Nouvelle opportunité
                </Button>
                <Button 
                  className="w-full justify-start hover-nukleo" 
                  variant="outline"
                  onClick={() => setShowCreateQuoteModal(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nouveau devis
                </Button>
                <Button 
                  className="w-full justify-start hover-nukleo" 
                  variant="outline"
                  onClick={() => setShowCreateContactModal(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter un contact
                </Button>
                <Button 
                  className="w-full justify-start hover-nukleo" 
                  variant="outline"
                  onClick={() => setShowCreateCompanyModal(true)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Ajouter une entreprise
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Create Opportunity Modal */}
        <Modal
          isOpen={showCreateOpportunityModal}
          onClose={() => setShowCreateOpportunityModal(false)}
          title="Nouvelle opportunité"
          size="lg"
        >
          <OpportunityForm
            onSubmit={handleCreateOpportunity}
            onCancel={() => setShowCreateOpportunityModal(false)}
            loading={createOpportunityMutation.isPending}
          />
        </Modal>

        {/* Create Quote Modal */}
        <Modal
          isOpen={showCreateQuoteModal}
          onClose={() => setShowCreateQuoteModal(false)}
          title="Nouveau devis"
          size="lg"
        >
          <QuoteForm
            onSubmit={handleCreateQuote}
            onCancel={() => setShowCreateQuoteModal(false)}
            loading={createQuoteMutation.isPending}
          />
        </Modal>

        {/* Create Contact Modal */}
        <Modal
          isOpen={showCreateContactModal}
          onClose={() => setShowCreateContactModal(false)}
          title="Ajouter un contact"
          size="lg"
        >
          <ContactForm
            onSubmit={handleCreateContact}
            onCancel={() => setShowCreateContactModal(false)}
            loading={createContactMutation.isPending}
            companies={companies}
            employees={employees}
          />
        </Modal>

        {/* Create Company Modal */}
        <Modal
          isOpen={showCreateCompanyModal}
          onClose={() => setShowCreateCompanyModal(false)}
          title="Ajouter une entreprise"
          size="lg"
        >
          <CompanyForm
            onSubmit={handleCreateCompany}
            onCancel={() => setShowCreateCompanyModal(false)}
            loading={createCompanyMutation.isPending}
            parentCompanies={companies}
          />
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
