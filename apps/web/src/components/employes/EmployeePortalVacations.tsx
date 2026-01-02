'use client';

import { useState, useMemo } from 'react';
import { Employee } from '@/lib/api/employees';
import { type VacationRequest, type VacationRequestCreate } from '@/lib/api/vacationRequests';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Loading, Alert, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { 
  useEmployeeVacationRequests,
  useCreateVacationRequest,
  useDeleteVacationRequest,
} from '@/lib/query/vacationRequests';
import { CheckCircle, XCircle, Clock, Calendar, Trash2 } from 'lucide-react';
import { EmployeePortalStatsCard, EmployeePortalContentCard, EmployeePortalEmptyState } from './index';

interface EmployeePortalVacationsProps {
  employee: Employee;
}

// Calculate number of days between two dates
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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

export default function EmployeePortalVacations({ employee }: EmployeePortalVacationsProps) {
  const { showToast } = useToast();
  
  // React Query hooks
  const { data: requests = [], isLoading, error } = useEmployeeVacationRequests(employee.id);
  const createMutation = useCreateVacationRequest();
  const deleteMutation = useDeleteVacationRequest();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<VacationRequestCreate>({
    employee_id: employee.id,
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Handle create
  const handleCreate = async () => {
    if (!formData.start_date || !formData.end_date) {
      showToast({
        message: 'Veuillez remplir toutes les dates',
        type: 'error',
      });
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (endDate < startDate) {
      showToast({
        message: 'La date de fin doit être après la date de début',
        type: 'error',
      });
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      showToast({
        message: 'Demande de vacances créée avec succès',
        type: 'success',
      });
      setShowCreateModal(false);
      setFormData({
        employee_id: employee.id,
        start_date: '',
        end_date: '',
        reason: '',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de la demande',
        type: 'error',
      });
    }
  };

  // Handle delete (only for pending requests)
  const handleDelete = async (request: VacationRequest) => {
    if (request.status !== 'pending') {
      showToast({
        message: 'Seules les demandes en attente peuvent être supprimées',
        type: 'error',
      });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande de vacances ?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(request.id);
      showToast({
        message: 'Demande de vacances supprimée',
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

  // Group requests by status
  const pendingRequests = useMemo(() => {
    return requests.filter(req => req.status === 'pending');
  }, [requests]);

  const approvedRequests = useMemo(() => {
    return requests.filter(req => req.status === 'approved');
  }, [requests]);

  // Vacation requests are rendered manually below, not using DataTable

  if (error) {
    return (
      <Alert variant="error">
        {handleApiError(error).message || 'Erreur lors du chargement des demandes de vacances'}
      </Alert>
    );
  }

  // Calculate statistics
  const totalDays = useMemo(() => {
    return requests.reduce((sum, v) => {
      return sum + calculateDays(v.start_date, v.end_date);
    }, 0);
  }, [requests]);

  const approvedDays = useMemo(() => {
    return approvedRequests.reduce((sum, v) => {
      return sum + calculateDays(v.start_date, v.end_date);
    }, 0);
  }, [approvedRequests]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EmployeePortalStatsCard
          value={totalDays}
          label="Total demandé"
        />
        <EmployeePortalStatsCard
          value={approvedDays}
          label="Jours approuvés"
          valueColor="green"
        />
        <EmployeePortalStatsCard
          value={pendingRequests.length}
          label="En attente"
          valueColor="yellow"
        />
        <EmployeePortalStatsCard
          value={25 - approvedDays}
          label="Jours disponibles"
          valueColor="blue"
        />
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loading />
        </div>
      ) : requests.length === 0 ? (
        <EmployeePortalEmptyState
          icon={Calendar}
          title="Aucune demande de vacances"
          action={{
            label: 'Créer une demande',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((vacation) => {
            const start = new Date(vacation.start_date);
            const end = new Date(vacation.end_date);
            const days = calculateDays(vacation.start_date, vacation.end_date);
            
            return (
              <EmployeePortalContentCard key={vacation.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-[#523DC9]" />
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {vacation.reason || 'Vacances'}
                      </h3>
                      <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${getStatusBadge(vacation.status)}`}>
                        {getStatusIcon(vacation.status)}
                        {vacation.status === 'approved' ? 'Approuvé' : vacation.status === 'rejected' ? 'Refusé' : 'En attente'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Du {start.toLocaleDateString('fr-FR')} au {end.toLocaleDateString('fr-FR')} • {days} jour{days > 1 ? 's' : ''}
                    </div>
                    {vacation.rejection_reason && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{vacation.rejection_reason}</p>
                    )}
                  </div>
                  {vacation.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(vacation)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </EmployeePortalContentCard>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            employee_id: employee.id,
            start_date: '',
            end_date: '',
            reason: '',
          });
        }}
        title="Nouvelle demande de vacances"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  employee_id: employee.id,
                  start_date: '',
                  end_date: '',
                  reason: '',
                });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !formData.start_date || !formData.end_date}
              className="bg-[#523DC9] hover:bg-[#5F2B75] text-white"
            >
              {createMutation.isPending ? 'Création...' : 'Créer la demande'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Date de début <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date de fin <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          {formData.start_date && formData.end_date && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Durée: {calculateDays(formData.start_date, formData.end_date)} jour(s)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Raison (optionnel)
            </label>
            <Textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value || null })}
              placeholder="Expliquez la raison de votre demande de vacances..."
              rows={4}
            />
          </div>

        </div>
      </Modal>
    </div>
  );
}
