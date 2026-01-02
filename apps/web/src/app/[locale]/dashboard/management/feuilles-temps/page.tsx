'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import { 
  Clock, 
  Plus,
  Search,
  Calendar,
  TrendingUp,
  User,
  Building,
  Edit,
  Trash2,
  X,
  Briefcase,
  Play,
  Pause,
  Square,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button, Card, Input, Loading, Textarea, Select, useToast, Badge } from '@/components/ui';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesAPI, type TimeEntry, type TimeEntryCreate, type TimeEntryUpdate, type TimerStatus } from '@/lib/api/time-entries';
import { projectsAPI } from '@/lib/api/projects';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { clientsAPI } from '@/lib/api/clients';
import { handleApiError } from '@/lib/errors/api';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';

type ViewMode = 'employee' | 'client' | 'week' | 'active-timers';

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

// Format duration from seconds to hours:minutes
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

export default function FeuillesTempsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // New filters
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<number | null>(null);
  
  // Timer state
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const [timerElapsed, setTimerElapsed] = useState<number>(0);
  const [showTimerWidget, setShowTimerWidget] = useState(false);
  
  // Active timers state
  const [activeTimers, setActiveTimers] = useState<Array<{
    user_id: number;
    user_name: string;
    user_email: string;
    task_id?: number;
    task_title?: string | null;
    project_name?: string | null;
    start_time: string;
    elapsed_seconds: number;
    accumulated_seconds: number;
    description?: string | null;
    paused: boolean;
  }>>([]);
  
  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Modal and Drawer states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<TimeEntryCreate>({
    description: '',
    duration: 0,
    date: new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10),
    task_id: null,
    project_id: null,
    client_id: null,
  });

  // Fetch time entries with filters
  const { data: timeEntriesData, isLoading: timeEntriesLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['time-entries', 'infinite', startDate, endDate, filterUserId, filterProjectId, filterTaskId],
    queryFn: ({ pageParam = 0 }) => {
      const params: any = { skip: pageParam, limit: 100 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (filterUserId) params.user_id = filterUserId;
      if (filterProjectId) params.project_id = filterProjectId;
      if (filterTaskId) params.task_id = filterTaskId;
      return timeEntriesAPI.list(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 100) return undefined;
      return allPages.length * 100;
    },
    initialPageParam: 0,
  });
  const timeEntries = useMemo(() => timeEntriesData?.pages.flat() || [], [timeEntriesData]);

  // Fetch projects, tasks, and clients for forms
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-time-entry'],
    queryFn: () => projectsAPI.list(0, 1000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-for-time-entry'],
    queryFn: () => projectTasksAPI.list({ skip: 0, limit: 1000 }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-time-entry'],
    queryFn: () => clientsAPI.list(0, 1000),
  });

  // Fetch users for filter
  const { data: usersData } = useQuery({
    queryKey: ['users-for-time-entry'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/users', { params: { page: 1, page_size: 1000 } });
        const data = extractApiData<{ items?: Array<{ id: number; first_name?: string; last_name?: string; email: string }> }>(response as any);
        if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
          return data.items.map(u => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
  });
  const users = useMemo(() => usersData || [], [usersData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: TimeEntryCreate) => timeEntriesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setShowCreateModal(false);
      resetForm();
      showToast({ message: 'Entrée créée avec succès', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TimeEntryUpdate }) => timeEntriesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setShowEditModal(false);
      setSelectedEntry(null);
      resetForm();
      showToast({ message: 'Entrée modifiée avec succès', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la modification', type: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => timeEntriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      showToast({ message: 'Entrée supprimée avec succès', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la suppression', type: 'error' });
    },
  });

  // Timer mutations
  const startTimerMutation = useMutation({
    mutationFn: ({ taskId, description }: { taskId: number; description?: string }) => 
      timeEntriesAPI.startTimer(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-status'] });
      loadTimerStatus();
      showToast({ message: 'Timer démarré', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors du démarrage du timer', type: 'error' });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: (description?: string) => timeEntriesAPI.stopTimer(description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['timer-status'] });
      setTimerStatus(null);
      setTimerElapsed(0);
      setShowTimerWidget(false);
      showToast({ message: 'Timer arrêté et entrée créée', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de l\'arrêt du timer', type: 'error' });
    },
  });

  const pauseTimerMutation = useMutation({
    mutationFn: () => timeEntriesAPI.pauseTimer(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-status'] });
      loadTimerStatus();
      showToast({ message: 'Timer mis en pause', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la pause', type: 'error' });
    },
  });

  const resumeTimerMutation = useMutation({
    mutationFn: () => timeEntriesAPI.resumeTimer(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-status'] });
      loadTimerStatus();
      showToast({ message: 'Timer repris', type: 'success' });
    },
    onError: (err) => {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la reprise', type: 'error' });
    },
  });

  // Load timer status
  const loadTimerStatus = useCallback(async () => {
    try {
      const status = await timeEntriesAPI.getTimerStatus();
      setTimerStatus(status);
      if (status.active) {
        setShowTimerWidget(true);
        setTimerElapsed(status.elapsed_seconds || 0);
      }
    } catch (err) {
      // Silent fail - timer might not be available
    }
  }, []);

  // Timer status query
  useQuery({
    queryKey: ['timer-status'],
    queryFn: loadTimerStatus,
    refetchInterval: timerStatus?.active && !timerStatus?.paused ? 1000 : false,
  });

  // Update timer elapsed every second when active
  useEffect(() => {
    if (timerStatus?.active && !timerStatus?.paused) {
      const interval = setInterval(async () => {
        try {
          const status = await timeEntriesAPI.getTimerStatus();
          setTimerElapsed(status.elapsed_seconds || 0);
        } catch {
          // Silent fail
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (timerStatus?.paused) {
      setTimerElapsed(timerStatus.accumulated_seconds || 0);
    }
    return undefined;
  }, [timerStatus?.active, timerStatus?.paused]);

  // Load timer status on mount
  useEffect(() => {
    loadTimerStatus();
  }, [loadTimerStatus]);

  // Load all active timers when active-timers view is selected
  useEffect(() => {
    const loadActiveTimers = async () => {
      if (viewMode === 'active-timers') {
        try {
          const timers = await timeEntriesAPI.getAllActiveTimers();
          setActiveTimers(timers);
        } catch (err) {
          // Silently fail - might not have permission
          setActiveTimers([]);
        }
      }
    };

    loadActiveTimers();
    if (viewMode === 'active-timers') {
      const interval = setInterval(loadActiveTimers, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [viewMode]);

  // Update elapsed time for active timers every second
  useEffect(() => {
    if (viewMode === 'active-timers' && activeTimers.length > 0) {
      const interval = setInterval(() => {
        setActiveTimers((prev: typeof activeTimers) => prev.map((timer) => {
          if (timer.paused) {
            return timer;
          }
          const startTime = new Date(timer.start_time).getTime();
          const now = Date.now();
          const elapsed = timer.accumulated_seconds + Math.floor((now - startTime) / 1000);
          return { ...timer, elapsed_seconds: elapsed };
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [viewMode, activeTimers]);

  const resetForm = () => {
    setFormData({
      description: '',
      duration: 0,
      date: new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10),
      task_id: null,
      project_id: null,
      client_id: null,
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    const dateStr = new Date(entry.date).toISOString().split('T')[0] || new Date(entry.date).toISOString().substring(0, 10);
    setFormData({
      description: entry.description || '',
      duration: entry.duration,
      date: dateStr,
      task_id: entry.task_id || null,
      project_id: entry.project_id || null,
      client_id: entry.client_id || null,
    });
    setShowEditModal(true);
  };

  const handleView = async (entry: TimeEntry) => {
    try {
      const fullEntry = await timeEntriesAPI.get(entry.id);
      setSelectedEntry(fullEntry);
      setShowDetailDrawer(true);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors du chargement', type: 'error' });
    }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette entrée de ${formatDuration(entry.duration)} ?`)) {
      return;
    }
    deleteMutation.mutate(entry.id);
  };

  const handleSubmit = () => {
    // Validation améliorée
    if (formData.duration <= 0) {
      showToast({ message: 'La durée doit être supérieure à 0', type: 'error' });
      return;
    }

    const entryDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (entryDate > today) {
      showToast({ message: 'La date ne peut pas être dans le futur', type: 'error' });
      return;
    }

    const hours = formData.duration / 3600;
    if (hours > 24) {
      showToast({ message: 'La durée ne peut pas dépasser 24 heures', type: 'error' });
      return;
    }

    // Validation des relations
    if (formData.task_id && formData.project_id) {
      const selectedTask = tasks.find(t => t.id === formData.task_id);
      if (selectedTask && selectedTask.project_id !== formData.project_id) {
        showToast({ message: 'La tâche sélectionnée n\'appartient pas au projet sélectionné', type: 'error' });
        return;
      }
    }

    if (selectedEntry) {
      updateMutation.mutate({ id: selectedEntry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Date', 'Durée (h)', 'Employé', 'Client', 'Projet', 'Tâche', 'Description'];
    const rows = filteredData.flatMap((group: any) => 
      group.entries.map((entry: TimeEntry) => [
        new Date(entry.date).toLocaleDateString('fr-FR'),
        (entry.duration / 3600).toFixed(2),
        entry.user_name || '',
        entry.client_name || '',
        entry.project_name || '',
        entry.task_title || '',
        entry.description || ''
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feuilles-temps-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast({ message: 'Export CSV réussi', type: 'success' });
  };

  const handleExportExcel = async () => {
    try {
      // Simple CSV export for now (can be enhanced with Excel library)
      handleExportCSV();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de l\'export', type: 'error' });
    }
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Convert duration from hours to seconds for form
  const durationHours = formData.duration / 3600;
  const setDurationHours = (hours: number) => {
    setFormData({ ...formData, duration: Math.round(hours * 3600) });
  };

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

  // Calculate stats (removed mock status counts)
  const stats = useMemo(() => {
    const total = timeEntries.length;
    const totalHours = timeEntries.reduce((sum: number, entry: TimeEntry) => sum + (entry.duration / 3600), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : '0.0';
    
    return { total, totalHours, avgHours };
  }, [timeEntries]);

  // Filter data based on search (amélioré pour rechercher dans descriptions, tâches, projets)
  const filteredData = useMemo(() => {
    let data;
    if (viewMode === 'employee') {
      data = entriesByEmployee.filter(group => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return group.userName.toLowerCase().includes(query) ||
          group.entries.some((entry: TimeEntry) =>
            entry.description?.toLowerCase().includes(query) ||
            entry.task_title?.toLowerCase().includes(query) ||
            entry.project_name?.toLowerCase().includes(query) ||
            entry.client_name?.toLowerCase().includes(query)
          );
      });
    } else if (viewMode === 'client') {
      data = entriesByClient.filter(group => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return group.clientName.toLowerCase().includes(query) ||
          group.entries.some((entry: TimeEntry) =>
            entry.description?.toLowerCase().includes(query) ||
            entry.task_title?.toLowerCase().includes(query) ||
            entry.project_name?.toLowerCase().includes(query) ||
            entry.user_name?.toLowerCase().includes(query)
          );
      });
    } else {
      data = entriesByWeek.filter(group => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return group.entries.some((entry: TimeEntry) =>
          entry.description?.toLowerCase().includes(query) ||
          entry.task_title?.toLowerCase().includes(query) ||
          entry.project_name?.toLowerCase().includes(query) ||
          entry.client_name?.toLowerCase().includes(query) ||
          entry.user_name?.toLowerCase().includes(query)
        );
      });
    }
    return data;
  }, [viewMode, entriesByEmployee, entriesByClient, entriesByWeek, searchQuery]);

  const isLoading = timeEntriesLoading;

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
                Feuilles de Temps
              </h1>
              <p className="text-white/80 text-lg">Suivez et gérez les heures de travail</p>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </div>

        {/* Timer Widget */}
        {showTimerWidget && timerStatus && (
          <Card className="glass-card p-4 rounded-xl border-2 border-primary-500 bg-nukleo-gradient/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary-500 text-white">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Timer actif</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatDuration(timerElapsed)}
                  </div>
                  {timerStatus.task_id && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tâche: {tasks.find(t => t.id === timerStatus.task_id)?.title || `#${timerStatus.task_id}`}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {timerStatus.paused ? (
                  <Button
                    size="sm"
                    onClick={() => resumeTimerMutation.mutate()}
                    disabled={resumeTimerMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Reprendre
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseTimerMutation.mutate()}
                    disabled={pauseTimerMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    const description = timerStatus.description || prompt('Description (optionnel):') || undefined;
                    stopTimerMutation.mutate(description);
                  }}
                  disabled={stopTimerMutation.isPending}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Arrêter
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowTimerWidget(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
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

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalHours.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Heures Totales</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <Clock className="w-6 h-6 text-success-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgHours}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Heures Moyennes</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20">
          <div className="flex flex-col gap-4">
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
                <Button 
                  variant={viewMode === 'active-timers' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('active-timers')}
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Timers Actifs
                </Button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employé
                </label>
                <Select
                  value={filterUserId?.toString() || ''}
                  onChange={(e) => setFilterUserId(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Tous les employés' },
                    ...users.map(u => ({ value: u.id.toString(), label: u.name }))
                  ]}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Projet
                </label>
                <Select
                  value={filterProjectId?.toString() || ''}
                  onChange={(e) => setFilterProjectId(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Tous les projets' },
                    ...projects.map(p => ({ value: p.id.toString(), label: p.name }))
                  ]}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tâche
                </label>
                <Select
                  value={filterTaskId?.toString() || ''}
                  onChange={(e) => setFilterTaskId(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Toutes les tâches' },
                    ...tasks
                      .filter(t => !filterProjectId || t.project_id === filterProjectId)
                      .map(t => ({ value: t.id.toString(), label: t.title }))
                  ]}
                />
              </div>
            </div>
            {(startDate || endDate || filterUserId || filterProjectId || filterTaskId) && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setFilterUserId(null);
                    setFilterProjectId(null);
                    setFilterTaskId(null);
                  }}
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter Excel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Time Entries Display */}
        {filteredData.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune entrée trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || startDate || endDate ? 'Essayez de modifier vos filtres' : 'Créez votre première entrée de temps'}
            </p>
            {!searchQuery && !startDate && !endDate && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une entrée
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {viewMode === 'employee' && entriesByEmployee.map((group: any) => (
              <Card key={group.userId} className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                      {group.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.userName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{group.entries.length} entrée{group.entries.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {group.totalHours.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {group.entries.slice(0, 8).map((entry: TimeEntry) => (
                    <div 
                      key={entry.id} 
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/40 transition-all cursor-pointer group"
                      onClick={() => handleView(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(entry)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {new Date(entry.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                      </p>
                      {entry.task_title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {entry.task_title}
                        </p>
                      )}
                      {entry.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {group.entries.length > 8 && (
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{group.entries.length - 8} autres</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {viewMode === 'client' && entriesByClient.map((group: any) => (
              <Card key={group.clientName} className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                      <Building className="w-6 h-6 text-success-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.clientName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{group.entries.length} entrée{group.entries.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {group.totalHours.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(expandedGroups.has(`client-${group.clientName}`) ? group.entries : group.entries.slice(0, 8)).map((entry: TimeEntry) => (
                    <div 
                      key={entry.id} 
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/40 transition-all cursor-pointer group"
                      onClick={() => handleView(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(entry)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {entry.user_name || 'Employé'}
                      </p>
                      {entry.task_title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {entry.task_title}
                        </p>
                      )}
                      {entry.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {group.entries.length > 8 && (
                    <div 
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => toggleGroup(`client-${group.clientName}`)}
                    >
                      {expandedGroups.has(`client-${group.clientName}`) ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500">Voir moins</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500">+{group.entries.length - 8} autres</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {viewMode === 'active-timers' && (
              <div className="space-y-4">
                {activeTimers.length === 0 ? (
                  <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Aucun timer actif
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucun employé n'a de timer en cours actuellement
                    </p>
                  </Card>
                ) : (
                  activeTimers.map((timer) => (
                    <Card key={`${timer.user_id}-${timer.task_id}`} className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                            {timer.user_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{timer.user_name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{timer.user_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            {timer.paused ? (
                              <Badge variant="warning" className="flex items-center gap-1">
                                <Pause className="w-3 h-3" />
                                En pause
                              </Badge>
                            ) : (
                              <Badge variant="success" className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                Actif
                              </Badge>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {formatDuration(timer.elapsed_seconds)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {timer.task_title && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tâche</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              {timer.task_title}
                            </p>
                          </div>
                        )}
                        {timer.project_name && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Projet</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              {timer.project_name}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Démarré le</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(timer.start_time).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {timer.description && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Description</p>
                            <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                              {timer.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {viewMode === 'week' && entriesByWeek.map((group: any) => (
              <Card key={`${group.weekInfo.year}-W${group.weekInfo.week}`} className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                      <Calendar className="w-6 h-6 text-primary-500" />
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{group.entries.length} entrée{group.entries.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(expandedGroups.has(`week-${group.weekInfo.year}-W${group.weekInfo.week}`) ? group.entries : group.entries.slice(0, 8)).map((entry: TimeEntry) => (
                    <div 
                      key={entry.id} 
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/40 transition-all cursor-pointer group"
                      onClick={() => handleView(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(entry)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {entry.user_name || 'Employé'}
                      </p>
                      {entry.task_title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {entry.task_title}
                        </p>
                      )}
                      {entry.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {group.entries.length > 8 && (
                    <div 
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => toggleGroup(`week-${group.weekInfo.year}-W${group.weekInfo.week}`)}
                    >
                      {expandedGroups.has(`week-${group.weekInfo.year}-W${group.weekInfo.week}`) ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500">Voir moins</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500">+{group.entries.length - 8} autres</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            
            {/* Pagination - Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  loading={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Chargement...' : `Charger plus (${timeEntries.length} entrées chargées)`}
                </Button>
              </div>
            )}
          </div>
        )}
      </MotionDiv>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedEntry(null);
          resetForm();
        }}
        title={selectedEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durée (heures) *
            </label>
            <Input
              type="number"
              step="0.25"
              min="0"
              value={durationHours}
              onChange={(e) => setDurationHours(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 2.5"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formatDuration(formData.duration)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du travail effectué..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client (optionnel)
            </label>
            <Select
              value={formData.client_id?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value ? parseInt(e.target.value) : null })}
              options={[
                { value: '', label: 'Aucun client' },
                ...clients.map(c => ({ value: c.id.toString(), label: c.company_name }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Projet (optionnel)
            </label>
            <Select
              value={formData.project_id?.toString() || ''}
              onChange={(e) => {
                const newProjectId = e.target.value ? parseInt(e.target.value) : null;
                // Réinitialiser la tâche si elle n'appartient pas au nouveau projet
                let newTaskId = formData.task_id;
                if (newProjectId && formData.task_id) {
                  const selectedTask = tasks.find(t => t.id === formData.task_id);
                  if (selectedTask && selectedTask.project_id !== newProjectId) {
                    newTaskId = null;
                  }
                }
                setFormData({ ...formData, project_id: newProjectId, task_id: newTaskId });
              }}
              options={[
                { value: '', label: 'Aucun projet' },
                ...projects.map(p => ({ value: p.id.toString(), label: p.name }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tâche (optionnel)
            </label>
            <Select
              value={formData.task_id?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value ? parseInt(e.target.value) : null })}
              options={[
                { value: '', label: 'Aucune tâche' },
                ...tasks
                  .filter(t => !formData.project_id || t.project_id === formData.project_id)
                  .map(t => ({ value: t.id.toString(), label: t.title }))
              ]}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            {!selectedEntry && formData.task_id && !timerStatus?.active && (
              <Button
                variant="outline"
                onClick={() => {
                  startTimerMutation.mutate({ 
                    taskId: formData.task_id!, 
                    description: formData.description || undefined 
                  });
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={startTimerMutation.isPending}
                className="text-primary-500 border-primary-500 hover:bg-primary-500/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Démarrer le timer
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedEntry(null);
                  resetForm();
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {selectedEntry ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedEntry(null);
        }}
        title="Détails de l'entrée"
        position="right"
        size="lg"
      >
        {selectedEntry ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Durée
              </h4>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatDuration(selectedEntry.duration)}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Date
              </h4>
              <p className="text-gray-900 dark:text-white">
                {new Date(selectedEntry.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {selectedEntry.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Description
                </h4>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedEntry.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedEntry.user_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Employé
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedEntry.user_name}
                  </p>
                  {selectedEntry.user_email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedEntry.user_email}
                    </p>
                  )}
                </div>
              )}

              {selectedEntry.client_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Client
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedEntry.client_name}
                  </p>
                </div>
              )}

              {selectedEntry.project_name && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Projet
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedEntry.project_name}
                  </p>
                </div>
              )}

              {selectedEntry.task_title && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Tâche
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedEntry.task_title}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>
                  Créée le {new Date(selectedEntry.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {selectedEntry.updated_at !== selectedEntry.created_at && (
                  <p>
                    Modifiée le {new Date(selectedEntry.updated_at).toLocaleDateString('fr-FR', {
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

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailDrawer(false);
                  handleEdit(selectedEntry);
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
                  handleDelete(selectedEntry);
                }}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </Drawer>
    </PageContainer>
  );
}
