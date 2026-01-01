'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plane, 
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Calendar,
  User,
  TrendingUp,
  Sun,
  Umbrella,
  Heart,
  Check,
  X
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading } from '@/components/ui';
import { useToast } from '@/components/ui';
import { 
  useInfiniteVacationRequests,
  useApproveVacationRequest,
  useRejectVacationRequest,
} from '@/lib/query/vacationRequests';
import type { VacationRequest } from '@/lib/api/vacationRequests';

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

const typeConfig: Record<string, { icon: any, color: string }> = {
  'vacation': { icon: Sun, color: 'text-yellow-500' },
  'sick': { icon: Umbrella, color: 'text-blue-500' },
  'personal': { icon: User, color: 'text-purple-500' },
  'parental': { icon: Heart, color: 'text-pink-500' },
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

  // Fetch data
  const { data, isLoading } = useInfiniteVacationRequests({ pageSize: 1000 });
  const approveVacationMutation = useApproveVacationRequest();
  const rejectVacationMutation = useRejectVacationRequest();

  // Flatten data
  const vacations = useMemo(() => data?.pages.flat() || [], [data]);

  // Filter vacations
  const filteredVacations = useMemo(() => {
    return vacations.filter((vacation: VacationRequest) => {
      const employeeName = vacation.employee_first_name && vacation.employee_last_name
        ? `${vacation.employee_first_name} ${vacation.employee_last_name}`
        : '';
      const matchesSearch = !searchQuery || 
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vacation.reason && vacation.reason.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || vacation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vacations, searchQuery, statusFilter]);

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

  const handleApprove = async (id: number) => {
    try {
      await approveVacationMutation.mutateAsync(id);
      showToast({ message: 'Demande approuvée avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de l\'approbation', type: 'error' });
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;
    
    try {
      await rejectVacationMutation.mutateAsync({ requestId: id });
      showToast({ message: 'Demande rejetée avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors du rejet', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
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
              className="bg-white text-[#523DC9] hover:bg-white/90"
              onClick={() => {}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Plane className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Demandes</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.approved}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approuvées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Attente</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <XCircle className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rejetées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jours Moyens</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
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
        </Card>

        {/* Vacation Requests */}
        {filteredVacations.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
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
              
              // vacation_type doesn't exist in VacationRequest, using 'vacation' as default
              const vacationType = 'vacation';
              const typeInfo = typeConfig[vacationType];
              const TypeIcon = typeInfo?.icon || Sun;
              
              const days = vacation.start_date && vacation.end_date 
                ? calculateBusinessDays(vacation.start_date, vacation.end_date)
                : 0;
              
              return (
                <Card 
                  key={vacation.id}
                  className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200"
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
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <TypeIcon className={`w-4 h-4 ${typeInfo?.color || 'text-yellow-500'}`} />
                        <span className="capitalize">{vacationType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {vacation.start_date && new Date(vacation.start_date).toLocaleDateString('fr-CA')}
                          {' → '}
                          {vacation.end_date && new Date(vacation.end_date).toLocaleDateString('fr-CA')}
                        </span>
                      </div>
                      <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30 border">
                        {days} jour{days > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Reason */}
                  {vacation.reason && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Raison:</span> {vacation.reason}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Demandé le {vacation.created_at && new Date(vacation.created_at).toLocaleDateString('fr-CA')}
                    </div>
                    {vacation.status === 'pending' && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApprove(vacation.id)}
                          className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReject(vacation.id)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                    {vacation.status === 'approved' && vacation.approved_by_name && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Approuvé par {vacation.approved_by_name}
                      </div>
                    )}
                    {vacation.status === 'rejected' && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Rejeté
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
