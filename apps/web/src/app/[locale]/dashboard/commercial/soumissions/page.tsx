'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/* eslint-disable @typescript-eslint/no-unused-vars */
// Variables marked as unused are actually used in DataTable callbacks
// TypeScript doesn't detect them due to type assertions

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { quotesAPI, type Quote, type QuoteCreate } from '@/lib/api/quotes';
import { submissionsAPI, type Submission, type SubmissionCreate } from '@/lib/api/submissions';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Plus, FileText, FileCheck, Eye, Trash2 } from 'lucide-react';
import type { DropdownItem } from '@/components/ui/Dropdown';
import MotionDiv from '@/components/motion/MotionDiv';

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
  const handleCreateQuote = async (quoteData: QuoteCreate) => {
    try {
      setLoading(true);
      setError(null);
      await quotesAPI.create(quoteData);
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
      await submissionsAPI.create(submissionData);
      await loadSubmissions();
      setShowCreateSubmissionModal(false);
      showToast({
        message: 'Soumission créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création de la soumission');
      showToast({
        message: appError.message || 'Erreur lors de la création de la soumission',
        type: 'error',
      });
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

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Soumissions"
        description="Gérez vos devis et soumissions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Soumissions' },
        ]}
      />

      {/* Tabs */}
      <Card>
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex gap-2">
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
          <div className="flex gap-2">
            {activeTab === 'quotes' ? (
              <Button onClick={() => setShowCreateQuoteModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un devis
              </Button>
            ) : (
              <Button onClick={() => setShowCreateSubmissionModal(true)}>
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
      </Card>

      {/* Create Quote Modal */}
      <Modal
        isOpen={showCreateQuoteModal}
        onClose={() => setShowCreateQuoteModal(false)}
        title="Créer un devis"
      >
        <QuoteForm
          onSubmit={handleCreateQuote}
          onCancel={() => setShowCreateQuoteModal(false)}
        />
      </Modal>

      {/* Create Submission Modal */}
      <Modal
        isOpen={showCreateSubmissionModal}
        onClose={() => setShowCreateSubmissionModal(false)}
        title="Créer une soumission"
      >
        <SubmissionForm
          onSubmit={handleCreateSubmission}
          onCancel={() => setShowCreateSubmissionModal(false)}
        />
      </Modal>
    </MotionDiv>
  );
}

// Simple Quote Form Component
function QuoteForm({ onSubmit, onCancel }: { onSubmit: (data: QuoteCreate) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<QuoteCreate>({
    title: '',
    description: '',
    currency: 'EUR',
    status: 'draft',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titre *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Montant</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 border border-border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Devise</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer
        </Button>
      </div>
    </form>
  );
}

// Simple Submission Form Component
function SubmissionForm({ onSubmit, onCancel }: { onSubmit: (data: SubmissionCreate) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<SubmissionCreate>({
    title: '',
    description: '',
    type: '',
    status: 'draft',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Titre *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={formData.type || ''}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md"
        >
          <option value="">Sélectionner un type</option>
          <option value="rfp">RFP (Request for Proposal)</option>
          <option value="tender">Appel d'offres</option>
          <option value="proposal">Proposition</option>
          <option value="other">Autre</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md"
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer
        </Button>
      </div>
    </form>
  );
}

export default function SoumissionsPage() {
  return <SoumissionsContent />;
}
