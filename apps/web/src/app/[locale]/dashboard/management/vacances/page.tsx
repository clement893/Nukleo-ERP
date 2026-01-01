'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type VacationRequest } from '@/lib/api/vacationRequests';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  useInfiniteVacationRequests,
  useApproveVacationRequest,
  useRejectVacationRequest,
} from '@/lib/query/vacationRequests';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import Textarea from '@/components/ui/Textarea';

function VacancesContent() {
  const { showToast } = useToast();
  
  // React Query hooks
  const {
    data: requestsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteVacationRequests({ 
    pageSize: 20,
  });

  // Mutations
  const approveMutation = useApproveVacationRequest();
  const rejectMutation = useRejectVacationRequest();
  
  // Flatten pages into single array
  const requests = useMemo(() => {
    return requestsData?.pages.flat() || [];
  }, [requestsData]);
  
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Load more requests for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') {
      return requests;
    }
    return requests.filter(req => req.status === filterStatus);
  }, [requests, filterStatus]);

  // Handle approve
  const handleApprove = async (request: VacationRequest) => {
    try {
      await approveMutation.mutateAsync(request.id);
      showToast({
        message: 'Demande de vacances approuvée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'approbation',
        type: 'error',
      });
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      await rejectMutation.mutateAsync({
        requestId: selectedRequest.id,
        rejectionReason: rejectionReason || undefined,
      });
      showToast({
        message: 'Demande de vacances rejetée',
        type: 'success',
      });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du rejet',
        type: 'error',
      });
    }
  };

  // Calculate number of days
  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Table columns
  const columns: Column<VacationRequest>[] = [
    {
      key: 'employee',
      label: 'Employé',
      sortable: false,
      render: (_value, request) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {request.employee_first_name} {request.employee_last_name}
            </div>
            {request.employee_email && (
              <div className="text-sm text-muted-foreground">{request.employee_email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      label: 'Période',
      sortable: false,
      render: (_value, request) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{formatDate(request.start_date)}</div>
            <div className="text-sm text-muted-foreground">
              jusqu'au {formatDate(request.end_date)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {calculateDays(request.start_date, request.end_date)} jour(s)
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => {
        const status = String(value);
        const statusConfig = {
          pending: { label: 'En attente', color: 'bg-yellow-500 hover:bg-yellow-600', icon: Clock },
          approved: { label: 'Approuvée', color: 'bg-green-500 hover:bg-green-600', icon: CheckCircle },
          rejected: { label: 'Rejetée', color: 'bg-red-500 hover:bg-red-600', icon: XCircle },
          cancelled: { label: 'Annulée', color: 'bg-gray-500 hover:bg-gray-600', icon: XCircle },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;
        
        return (
          <Badge variant="default" className={`${config.color} text-white flex items-center gap-1 w-fit`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'reason',
      label: 'Raison',
      sortable: false,
      render: (value) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {value ? String(value) : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_value, request) => (
        <div className="flex items-center gap-2">
          {request.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApprove(request)}
                disabled={approveMutation.isPending}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approuver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRequest(request);
                  setShowRejectModal(true);
                }}
                disabled={rejectMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeter
              </Button>
            </>
          )}
          {request.status === 'approved' && request.approved_by_name && (
            <div className="text-xs text-muted-foreground">
              Approuvé par {request.approved_by_name}
            </div>
          )}
          {request.status === 'rejected' && request.rejection_reason && (
            <div className="text-xs text-muted-foreground max-w-xs truncate" title={request.rejection_reason}>
              Raison: {request.rejection_reason}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Demandes de vacances"
        description="Gérez les demandes de vacances de vos employés"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Demandes de vacances' },
        ]}
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="glass-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtrer par statut:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
              >
                <option value="all">Toutes</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {loading && requests.length === 0 ? (
          <div className="py-12 text-center">
            <Loading />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Aucune demande de vacances trouvée</p>
          </div>
        ) : (
          <DataTable
            data={filteredRequests as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={false}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title="Rejeter la demande de vacances"
        size="md"
      >
        <div className="space-y-4">
          {selectedRequest && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Demande de:</p>
              <p className="text-sm">
                {selectedRequest.employee_first_name} {selectedRequest.employee_last_name}
              </p>
              <p className="text-sm mt-2">
                Du {formatDate(selectedRequest.start_date)} au {formatDate(selectedRequest.end_date)}
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Raison du rejet (optionnel)
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez pourquoi cette demande est rejetée..."
              rows={4}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectionReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              Rejeter la demande
            </Button>
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}

export default function VacancesPage() {
  return <VacancesContent />;
}
