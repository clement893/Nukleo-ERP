'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import { 
  Plane, 
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Calendar,
  TrendingUp,
  Check,
  X,
  Edit,
  Trash2,
  Download,
  Eye,
  X as XIcon
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui';
import { 
  useInfiniteVacationRequests,
  useApproveVacationRequest,
  useRejectVacationRequest,
  useCreateVacationRequest,
  useUpdateVacationRequest,
  useDeleteVacationRequest,
} from '@/lib/query/vacationRequests';
import type { VacationRequest, VacationRequestCreate } from '@/lib/api/vacationRequests';
import { employeesAPI } from '@/lib/api/employees';
import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errors/api';

const statusConfig = {
  approved: { 
    label: 'Approuvé', 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
  pending: { 
    label: 'En attente', 
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    icon: Clock,
    iconColor: 'text-orange-500'
  },
  rejected: { 
    label: 'Rejeté', 
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-500'
  },
  cancelled: { 
    label: 'Annulé', 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    icon: XCircle,
    iconColor: 'text-gray-500'
  },
};


// Generate avatar color
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-red-500'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] || 'bg-gray-500';
};

// Calculate business days
const calculateBusinessDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export default function VacancesPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Modal and Drawer states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<VacationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState<VacationRequestCreate>({
    employee_id: 0,
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Fetch data with filters
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteVacationRequests({ 
    pageSize: 50,
    employee_id: employeeFilter || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  });
  const approveVacationMutation = useApproveVacationRequest();
  const rejectVacationMutation = useRejectVacationRequest();
  const createVacationMutation = useCreateVacationRequest();
  const updateVacationMutation = useUpdateVacationRequest();
  const deleteVacationMutation = useDeleteVacationRequest();

  // Fetch employees for filter and form
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-vacation'],
    queryFn: () => employeesAPI.list(0, 1000),
  });

  // Flatten data
  const vacations = useMemo(() => data?.pages.flat() || [], [data]);

  // Filter vacations (improved search and date filters)
  const filteredVacations = useMemo(() => {
    return vacations.filter((vacation: VacationRequest) => {
      const employeeName = vacation.employee_first_name && vacation.employee_last_name
        ? `${vacation.employee_first_name} ${vacation.employee_last_name}`
        : '';
      const employeeEmail = vacation.employee_email || '';
      
      // Improved search
      const matchesSearch = !searchQuery || 
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vacation.reason && vacation.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vacation.rejection_reason && vacation.rejection_reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vacation.start_date && vacation.start_date.includes(searchQuery)) ||
        (vacation.end_date && vacation.end_date.includes(searchQuery)) ||
        vacation.status.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filters
      const matchesStartDate = !startDateFilter || !vacation.start_date || vacation.start_date >= startDateFilter;
      const matchesEndDate = !endDateFilter || !vacation.end_date || vacation.end_date <= endDateFilter;
      
      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [vacations, searchQuery, startDateFilter, endDateFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = vacations.length;
    const approved = vacations.filter((v: VacationRequest) => v.status === 'approved').length;
    const pending = vacations.filter((v: VacationRequest) => v.status === 'pending').length;
    const rejected = vacations.filter((v: VacationRequest) => v.status === 'rejected').length;
    
    const totalDays = vacations.reduce((sum: number, v: VacationRequest) => {
      if (v.status === 'approved' && v.start_date && v.end_date) {
        return sum + calculateBusinessDays(v.start_date, v.end_date);
      }
      return sum;
    }, 0);
    
    const avgDays = approved > 0 ? (totalDays / approved).toFixed(1) : '0.0';
    
    return { total, approved, pending, rejected, avgDays };
  }, [vacations]);

  const resetForm = () => {
    setFormData({
      employee_id: 0,
      start_date: '',
      end_date: '',
      reason: '',
    });
    setSelectedVacation(null);
    setRejectionReason('');
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (vacation: VacationRequest) => {
    setSelectedVacation(vacation);
    setFormData({
      employee_id: vacation.employee_id,
      start_date: vacation.start_date,
      end_date: vacation.end_date,
      reason: vacation.reason || '',
    });
    setShowEditModal(true);
  };

  const handleView = (vacation: VacationRequest) => {
    setSelectedVacation(vacation);
    setShowDetailDrawer(true);
  };

  const handleDelete = async (vacation: VacationRequest) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la demande de ${vacation.employee_first_name} ${vacation.employee_last_name} ?`)) {
      return;
    }
    
    try {
      await deleteVacationMutation.mutateAsync(vacation.id);
      showToast({ message: 'Demande supprimée avec succès', type: 'success' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.employee_id || formData.employee_id === 0) {
      showToast({ message: 'Veuillez sélectionner un employé', type: 'error' });
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      showToast({ message: 'Veuillez remplir les dates', type: 'error' });
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      showToast({ message: 'La date de début doit être antérieure à la date de fin', type: 'error' });
      return;
    }

    if (selectedVacation) {
      // Update
      updateVacationMutation.mutate(
        { id: selectedVacation.id, data: formData },
        {
          onSuccess: () => {
            showToast({ message: 'Demande modifiée avec succès', type: 'success' });
            setShowEditModal(false);
            resetForm();
          },
          onError: (error) => {
            const appError = handleApiError(error);
            showToast({ message: appError.message || 'Erreur lors de la modification', type: 'error' });
          },
        }
      );
    } else {
      // Create
      createVacationMutation.mutate(formData, {
        onSuccess: () => {
          showToast({ message: 'Demande créée avec succès', type: 'success' });
          setShowCreateModal(false);
          resetForm();
        },
        onError: (error) => {
          const appError = handleApiError(error);
          showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
        },
      });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveVacationMutation.mutateAsync(id);
      showToast({ message: 'Demande approuvée avec succès', type: 'success' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de l\'approbation', type: 'error' });
    }
  };

  const handleRejectClick = (vacation: VacationRequest) => {
    setSelectedVacation(vacation);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedVacation) return;
    
    try {
      await rejectVacationMutation.mutateAsync({ 
        requestId: selectedVacation.id,
        rejectionReason: rejectionReason || undefined
      });
      showToast({ message: 'Demande rejetée avec succès', type: 'success' });
      setShowRejectModal(false);
      resetForm();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors du rejet', type: 'error' });
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Employé', 'Email', 'Date début', 'Date fin', 'Jours', 'Raison', 'Statut', 'Approuvé par', 'Raison rejet', 'Créé le'];
    const rows = filteredVacations.map((vacation: VacationRequest) => [
      `${vacation.employee_first_name || ''} ${vacation.employee_last_name || ''}`.trim(),
      vacation.employee_email || '',
      vacation.start_date || '',
      vacation.end_date || '',
      vacation.start_date && vacation.end_date ? calculateBusinessDays(vacation.start_date, vacation.end_date).toString() : '0',
      vacation.reason || '',
      vacation.status,
      vacation.approved_by_name || '',
      vacation.rejection_reason || '',
      vacation.created_at ? new Date(vacation.created_at).toLocaleDateString('fr-FR') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demandes-vacances-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast({ message: 'Export CSV réussi', type: 'success' });
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

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulance type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Vacances
              </h1>
              <p className="text-white/80 text-lg">Gérez les demandes de congés de votre équipe</p>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Plane className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Demandes</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/30">
                <CheckCircle2 className="w-6 h-6 text-secondary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.approved}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approuvées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <Clock className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Attente</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/30">
                <XCircle className="w-6 h-6 text-danger-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rejetées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jours Moyens</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher une demande..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  Toutes
                </Button>
                <Button 
                  variant={statusFilter === 'approved' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                >
                  Approuvées
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                >
                  En attente
                </Button>
                <Button 
                  variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                  size="sm"
                >
                  Rejetées
                </Button>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employé
                </label>
                <Select
                  value={employeeFilter?.toString() || ''}
                  onChange={(e) => setEmployeeFilter(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Tous les employés' },
                    ...employees.map(e => ({ 
                      value: e.id.toString(), 
                      label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.email || `Employé #${e.id}`
                    }))
                  ]}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              {(employeeFilter || startDateFilter || endDateFilter) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmployeeFilter(null);
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }}
                    size="sm"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              )}
            </div>

            {/* Export Button */}
            {filteredVacations.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Vacation Requests */}
        {filteredVacations.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune demande trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre première demande de vacances'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVacations.map((vacation: VacationRequest) => {
              const employeeName = vacation.employee_first_name && vacation.employee_last_name
                ? `${vacation.employee_first_name} ${vacation.employee_last_name}`
                : 'Employé';
              const initials = employeeName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
              const avatarColor = getAvatarColor(employeeName);
              const statusInfo = statusConfig[vacation.status as keyof typeof statusConfig] || statusConfig.pending;
              
              const days = vacation.start_date && vacation.end_date 
                ? calculateBusinessDays(vacation.start_date, vacation.end_date)
                : 0;
              
              return (
                <Card 
                  key={vacation.id}
                  className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleView(vacation)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {employeeName}
                        </h3>
                        <Badge className={`${statusInfo.color} border flex-shrink-0`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {vacation.start_date && new Date(vacation.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' → '}
                          {vacation.end_date && new Date(vacation.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30 border">
                        {days} jour{days > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Reason */}
                  {vacation.reason && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        <span className="font-semibold">Raison:</span> {vacation.reason}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {vacation.status === 'rejected' && vacation.rejection_reason && (
                    <div className="mb-4 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-700 dark:text-red-300">
                        <span className="font-semibold">Raison du rejet:</span> {vacation.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Demandé le {vacation.created_at && new Date(vacation.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {vacation.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleApprove(vacation.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRejectClick(vacation)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Rejeter"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEdit(vacation)}
                            className="h-8 w-8 p-0"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(vacation)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {vacation.status !== 'pending' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleView(vacation)}
                          className="h-8 w-8 p-0"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {vacation.status === 'approved' && vacation.approved_by_name && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Approuvé par {vacation.approved_by_name}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination - Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              loading={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Chargement...' : `Charger plus (${vacations.length} demandes chargées)`}
            </Button>
          </div>
        )}
      </MotionDiv>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedVacation ? 'Modifier la demande' : 'Nouvelle demande de vacances'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employé *
            </label>
            <Select
              value={formData.employee_id?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value ? parseInt(e.target.value) : 0 })}
              options={[
                { value: '', label: 'Sélectionner un employé' },
                ...employees.map(e => ({ 
                  value: e.id.toString(), 
                  label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.email || `Employé #${e.id}`
                }))
              ]}
              disabled={!!selectedVacation}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début *
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin *
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Durée: {calculateBusinessDays(formData.start_date, formData.end_date)} jour{calculateBusinessDays(formData.start_date, formData.end_date) > 1 ? 's' : ''} ouvrés
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Raison (optionnel)
            </label>
            <Textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Raison de la demande de vacances..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              disabled={createVacationMutation.isPending || updateVacationMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createVacationMutation.isPending || updateVacationMutation.isPending}
            >
              {selectedVacation ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          resetForm();
        }}
        title="Rejeter la demande"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Êtes-vous sûr de vouloir rejeter cette demande de vacances ?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Raison du rejet (optionnel)
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                resetForm();
              }}
              disabled={rejectVacationMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectVacationMutation.isPending}
            >
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedVacation(null);
        }}
        title="Détails de la demande"
        position="right"
        size="lg"
      >
        {selectedVacation ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Employé
              </h4>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedVacation.employee_first_name && selectedVacation.employee_last_name
                  ? `${selectedVacation.employee_first_name} ${selectedVacation.employee_last_name}`
                  : 'Employé'}
              </p>
              {selectedVacation.employee_email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedVacation.employee_email}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Statut
              </h4>
              <Badge className={`${statusConfig[selectedVacation.status as keyof typeof statusConfig]?.color || statusConfig.pending.color} border`}>
                {statusConfig[selectedVacation.status as keyof typeof statusConfig]?.label || selectedVacation.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Date de début
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedVacation.start_date && new Date(selectedVacation.start_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Date de fin
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedVacation.end_date && new Date(selectedVacation.end_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {selectedVacation.start_date && selectedVacation.end_date && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Durée
                </h4>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {calculateBusinessDays(selectedVacation.start_date, selectedVacation.end_date)} jour{calculateBusinessDays(selectedVacation.start_date, selectedVacation.end_date) > 1 ? 's' : ''} ouvrés
                </p>
              </div>
            )}

            {selectedVacation.reason && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Raison
                </h4>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedVacation.reason}
                </p>
              </div>
            )}

            {selectedVacation.status === 'rejected' && selectedVacation.rejection_reason && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Raison du rejet
                </h4>
                <p className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {selectedVacation.rejection_reason}
                </p>
              </div>
            )}

            {selectedVacation.status === 'approved' && selectedVacation.approved_by_name && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Approuvé par
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedVacation.approved_by_name}
                </p>
                {selectedVacation.approved_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Le {new Date(selectedVacation.approved_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>
                  Créée le {new Date(selectedVacation.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {selectedVacation.updated_at !== selectedVacation.created_at && (
                  <p>
                    Modifiée le {new Date(selectedVacation.updated_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>

            {selectedVacation.status === 'pending' && (
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailDrawer(false);
                    handleEdit(selectedVacation);
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailDrawer(false);
                    handleDelete(selectedVacation);
                  }}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Loading />
        )}
      </Drawer>
    </PageContainer>
  );
}
