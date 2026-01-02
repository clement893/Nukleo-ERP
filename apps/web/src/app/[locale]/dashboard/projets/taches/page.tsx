'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import Drawer from '@/components/ui/Drawer';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Select from '@/components/ui/Select';
import { 
  CheckSquare, 
  CheckCircle2,
  Plus,
  Search,
  List as ListIcon,
  LayoutGrid,
  User,
  Calendar,
  Circle,
  Play,
  Ban,
  Trash2,
  Eye,
  Loader2,
  Info,
  MessageSquare,
  Paperclip,
  Edit,
  Copy,
  MoreVertical,
  Download,
  FileDown,
  CheckSquare as CheckSquareIcon,
  Square
} from 'lucide-react';
import { Badge, Button, Card, Input, useToast, Loading } from '@/components/ui';
import { 
  useInfiniteProjectTasks, 
  useDeleteProjectTask, 
  useProjectTask,
  useCreateProjectTask,
  useUpdateProjectTask
} from '@/lib/query/project-tasks';
import { projectTasksAPI, type ProjectTask, type ProjectTaskCreate, type ProjectTaskUpdate, type TaskStatus, type TaskPriority } from '@/lib/api/project-tasks';
import ProjectComments from '@/components/projects/ProjectComments';
import ProjectAttachments from '@/components/projects/ProjectAttachments';
import TaskTimer from '@/components/projects/TaskTimer';
import TaskForm from '@/components/projects/TaskForm';
import KanbanBoard from '@/components/ui/KanbanBoard';
import { handleApiError } from '@/lib/errors/api';
import { useDebounce } from '@/hooks/useDebounce';
import { projectsAPI } from '@/lib/api/projects';
import { teamsAPI } from '@/lib/api/teams';
import { employeesAPI } from '@/lib/api/employees';

type ViewMode = 'list' | 'kanban';
type GroupBy = 'none' | 'project' | 'assignee' | 'team';

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string }> = {
  todo: { label: 'À faire', icon: Circle, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30' },
  in_progress: { label: 'En cours', icon: Play, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  blocked: { label: 'Bloqué', icon: Ban, color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
  to_transfer: { label: 'À transférer', icon: CheckCircle2, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  completed: { label: 'Terminé', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' }
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30' },
  medium: { label: 'Moyenne', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  high: { label: 'Haute', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  urgent: { label: 'Urgente', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' }
};

export default function TachesPage() {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Advanced filters
  const [teamFilter, setTeamFilter] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  
  // Selection
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  
  // Drawer state
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskDetails, setTaskDetails] = useState<ProjectTask | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'info' | 'comments' | 'attachments' | 'edit'>('info');

  // Data for filters
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch tasks with filters
  const { data, isLoading, error } = useInfiniteProjectTasks(100, {
    team_id: teamFilter || undefined,
    project_id: projectFilter || undefined,
    assignee_id: assigneeFilter || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const tasks = useMemo(() => data?.pages.flat() || [], [data]);

  // Mutations
  const createTaskMutation = useCreateProjectTask();
  const updateTaskMutation = useUpdateProjectTask();
  const deleteTaskMutation = useDeleteProjectTask();
  
  // Fetch task details when drawer opens
  const { data: taskDetailData, isLoading: isLoadingTaskDetail } = useProjectTask(
    selectedTaskId || 0,
    !!selectedTaskId && showTaskDrawer
  );
  
  // Update taskDetails when data is loaded
  useEffect(() => {
    if (taskDetailData) {
      setTaskDetails(taskDetailData);
    }
  }, [taskDetailData]);

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Load teams
        const teamsResponse = await teamsAPI.list(0, 1000);
        const teamsData = teamsResponse.data || teamsResponse;
        const teamsList = (teamsData as any)?.teams || (Array.isArray(teamsData) ? teamsData : []);
        setTeams(teamsList.map((t: any) => ({ id: t.id, name: t.name || t.slug })));

        // Load projects
        const projectsData = await projectsAPI.list(0, 1000);
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));

        // Load employees
        const employeesData = await employeesAPI.list(0, 1000);
        setEmployees(employeesData.map(e => ({ 
          id: e.id, 
          name: `${e.first_name} ${e.last_name}` 
        })));
      } catch (err) {
        // Silent fail for filters
      }
    };
    loadFilterData();
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesTeam = !teamFilter || task.team_id === teamFilter;
      const matchesProject = !projectFilter || task.project_id === projectFilter;
      const matchesAssignee = !assigneeFilter || task.assignee_id === assigneeFilter;
      const matchesSearch = !debouncedSearchQuery || 
        task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
        (task.assignee_name && task.assignee_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      return matchesStatus && matchesPriority && matchesTeam && matchesProject && matchesAssignee && matchesSearch;
    });
  }, [tasks, statusFilter, priorityFilter, teamFilter, projectFilter, assigneeFilter, debouncedSearchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }, [tasks]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Toutes les tâches': filteredTasks };
    }

    const groups: Record<string, ProjectTask[]> = {};
    
    filteredTasks.forEach(task => {
      let groupKey = '';
      
      if (groupBy === 'project') {
        groupKey = task.project_id ? `Projet ${task.project_id}` : 'Sans projet';
      } else if (groupBy === 'assignee') {
        groupKey = task.assignee_name || 'Non assigné';
      } else if (groupBy === 'team') {
        groupKey = `Équipe ${task.team_id}`;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      // TypeScript assertion: we just checked and created the array above
      const group = groups[groupKey];
      if (group) {
        group.push(task);
      }
    });
    
    return groups;
  }, [filteredTasks, groupBy]);

  // Handlers
  const handleCreate = useCallback(async (data: ProjectTaskCreate | ProjectTaskUpdate) => {
    try {
      // Ensure required fields for creation
      const createData: ProjectTaskCreate = {
        title: (data as ProjectTaskCreate).title || '',
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        team_id: (data as ProjectTaskCreate).team_id || 0,
        project_id: data.project_id || null,
        assignee_id: data.assignee_id || null,
        employee_assignee_id: data.employee_assignee_id || null,
        due_date: data.due_date || null,
        estimated_hours: data.estimated_hours || null,
      };
      await createTaskMutation.mutateAsync(createData);
      showToast({ message: 'Tâche créée avec succès', type: 'success' });
      setShowCreateModal(false);
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
    }
  }, [createTaskMutation, showToast, setShowCreateModal]);

  const handleUpdate = async (data: ProjectTaskCreate | ProjectTaskUpdate) => {
    if (!editingTask) return;
    try {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data: data as ProjectTaskUpdate });
      showToast({ message: 'Tâche modifiée avec succès', type: 'success' });
      setShowEditModal(false);
      setEditingTask(null);
      if (taskDetails?.id === editingTask.id) {
        // Refresh task details
        const updated = await projectTasksAPI.get(editingTask.id);
        setTaskDetails(updated);
      }
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la modification', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
      await deleteTaskMutation.mutateAsync(id);
      showToast({ message: 'Tâche supprimée avec succès', type: 'success' });
      if (selectedTaskId === id) {
        handleCloseDrawer();
      }
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedTasks.size} tâche(s) ?`)) return;
    
    try {
      await Promise.all(Array.from(selectedTasks).map(id => deleteTaskMutation.mutateAsync(id)));
      showToast({ message: `${selectedTasks.size} tâche(s) supprimée(s) avec succès`, type: 'success' });
      setSelectedTasks(new Set());
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    
    try {
      await Promise.all(
        Array.from(selectedTasks).map(id => 
          updateTaskMutation.mutateAsync({ id, data: { status: newStatus } })
        )
      );
      showToast({ message: `${selectedTasks.size} tâche(s) mise(s) à jour`, type: 'success' });
      setSelectedTasks(new Set());
    } catch (error) {
      showToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    }
  };

  const handleDuplicate = async (task: ProjectTask) => {
    try {
      const duplicateData: ProjectTaskCreate = {
        title: `${task.title} (copie)`,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        team_id: task.team_id,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
      };
      await createTaskMutation.mutateAsync(duplicateData);
      showToast({ message: 'Tâche dupliquée avec succès', type: 'success' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la duplication', type: 'error' });
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const headers = ['ID', 'Titre', 'Description', 'Statut', 'Priorité', 'Équipe', 'Projet', 'Assigné', 'Date d\'échéance', 'Heures estimées', 'Créée le'];
      const rows = filteredTasks.map(task => [
        task.id,
        task.title,
        task.description || '',
        statusConfig[task.status].label,
        priorityConfig[task.priority].label,
        task.team_id,
        task.project_id || '',
        task.assignee_name || '',
        task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '',
        task.estimated_hours || '',
        new Date(task.created_at).toLocaleDateString('fr-FR'),
      ]);

      let content = '';
      if (format === 'csv') {
        content = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      } else {
        // Excel format (TSV-like)
        content = [headers, ...rows].map(row => row.join('\t')).join('\n');
      }

      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taches_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast({ message: `Export ${format.toUpperCase()} réussi`, type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de l\'export', type: 'error' });
    }
  };

  const handleCardMove = async (cardId: string, newStatus: string) => {
    try {
      const taskId = parseInt(cardId);
      await updateTaskMutation.mutateAsync({ 
        id: taskId, 
        data: { status: newStatus as TaskStatus } 
      });
    } catch (error) {
      showToast({ message: 'Erreur lors du déplacement', type: 'error' });
    }
  };

  const toggleTaskSelection = (taskId: number) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleView = async (id: number) => {
    setSelectedTaskId(id);
    setShowTaskDrawer(true);
    setLoadingDetails(true);
    setTaskDetails(null);
    
    try {
      const task = await projectTasksAPI.get(id);
      setTaskDetails(task);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement de la tâche',
        type: 'error',
      });
      setShowTaskDrawer(false);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleCloseDrawer = () => {
    setShowTaskDrawer(false);
    setSelectedTaskId(null);
    setTaskDetails(null);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Pas de date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des tâches</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full">
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <CheckSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Tâches
                  </h1>
                  <p className="text-white/80 text-sm">Gérez vos tâches et suivez leur progression</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedTasks.size > 0 && (
                  <div className="flex items-center gap-2 mr-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer ({selectedTasks.size})
                    </Button>
                    <Dropdown
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                        >
                          Changer statut ({selectedTasks.size})
                        </Button>
                      }
                      items={[
                        { label: 'À faire', onClick: () => handleBulkStatusChange('todo') },
                        { label: 'En cours', onClick: () => handleBulkStatusChange('in_progress') },
                        { label: 'Bloqué', onClick: () => handleBulkStatusChange('blocked') },
                        { label: 'À transférer', onClick: () => handleBulkStatusChange('to_transfer') },
                        { label: 'Terminé', onClick: () => handleBulkStatusChange('completed') },
                      ]}
                    />
                  </div>
                )}
                <Dropdown
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  }
                  items={[
                    { label: 'Exporter CSV', onClick: () => handleExport('csv'), icon: <FileDown className="w-4 h-4" /> },
                    { label: 'Exporter Excel', onClick: () => handleExport('excel'), icon: <FileDown className="w-4 h-4" /> },
                  ]}
                />
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <CheckSquare className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Circle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.todo}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">À faire</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.inProgress}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En cours</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.blocked}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Bloqué</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.completed}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Terminé</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col gap-4">
            {/* Top row: Search and View Mode */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* View Mode */}
              <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                  onClick={() => setViewMode('kanban')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status Filter */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'todo' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('todo')}
                >
                  À faire
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'in_progress' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('in_progress')}
                >
                  En cours
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'blocked' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('blocked')}
                >
                  Bloqué
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                >
                  Terminé
                </Button>
              </div>

              {/* Advanced Filters */}
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                options={[
                  { value: 'all', label: 'Toutes priorités' },
                  { value: 'low', label: 'Basse' },
                  { value: 'medium', label: 'Moyenne' },
                  { value: 'high', label: 'Haute' },
                  { value: 'urgent', label: 'Urgente' },
                ]}
                className="w-40"
              />
              <Select
                value={teamFilter ? String(teamFilter) : ''}
                onChange={(e) => setTeamFilter(e.target.value ? parseInt(e.target.value) : null)}
                options={[
                  { value: '', label: 'Toutes équipes' },
                  ...teams.map(t => ({ value: String(t.id), label: t.name })),
                ]}
                className="w-40"
              />
              <Select
                value={projectFilter ? String(projectFilter) : ''}
                onChange={(e) => setProjectFilter(e.target.value ? parseInt(e.target.value) : null)}
                options={[
                  { value: '', label: 'Tous projets' },
                  ...projects.map(p => ({ value: String(p.id), label: p.name })),
                ]}
                className="w-40"
              />
              <Select
                value={assigneeFilter ? String(assigneeFilter) : ''}
                onChange={(e) => setAssigneeFilter(e.target.value ? parseInt(e.target.value) : null)}
                options={[
                  { value: '', label: 'Tous assignés' },
                  ...employees.map(e => ({ value: String(e.id), label: e.name })),
                ]}
                className="w-40"
              />

              {/* Group By */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="none">Sans groupement</option>
                <option value="project">Par projet</option>
                <option value="assignee">Par employé</option>
                <option value="team">Par équipe</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tasks */}
        {filteredTasks.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune tâche trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Essayez de modifier vos critères de recherche' : 'Créez votre première tâche pour commencer'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName}>
                {groupBy !== 'none' && (
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {groupName}
                    </h2>
                    <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30">
                      {groupTasks.length}
                    </Badge>
                  </div>
                )}

                {viewMode === 'list' ? (
                  <div className="space-y-2">
                    {/* Select All */}
                    {groupTasks.length > 0 && (
                      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          {selectedTasks.size === filteredTasks.length && filteredTasks.length > 0 ? (
                            <CheckSquareIcon className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          <span>Sélectionner tout</span>
                        </button>
                      </div>
                    )}
                    {groupTasks.map((task) => {
                      const StatusIcon = statusConfig[task.status].icon;
                      const isSelected = selectedTasks.has(task.id);
                      return (
                        <Card 
                          key={task.id} 
                          className={`glass-card p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-[#523DC9] bg-[#523DC9]/5' 
                              : 'border-[#A7A2CF]/20 hover:border-[#523DC9]/30'
                          }`}
                          onClick={() => handleView(task.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}>
                              {isSelected ? (
                                <CheckSquareIcon className="w-4 h-4 text-[#523DC9]" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className={`p-1.5 rounded-md ${statusConfig[task.status].color}`}>
                              <StatusIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {task.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {task.assignee_name || 'Non assigné'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate(task.due_date)}
                                </span>
                                <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0.5`}>
                                  {priorityConfig[task.priority].label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Dropdown
                                trigger={
                                  <Button size="sm" variant="ghost">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                }
                                items={[
                                  { label: 'Voir les détails', onClick: () => handleView(task.id), icon: <Eye className="w-4 h-4" /> },
                                  { label: 'Modifier', onClick: () => { setEditingTask(task); setShowEditModal(true); }, icon: <Edit className="w-4 h-4" /> },
                                  { label: 'Dupliquer', onClick: () => handleDuplicate(task), icon: <Copy className="w-4 h-4" /> },
                                  { divider: true },
                                  { label: 'Supprimer', onClick: () => handleDelete(task.id), icon: <Trash2 className="w-4 h-4" />, variant: 'danger' },
                                ]}
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : viewMode === 'kanban' ? (
                  <KanbanBoard
                    columns={[
                      { id: 'todo', title: 'À faire', status: 'todo' },
                      { id: 'in_progress', title: 'En cours', status: 'in_progress' },
                      { id: 'blocked', title: 'Bloqué', status: 'blocked' },
                      { id: 'to_transfer', title: 'À transférer', status: 'to_transfer' },
                      { id: 'completed', title: 'Terminé', status: 'completed' },
                    ]}
                    cards={groupTasks.map(task => ({
                      id: String(task.id),
                      title: task.title,
                      description: task.description || undefined,
                      status: task.status,
                      priority: task.priority === 'urgent' ? 'high' : (task.priority as 'low' | 'medium' | 'high'),
                      assignee: task.assignee_name || undefined,
                      dueDate: task.due_date ? new Date(task.due_date) : undefined,
                    }))}
                    onCardMove={handleCardMove}
                    onCardClick={(card) => handleView(parseInt(card.id))}
                    renderCard={(card, isDragged) => {
                      const task = groupTasks.find(t => String(t.id) === card.id);
                      if (!task) return null;
                      const StatusIcon = statusConfig[task.status].icon;
                      return (
                        <Card className={`glass-card p-3 rounded-lg border border-[#A7A2CF]/20 ${isDragged ? 'opacity-50' : ''}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge className={`${statusConfig[task.status].color} text-xs px-1.5 py-0.5`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[task.status].label}
                            </Badge>
                            <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0.5`}>
                              {priorityConfig[task.priority].label}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                            {task.title}
                          </h3>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            {task.assignee_name && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="truncate">{task.assignee_name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(task.due_date)}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupTasks.map((task) => {
                      const StatusIcon = statusConfig[task.status].icon;
                      return (
                        <Card 
                          key={task.id} 
                          className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer"
                          onClick={() => handleView(task.id)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge className={`${statusConfig[task.status].color} text-xs px-1.5 py-0.5`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[task.status].label}
                            </Badge>
                            <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0.5`}>
                              {priorityConfig[task.priority].label}
                            </Badge>
                          </div>
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                            {task.title}
                          </h3>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="truncate">{task.assignee_name || 'Non assigné'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(task.due_date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" onClick={() => handleView(task.id)} className="flex-1 text-xs px-2 py-1">
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(task.id)}
                              disabled={deleteTaskMutation.isPending}
                              className="text-xs px-2 py-1"
                            >
                              {deleteTaskMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </MotionDiv>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle tâche"
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createTaskMutation.isPending}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        title="Modifier la tâche"
        size="lg"
      >
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTask(null);
            }}
            loading={updateTaskMutation.isPending}
          />
        )}
      </Modal>
      
      {/* Task Details Drawer */}
      <Drawer
        isOpen={showTaskDrawer}
        onClose={handleCloseDrawer}
        title={taskDetails?.title || 'Détails de la tâche'}
        position="right"
        size="xl"
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        {loadingDetails || isLoadingTaskDetail ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : taskDetails ? (
          <div className="h-full flex flex-col">
            <Tabs
              tabs={[
                {
                  id: 'info',
                  label: 'Informations',
                  icon: <Info className="w-4 h-4" />,
                  content: (
                    <div className="space-y-6 py-4">
                      {/* Timer */}
                      <div className="mb-4">
                        <TaskTimer taskId={taskDetails.id} />
                      </div>
                      
                      {/* Description */}
                      {taskDetails.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Description
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {taskDetails.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Statut
                          </h4>
                          <Badge className={statusConfig[taskDetails.status].color}>
                            {statusConfig[taskDetails.status].label}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Priorité
                          </h4>
                          <Badge className={priorityConfig[taskDetails.priority].color}>
                            {priorityConfig[taskDetails.priority].label}
                          </Badge>
                        </div>
                        {taskDetails.due_date && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              Échéance
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {formatDate(taskDetails.due_date)}
                            </p>
                          </div>
                        )}
                        {taskDetails.estimated_hours && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              Heures estimées
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {taskDetails.estimated_hours}h
                            </p>
                          </div>
                        )}
                        {taskDetails.assignee_name && (
                          <div className="col-span-2">
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              Assigné à
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {taskDetails.assignee_name}
                              {taskDetails.assignee_email && (
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  ({taskDetails.assignee_email})
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Dates */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        {taskDetails.started_at && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Démarrée le
                            </h4>
                            <p className="text-xs text-gray-900 dark:text-white">
                              {formatDate(taskDetails.started_at)}
                            </p>
                          </div>
                        )}
                        {taskDetails.completed_at && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Terminée le
                            </h4>
                            <p className="text-xs text-gray-900 dark:text-white">
                              {formatDate(taskDetails.completed_at)}
                            </p>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Créée le
                          </h4>
                          <p className="text-xs text-gray-900 dark:text-white">
                            {formatDate(taskDetails.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'comments',
                  label: 'Commentaires',
                  icon: <MessageSquare className="w-4 h-4" />,
                  content: (
                    <div className="py-4">
                      <ProjectComments 
                        taskId={taskDetails.id} 
                        projectId={taskDetails.project_id || undefined}
                      />
                    </div>
                  ),
                },
                {
                  id: 'attachments',
                  label: 'Documents',
                  icon: <Paperclip className="w-4 h-4" />,
                  content: (
                    <div className="py-4">
                      <ProjectAttachments 
                        taskId={taskDetails.id} 
                        projectId={taskDetails.project_id || undefined}
                      />
                    </div>
                  ),
                },
                {
                  id: 'edit',
                  label: 'Modifier',
                  icon: <Edit className="w-4 h-4" />,
                  content: (
                    <div className="py-4">
                      <TaskForm
                        task={taskDetails}
                        onSubmit={async (data) => {
                          await handleUpdate(data);
                          setDrawerTab('info');
                        }}
                        onCancel={() => setDrawerTab('info')}
                        loading={updateTaskMutation.isPending}
                      />
                    </div>
                  ),
                },
              ]}
              value={drawerTab}
              onChange={(tabId: string) => setDrawerTab(tabId as typeof drawerTab)}
            />
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Tâche non trouvée</p>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
