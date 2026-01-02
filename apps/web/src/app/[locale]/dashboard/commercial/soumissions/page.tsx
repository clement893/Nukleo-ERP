'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  List,
  Search,
  Edit,
  Download,
  FileDown,
  MoreVertical,
  Copy,
  CheckSquare,
  Square
} from 'lucide-react';
import { Badge, Button, Card, Alert, Loading, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import MultiSelect from '@/components/ui/MultiSelect';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors/api';
import QuoteForm from '@/components/commercial/QuoteForm';
import SubmissionWizard from '@/components/commercial/SubmissionWizard';
import { 
  useInfiniteQuotes, 
  useCreateQuote, 
  useUpdateQuote, 
  useDeleteQuote 
} from '@/lib/query/quotes';
import { 
  useInfiniteSubmissions, 
  useCreateSubmission, 
  useUpdateSubmission, 
  useDeleteSubmission 
} from '@/lib/query/submissions';
import { type Quote, type QuoteCreate, type QuoteUpdate } from '@/lib/api/quotes';
import { submissionsAPI, type Submission, type SubmissionCreate, type SubmissionUpdate } from '@/lib/api/submissions';
import { companiesAPI } from '@/lib/api/companies';
import { useDebounce } from '@/hooks/useDebounce';

type TabType = 'quotes' | 'submissions';

export default function SoumissionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('quotes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  
  // Selection
  const [selectedQuotes, setSelectedQuotes] = useState<Set<number>>(new Set());
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());
  
  // Modals
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [showCreateSubmissionModal, setShowCreateSubmissionModal] = useState(false);
  const [showEditQuoteModal, setShowEditQuoteModal] = useState(false);
  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Companies for filters
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);
  
  // Load companies for filters
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companiesAPI.list(0, 1000);
        setCompanies(data.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        // Silent fail for filters
      }
    };
    loadCompanies();
  }, []);
  
  // React Query hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const {
    data: quotesData,
    fetchNextPage: fetchNextQuotes,
    hasNextPage: hasNextQuotes,
    isFetchingNextPage: isFetchingNextQuotes,
    isLoading: loadingQuotes,
    error: quotesError,
  } = useInfiniteQuotes(20, {
    status: filterStatus.length === 1 && filterStatus[0] ? filterStatus[0] : undefined,
    company_id: filterCompany.length === 1 && filterCompany[0] ? parseInt(filterCompany[0]) : undefined,
  });
  
  const {
    data: submissionsData,
    fetchNextPage: fetchNextSubmissions,
    hasNextPage: hasNextSubmissions,
    isFetchingNextPage: isFetchingNextSubmissions,
    isLoading: loadingSubmissions,
    error: submissionsError,
  } = useInfiniteSubmissions(20, {
    status: filterStatus.length === 1 && filterStatus[0] ? filterStatus[0] : undefined,
    company_id: filterCompany.length === 1 && filterCompany[0] ? parseInt(filterCompany[0]) : undefined,
    type: filterType.length === 1 && filterType[0] ? filterType[0] : undefined,
  });
  
  // Mutations
  const createQuoteMutation = useCreateQuote();
  const updateQuoteMutation = useUpdateQuote();
  const deleteQuoteMutation = useDeleteQuote();
  const createSubmissionMutation = useCreateSubmission();
  const updateSubmissionMutation = useUpdateSubmission();
  const deleteSubmissionMutation = useDeleteSubmission();
  
  // Flatten data
  const quotes = useMemo(() => quotesData?.pages.flat() || [], [quotesData]);
  const submissions = useMemo(() => submissionsData?.pages.flat() || [], [submissionsData]);
  
  // Load companies for filters
  useState(() => {
    const loadCompanies = async () => {
      try {
        const data = await companiesAPI.list(0, 1000);
        setCompanies(data.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        // Silent fail for filters
      }
    };
    loadCompanies();
  });
  
  // Filtered data
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch = !debouncedSearchQuery || 
        quote.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        quote.quote_number?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        quote.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(quote.status);
      const matchesCompany = filterCompany.length === 0 || 
        (quote.company_id && filterCompany.includes(String(quote.company_id)));
      
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [quotes, debouncedSearchQuery, filterStatus, filterCompany]);
  
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch = !debouncedSearchQuery || 
        submission.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        submission.submission_number?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        submission.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(submission.status);
      const matchesCompany = filterCompany.length === 0 || 
        (submission.company_id && filterCompany.includes(String(submission.company_id)));
      const matchesType = filterType.length === 0 || 
        (submission.type && filterType.includes(submission.type));
      
      return matchesSearch && matchesStatus && matchesCompany && matchesType;
    });
  }, [submissions, debouncedSearchQuery, filterStatus, filterCompany, filterType]);
  
  // Extract unique statuses and types
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    if (activeTab === 'quotes') {
      quotes.forEach(q => q.status && statuses.add(q.status));
    } else {
      submissions.forEach(s => s.status && statuses.add(s.status));
    }
    return Array.from(statuses).sort();
  }, [quotes, submissions, activeTab]);
  
  const typeOptions = useMemo(() => {
    const types = new Set<string>();
    submissions.forEach(s => s.type && types.add(s.type));
    return Array.from(types).sort();
  }, [submissions]);
  
  // Loading and error states
  const loading = activeTab === 'quotes' ? loadingQuotes : loadingSubmissions;
  const loadingMore = activeTab === 'quotes' ? isFetchingNextQuotes : isFetchingNextSubmissions;
  const hasMore = activeTab === 'quotes' ? hasNextQuotes : hasNextSubmissions;
  const error = activeTab === 'quotes' 
    ? (quotesError ? handleApiError(quotesError).message : null)
    : (submissionsError ? handleApiError(submissionsError).message : null);
  
  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      if (activeTab === 'quotes') {
        fetchNextQuotes();
      } else {
        fetchNextSubmissions();
      }
    }
  }, [loadingMore, hasMore, activeTab, fetchNextQuotes, fetchNextSubmissions]);
  
  // Handlers
  const handleCreateQuote = useCallback(async (data: QuoteCreate | QuoteUpdate) => {
    try {
      await createQuoteMutation.mutateAsync(data as QuoteCreate);
      setShowCreateQuoteModal(false);
      showToast({
        message: 'Devis créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du devis',
        type: 'error',
      });
    }
  }, [createQuoteMutation, showToast]);
  
  const handleUpdateQuote = useCallback(async (id: number, data: QuoteUpdate) => {
    try {
      await updateQuoteMutation.mutateAsync({ id, data });
      setShowEditQuoteModal(false);
      setSelectedQuote(null);
      showToast({
        message: 'Devis mis à jour avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour du devis',
        type: 'error',
      });
    }
  }, [updateQuoteMutation, showToast]);
  
  const handleDeleteQuote = useCallback(async (quoteId: number, quoteTitle?: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le devis "${quoteTitle || quoteId}" ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      await deleteQuoteMutation.mutateAsync(quoteId);
      showToast({
        message: 'Devis supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du devis',
        type: 'error',
      });
    }
  }, [deleteQuoteMutation, showToast]);
  
  const handleCreateSubmission = useCallback(async (submissionData: SubmissionCreate) => {
    try {
      await createSubmissionMutation.mutateAsync(submissionData);
      setShowCreateSubmissionModal(false);
      showToast({
        message: 'Soumission créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de la soumission',
        type: 'error',
      });
      throw err;
    }
  }, [createSubmissionMutation, showToast]);
  
  const handleUpdateSubmission = useCallback(async (id: number, data: SubmissionUpdate) => {
    try {
      await updateSubmissionMutation.mutateAsync({ id, data });
      setShowEditSubmissionModal(false);
      setSelectedSubmission(null);
      showToast({
        message: 'Soumission mise à jour avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour de la soumission',
        type: 'error',
      });
    }
  }, [updateSubmissionMutation, showToast]);
  
  const handleDeleteSubmission = useCallback(async (submissionId: number, submissionTitle?: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la soumission "${submissionTitle || submissionId}" ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      await deleteSubmissionMutation.mutateAsync(submissionId);
      showToast({
        message: 'Soumission supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de la soumission',
        type: 'error',
      });
    }
  }, [deleteSubmissionMutation, showToast]);
  
  const handleSaveDraftSubmission = useCallback(async (submissionData: SubmissionCreate) => {
    try {
      const draftData = { ...submissionData, status: 'draft' };
      await createSubmissionMutation.mutateAsync(draftData);
      showToast({
        message: 'Brouillon sauvegardé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde du brouillon',
        type: 'error',
      });
      throw err;
    }
  }, [createSubmissionMutation, showToast]);
  
  // Duplicate handlers
  const handleDuplicateQuote = async (quote: Quote) => {
    try {
      const duplicateData: QuoteCreate = {
        title: `${quote.title} (Copie)`,
        description: quote.description,
        company_id: quote.company_id,
        amount: quote.amount,
        currency: quote.currency,
        pricing_type: quote.pricing_type,
        status: 'draft',
        valid_until: quote.valid_until,
        notes: quote.notes,
        line_items: quote.line_items,
      };
      await createQuoteMutation.mutateAsync(duplicateData);
      showToast({
        message: 'Devis dupliqué avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la duplication du devis',
        type: 'error',
      });
    }
  };
  
  const handleDuplicateSubmission = async (submission: Submission) => {
    try {
      const duplicateData: SubmissionCreate = {
        submission_number: `${submission.submission_number}-COPY`,
        title: `${submission.title} (Copie)`,
        description: submission.description,
        company_id: submission.company_id,
        type: submission.type,
        content: submission.content,
        status: 'draft',
        deadline: submission.deadline,
        notes: submission.notes,
        attachments: submission.attachments,
      };
      await createSubmissionMutation.mutateAsync(duplicateData);
      showToast({
        message: 'Soumission dupliquée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la duplication de la soumission',
        type: 'error',
      });
    }
  };
  
  // Generate PDF for submission
  const handleGeneratePDF = async (submissionId: number) => {
    try {
      setIsExporting(true);
      await submissionsAPI.generatePDF(submissionId);
      showToast({
        message: 'PDF généré avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la génération du PDF',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Export handlers
  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      if (activeTab === 'quotes') {
        const csvData = filteredQuotes.map(q => ({
          Numéro: q.quote_number,
          Titre: q.title || '',
          Entreprise: q.company_name || '',
          Montant: q.amount || 0,
          Statut: q.status,
          'Date de validité': q.valid_until || '',
        }));
        
        const headers = Object.keys(csvData[0] || {});
        const csvRows = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => {
            const value = row[header as keyof typeof row];
            if (value === null || value === undefined) return '';
            return String(value).replace(/"/g, '""');
          }).join(','))
        ];
        const csv = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const csvData = filteredSubmissions.map(s => ({
          Numéro: s.submission_number,
          Titre: s.title || '',
          Entreprise: s.company_name || '',
          Type: s.type || '',
          Statut: s.status,
          'Date d\'échéance': s.deadline || '',
        }));
        
        const headers = Object.keys(csvData[0] || {});
        const csvRows = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => {
            const value = row[header as keyof typeof row];
            if (value === null || value === undefined) return '';
            return String(value).replace(/"/g, '""');
          }).join(','))
        ];
        const csv = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `soumissions_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      showToast({
        message: `Export ${format.toUpperCase()} réussi`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'export',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Bulk delete handlers
  const handleDeleteSelectedQuotes = async () => {
    if (selectedQuotes.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedQuotes.size} devis ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedQuotes).map(id =>
        deleteQuoteMutation.mutateAsync(id)
      );
      await Promise.all(deletePromises);
      setSelectedQuotes(new Set());
      showToast({
        message: `${selectedQuotes.size} devis supprimés avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };
  
  const handleDeleteSelectedSubmissions = async () => {
    if (selectedSubmissions.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSubmissions.size} soumissions ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedSubmissions).map(id =>
        deleteSubmissionMutation.mutateAsync(id)
      );
      await Promise.all(deletePromises);
      setSelectedSubmissions(new Set());
      showToast({
        message: `${selectedSubmissions.size} soumissions supprimées avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };
  
  // Toggle selection
  const toggleQuoteSelection = (quoteId: number) => {
    setSelectedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId);
      } else {
        newSet.add(quoteId);
      }
      return newSet;
    });
  };
  
  const toggleSubmissionSelection = (submissionId: number) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };
  
  const toggleSelectAllQuotes = () => {
    if (selectedQuotes.size === filteredQuotes.length) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(filteredQuotes.map(q => q.id)));
    }
  };
  
  const toggleSelectAllSubmissions = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.id)));
    }
  };
  
  // Status and icon helpers
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'brouillon':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'sent':
      case 'envoyé':
      case 'submitted':
      case 'soumis':
        return 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400';
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
  const quotesStats = useMemo(() => {
    const total = filteredQuotes.length;
    const totalAmount = filteredQuotes.reduce((sum, q) => sum + (q.amount || 0), 0);
    const accepted = filteredQuotes.filter(q => q.status === 'accepted').length;
    const pending = filteredQuotes.filter(q => q.status === 'sent').length;
    return { total, totalAmount, accepted, pending };
  }, [filteredQuotes]);
  
  const submissionsStats = useMemo(() => {
    const total = filteredSubmissions.length;
    const totalAmount = filteredSubmissions.reduce((sum, s) => {
      const amount = s.content?.amount || s.content?.value || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);
    const won = filteredSubmissions.filter(s => s.status === 'accepted').length;
    const pending = filteredSubmissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
    return { total, totalAmount, won, pending };
  }, [filteredSubmissions]);
  
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
  
  const hasActiveFilters = searchQuery.trim() !== '' || filterStatus.length > 0 || filterCompany.length > 0 || filterType.length > 0;
  const selectedCount = activeTab === 'quotes' ? selectedQuotes.size : selectedSubmissions.size;
  
  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
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
                  {activeTab === 'quotes' ? 'Devis' : 'Soumissions'}
                </h1>
                <p className="text-white/80 text-lg">
                  {activeTab === 'quotes' 
                    ? 'Gérez vos devis et propositions commerciales' 
                    : 'Suivez vos soumissions aux appels d\'offres'}
                </p>
              </div>
              <div className="flex gap-2">
                <Dropdown
                  trigger={
                    <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  }
                  items={[
                    {
                      label: 'Exporter en Excel',
                      onClick: () => handleExport('excel'),
                      icon: <Download className="w-4 h-4" />,
                      disabled: isExporting || (activeTab === 'quotes' ? filteredQuotes.length === 0 : filteredSubmissions.length === 0),
                    },
                    {
                      label: 'Exporter en CSV',
                      onClick: () => handleExport('csv'),
                      icon: <Download className="w-4 h-4" />,
                      disabled: isExporting || (activeTab === 'quotes' ? filteredQuotes.length === 0 : filteredSubmissions.length === 0),
                    },
                  ]}
                  position="bottom"
                />
                <Button 
                  className="bg-white text-primary-500 hover:bg-white/90"
                  onClick={() => activeTab === 'quotes' ? setShowCreateQuoteModal(true) : setShowCreateSubmissionModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === 'quotes' ? 'Nouveau devis' : 'Nouvelle soumission'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('quotes');
              setSelectedQuotes(new Set());
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'quotes'
                ? 'bg-primary-500 text-white shadow-lg'
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
            onClick={() => {
              setActiveTab('submissions');
              setSelectedSubmissions(new Set());
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'submissions'
                ? 'bg-primary-500 text-white shadow-lg'
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
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
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

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Target className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {getTotal()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
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

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
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

        {/* Filters */}
        <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          <div className="space-y-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={`Rechercher ${activeTab === 'quotes' ? 'un devis' : 'une soumission'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter */}
              <MultiSelect
                options={statusOptions.map((status) => ({
                  label: status,
                  value: status,
                }))}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Filtrer par statut"
                className="min-w-[180px]"
              />

              {/* Company filter */}
              {companies.length > 0 && (
                <MultiSelect
                  options={companies.map((company) => ({
                    label: company.name,
                    value: String(company.id),
                  }))}
                  value={filterCompany}
                  onChange={setFilterCompany}
                  placeholder="Filtrer par entreprise"
                  className="min-w-[180px]"
                />
              )}

              {/* Type filter (submissions only) */}
              {activeTab === 'submissions' && typeOptions.length > 0 && (
                <MultiSelect
                  options={typeOptions.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                  value={filterType}
                  onChange={setFilterType}
                  placeholder="Filtrer par type"
                  className="min-w-[180px]"
                />
              )}

              {/* Bulk actions */}
              {selectedCount > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={activeTab === 'quotes' ? handleDeleteSelectedQuotes : handleDeleteSelectedSubmissions}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              )}

              {/* View mode toggle */}
              <div className={selectedCount > 0 ? '' : 'ml-auto flex gap-2'}>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
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
          <>
            {activeTab === 'quotes' ? (
              filteredQuotes.length === 0 ? (
                <div className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Aucun devis trouvé
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {hasActiveFilters
                      ? 'Essayez de modifier vos filtres'
                      : 'Créez votre premier devis'}
                  </p>
                  <Button onClick={() => setShowCreateQuoteModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un devis
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuotes.map((quote) => (
                    <Card 
                      key={quote.id} 
                      className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500/30 transition-all cursor-pointer group relative"
                    >
                      <div
                        onClick={(e: React.MouseEvent) => {
                          if ((e.target as HTMLElement).closest('.selection-checkbox') || 
                              (e.target as HTMLElement).closest('.dropdown-trigger')) {
                            return;
                          }
                          const locale = window.location.pathname.split('/')[1] || 'fr';
                          router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quote.id}`);
                        }}
                      >
                        {/* Selection checkbox */}
                        <div className="absolute top-4 left-4 z-10">
                          <button
                            className="selection-checkbox p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              toggleQuoteSelection(quote.id);
                            }}
                          >
                            {selectedQuotes.has(quote.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 ml-8">
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
                          <Dropdown
                            trigger={
                              <button 
                                className="dropdown-trigger p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                }}
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            }
                            items={[
                              {
                                label: 'Voir les détails',
                                onClick: () => {
                                  const locale = window.location.pathname.split('/')[1] || 'fr';
                                  router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quote.id}`);
                                },
                                icon: <Eye className="w-4 h-4" />,
                              },
                              {
                                label: 'Modifier',
                                onClick: () => {
                                  setSelectedQuote(quote);
                                  setShowEditQuoteModal(true);
                                },
                                icon: <Edit className="w-4 h-4" />,
                              },
                              {
                                label: 'Dupliquer',
                                onClick: () => handleDuplicateQuote(quote),
                                icon: <Copy className="w-4 h-4" />,
                              },
                              { divider: true },
                              {
                                label: 'Supprimer',
                                onClick: () => handleDeleteQuote(quote.id, quote.title),
                                icon: <Trash2 className="w-4 h-4" />,
                                variant: 'danger',
                              },
                            ]}
                            position="bottom"
                          />
                        </div>

                        <Badge className={`${getStatusColor(quote.status)} mb-4`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(quote.status)}
                            <span>{quote.status}</span>
                          </div>
                        </Badge>

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
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select all header */}
                  {filteredQuotes.length > 0 && (
                    <div className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 flex items-center gap-3">
                      <button
                        onClick={toggleSelectAllQuotes}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        {selectedQuotes.size === filteredQuotes.length ? (
                          <CheckSquare className="w-5 h-5 text-[#523DC9]" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedQuotes.size > 0 
                          ? `${selectedQuotes.size} sélectionné${selectedQuotes.size > 1 ? 's' : ''}`
                          : 'Sélectionner tout'}
                      </span>
                    </div>
                  )}
                  {filteredQuotes.map((quote) => (
                    <Card 
                      key={quote.id} 
                      className="glass-card p-4 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer group relative"
                    >
                      <div
                        onClick={(e: React.MouseEvent) => {
                          if ((e.target as HTMLElement).closest('.selection-checkbox') || 
                              (e.target as HTMLElement).closest('.dropdown-trigger')) {
                            return;
                          }
                          const locale = window.location.pathname.split('/')[1] || 'fr';
                          router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quote.id}`);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            className="selection-checkbox p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              toggleQuoteSelection(quote.id);
                            }}
                          >
                            {selectedQuotes.has(quote.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-[#523DC9]" />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {quote.quote_number}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                              {quote.title || '-'}
                            </h3>
                            <Badge className={getStatusColor(quote.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(quote.status)}
                                <span>{quote.status}</span>
                              </div>
                            </Badge>
                          </div>

                          {quote.company_name && (
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                              <Building2 className="w-4 h-4" />
                              <span className="truncate">{quote.company_name}</span>
                            </div>
                          )}

                          <div className="text-right min-w-[120px]">
                            <div className="text-lg font-bold text-[#10B981]">
                              {formatCurrency(quote.amount || 0)}
                            </div>
                          </div>

                          <Dropdown
                            trigger={
                              <Button 
                                variant="outline"
                                size="sm"
                                className="dropdown-trigger"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            }
                            items={[
                              {
                                label: 'Voir les détails',
                                onClick: () => {
                                  const locale = window.location.pathname.split('/')[1] || 'fr';
                                  router.push(`/${locale}/dashboard/commercial/soumissions/quotes/${quote.id}`);
                                },
                                icon: <Eye className="w-4 h-4" />,
                              },
                              {
                                label: 'Modifier',
                                onClick: () => {
                                  setSelectedQuote(quote);
                                  setShowEditQuoteModal(true);
                                },
                                icon: <Edit className="w-4 h-4" />,
                              },
                              {
                                label: 'Dupliquer',
                                onClick: () => handleDuplicateQuote(quote),
                                icon: <Copy className="w-4 h-4" />,
                              },
                              { divider: true },
                              {
                                label: 'Supprimer',
                                onClick: () => handleDeleteQuote(quote.id, quote.title),
                                icon: <Trash2 className="w-4 h-4" />,
                                variant: 'danger',
                              },
                            ]}
                            position="bottom"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              filteredSubmissions.length === 0 ? (
                <div className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
                  <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Aucune soumission trouvée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {hasActiveFilters
                      ? 'Essayez de modifier vos filtres'
                      : 'Créez votre première soumission'}
                  </p>
                  <Button onClick={() => setShowCreateSubmissionModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une soumission
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubmissions.map((submission) => (
                    <Card 
                      key={submission.id} 
                      className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500/30 transition-all cursor-pointer group relative"
                      onClick={() => {
                        const locale = window.location.pathname.split('/')[1] || 'fr';
                        router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submission.id}`);
                      }}
                      onMouseDown={(e: React.MouseEvent) => {
                        if ((e.target as HTMLElement).closest('.selection-checkbox') || 
                            (e.target as HTMLElement).closest('.dropdown-trigger')) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-4 left-4 z-10">
                        <button
                          className="selection-checkbox p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubmissionSelection(submission.id);
                          }}
                        >
                          {selectedSubmissions.has(submission.id) ? (
                            <CheckSquare className="w-5 h-5 text-[#523DC9]" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 ml-8">
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
                        <Dropdown
                          trigger={
                            <button 
                              className="dropdown-trigger p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          }
                          items={[
                            {
                              label: 'Voir les détails',
                              onClick: () => {
                                const locale = window.location.pathname.split('/')[1] || 'fr';
                                router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submission.id}`);
                              },
                              icon: <Eye className="w-4 h-4" />,
                            },
                            {
                              label: 'Modifier',
                              onClick: () => {
                                setSelectedSubmission(submission);
                                setShowEditSubmissionModal(true);
                              },
                              icon: <Edit className="w-4 h-4" />,
                            },
                            {
                              label: 'Générer PDF',
                              onClick: () => handleGeneratePDF(submission.id),
                              icon: <FileDown className="w-4 h-4" />,
                              disabled: isExporting,
                            },
                            {
                              label: 'Dupliquer',
                              onClick: () => handleDuplicateSubmission(submission),
                              icon: <Copy className="w-4 h-4" />,
                            },
                            { divider: true },
                            {
                              label: 'Supprimer',
                              onClick: () => handleDeleteSubmission(submission.id, submission.title),
                              icon: <Trash2 className="w-4 h-4" />,
                              variant: 'danger',
                            },
                          ]}
                          position="bottom"
                        />
                      </div>

                      <Badge className={`${getStatusColor(submission.status)} mb-4`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(submission.status)}
                          <span>{submission.status}</span>
                        </div>
                      </Badge>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Building2 className="w-4 h-4" />
                          <span>{submission.company_name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Échéance: {formatDate(submission.deadline)}</span>
                        </div>
                        {submission.content?.probability !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Target className="w-4 h-4" />
                            <span>Probabilité: {submission.content.probability}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-2xl font-bold text-[#10B981]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {formatCurrency((submission.content?.amount || submission.content?.value || 0) as number)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select all header */}
                  {filteredSubmissions.length > 0 && (
                    <div className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 flex items-center gap-3">
                      <button
                        onClick={toggleSelectAllSubmissions}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        {selectedSubmissions.size === filteredSubmissions.length ? (
                          <CheckSquare className="w-5 h-5 text-[#523DC9]" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedSubmissions.size > 0 
                          ? `${selectedSubmissions.size} sélectionnée${selectedSubmissions.size > 1 ? 's' : ''}`
                          : 'Sélectionner tout'}
                      </span>
                    </div>
                  )}
                  {filteredSubmissions.map((submission) => (
                    <Card 
                      key={submission.id} 
                      className="glass-card p-4 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer group relative"
                    >
                      <div
                        onClick={(e: React.MouseEvent) => {
                          if ((e.target as HTMLElement).closest('.selection-checkbox') || 
                              (e.target as HTMLElement).closest('.dropdown-trigger')) {
                            return;
                          }
                          const locale = window.location.pathname.split('/')[1] || 'fr';
                          router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submission.id}`);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            className="selection-checkbox p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              toggleSubmissionSelection(submission.id);
                            }}
                          >
                            {selectedSubmissions.has(submission.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileCheck className="w-4 h-4 text-[#523DC9]" />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {submission.submission_number}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                              {submission.title || '-'}
                            </h3>
                            <Badge className={getStatusColor(submission.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(submission.status)}
                                <span>{submission.status}</span>
                              </div>
                            </Badge>
                          </div>

                          {submission.company_name && (
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                              <Building2 className="w-4 h-4" />
                              <span className="truncate">{submission.company_name}</span>
                            </div>
                          )}

                          <div className="text-right min-w-[120px]">
                            <div className="text-lg font-bold text-[#10B981]">
                              {formatCurrency((submission.content?.amount || submission.content?.value || 0) as number)}
                            </div>
                          </div>

                          <Dropdown
                            trigger={
                              <Button 
                                variant="outline"
                                size="sm"
                                className="dropdown-trigger"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            }
                            items={[
                              {
                                label: 'Voir les détails',
                                onClick: () => {
                                  const locale = window.location.pathname.split('/')[1] || 'fr';
                                  router.push(`/${locale}/dashboard/commercial/soumissions/submissions/${submission.id}`);
                                },
                                icon: <Eye className="w-4 h-4" />,
                              },
                              {
                                label: 'Modifier',
                                onClick: () => {
                                  setSelectedSubmission(submission);
                                  setShowEditSubmissionModal(true);
                                },
                                icon: <Edit className="w-4 h-4" />,
                              },
                              {
                                label: 'Générer PDF',
                                onClick: () => handleGeneratePDF(submission.id),
                                icon: <FileDown className="w-4 h-4" />,
                                disabled: isExporting,
                              },
                              {
                                label: 'Dupliquer',
                                onClick: () => handleDuplicateSubmission(submission),
                                icon: <Copy className="w-4 h-4" />,
                              },
                              { divider: true },
                              {
                                label: 'Supprimer',
                                onClick: () => handleDeleteSubmission(submission.id, submission.title),
                                icon: <Trash2 className="w-4 h-4" />,
                                variant: 'danger',
                              },
                            ]}
                            position="bottom"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
            
            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Chargement...' : 'Charger plus'}
                </Button>
              </div>
            )}
          </>
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
            loading={createQuoteMutation.isPending}
          />
        </Modal>

        {/* Edit Quote Modal */}
        <Modal
          isOpen={showEditQuoteModal}
          onClose={() => {
            setShowEditQuoteModal(false);
            setSelectedQuote(null);
          }}
          title="Modifier le devis"
          size="xl"
        >
          {selectedQuote && (
            <QuoteForm
              quote={selectedQuote}
              onSubmit={(data) => handleUpdateQuote(selectedQuote.id, data)}
              onCancel={() => {
                setShowEditQuoteModal(false);
                setSelectedQuote(null);
              }}
              loading={updateQuoteMutation.isPending}
            />
          )}
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
            loading={createSubmissionMutation.isPending}
          />
        </Modal>

        {/* Edit Submission Modal */}
        <Modal
          isOpen={showEditSubmissionModal}
          onClose={() => {
            setShowEditSubmissionModal(false);
            setSelectedSubmission(null);
          }}
          title="Modifier la soumission"
          size="full"
        >
          {selectedSubmission && (
            <SubmissionWizard
              initialData={(() => {
                // Convert Submission to SubmissionWizardData format
                const content = selectedSubmission.content || {};
                return {
                  coverTitle: selectedSubmission.title || '',
                  coverSubtitle: content.coverSubtitle || '',
                  coverDate: (() => {
                    if (selectedSubmission.submitted_at) {
                      const date = selectedSubmission.submitted_at.split('T')[0];
                      if (date) return date;
                    }
                    const today = new Date().toISOString().split('T')[0];
                    return today || '';
                  })(),
                  coverClient: selectedSubmission.company_name || '',
                  coverCompany: selectedSubmission.company_name || '',
                  context: content.context || '',
                  introduction: content.introduction || '',
                  mandate: content.mandate || '',
                  objectives: Array.isArray(content.objectives) ? content.objectives : [],
                  processSteps: Array.isArray(content.processSteps) ? content.processSteps : [],
                  budgetItems: Array.isArray(content.budgetItems) ? content.budgetItems : [],
                  budgetTotal: typeof content.budgetTotal === 'number' ? content.budgetTotal : (typeof content.amount === 'number' ? content.amount : (typeof content.value === 'number' ? content.value : 0)),
                  currency: typeof content.currency === 'string' ? content.currency : 'CAD',
                  teamMembers: Array.isArray(content.teamMembers) ? content.teamMembers : [],
                  companyId: selectedSubmission.company_id,
                  type: selectedSubmission.type || '',
                  deadline: selectedSubmission.deadline,
                };
              })()}
              onSubmit={(data) => handleUpdateSubmission(selectedSubmission.id, data)}
              onCancel={() => {
                setShowEditSubmissionModal(false);
                setSelectedSubmission(null);
              }}
              onSaveDraft={async (data) => {
                await handleUpdateSubmission(selectedSubmission.id, { ...data, status: 'draft' });
              }}
              loading={updateSubmissionMutation.isPending}
            />
          )}
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
