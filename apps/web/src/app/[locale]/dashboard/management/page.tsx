'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Users, 
  Clock, 
  Plane,
  Calendar,
  UserPlus,
  DollarSign,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Badge, Button, Card, Loading } from '@/components/ui';
import { useInfiniteEmployees } from '@/lib/query/employees';
import { useInfiniteQuery } from '@tanstack/react-query';
import { vacationRequestsAPI } from '@/lib/api/vacationRequests';
import { timeEntriesAPI } from '@/lib/api/time-entries';

export default function ManagementPage() {
  const router = useRouter();

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useInfiniteEmployees(1000);
  const employees = useMemo(() => employeesData?.pages.flat() || [], [employeesData]);

  // Fetch vacation requests
  const { data: vacationsData, isLoading: vacationsLoading } = useInfiniteQuery({
    queryKey: ['vacation-requests', 'infinite'],
    queryFn: ({ pageParam = 0 }) => vacationRequestsAPI.list(pageParam, 1000),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  const vacations = useMemo(() => vacationsData?.pages.flat() || [], [vacationsData]);

  // Fetch time entries (for timesheets)
  const { data: timeEntriesData, isLoading: timeEntriesLoading } = useInfiniteQuery({
    queryKey: ['time-entries', 'infinite'],
    queryFn: ({ pageParam = 0 }) => timeEntriesAPI.list(pageParam, 1000),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  const timeEntries = useMemo(() => timeEntriesData?.pages.flat() || [], [timeEntriesData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e: any) => e.status === 'active').length;
    const onVacation = vacations.filter((v: any) => 
      v.status === 'approved' && 
      new Date(v.start_date) <= new Date() && 
      new Date(v.end_date) >= new Date()
    ).length;

    // Calculate average hours from time entries
    const totalHours = timeEntries.reduce((sum: number, entry: any) => sum + (entry.duration / 3600), 0);
    const avgHours = timeEntries.length > 0 ? (totalHours / timeEntries.length).toFixed(1) : '0.0';

    // Pending items
    const pendingVacations = vacations.filter((v: any) => v.status === 'pending').length;

    // Mock expenses data (no API available)
    const totalExpenses = 0;

    return {
      totalEmployees,
      activeEmployees,
      onVacation,
      avgHours,
      pendingVacations,
      totalExpenses
    };
  }, [employees, vacations, timeEntries]);

  // Get recent employees (last 3)
  const recentEmployees = useMemo(() => {
    return employees
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [employees]);

  // Get pending vacations (last 3)
  const pendingVacations = useMemo(() => {
    return vacations
      .filter((v: any) => v.status === 'pending')
      .slice(0, 3);
  }, [vacations]);

  // Get upcoming vacations
  const upcomingVacations = useMemo(() => {
    const now = new Date();
    return vacations
      .filter((v: any) => 
        v.status === 'approved' && 
        new Date(v.start_date) > now
      )
      .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 4);
  }, [vacations]);

  const isLoading = employeesLoading || vacationsLoading || timeEntriesLoading;

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
          
          <div className="relative">
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Management
            </h1>
            <p className="text-white/80 text-lg">
              Gérez vos employés, feuilles de temps, vacances et dépenses
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalEmployees}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Employés</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-2">
              {stats.activeEmployees} actifs
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgHours}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Heures moyennes</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Par entrée de temps
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Plane className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.onVacation}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En vacances</div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {stats.pendingVacations} en attente
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              ${stats.totalExpenses}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses totales</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Ce mois
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push('/dashboard/management/employes')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 group-hover:bg-[#523DC9]/20 transition-colors">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Employés</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Gérer les employés</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-colors" />
            </div>
          </Card>

          <Card 
            className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push('/dashboard/management/feuilles-temps')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 group-hover:bg-[#3B82F6]/20 transition-colors">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Feuilles de temps</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Suivi du temps</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-colors" />
            </div>
          </Card>

          <Card 
            className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push('/dashboard/management/vacances')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 group-hover:bg-[#F59E0B]/20 transition-colors">
                <Plane className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Vacances</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Demandes de congés</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-colors" />
            </div>
          </Card>

          <Card 
            className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push('/dashboard/management/compte-depenses')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 group-hover:bg-[#10B981]/20 transition-colors">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Dépenses</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Comptes de dépenses</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-colors" />
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Employees */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employés actifs</h3>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => router.push('/dashboard/management/employes')}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentEmployees.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucun employé
                </p>
              ) : (
                recentEmployees.map((employee: any) => {
                  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
                  return (
                    <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-[#523DC9] flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {employee.position || 'Employé'}
                        </p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border text-xs">
                        Actif
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Pending Vacations */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demandes en attente</h3>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => router.push('/dashboard/management/vacances')}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {pendingVacations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucune demande en attente
                </p>
              ) : (
                pendingVacations.map((vacation: any) => (
                  <div key={vacation.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {vacation.employee_name || 'Employé'}
                      </p>
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 border text-xs">
                        En attente
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(vacation.start_date).toLocaleDateString('fr-CA')} - {new Date(vacation.end_date).toLocaleDateString('fr-CA')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Upcoming Vacations Calendar */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vacances à venir</h3>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => router.push('/dashboard/management/vacances')}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingVacations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucune vacance à venir
                </p>
              ) : (
                upcomingVacations.map((vacation: any) => (
                  <div key={vacation.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {vacation.employee_name || 'Employé'}
                      </p>
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border text-xs">
                        Approuvé
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(vacation.start_date).toLocaleDateString('fr-CA')} - {new Date(vacation.end_date).toLocaleDateString('fr-CA')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
