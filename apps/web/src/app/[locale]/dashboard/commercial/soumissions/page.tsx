'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, 
  FileText, 
  FileCheck, 
  Eye, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid,
  List
} from 'lucide-react';
import { Badge, Button, Card, Alert, Loading } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { quotesAPI, type Quote, type QuoteCreate, type QuoteUpdate } from '@/lib/api/quotes';
import { submissionsAPI, type Submission, type SubmissionCreate } from '@/lib/api/submissions';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import QuoteForm from '@/components/commercial/QuoteForm';
import SubmissionWizard from '@/components/commercial/SubmissionWizard';

type TabType = 'quotes' | 'submissions';

export default function SoumissionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('quotes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [showCreateSubmissionModal, setShowCreateSubmissionModal] = useState(false);

  // Load quotes
  const loadQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotesAPI.list();
      setQuotes(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des devis');
      showToast({
        message: appError.message || 'Erreur lors du chargement des devis',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load submissions
  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await submissionsAPI.list();
      setSubmissions(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des soumissions');
      showToast({
        message: appError.message || 'Erreur lors du chargement des soumissions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quotes') {
      loadQuotes();
    } else {
      loadSubmissions();
    }
  }, [activeTab]);

  // Handle create quote
  const handleCreateQuote = async (quoteData: QuoteCreate | QuoteUpdate) => {
    try {
      setLoading(true);
      setError(null);
      await quotesAPI.create(quoteData as QuoteCreate);
      await loadQuotes();
      setShowCreateQuoteModal(false);
      showToast({
        message: 'Devis créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création du devis');
      showToast({
        message: appError.message || 'Erreur lors de la création du devis',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle create submission
  const handleCreateSubmission = async (submissionData: SubmissionCreate) => {
    try {
      setLoading(true);
      setError(null);
      const createdSubmission = await submissionsAPI.create(submissionData);
      await loadSubmissions();
      setShowCreateSubmissionModal(false);
      showToast({
        message: 'Soumission créée avec succès',
        type: 'success',
      });
      return createdSubmission;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création de la soumission');
      showToast({
        message: appError.message || 'Erreur lors de la création de la soumission',
        type: 'error',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle save draft submission
  const handleSaveDraftSubmission = async (submissionData: SubmissionCreate) => {
    try {
      setLoading(true);
      setError(null);
      const draftData = { ...submissionData, status: 'draft' };
      const createdSubmission = await submissionsAPI.create(draftData);
      await loadSubmissions();
      showToast({
        message: 'Brouillon sauvegardé avec succès',
        type: 'success',
      });
      return createdSubmission;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la sauvegarde du brouillon');
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde du brouillon',
        type: 'error',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle delete quote
  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await quotesAPI.delete(quoteId);
      await loadQuotes();
      showToast({
        message: 'Devis supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression du devis');
      showToast({
        message: appError.message || 'Erreur lors de la suppression du devis',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete submission
  const handleDeleteSubmission = async (submissionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette soumission ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await submissionsAPI.delete(submissionId);
      await loadSubmissions();
      showToast({
        message: 'Soumission supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression de la soumission');
      showToast({
        message: appError.message || 'Erreur lors de la suppression de la soumission',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'brouillon':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'sent':
      case 'envoyé':
      case 'submitted':
      case 'soumis':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'accepted':
      case 'accepté':
      case 'won':
      case 'gagné':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
      case 'refusé':
      case 'lost':
      case 'perdu':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'accepté':
      case 'won':
      case 'gagné':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'refusé':
      case 'lost':
      case 'perdu':
        return <XCircle className="w-4 h-4" />;
      case 'sent':
      case 'envoyé':
      case 'submitted':
      case 'soumis':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate stats
  const quotesStats = {
    total: quotes.length,
    totalAmount: quotes.reduce((sum, q) => sum + (q.amount || 0), 0),
    accepted: quotes.filter(q => q.status === 'accepted').length,
    pending: quotes.filter(q => q.status === 'sent').length,
  };

  const submissionsStats = {
    total: submissions.length,
    totalAmount: submissions.reduce((sum, s) => sum + (s.amount || 0), 0),
    won: submissions.filter(s => s.status === 'accepted').length,
    pending: submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
  };

  const getAcceptedOrWon = () => {
    return activeTab === 'quotes' ? quotesStats.accepted : submissionsStats.won;
  };

  const getTotalAmount = () => {
    return activeTab === 'quotes' ? quotesStats.totalAmount : submissionsStats.totalAmount;
  };

  const getTotal = () => {
    return activeTab === 'quotes' ? quotesStats.total : submissionsStats.total;
  };

  const getPending = () => {
    return activeTab === 'quotes' ? quotesStats.pending : submissionsStats.pending;
  };

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {activeTab === 'quotes' ? 'Devis' : 'Soumissions'}
                </h1>
                <p className="text-white/80 text-lg">
                  {activeTab === 'quotes' 
                    ? 'Gérez vos devis et propositions commerciales' 
                    : 'Suivez vos soumissions aux appels d\'offres'}
                </p>
              </div>
              <Button 
                className="bg-white text-[#523DC9] hover:bg-white/90"
                onClick={() => activeTab === 'quotes' ? setShowCreateQuoteModal(true) : setShowCreateSubmissionModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'quotes' ? 'Nouveau devis' : 'Nouvelle soumission'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'quotes'
                ? 'bg-[#523DC9] text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Devis</span>
              <Badge className="bg-white/20 text-white">{quotes.length}</Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'submissions'
                ? 'bg-[#523DC9] text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Soumissions</span>
              <Badge className="bg-white/20 text-white">{submissions.length}</Badge>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(getTotalAmount())}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Target className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {getTotal()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {getAcceptedOrWon()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'quotes' ? 'Acceptés' : 'Gagnés'}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {getPending()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center">
            <Loading />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {activeTab === 'quotes' ? (
              quotes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Aucun devis pour le moment
                </div>
              ) : (
                quotes.map((quote) => (
                  <Card 
                    key={quote.id} 
                    className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer"
                    onClick={() => {
                      const locale = window.location.pathname.split('/')[1] || 'fr';
                      router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quote.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-[#523DC9]" />
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {quote.quote_number}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {quote.title || '-'}
                        </h3>
                      </div>
                      <Badge className={getStatusColor(quote.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(quote.status)}
                          <span>{quote.status}</span>
                        </div>
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>{quote.company_name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Validité: {formatDate(quote.valid_until)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-bold text-[#10B981]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatCurrency(quote.amount || 0)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const locale = window.location.pathname.split('/')[1] || 'fr';
                            router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quote.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuote(quote.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )
            ) : (
              submissions.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Aucune soumission pour le moment
                </div>
              ) : (
                submissions.map((submission) => (
                  <Card 
                    key={submission.id} 
                    className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer"
                    onClick={() => {
                      const locale = window.location.pathname.split('/')[1] || 'fr';
                      router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submission.id}`);
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCheck className="w-5 h-5 text-[#523DC9]" />
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {submission.submission_number}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {submission.title || '-'}
                        </h3>
                      </div>
                      <Badge className={getStatusColor(submission.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(submission.status)}
                          <span>{submission.status}</span>
                        </div>
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>{submission.company_name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Échéance: {formatDate(submission.deadline)}</span>
                      </div>
                      {submission.probability !== undefined && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Target className="w-4 h-4" />
                          <span>Probabilité: {submission.probability}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-bold text-[#10B981]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatCurrency(submission.amount || 0)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const locale = window.location.pathname.split('/')[1] || 'fr';
                            router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submission.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubmission(submission.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )
            )}
          </div>
        )}

        {/* Create Quote Modal */}
        <Modal
          isOpen={showCreateQuoteModal}
          onClose={() => setShowCreateQuoteModal(false)}
          title="Créer un devis"
          size="xl"
        >
          <QuoteForm
            onSubmit={handleCreateQuote}
            onCancel={() => setShowCreateQuoteModal(false)}
            loading={loading}
          />
        </Modal>

        {/* Create Submission Modal */}
        <Modal
          isOpen={showCreateSubmissionModal}
          onClose={() => setShowCreateSubmissionModal(false)}
          title="Créer une soumission"
          size="full"
        >
          <SubmissionWizard
            onSubmit={handleCreateSubmission}
            onCancel={() => setShowCreateSubmissionModal(false)}
            onSaveDraft={handleSaveDraftSubmission}
            loading={loading}
          />
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
