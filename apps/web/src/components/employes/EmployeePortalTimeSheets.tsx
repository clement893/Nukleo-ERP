'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Badge, Button, Loading, Alert, Input, Select, Modal } from '@/components/ui';
import { timeEntriesAPI, type TimeEntry, type TimeEntryCreate, type TimerStatus } from '@/lib/api/time-entries';
import { handleApiError } from '@/lib/errors/api';
import { employeesAPI } from '@/lib/api/employees';
import { projectsAPI } from '@/lib/api/projects';
import { clientsAPI } from '@/lib/api/clients';
import { projectTasksAPI, type ProjectTask, type ProjectTaskCreate } from '@/lib/api/project-tasks';
import { teamsAPI } from '@/lib/api/teams';
import { useToast } from '@/components/ui';
import { 
  Calendar, 
  Clock, 
  Briefcase, 
  Building, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Play,
  Square,
  Plus,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import {
  groupByWeek,
  groupByMonth,
  groupByProject,
  groupByClient,
  formatDuration,
  formatDurationHours,
  type GroupedTimeEntry,
} from '@/lib/utils/timesheet';
import type { Project } from '@/lib/api/projects';
import type { Client } from '@/lib/api/clients';

// Fix Client interface to match API response
interface ClientWithName extends Client {
  name?: string;
}

type GroupByType = 'week' | 'month' | 'project' | 'client' | 'none';
type ViewMode = 'table' | 'cards';
type QuickView = 'today' | 'week' | 'all';

interface EmployeePortalTimeSheetsProps {
  employeeId: number;
}

export default function EmployeePortalTimeSheets({ employeeId }: EmployeePortalTimeSheetsProps) {
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<{ user_id?: number | null; team_id?: number | null } | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientWithName[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [quickView, setQuickView] = useState<QuickView>('week');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    project_id: '',
    client_id: '',
  });
  const [groupBy, setGroupBy] = useState<GroupByType>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<TimeEntryCreate>({
    description: '',
    duration: 0,
    date: new Date().toISOString().split('T')[0] || '',
    task_id: null,
    project_id: null,
    client_id: null,
  });
  
  // Timer task creation form
  const [timerTaskForm, setTimerTaskForm] = useState({
    title: '',
    description: '',
    project_id: null as number | null,
  });
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  useEffect(() => {
    if (employee && employee.user_id) {
      loadData();
      loadTimerStatus();
    } else if (employee && !employee.user_id) {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    if (employee?.user_id) {
      loadEntries();
    }
  }, [filters, employee, quickView]);

  useEffect(() => {
    // Update timer display
    if (timerStatus?.active && timerStatus.start_time) {
      const updateTimer = () => {
        const startTime = new Date(timerStatus.start_time!).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimerElapsed(elapsed);
      };
      
      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerElapsed(0);
      return undefined;
    }
  }, [timerStatus]);

  // Apply quick view filters
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    if (quickView === 'today') {
      const todayStr = today.toISOString().split('T')[0] || '';
      setFilters(prev => ({
        ...prev,
        start_date: todayStr,
        end_date: todayStr,
      }));
    } else if (quickView === 'week') {
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const startStr = startOfWeek.toISOString().split('T')[0] || '';
      const endStr = endOfWeek.toISOString().split('T')[0] || '';
      
      setFilters(prev => ({
        ...prev,
        start_date: startStr,
        end_date: endStr,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        start_date: '',
        end_date: '',
      }));
    }
  }, [quickView]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeesAPI.get(employeeId);
      setEmployee(data);
      setLoading(false);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de l\'employé');
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load projects, clients, and tasks in parallel
      const [projectsData, clientsData, tasksData] = await Promise.all([
        projectsAPI.list().catch(() => []),
        clientsAPI.list().catch(() => []),
        employee?.user_id ? projectTasksAPI.list({ assignee_id: employee.user_id }).catch(() => []) : Promise.resolve([]),
      ]);

      setProjects(projectsData || []);
      setClients(clientsData || []);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  const loadTimerStatus = async () => {
    if (!employee?.user_id) return;
    
    try {
      const status = await timeEntriesAPI.getTimerStatus();
      setTimerStatus(status);
    } catch (err) {
      console.error('Error loading timer status:', err);
    }
  };

  const loadEntries = async () => {
    if (!employee?.user_id) return;

    setLoading(true);
    setError(null);
    try {
      const params: {
        user_id?: number;
        start_date?: string;
        end_date?: string;
        project_id?: number;
        client_id?: number;
      } = {
        user_id: employee.user_id,
      };

      if (filters.start_date) {
        params.start_date = new Date(filters.start_date).toISOString();
      }
      if (filters.end_date) {
        params.end_date = new Date(filters.end_date).toISOString();
      }
      if (filters.project_id) {
        params.project_id = parseInt(filters.project_id);
      }
      if (filters.client_id) {
        params.client_id = parseInt(filters.client_id);
      }

      const data = await timeEntriesAPI.list(params);
      setEntries(data || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des feuilles de temps');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!employee?.user_id) {
      showToast({ message: 'Aucun utilisateur associé', type: 'error' });
      return;
    }

    let taskId = formData.task_id;

    // If no task selected but task name provided, create new task
    if (!taskId && timerTaskForm.title.trim()) {
      try {
        setCreatingTask(true);
        
        // Get user's team
        let teamId: number | null = null;
        if (employee.team_id) {
          teamId = employee.team_id;
        } else {
          // Try to get user's first team
          try {
            const teamsResponse = await teamsAPI.getMyTeams();
            const teamsData = (teamsResponse as any)?.data?.teams || (teamsResponse as any)?.teams || [];
            if (teamsData.length > 0) {
              teamId = teamsData[0].id;
            }
          } catch (err) {
            console.error('Error loading teams:', err);
          }
        }

        if (!teamId) {
          showToast({ message: 'Aucune équipe trouvée. Veuillez créer une équipe d\'abord.', type: 'error' });
          setCreatingTask(false);
          return;
        }

        // Create task
        const newTask: ProjectTaskCreate = {
          title: timerTaskForm.title,
          description: timerTaskForm.description || null,
          team_id: teamId,
          project_id: timerTaskForm.project_id,
          employee_assignee_id: employeeId,
          status: 'in_progress',
        };

        const createdTask = await projectTasksAPI.create(newTask);
        taskId = createdTask.id;
        
        await loadData(); // Reload tasks
        setFormData(prev => ({ ...prev, task_id: taskId }));
      } catch (err) {
        const appError = handleApiError(err);
        showToast({ message: appError.message || 'Erreur lors de la création de la tâche', type: 'error' });
        setCreatingTask(false);
        return;
      } finally {
        setCreatingTask(false);
      }
    }

    if (!taskId) {
      showToast({ message: 'Veuillez sélectionner une tâche ou créer une nouvelle tâche', type: 'error' });
      return;
    }

    try {
      await timeEntriesAPI.startTimer(taskId, formData.description || undefined);
      await loadTimerStatus();
      showToast({ message: 'Timer démarré', type: 'success' });
      // Clear form
      setTimerTaskForm({ title: '', description: '', project_id: null });
      setFormData(prev => ({ ...prev, description: '' }));
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors du démarrage du timer', type: 'error' });
    }
  };

  const handleStopTimer = async () => {
    try {
      await timeEntriesAPI.stopTimer(formData.description || undefined);
      await loadTimerStatus();
      await loadEntries();
      showToast({ message: 'Timer arrêté et entrée créée', type: 'success' });
      const dateStr = new Date().toISOString().split('T')[0] || '';
      setFormData({
        description: '',
        duration: 0,
        date: dateStr,
        task_id: null,
        project_id: null,
        client_id: null,
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de l\'arrêt du timer', type: 'error' });
    }
  };


  const handleCreateEntry = async () => {
    if (!employee?.user_id) {
      showToast({ message: 'Aucun utilisateur associé', type: 'error' });
      return;
    }

    if (!formData.date || formData.duration <= 0) {
      showToast({ message: 'Date et durée requises', type: 'error' });
      return;
    }

    try {
      // Convert date string to ISO datetime string
      const dateStr = formData.date;
      const dateObj = new Date(dateStr);
      const isoDate = dateObj.toISOString();
      
      const entryData: TimeEntryCreate = {
        ...formData,
        date: isoDate,
      };
      
      await timeEntriesAPI.create(entryData);
      await loadEntries();
      setShowCreateModal(false);
      const todayStr = new Date().toISOString().split('T')[0] || '';
      setFormData({
        description: '',
        duration: 0,
        date: todayStr,
        task_id: null,
        project_id: null,
        client_id: null,
      });
      showToast({ message: 'Entrée créée avec succès', type: 'success' });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
    }
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    try {
      // Convert date string to ISO datetime string
      const dateStr = formData.date;
      const dateObj = new Date(dateStr);
      const isoDate = dateObj.toISOString();
      
      const entryData: TimeEntryCreate = {
        ...formData,
        date: isoDate,
      };
      
      await timeEntriesAPI.update(editingEntry.id, entryData);
      await loadEntries();
      setShowEditModal(false);
      setEditingEntry(null);
      const todayStr = new Date().toISOString().split('T')[0] || '';
      setFormData({
        description: '',
        duration: 0,
        date: todayStr,
        task_id: null,
        project_id: null,
        client_id: null,
      });
      showToast({ message: 'Entrée mise à jour avec succès', type: 'success' });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la mise à jour', type: 'error' });
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;

    try {
      await timeEntriesAPI.delete(entryId);
      await loadEntries();
      showToast({ message: 'Entrée supprimée avec succès', type: 'success' });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    const dateStr = entry.date.split('T')[0] || new Date().toISOString().split('T')[0] || '';
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  // Group entries based on selected grouping
  const groupedEntries: GroupedTimeEntry[] = useMemo(() => {
    if (groupBy === 'week') {
      return groupByWeek(entries);
    } else if (groupBy === 'month') {
      return groupByMonth(entries);
    } else if (groupBy === 'project') {
      return groupByProject(entries);
    } else if (groupBy === 'client') {
      return groupByClient(entries);
    } else {
      return [{
        key: 'all',
        label: 'Toutes les entrées',
        entries,
        totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
      }];
    }
  }, [entries, groupBy]);

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalHours = (totalDuration / 3600).toFixed(2);

  // Statistics
  const stats = useMemo(() => {
    const uniqueProjects = new Set(entries.map(e => e.project_id).filter(Boolean)).size;
    const uniqueClients = new Set(entries.map(e => e.client_id).filter(Boolean)).size;
    
    return {
      totalEntries: entries.length,
      uniqueProjects,
      uniqueClients,
      totalHours: parseFloat(totalHours),
    };
  }, [entries, totalHours]);

  if (!employee) {
    return (
      <div className="space-y-4 mt-4">
        <Card>
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chargement des informations de l'employé...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!employee.user_id) {
    return (
      <div className="space-y-4 mt-4">
        <Card>
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun compte utilisateur associé</p>
            <p className="text-sm">
              Cet employé n'a pas de compte utilisateur associé. Les feuilles de temps nécessitent un compte utilisateur.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Timer Section */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Timer</h2>
          <div className="flex items-center gap-4">
            {timerStatus?.active ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-lg font-mono font-semibold text-foreground">
                    {formatDuration(timerElapsed)}
                  </span>
                </div>
                <Button
                  variant="danger"
                  onClick={handleStopTimer}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Arrêter
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={handleStartTimer}
                className="flex items-center gap-2"
                disabled={(!timerTaskForm.title.trim() && !formData.task_id) || creatingTask}
              >
                <Play className="w-4 h-4" />
                {creatingTask ? 'Création de la tâche...' : 'Démarrer le timer'}
              </Button>
            )}
          </div>
        </div>
        
        {!timerStatus?.active && (
          <div className="mt-4 space-y-4 p-4 bg-accent rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  label="Nom de la tâche"
                  placeholder="Ex: Développement fonctionnalité X"
                  value={timerTaskForm.title}
                  onChange={(e) => setTimerTaskForm({ ...timerTaskForm, title: e.target.value })}
                />
              </div>
              <div>
                <Select
                  label="Projet (optionnel)"
                  value={timerTaskForm.project_id?.toString() || ''}
                  onChange={(e) => setTimerTaskForm({ ...timerTaskForm, project_id: e.target.value ? parseInt(e.target.value) : null })}
                  options={[
                    { value: '', label: 'Aucun projet' },
                    ...projects.map((proj) => ({
                      value: proj.id.toString(),
                      label: proj.name,
                    })),
                  ]}
                />
              </div>
            </div>
            <div>
              <Input
                type="text"
                label="Description (optionnel)"
                placeholder="Notes sur le travail effectué"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                label="Ou sélectionner une tâche existante"
                value={formData.task_id?.toString() || ''}
                onChange={(e) => {
                  const taskId = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ ...formData, task_id: taskId });
                  if (taskId) {
                    // Clear new task form if selecting existing task
                    setTimerTaskForm({ title: '', description: '', project_id: null });
                  }
                }}
                options={[
                  { value: '', label: 'Créer une nouvelle tâche' },
                  ...tasks.map((task) => ({
                    value: task.id.toString(),
                    label: task.title,
                  })),
                ]}
              />
            </div>
          </div>
        )}
        
        {timerStatus?.active && timerStatus.task_id && (
          <div className="mt-4 p-4 bg-accent rounded-lg">
            <p className="text-sm text-muted-foreground">
              Tâche: {tasks.find(t => t.id === timerStatus.task_id)?.title || `Tâche #${timerStatus.task_id}`}
            </p>
            {timerStatus.description && (
              <p className="text-sm text-muted-foreground mt-1">{timerStatus.description}</p>
            )}
          </div>
        )}
      </Card>

      {/* Quick View Buttons */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Vue rapide:</span>
          <Button
            variant={quickView === 'today' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setQuickView('today')}
          >
            Aujourd'hui
          </Button>
          <Button
            variant={quickView === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setQuickView('week')}
          >
            Cette semaine
          </Button>
          <Button
            variant={quickView === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setQuickView('all')}
          >
            Tout
          </Button>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total heures</p>
              <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrées</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalEntries}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projets</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueProjects}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clients</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueClients}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Filtres et regroupement</h2>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une entrée
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Select
              label="Regrouper par"
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as GroupByType);
                setExpandedGroups(new Set());
              }}
              options={[
                { value: 'week', label: 'Semaine' },
                { value: 'month', label: 'Mois' },
                { value: 'project', label: 'Projet' },
                { value: 'client', label: 'Client' },
                { value: 'none', label: 'Aucun' },
              ]}
            />
          </div>
          <div>
            <Input
              type="date"
              label="Date de début"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="date"
              label="Date de fin"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Projet"
              value={filters.project_id || ''}
              onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
              options={[
                { value: '', label: 'Tous les projets' },
                ...projects.map((proj) => ({
                  value: proj.id.toString(),
                  label: proj.name,
                })),
              ]}
            />
          </div>
          <div>
            <Select
              label="Client"
              value={filters.client_id || ''}
              onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
              options={[
                { value: '', label: 'Tous les clients' },
                ...clients.map((client) => ({
                  value: client.id.toString(),
                  label: client.company_name || client.name || `Client ${client.id}`,
                })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Entries List - Grouped */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Mes entrées de temps</h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cartes
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Tableau
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune entrée de temps</p>
            </div>
          ) : (
            groupedEntries.map((group) => {
              const isExpanded = expandedGroups.has(group.key);
              return (
                <div key={group.key} className="border border-border rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full p-4 bg-accent hover:bg-accent/80 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{group.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.entries.length} entrée{group.entries.length > 1 ? 's' : ''} • {formatDurationHours(group.totalDuration)}h
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-lg">
                      {formatDuration(group.totalDuration)}
                    </Badge>
                  </button>

                  {/* Group Entries */}
                  {isExpanded && (
                    <div className="p-4">
                      {viewMode === 'table' ? (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-2 text-sm font-medium text-foreground">Date</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Tâche</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Projet</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Client</th>
                              <th className="text-right p-2 text-sm font-medium text-foreground">Durée</th>
                              <th className="text-right p-2 text-sm font-medium text-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.entries.map((entry) => (
                              <tr key={entry.id} className="border-b border-border hover:bg-accent">
                                <td className="p-2 text-sm text-foreground">{formatDate(entry.date)}</td>
                                <td className="p-2 text-sm text-foreground">{entry.task_title || '-'}</td>
                                <td className="p-2 text-sm text-foreground">{entry.project_name || '-'}</td>
                                <td className="p-2 text-sm text-foreground">{entry.client_name || '-'}</td>
                                <td className="p-2 text-sm text-foreground text-right">{formatDuration(entry.duration)}</td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditEntry(entry)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      className="h-8 w-8 p-0 text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="space-y-3">
                          {group.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium text-foreground">
                                      {entry.task_title || 'Tâche sans titre'}
                                    </h4>
                                    <Badge variant="default">{formatDuration(entry.duration)}</Badge>
                                  </div>
                                  
                                  {entry.description && (
                                    <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>
                                  )}
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="w-4 h-4" />
                                      <span>{formatDate(entry.date)}</span>
                                    </div>
                                    
                                    {entry.project_name && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{entry.project_name}</span>
                                      </div>
                                    )}
                                    
                                    {entry.client_name && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building className="w-4 h-4" />
                                        <span>{entry.client_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditEntry(entry)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    className="h-8 w-8 p-0 text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Create Entry Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          const dateStr = new Date().toISOString().split('T')[0] || '';
          setFormData({
            description: '',
            duration: 0,
            date: dateStr,
            task_id: null,
            project_id: null,
            client_id: null,
          });
        }}
        title="Créer une entrée de temps"
      >
        <div className="space-y-4">
          <Input
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Durée
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Heures"
                value={Math.floor(formData.duration / 3600)}
                onChange={(e) => {
                  const hours = parseInt(e.target.value) || 0;
                  const minutes = Math.floor((formData.duration % 3600) / 60);
                  setFormData({ ...formData, duration: hours * 3600 + minutes * 60 });
                }}
                min={0}
              />
              <Input
                type="number"
                placeholder="Minutes"
                value={Math.floor((formData.duration % 3600) / 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  const hours = Math.floor(formData.duration / 3600);
                  setFormData({ ...formData, duration: hours * 3600 + Math.min(minutes, 59) * 60 });
                }}
                min={0}
                max={59}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatDuration(formData.duration)}
            </p>
          </div>
          <Input
            type="text"
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Tâche"
            value={formData.task_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, task_id: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'Aucune tâche' },
              ...tasks.map((task) => ({
                value: task.id.toString(),
                label: task.title,
              })),
            ]}
          />
          <Select
            label="Projet"
            value={formData.project_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'Aucun projet' },
              ...projects.map((proj) => ({
                value: proj.id.toString(),
                label: proj.name,
              })),
            ]}
          />
          <Select
            label="Client"
            value={formData.client_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'Aucun client' },
              ...clients.map((client) => ({
                value: client.id.toString(),
                label: client.company_name || client.name || `Client ${client.id}`,
              })),
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleCreateEntry}>
              <Save className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEntry(null);
          const dateStr = new Date().toISOString().split('T')[0] || '';
          setFormData({
            description: '',
            duration: 0,
            date: dateStr,
            task_id: null,
            project_id: null,
            client_id: null,
          });
        }}
        title="Modifier l'entrée de temps"
      >
        <div className="space-y-4">
          <Input
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Durée
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Heures"
                value={Math.floor(formData.duration / 3600)}
                onChange={(e) => {
                  const hours = parseInt(e.target.value) || 0;
                  const minutes = Math.floor((formData.duration % 3600) / 60);
                  setFormData({ ...formData, duration: hours * 3600 + minutes * 60 });
                }}
                min={0}
              />
              <Input
                type="number"
                placeholder="Minutes"
                value={Math.floor((formData.duration % 3600) / 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  const hours = Math.floor(formData.duration / 3600);
                  setFormData({ ...formData, duration: hours * 3600 + Math.min(minutes, 59) * 60 });
                }}
                min={0}
                max={59}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatDuration(formData.duration)}
            </p>
          </div>
          <Input
            type="text"
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Tâche"
            value={formData.task_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, task_id: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'Aucune tâche' },
              ...tasks.map((task) => ({
                value: task.id.toString(),
                label: task.title,
              })),
            ]}
          />
          <Select
            label="Projet"
            value={formData.project_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'Aucun projet' },
              ...projects.map((proj) => ({
                value: proj.id.toString(),
                label: proj.name,
              })),
            ]}
          />
          <Select
            label="Client"
            value={formData.client_id?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'Aucun client' },
              ...clients.map((client) => ({
                value: client.id.toString(),
                label: client.company_name || client.name || `Client ${client.id}`,
              })),
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleUpdateEntry}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
