'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  UserPlus, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Calendar,
  FileText,
  BookOpen,
  Laptop,
  TrendingUp
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading, Modal, Select, useToast } from '@/components/ui';
import { useInfiniteEmployees } from '@/lib/query/employees';
import { 
  useTeams, 
  useEmployeesOnboarding, 
  useEmployeeOnboardingSteps,
  useInitializeEmployeeOnboarding,
  useCompleteEmployeeStep,
  useOnboardingSteps
} from '@/lib/query/queries';
import type { Employee } from '@/lib/api/employees';
import type { OnboardingStep } from '@/lib/api/onboarding';
import { handleApiError } from '@/lib/errors/api';

type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

interface OnboardingProcess {
  employee: Employee;
  status: OnboardingStatus;
  progress: number;
  steps: OnboardingStep[];
  completedSteps: string[];
  startDate: string | null;
}

const statusConfig = {
  pending: { 
    label: 'En attente', 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    icon: Clock,
    iconColor: 'text-gray-500'
  },
  in_progress: { 
    label: 'En cours', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: AlertCircle,
    iconColor: 'text-blue-500'
  },
  completed: { 
    label: 'Terminé', 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle2,
    iconColor: 'text-green-500'
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

// Map progress to status
const getStatusFromProgress = (progress: number, isCompleted: boolean): OnboardingStatus => {
  if (isCompleted) return 'completed';
  if (progress === 0) return 'pending';
  return 'in_progress';
};

export default function OnboardingPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<number | 'all'>('all');
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [showResourcesModal, setShowResourcesModal] = useState<'documents' | 'formations' | 'tools' | null>(null);

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useInfiniteEmployees(1000);
  const employees = useMemo(() => employeesData?.pages.flat() || [], [employeesData]);

  // Fetch teams for filter
  const { data: teamsData } = useTeams();
  const teams = Array.isArray(teamsData) ? teamsData : (teamsData?.teams || []);

  // Fetch onboarding data
  const { data: onboardingData = [], isLoading: onboardingLoading, refetch: refetchOnboarding } = useEmployeesOnboarding({
    team_id: teamFilter !== 'all' ? teamFilter : undefined,
  });

  // Fetch onboarding steps (for new process modal)
  const { data: onboardingSteps = [] } = useOnboardingSteps();
  const initializeMutation = useInitializeEmployeeOnboarding();
  const completeStepMutation = useCompleteEmployeeStep();

  // Create onboarding processes from employees and onboarding data
  const onboardingProcesses = useMemo((): OnboardingProcess[] => {
    if (!onboardingData || !employees.length) return [];

    // Create a map of employee_id -> onboarding progress
    const onboardingMap = new Map(
      (onboardingData as any[]).map((item: any) => [item.employee_id, item])
    );

    return employees
      .filter((emp: Employee) => emp.hire_date) // Only employees with hire date
      .map((emp: Employee) => {
        const onboardingItem = onboardingMap.get(emp.id) as any;
        const progress = onboardingItem?.progress?.progress_percentage || 0;
        const isCompleted = onboardingItem?.progress?.is_completed || false;
        
        return {
          employee: emp,
          status: getStatusFromProgress(progress, isCompleted),
          progress: Math.round(progress),
          steps: [], // Will be loaded per employee if needed
          completedSteps: [], // Will be loaded per employee if needed
          startDate: emp.hire_date || null,
        };
      })
      .sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
  }, [employees, onboardingData]);

  // Filter onboarding processes
  const filteredProcesses = useMemo(() => {
    return onboardingProcesses.filter(process => {
      const fullName = `${process.employee.first_name} ${process.employee.last_name}`.toLowerCase();
      const matchesSearch = !searchQuery || 
        fullName.includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || process.status === statusFilter;
      
      const matchesTeam = teamFilter === 'all' || process.employee.team_id === teamFilter;
      
      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [onboardingProcesses, searchQuery, statusFilter, teamFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = onboardingProcesses.length;
    const pending = onboardingProcesses.filter(p => p.status === 'pending').length;
    const inProgress = onboardingProcesses.filter(p => p.status === 'in_progress').length;
    const completed = onboardingProcesses.filter(p => p.status === 'completed').length;
    
    const totalProgress = onboardingProcesses.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    
    return { total, pending, inProgress, completed, avgProgress };
  }, [onboardingProcesses]);

  const isLoading = employeesLoading || onboardingLoading;

  // Handle new process creation
  const handleCreateNewProcess = async () => {
    if (!selectedEmployeeId) {
      showToast({
        message: 'Veuillez sélectionner un employé',
        type: 'error',
      });
      return;
    }

    try {
      await initializeMutation.mutateAsync(selectedEmployeeId);
      showToast({
        message: 'Processus d\'onboarding initialisé avec succès',
        type: 'success',
      });
      setShowNewProcessModal(false);
      setSelectedEmployeeId(null);
      refetchOnboarding();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de l\'initialisation du processus',
        type: 'error',
      });
    }
  };

  // Handle step completion
  const handleCompleteStep = async (employeeId: number, stepKey: string) => {
    try {
      await completeStepMutation.mutateAsync({ employeeId, stepKey });
      showToast({
        message: 'Tâche marquée comme complétée',
        type: 'success',
      });
      refetchOnboarding();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour',
        type: 'error',
      });
    }
  };

  // Get employees without onboarding
  const employeesWithoutOnboarding = useMemo(() => {
    if (!onboardingData) return employees.filter((emp: Employee) => emp.hire_date && emp.user_id);
    
    const employeesWithOnboarding = new Set((onboardingData as any[]).map((item: any) => item.employee_id));
    return employees.filter(
      (emp: Employee) => 
        emp.hire_date && 
        emp.user_id && 
        !employeesWithOnboarding.has(emp.id)
    );
  }, [employees, onboardingData]);

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
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Onboarding
              </h1>
              <p className="text-white/80 text-lg">Suivez l'intégration de vos nouveaux employés</p>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90"
              onClick={() => setShowNewProcessModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau processus
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <UserPlus className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Onboardings</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Attente</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <AlertCircle className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Cours</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/30">
                <CheckCircle2 className="w-6 h-6 text-secondary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Terminés</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <TrendingUp className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgProgress}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Progression Moyenne</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select
                value={teamFilter.toString()}
                onChange={(e) => setTeamFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="min-w-[150px]"
                options={[
                  { label: 'Toutes les équipes', value: 'all' },
                  ...teams.map((team: any) => ({
                    label: team.name || team.slug || `Équipe ${team.id}`,
                    value: team.id.toString(),
                  })),
                ]}
              />
              
              <Button 
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button 
                variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                En attente
              </Button>
              <Button 
                variant={statusFilter === 'in_progress' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('in_progress')}
                size="sm"
              >
                En cours
              </Button>
              <Button 
                variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                size="sm"
              >
                Terminés
              </Button>
            </div>
          </div>
        </Card>

        {/* Onboarding Processes */}
        {filteredProcesses.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun processus trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all' || teamFilter !== 'all'
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre premier processus d\'onboarding'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProcesses.map((process) => {
              const fullName = `${process.employee.first_name} ${process.employee.last_name}`;
              const initials = `${process.employee.first_name?.[0] || ''}${process.employee.last_name?.[0] || ''}`.toUpperCase();
              const avatarColor = getAvatarColor(fullName);
              const statusInfo = statusConfig[process.status];
              const onboardingItem = (onboardingData as any[])?.find((item: any) => item.employee_id === process.employee.id);
              const completedCount = onboardingItem?.progress?.completed_count || 0;
              const totalCount = onboardingItem?.progress?.total_count || 0;
              
              return (
                <OnboardingProcessCard
                  key={process.employee.id}
                  process={process}
                  fullName={fullName}
                  initials={initials}
                  avatarColor={avatarColor}
                  statusInfo={statusInfo}
                  completedCount={completedCount}
                  totalCount={totalCount}
                  onCompleteStep={(stepKey) => handleCompleteStep(process.employee.id, stepKey)}
                />
              );
            })}
          </div>
        )}

        {/* Resources Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <FileText className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Guides, politiques et procédures
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setShowResourcesModal('documents')}
            >
              Voir les documents
            </Button>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <BookOpen className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Formations</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cours et modules de formation
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setShowResourcesModal('formations')}
            >
              Voir les formations
            </Button>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Laptop className="w-6 h-6 text-warning-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Outils</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Logiciels et accès nécessaires
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setShowResourcesModal('tools')}
            >
              Voir les outils
            </Button>
          </Card>
        </div>
      </MotionDiv>

      {/* New Process Modal */}
      {showNewProcessModal && (
        <Modal
          isOpen={showNewProcessModal}
          onClose={() => {
            setShowNewProcessModal(false);
            setSelectedEmployeeId(null);
          }}
          title="Nouveau processus d'onboarding"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sélectionner un employé
              </label>
              <Select
                value={selectedEmployeeId?.toString() || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="-- Sélectionner un employé --"
                options={[
                  { label: '-- Sélectionner un employé --', value: '' },
                  ...employeesWithoutOnboarding.map((emp: Employee) => ({
                    label: `${emp.first_name} ${emp.last_name}${emp.email ? ` (${emp.email})` : ''}`,
                    value: emp.id.toString(),
                  })),
                ]}
              />
              {employeesWithoutOnboarding.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Tous les employés avec une date d'embauche ont déjà un processus d'onboarding.
                </p>
              )}
            </div>
            
            {onboardingSteps && onboardingSteps.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Étapes d'onboarding qui seront créées :
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {onboardingSteps.map((step: OnboardingStep) => (
                    <li key={step.id}>{step.title}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewProcessModal(false);
                  setSelectedEmployeeId(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateNewProcess}
                disabled={!selectedEmployeeId || initializeMutation.isPending}
                loading={initializeMutation.isPending}
              >
                Créer le processus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Resources Modal */}
      {showResourcesModal && (
        <Modal
          isOpen={!!showResourcesModal}
          onClose={() => setShowResourcesModal(null)}
          title={
            showResourcesModal === 'documents' ? 'Documents' :
            showResourcesModal === 'formations' ? 'Formations' :
            'Outils'
          }
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {showResourcesModal === 'documents' && 'Les documents d\'onboarding seront disponibles ici.'}
              {showResourcesModal === 'formations' && 'Les formations d\'onboarding seront disponibles ici.'}
              {showResourcesModal === 'tools' && 'Les outils d\'onboarding seront disponibles ici.'}
            </p>
            <p className="text-sm text-gray-500">
              Cette fonctionnalité sera implémentée prochainement.
            </p>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowResourcesModal(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

// Separate component for process card to handle step loading
function OnboardingProcessCard({
  process,
  fullName,
  initials,
  avatarColor,
  statusInfo,
  completedCount,
  totalCount,
  onCompleteStep,
}: {
  process: OnboardingProcess;
  fullName: string;
  initials: string;
  avatarColor: string;
  statusInfo: typeof statusConfig[keyof typeof statusConfig];
  completedCount: number;
  totalCount: number;
  onCompleteStep: (stepKey: string) => void;
}) {
  const [showSteps, setShowSteps] = useState(false);
  const { data: steps = [], isLoading: stepsLoading } = useEmployeeOnboardingSteps(
    process.employee.id,
    showSteps && !!process.employee.user_id
  );

  return (
    <Card 
      className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {fullName}
            </h3>
            <Badge className={`${statusInfo.color} border flex-shrink-0`}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Employé
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progression
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {process.progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-nukleo-gradient transition-all duration-500"
            style={{ width: `${process.progress}%` }}
          />
        </div>
      </div>

      {/* Tasks Checklist */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tâches ({completedCount}/{totalCount})
          </h4>
          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSteps(!showSteps)}
            >
              {showSteps ? 'Masquer' : 'Voir les détails'}
            </Button>
          )}
        </div>
        
        {showSteps && steps && steps.length > 0 ? (
          <div className="space-y-2">
            {steps.map((step: OnboardingStep, index: number) => {
              // Steps are ordered, so if completedCount is 3, first 3 steps are completed
              const isCompleted = index < completedCount;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <button
                      onClick={() => !isCompleted && onCompleteStep(step.key)}
                      className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 hover:border-blue-500 transition-colors cursor-pointer"
                      title="Marquer comme complété"
                    />
                  )}
                  <span className={`text-sm flex-1 ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        ) : showSteps && stepsLoading ? (
          <Loading />
        ) : totalCount === 0 ? (
          <p className="text-sm text-gray-500">Aucune tâche d'onboarding configurée</p>
        ) : null}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            {process.startDate 
              ? new Date(process.startDate).toLocaleDateString('fr-CA')
              : 'Date non définie'}
          </span>
        </div>
      </div>
    </Card>
  );
}
