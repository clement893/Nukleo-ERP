'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/* eslint-disable @typescript-eslint/no-unused-vars */
// Variables marked as unused are actually used in DataTable callbacks
// TypeScript doesn't detect them due to type assertions

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NukleoPageHeader } from '@/components/nukleo';
import { Button, Alert, Loading, Badge, Card } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { quotesAPI, type Quote, type QuoteCreate, type QuoteUpdate } from '@/lib/api/quotes';
import { submissionsAPI, type Submission, type SubmissionCreate } from '@/lib/api/submissions';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Plus, FileText, FileCheck, Eye, Trash2, DollarSign, TrendingUp, Clock } from 'lucide-react';
import type { DropdownItem } from '@/components/ui/Dropdown';
import MotionDiv from '@/components/motion/MotionDiv';
import QuoteForm from '@/components/commercial/QuoteForm';
import SubmissionWizard from '@/components/commercial/SubmissionWizard';

type TabType = 'quotes' | 'submissions';

function SoumissionsContent() {
  const router = useRouter(); // Used in onRowClick and actions callbacks
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('quotes');
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
      // Ensure status is draft
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

  // Handle delete quote - used in DataTable actions callback (line 399)
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

  // Handle delete submission - used in DataTable actions callback (line 430)
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

  // Quote columns - used in DataTable
  // @ts-ignore - Used in DataTable component
  const quoteColumns: Column<Quote>[] = [
    {
      key: 'quote_number',
      label: 'Numéro',
      sortable: true,
      render: (value) => <span className="font-medium">{String(value)}</span>,
    },
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (value) => (
        <span className="truncate block" title={value ? String(value) : undefined}>{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'company_name',
      label: 'Client',
      sortable: true,
      render: (value) => <span className="text-muted-foreground">{value ? String(value) : '-'}</span>,
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (_value, quote) => (
        <span>
          {quote.amount ? `${quote.amount.toLocaleString('fr-FR')} ${quote.currency}` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          draft: 'bg-gray-500',
          sent: 'bg-blue-500',
          accepted: 'bg-green-500',
          rejected: 'bg-red-500',
          expired: 'bg-orange-500',
        };
        return (
          <Badge variant="default" className={statusColors[String(value)] || 'bg-gray-500'}>
            {String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Créé le',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
  ];

  // Submission columns - used in DataTable (line 409)
  const submissionColumns: Column<Submission>[] = [
    {
      key: 'submission_number',
      label: 'Numéro',
      sortable: true,
      render: (value) => <span className="font-medium">{String(value)}</span>,
    },
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (value) => (
        <span className="truncate block" title={value ? String(value) : undefined}>{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'company_name',
      label: 'Client',
      sortable: true,
      render: (value) => <span className="text-muted-foreground">{value ? String(value) : '-'}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => <span className="text-muted-foreground">{value ? String(value) : '-'}</span>,
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          draft: 'bg-gray-500',
          submitted: 'bg-blue-500',
          under_review: 'bg-yellow-500',
          accepted: 'bg-green-500',
          rejected: 'bg-red-500',
        };
        return (
          <Badge variant="default" className={statusColors[String(value)] || 'bg-gray-500'}>
            {String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'deadline',
      label: 'Échéance',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {value ? new Date(String(value)).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
  ];

  // Calculate stats
  const totalQuotes = quotes.length;
  const totalSubmissions = submissions.length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const wonSubmissions = submissions.filter(s => s.status === 'accepted').length;
  const pendingQuotes = quotes.filter(q => q.status === 'sent').length;
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
  const totalQuotesValue = quotes.reduce((sum, q) => sum + (q.amount || 0), 0);
  const totalSubmissionsValue = submissions.reduce((sum, s) => {
    const amount = s.content?.amount || s.content?.value || 0;
    return sum + (typeof amount === 'number' ? amount : 0);
  }, 0);

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-6">
      <NukleoPageHeader
        title={activeTab === 'quotes' ? 'Devis' : 'Soumissions'}
        description={activeTab === 'quotes' ? 'Gérez vos devis et propositions commerciales' : 'Suivez vos soumissions aux appels d\'offres'}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
              <DollarSign className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {activeTab === 'quotes' ? totalQuotesValue.toLocaleString('fr-FR') : totalSubmissionsValue.toLocaleString('fr-FR')} $
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
              <FileText className="w-6 h-6 text-[#523DC9]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {activeTab === 'quotes' ? totalQuotes : totalSubmissions}
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
            {activeTab === 'quotes' ? acceptedQuotes : wonSubmissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{activeTab === 'quotes' ? 'Acceptés' : 'Gagnés'}</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
              <Clock className="w-6 h-6 text-[#3B82F6]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {activeTab === 'quotes' ? pendingQuotes : pendingSubmissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-6 gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'quotes'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Devis ({quotes.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCheck className="w-4 h-4 inline mr-2" />
              Soumissions ({submissions.length})
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab === 'quotes' ? (
              <Button onClick={() => setShowCreateQuoteModal(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Créer un devis
              </Button>
            ) : (
              <Button onClick={() => setShowCreateSubmissionModal(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Créer une soumission
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loading />
            </div>
          ) : activeTab === 'quotes' ? (
            <DataTable
              data={quotes as unknown as Record<string, unknown>[]}
              columns={quoteColumns as unknown as Column<Record<string, unknown>>[]}
              onRowClick={(quote) => {
                const locale = window.location.pathname.split('/')[1] || 'fr';
                const quoteObj = quote as unknown as Quote;
                router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quoteObj.id}`);
              }}
              actions={(quote): DropdownItem[] => {
                const locale = window.location.pathname.split('/')[1] || 'fr';
                const quoteObj = quote as unknown as Quote;
                return [
                  {
                    label: 'Voir',
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => {
                      router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quoteObj.id}`);
                    },
                  },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => {
                      handleDeleteQuote(quoteObj.id);
                    },
                    variant: 'danger',
                  },
                ];
              }}
            />
          ) : (
            <DataTable
              data={submissions as unknown as Record<string, unknown>[]}
              columns={submissionColumns as unknown as Column<Record<string, unknown>>[]}
              onRowClick={(submission) => {
                const locale = window.location.pathname.split('/')[1] || 'fr';
                const submissionObj = submission as unknown as Submission;
                router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submissionObj.id}`);
              }}
              actions={(submission): DropdownItem[] => {
                const locale = window.location.pathname.split('/')[1] || 'fr';
                const submissionObj = submission as unknown as Submission;
                return [
                  {
                    label: 'Voir',
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => {
                      router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submissionObj.id}`);
                    },
                  },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => {
                      handleDeleteSubmission(submissionObj.id);
                    },
                    variant: 'danger',
                  },
                ];
              }}
            />
          )}
        </div>
      </div>

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
  );
}

export default function SoumissionsPage() {
  return <SoumissionsContent />;
}
