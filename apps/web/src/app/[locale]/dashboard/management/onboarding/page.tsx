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
  User,
  FileText,
  BookOpen,
  Laptop,
  TrendingUp
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading } from '@/components/ui';
import { useInfiniteEmployees } from '@/lib/query/employees';
import type { Employee } from '@/lib/api/employees';

type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

interface OnboardingTask {
  id: number;
  title: string;
  completed: boolean;
}

interface OnboardingProcess {
  employee: Employee;
  status: OnboardingStatus;
  progress: number;
  tasks: OnboardingTask[];
  mentor: string;
  startDate: string;
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

// Standard onboarding tasks
const standardTasks: OnboardingTask[] = [
  { id: 1, title: 'Signature du contrat', completed: false },
  { id: 2, title: 'Configuration email', completed: false },
  { id: 3, title: 'Accès aux outils', completed: false },
  { id: 4, title: 'Formation sécurité', completed: false },
  { id: 5, title: 'Rencontre équipe', completed: false },
];

// Generate avatar color
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-red-500'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] || 'bg-gray-500';
};

// Simulate onboarding status based on hire date
const getOnboardingStatus = (hireDate: string): { status: OnboardingStatus, progress: number, tasks: OnboardingTask[] } => {
  const hire = new Date(hireDate);
  const now = new Date();
  const daysSinceHire = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceHire < 0) {
    // Future hire date - pending
    return { status: 'pending', progress: 0, tasks: standardTasks };
  } else if (daysSinceHire < 30) {
    // Within first 30 days - in progress
    const progress = Math.min(100, Math.floor((daysSinceHire / 30) * 100));
    const completedCount = Math.floor((progress / 100) * standardTasks.length);
    const tasks = standardTasks.map((task, index) => ({
      ...task,
      completed: index < completedCount
    }));
    return { status: 'in_progress', progress, tasks };
  } else {
    // More than 30 days - completed
    const tasks = standardTasks.map(task => ({ ...task, completed: true }));
    return { status: 'completed', progress: 100, tasks };
  }
};

export default function OnboardingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch employees
  const { data: employeesData, isLoading } = useInfiniteEmployees(1000);
  const employees = useMemo(() => employeesData?.pages.flat() || [], [employeesData]);

  // Create onboarding processes from employees
  const onboardingProcesses = useMemo((): OnboardingProcess[] => {
    return employees
      .filter((emp: Employee) => emp.hire_date) // Only employees with hire date
      .map((emp: Employee) => {
        const { status, progress, tasks } = getOnboardingStatus(emp.hire_date!);
        // Pick a random mentor from other employees
        const otherEmployees = employees.filter((e: Employee) => e.id !== emp.id && e.first_name && e.last_name);
        const mentor = otherEmployees.length > 0 
          ? (() => {
              const mentorEmp = otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
              return mentorEmp ? `${mentorEmp.first_name} ${mentorEmp.last_name}` : 'Non assigné';
            })()
          : 'Non assigné';
        
        return {
          employee: emp,
          status,
          progress,
          tasks,
          mentor,
          startDate: emp.hire_date!
        };
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [employees]);

  // Filter onboarding processes
  const filteredProcesses = useMemo(() => {
    return onboardingProcesses.filter(process => {
      const fullName = `${process.employee.first_name} ${process.employee.last_name}`.toLowerCase();
      const matchesSearch = !searchQuery || 
        fullName.includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || process.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [onboardingProcesses, searchQuery, statusFilter]);

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
              className="bg-white text-[#523DC9] hover:bg-white/90"
              onClick={() => {}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau processus
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <UserPlus className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Onboardings</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
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

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <AlertCircle className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Cours</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Terminés</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgProgress}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Progression Moyenne</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
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
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun processus trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all'
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
              const completedTasks = process.tasks.filter(t => t.completed).length;
              
              return (
                <Card 
                  key={process.employee.id}
                  className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200"
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
                        className="h-full bg-gradient-to-r from-[#5F2B75] via-[#523DC9] to-[#6B1817] transition-all duration-500"
                        style={{ width: `${process.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks Checklist */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tâches ({completedTasks}/{process.tasks.length})
                    </h4>
                    <div className="space-y-2">
                      {process.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Mentor: {process.mentor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(process.startDate).toLocaleDateString('fr-CA')}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Resources Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <FileText className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Guides, politiques et procédures
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Voir les documents
            </Button>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <BookOpen className="w-6 h-6 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Formations</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cours et modules de formation
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Voir les formations
            </Button>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Laptop className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Outils</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Logiciels et accès nécessaires
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Voir les outils
            </Button>
          </Card>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
