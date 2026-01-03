'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  MessageSquare, Search, CheckCircle2, Clock, XCircle, 
  AlertCircle, Trash2, Send, Eye, User, Calendar, ExternalLink,
  Bug, Lightbulb, HelpCircle, AlertTriangle, Heart, MoreHorizontal, Settings
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, useToast, Select, Textarea } from '@/components/ui';
import { 
  useFeedback, 
  useFeedbackDetail,
  useUpdateFeedback,
  useDeleteFeedback
} from '@/lib/query/queries';
import { type Feedback, type FeedbackStatus, type FeedbackType } from '@/lib/api/feedback';
import { handleApiError } from '@/lib/errors/api';
import { Loading } from '@/components/ui';

const statusConfig = {
  open: { label: 'Ouvert', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: AlertCircle },
  resolved: { label: 'Résolu', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  closed: { label: 'Fermé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: XCircle },
};

const typeConfig = {
  bug: { label: 'Bug', color: 'bg-red-500/10 text-red-600', icon: Bug },
  feature_request: { label: 'Demande de fonctionnalité', color: 'bg-purple-500/10 text-purple-600', icon: Lightbulb },
  question: { label: 'Question', color: 'bg-blue-500/10 text-blue-600', icon: HelpCircle },
  complaint: { label: 'Plainte', color: 'bg-orange-500/10 text-orange-600', icon: AlertTriangle },
  praise: { label: 'Éloge', color: 'bg-green-500/10 text-green-600', icon: Heart },
  other: { label: 'Autre', color: 'bg-gray-500/10 text-gray-600', icon: MoreHorizontal },
};

const priorityConfig = {
  1: { label: 'Faible', color: 'bg-gray-500/10 text-gray-600' },
  2: { label: 'Moyenne', color: 'bg-blue-500/10 text-blue-600' },
  3: { label: 'Élevée', color: 'bg-orange-500/10 text-orange-600' },
  4: { label: 'Critique', color: 'bg-red-500/10 text-red-600' },
};

export default function AdminFeedbackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<FeedbackStatus>('resolved');
  const { showToast } = useToast();

  // Fetch feedback
  const { data: feedbackList = [], isLoading } = useFeedback({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    limit: 1000,
  });

  // Fetch selected feedback details
  const { data: selectedFeedback } = useFeedbackDetail(
    selectedFeedbackId || 0,
    !!selectedFeedbackId && viewMode === 'detail'
  );

  // Mutations
  const updateMutation = useUpdateFeedback();
  const deleteMutation = useDeleteFeedback();

  // Filter feedback by search query
  const filteredFeedback = useMemo(() => {
    if (!searchQuery) return feedbackList;
    
    const query = searchQuery.toLowerCase();
    return feedbackList.filter((feedback: Feedback) => {
      return (
        feedback.subject.toLowerCase().includes(query) ||
        feedback.message.toLowerCase().includes(query) ||
        feedback.id.toString().includes(query)
      );
    });
  }, [feedbackList, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = feedbackList.length;
    const open = feedbackList.filter((f: Feedback) => f.status === 'open').length;
    const inProgress = feedbackList.filter((f: Feedback) => f.status === 'in_progress').length;
    const resolved = feedbackList.filter((f: Feedback) => f.status === 'resolved').length;
    const closed = feedbackList.filter((f: Feedback) => f.status === 'closed').length;
    const critical = feedbackList.filter((f: Feedback) => f.priority === 4).length;

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      critical,
    };
  }, [feedbackList]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewFeedback = (feedbackId: number) => {
    setSelectedFeedbackId(feedbackId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedFeedbackId(null);
  };

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedbackId(feedback.id);
    setResponseText(feedback.response || '');
    setNewStatus(feedback.status === 'open' ? 'in_progress' : feedback.status);
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedbackId) return;
    
    try {
      await updateMutation.mutateAsync({
        id: selectedFeedbackId,
        data: {
          response: responseText,
          status: newStatus,
        },
      });
      showToast({
        message: 'Réponse enregistrée avec succès',
        type: 'success',
      });
      setShowResponseModal(false);
      setResponseText('');
      if (viewMode === 'detail') {
        // Refresh the detail view
        window.location.reload();
      }
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de l\'enregistrement de la réponse',
        type: 'error',
      });
    }
  };

  const handleDeleteClick = (feedbackId: number) => {
    setFeedbackToDelete(feedbackId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!feedbackToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(feedbackToDelete);
      showToast({
        message: 'Ticket supprimé avec succès',
        type: 'success',
      });
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
      if (selectedFeedbackId === feedbackToDelete) {
        handleBackToList();
      }
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const handleStatusChange = async (feedbackId: number, newStatus: FeedbackStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: feedbackId,
        data: { status: newStatus },
      });
      showToast({
        message: 'Statut mis à jour avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour du statut',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (viewMode === 'detail' && selectedFeedback) {
    const StatusIcon = statusConfig[selectedFeedback.status as keyof typeof statusConfig]?.icon || Clock;
    const TypeIcon = typeConfig[selectedFeedback.type as keyof typeof typeConfig]?.icon || MessageSquare;

    return (
      <PageContainer maxWidth="full">
        <MotionDiv variant="slideUp" duration="normal">
          {/* Back Button */}
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={handleBackToList}
          >
            ← Retour à la liste
          </Button>

          {/* Feedback Detail Header */}
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
                    <TypeIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white mb-1 font-nukleo">
                      Ticket #{selectedFeedback.id}
                    </h1>
                    <p className="text-white/80 text-sm">{selectedFeedback.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig[selectedFeedback.status as keyof typeof statusConfig]?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[selectedFeedback.status as keyof typeof statusConfig]?.label || selectedFeedback.status}
                  </Badge>
                  <Badge className={`${priorityConfig[selectedFeedback.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/10 text-gray-600'} border`}>
                    {priorityConfig[selectedFeedback.priority as keyof typeof priorityConfig]?.label || `Priorité ${selectedFeedback.priority}`}
                  </Badge>
                  {selectedFeedback.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespond(selectedFeedback)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Répondre
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(selectedFeedback.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Feedback Info */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Informations
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                  <Badge className={`${typeConfig[selectedFeedback.type as keyof typeof typeConfig]?.color || 'bg-gray-500/10 text-gray-600'} mt-1`}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {typeConfig[selectedFeedback.type as keyof typeof typeConfig]?.label || selectedFeedback.type}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Priorité</div>
                  <Badge className={`${priorityConfig[selectedFeedback.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/10 text-gray-600'} mt-1`}>
                    {priorityConfig[selectedFeedback.priority as keyof typeof priorityConfig]?.label || `Priorité ${selectedFeedback.priority}`}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Créé le</div>
                  <div className="font-medium">{formatDate(selectedFeedback.created_at)}</div>
                </div>
                {selectedFeedback.url && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Page</div>
                    <a 
                      href={selectedFeedback.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {selectedFeedback.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* User Info */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Utilisateur
              </h3>
              <div className="space-y-3">
                {selectedFeedback.user_id ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">ID Utilisateur</div>
                      <div className="font-medium">#{selectedFeedback.user_id}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">Feedback anonyme</div>
                )}
              </div>
            </Card>

            {/* Status Management */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Gestion du statut
              </h3>
              <div className="space-y-3">
                <Select
                  value={selectedFeedback.status}
                  onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value as FeedbackStatus)}
                  options={[
                    { value: 'open', label: 'Ouvert' },
                    { value: 'in_progress', label: 'En cours' },
                    { value: 'resolved', label: 'Résolu' },
                    { value: 'closed', label: 'Fermé' },
                  ]}
                />
              </div>
            </Card>
          </div>

          {/* Message */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 mb-6">
            <h3 className="font-semibold mb-4">Message</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {selectedFeedback.message}
              </p>
            </div>
          </Card>

          {/* Response */}
          {selectedFeedback.response && (
            <Card className="glass-card p-6 rounded-xl border border-green-500/30 bg-green-500/5 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-green-600" />
                Réponse
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {selectedFeedback.response}
                </p>
              </div>
              {selectedFeedback.responded_at && (
                <div className="mt-4 text-sm text-gray-500">
                  Répondu le {formatDate(selectedFeedback.responded_at)}
                </div>
              )}
            </Card>
          )}

          {!selectedFeedback.response && selectedFeedback.status !== 'closed' && (
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aucune réponse n'a encore été donnée à ce ticket.
                </p>
                <Button
                  variant="primary"
                  onClick={() => handleRespond(selectedFeedback)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Répondre au ticket
                </Button>
              </div>
            </Card>
          )}
        </MotionDiv>
      </PageContainer>
    );
  }

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
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Tickets de Feedback
                  </h1>
                  <p className="text-white/80 text-sm">Gestion des retours utilisateurs et tickets de support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-nukleo-lavender/20">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
            <div className="text-2xl font-bold font-nukleo">{stats.total}</div>
          </Card>
          <Card className="glass-card p-5 rounded-xl border border-blue-500/30 bg-blue-500/5">
            <div className="text-sm text-blue-600 mb-1">Ouverts</div>
            <div className="text-2xl font-bold text-blue-600 font-nukleo">{stats.open}</div>
          </Card>
          <Card className="glass-card p-5 rounded-xl border border-orange-500/30 bg-orange-500/5">
            <div className="text-sm text-orange-600 mb-1">En cours</div>
            <div className="text-2xl font-bold text-orange-600 font-nukleo">{stats.inProgress}</div>
          </Card>
          <Card className="glass-card p-5 rounded-xl border border-green-500/30 bg-green-500/5">
            <div className="text-sm text-green-600 mb-1">Résolus</div>
            <div className="text-2xl font-bold text-green-600 font-nukleo">{stats.resolved}</div>
          </Card>
          <Card className="glass-card p-5 rounded-xl border border-gray-500/30 bg-gray-500/5">
            <div className="text-sm text-gray-600 mb-1">Fermés</div>
            <div className="text-2xl font-bold text-gray-600 font-nukleo">{stats.closed}</div>
          </Card>
          <Card className="glass-card p-5 rounded-xl border border-red-500/30 bg-red-500/5">
            <div className="text-sm text-red-600 mb-1">Critiques</div>
            <div className="text-2xl font-bold text-red-600 font-nukleo">{stats.critical}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par sujet, message ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'open', label: 'Ouvert' },
                  { value: 'in_progress', label: 'En cours' },
                  { value: 'resolved', label: 'Résolu' },
                  { value: 'closed', label: 'Fermé' },
                ]}
              />
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
                options={[
                  { value: 'all', label: 'Tous les types' },
                  { value: 'bug', label: 'Bug' },
                  { value: 'feature_request', label: 'Fonctionnalité' },
                  { value: 'question', label: 'Question' },
                  { value: 'complaint', label: 'Plainte' },
                  { value: 'praise', label: 'Éloge' },
                  { value: 'other', label: 'Autre' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Feedback List */}
        <div className="space-y-3">
          {filteredFeedback.map((feedback: Feedback) => {
            const StatusIcon = statusConfig[feedback.status as keyof typeof statusConfig]?.icon || Clock;
            const TypeIcon = typeConfig[feedback.type as keyof typeof typeConfig]?.icon || MessageSquare;
            
            return (
              <Card 
                key={feedback.id} 
                className="glass-card p-5 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500 transition-all cursor-pointer"
                onClick={() => handleViewFeedback(feedback.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${typeConfig[feedback.type as keyof typeof typeConfig]?.color || 'bg-gray-500/10'} border`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">#{feedback.id}</span>
                        <Badge className={`${statusConfig[feedback.status as keyof typeof statusConfig]?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[feedback.status as keyof typeof statusConfig]?.label || feedback.status}
                        </Badge>
                        <Badge className={`${priorityConfig[feedback.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/10 text-gray-600'} border text-xs`}>
                          {priorityConfig[feedback.priority as keyof typeof priorityConfig]?.label || `P${feedback.priority}`}
                        </Badge>
                      </div>
                      <div className="font-semibold mb-1">{feedback.subject}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {feedback.message}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(feedback.created_at)}
                        </span>
                        {feedback.user_id && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Utilisateur #{feedback.user_id}
                          </span>
                        )}
                        {feedback.response && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Répondu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFeedback(feedback.id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                    {feedback.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespond(feedback);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Répondre
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredFeedback.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun ticket trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Aucun ticket de feedback pour le moment'}
            </p>
          </Card>
        )}

        {/* Response Modal */}
        <Modal
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setResponseText('');
          }}
          title="Répondre au ticket"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Réponse *</label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Votre réponse au ticket..."
                rows={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nouveau statut</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
                options={[
                  { value: 'open', label: 'Ouvert' },
                  { value: 'in_progress', label: 'En cours' },
                  { value: 'resolved', label: 'Résolu' },
                  { value: 'closed', label: 'Fermé' },
                ]}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                }}
                disabled={updateMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitResponse}
                disabled={updateMutation.isPending || !responseText.trim()}
                loading={updateMutation.isPending}
              >
                Enregistrer la réponse
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setFeedbackToDelete(null);
          }}
          title="Supprimer le ticket"
        >
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setFeedbackToDelete(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
