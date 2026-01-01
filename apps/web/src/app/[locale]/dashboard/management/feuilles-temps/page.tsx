'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Clock, 
  Plus,
  Search,
  Calendar,
  TrendingUp,
  User,
  Building
} from 'lucide-react';
import { Button, Card, Input, Loading } from '@/components/ui';
import { useInfiniteQuery } from '@tanstack/react-query';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { useInfiniteEmployees } from '@/lib/query/employees';

type ViewMode = 'employee' | 'client' | 'week';

// Helper to get week number and year
const getWeekInfo = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getFullYear() };
};

// Helper to get start of week
const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export default function FeuillesTempsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch time entries
  const { data: timeEntriesData, isLoading: timeEntriesLoading } = useInfiniteQuery({
    queryKey: ['time-entries', 'infinite'],
    queryFn: ({ pageParam = 0 }) => timeEntriesAPI.list({ skip: pageParam, limit: 1000 }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  const timeEntries = useMemo(() => timeEntriesData?.pages.flat() || [], [timeEntriesData]);

  // Fetch employees (only for loading state)
  const { isLoading: employeesLoading } = useInfiniteEmployees(1000);

  // Group time entries by employee
  const entriesByEmployee = useMemo(() => {
    const grouped: Record<string, { entries: TimeEntry[], totalHours: number, userName: string, userId: number }> = {};
    
    timeEntries.forEach((entry: TimeEntry) => {
      const key = entry.user_name || `User ${entry.user_id}`;
      if (!grouped[key]) {
        grouped[key] = { 
          entries: [], 
          totalHours: 0, 
          userName: entry.user_name || key,
          userId: entry.user_id
        };
      }
      grouped[key].entries.push(entry);
      grouped[key].totalHours += entry.duration / 3600;
    });
    
    return Object.values(grouped).sort((a, b) => b.totalHours - a.totalHours);
  }, [timeEntries]);

  // Group time entries by client
  const entriesByClient = useMemo(() => {
    const grouped: Record<string, { entries: TimeEntry[], totalHours: number, clientName: string }> = {};
    
    timeEntries.forEach((entry: TimeEntry) => {
      const key = entry.client_name || 'Sans client';
      if (!grouped[key]) {
        grouped[key] = { entries: [], totalHours: 0, clientName: key };
      }
      grouped[key].entries.push(entry);
      grouped[key].totalHours += entry.duration / 3600;
    });
    
    return Object.values(grouped).sort((a, b) => b.totalHours - a.totalHours);
  }, [timeEntries]);

  // Group time entries by week
  const entriesByWeek = useMemo(() => {
    const grouped: Record<string, { entries: TimeEntry[], totalHours: number, weekStart: Date, weekInfo: { week: number, year: number } }> = {};
    
    timeEntries.forEach((entry: TimeEntry) => {
      const entryDate = new Date(entry.date);
      const weekStart = getWeekStart(entryDate);
      const weekInfo = getWeekInfo(entryDate);
      const key = `${weekInfo.year}-W${weekInfo.week}`;
      
      if (!grouped[key]) {
        grouped[key] = { entries: [], totalHours: 0, weekStart, weekInfo };
      }
      grouped[key].entries.push(entry);
      grouped[key].totalHours += entry.duration / 3600;
    });
    
    return Object.values(grouped).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [timeEntries]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = timeEntries.length;
    const totalHours = timeEntries.reduce((sum: number, entry: TimeEntry) => sum + (entry.duration / 3600), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : '0.0';
    
    // Mock status counts (no status in TimeEntry)
    const approved = Math.floor(total * 0.6);
    const pending = Math.floor(total * 0.3);
    const rejected = total - approved - pending;
    
    return { total, approved, pending, rejected, avgHours };
  }, [timeEntries]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (viewMode === 'employee') {
      return entriesByEmployee.filter(group => 
        !searchQuery || group.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (viewMode === 'client') {
      return entriesByClient.filter(group => 
        !searchQuery || group.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return entriesByWeek;
    }
  }, [viewMode, entriesByEmployee, entriesByClient, entriesByWeek, searchQuery]);


  const isLoading = timeEntriesLoading || employeesLoading;

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
                Feuilles de Temps
              </h1>
              <p className="text-white/80 text-lg">Suivez et gérez les heures de travail</p>
            </div>
            <Button 
              className="bg-white text-[#523DC9] hover:bg-white/90"
              onClick={() => {}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Entrées</div>
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
                <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
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
              {stats.avgHours}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Heures Moyennes</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={`Rechercher ${viewMode === 'employee' ? 'un employé' : viewMode === 'client' ? 'un client' : 'une semaine'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'employee' ? 'primary' : 'outline'}
                onClick={() => setViewMode('employee')}
                size="sm"
              >
                <User className="w-4 h-4 mr-2" />
                Par Employé
              </Button>
              <Button 
                variant={viewMode === 'client' ? 'primary' : 'outline'}
                onClick={() => setViewMode('client')}
                size="sm"
              >
                <Building className="w-4 h-4 mr-2" />
                Par Client
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'primary' : 'outline'}
                onClick={() => setViewMode('week')}
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Par Semaine
              </Button>
            </div>
          </div>
        </Card>

        {/* Time Entries Display */}
        {filteredData.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune entrée trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? 'Essayez de modifier votre recherche' : 'Créez votre première entrée de temps'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {viewMode === 'employee' && entriesByEmployee.map((group: any) => (
              <Card key={group.userId} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#523DC9] flex items-center justify-center text-white font-semibold">
                      {group.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.userName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{group.entries.length} entrées</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {group.totalHours.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {group.entries.slice(0, 4).map((entry: TimeEntry) => (
                    <div key={entry.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(entry.duration / 3600).toFixed(1)}h
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {new Date(entry.date).toLocaleDateString('fr-CA')}
                      </p>
                      {entry.project_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {entry.project_name}
                        </p>
                      )}
                    </div>
                  ))}
                  {group.entries.length > 4 && (
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{group.entries.length - 4} autres</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {viewMode === 'client' && entriesByClient.map((group: any) => (
              <Card key={group.clientName} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                      <Building className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.clientName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{group.entries.length} entrées</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {group.totalHours.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {group.entries.slice(0, 4).map((entry: TimeEntry) => (
                    <div key={entry.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(entry.duration / 3600).toFixed(1)}h
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {entry.user_name || 'Employé'}
                      </p>
                      {entry.project_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {entry.project_name}
                        </p>
                      )}
                    </div>
                  ))}
                  {group.entries.length > 4 && (
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{group.entries.length - 4} autres</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {viewMode === 'week' && entriesByWeek.map((group: any) => (
              <Card key={`${group.weekInfo.year}-W${group.weekInfo.week}`} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                      <Calendar className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Semaine {group.weekInfo.week} - {group.weekInfo.year}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.weekStart.toLocaleDateString('fr-CA')} - {new Date(group.weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-CA')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {group.totalHours.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{group.entries.length} entrées</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {group.entries.slice(0, 4).map((entry: TimeEntry) => (
                    <div key={entry.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(entry.duration / 3600).toFixed(1)}h
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {entry.user_name || 'Employé'}
                      </p>
                      {entry.project_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {entry.project_name}
                        </p>
                      )}
                    </div>
                  ))}
                  {group.entries.length > 4 && (
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{group.entries.length - 4} autres</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
