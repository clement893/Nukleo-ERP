'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { 
  useInfiniteProjectTasks,
} from '@/lib/query/project-tasks';
import type { TaskStatus, TaskPriority, ProjectTask } from '@/lib/api/project-tasks';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Drawer from '@/components/ui/Drawer';
import Tabs from '@/components/ui/Tabs';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/components/ui';
import ProjectComments from '@/components/projects/ProjectComments';
import ProjectAttachments from '@/components/projects/ProjectAttachments';
import { 
  Search,
  List as ListIcon,
  CheckSquare,
  Clock,
  User,
  Calendar,
  FolderKanban,
  Users,
  Circle,
  Play,
  Ban,
  ArrowRight,
  CheckCircle2,
  Info,
  MessageSquare,
  Paperclip
} from 'lucide-react';

type ViewMode = 'list' | 'kanban';
type FilterStatus = 'all' | TaskStatus;
type FilterPriority = 'all' | TaskPriority;
type SortBy = 'created_at' | 'due_date' | 'priority' | 'title' | 'status';
type SortDirection = 'asc' | 'desc';

export default function TachesPage() {
  const { showToast } = useToast();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Drawer state
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [taskDetails, setTaskDetails] = useState<ProjectTask | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // API Hooks
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProjectTasks(50, {
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Flatten tasks from pages
  const tasks = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  // Get unique values for filters
  const uniqueTeams = useMemo(() => {
    const teams = new Set<number>();
    tasks.forEach(task => {
      if (task.team_id) teams.add(task.team_id);
    });
    return Array.from(teams);
  }, [tasks]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set<number>();
    tasks.forEach(task => {
      if (task.project_id) projects.add(task.project_id);
    });
    return Array.from(projects);
  }, [tasks]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<number>();
    tasks.forEach(task => {
      if (task.assignee_id) assignees.add(task.assignee_id);
    });
    return Array.from(assignees);
  }, [tasks]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee_name?.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(task => task.team_id.toString() === teamFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project_id?.toString() === projectFilter);
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assignee_id?.toString() === assigneeFilter);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' });
          break;
        case 'priority':
          const priorityOrder: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'status':
          const statusOrder: Record<TaskStatus, number> = { 
            todo: 1, in_progress: 2, blocked: 3, to_transfer: 4, completed: 5 
          };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        case 'due_date':
          const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'created_at':
        default:
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = aCreated - bCreated;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, teamFilter, projectFilter, assigneeFilter, sortBy, sortDirection]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      to_transfer: tasks.filter(t => t.status === 'to_transfer').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }, [tasks]);

  // Get status colors
  const getStatusColors = (status: TaskStatus) => {
    const colors: Record<TaskStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
      todo: { 
        bg: 'bg-gray-500/10', 
        text: 'text-gray-600 dark:text-gray-400', 
        border: 'border-gray-500/30',
        icon: <Circle className="w-3 h-3" />
      },
      in_progress: { 
        bg: 'bg-blue-500/10', 
        text: 'text-blue-600 dark:text-blue-400', 
        border: 'border-blue-500/30',
        icon: <Play className="w-3 h-3" />
      },
      blocked: { 
        bg: 'bg-red-500/10', 
        text: 'text-red-600 dark:text-red-400', 
        border: 'border-red-500/30',
        icon: <Ban className="w-3 h-3" />
      },
      to_transfer: { 
        bg: 'bg-yellow-500/10', 
        text: 'text-yellow-600 dark:text-yellow-400', 
        border: 'border-yellow-500/30',
        icon: <ArrowRight className="w-3 h-3" />
      },
      completed: { 
        bg: 'bg-green-500/10', 
        text: 'text-green-600 dark:text-green-400', 
        border: 'border-green-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
    };
    return colors[status];
  };

  // Get priority colors
  const getPriorityColors = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, { bg: string; text: string; border: string }> = {
      low: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' },
      medium: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
      high: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
      urgent: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
    };
    return colors[priority];
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Handle opening task details drawer
  const handleOpenTaskDetails = async (task: ProjectTask) => {
    setLoadingDetails(true);
    try {
      const details = await projectTasksAPI.get(task.id);
      setTaskDetails(details);
      setShowTaskDrawer(true);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({ message: appError.message || 'Erreur lors du chargement des détails', type: 'error' });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Status and priority labels
  const STATUS_LABELS: Record<TaskStatus, string> = {
    todo: 'À faire',
    in_progress: 'En cours',
    blocked: 'Bloquée',
    to_transfer: 'À transférer',
    completed: 'Terminée',
  };

  const PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };

  const PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: 'bg-gray-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };

  // Loading skeleton
  const TaskCardSkeleton = () => (
    <div className="glass-card p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="50%" height={16} />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-2">
              <Skeleton variant="text" width={200} height={36} />
              <Skeleton variant="text" width={300} height={20} />
            </div>
            <Skeleton variant="rectangular" width={160} height={44} />
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="glass-card p-4 rounded-xl mb-6 space-y-4">
          <Skeleton variant="rectangular" width="100%" height={44} />
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={100} height={36} />
            ))}
          </div>
        </div>

        {/* Tasks skeleton */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen p-6">
        <Alert variant="error">
          {error?.message || 'Erreur lors du chargement des tâches'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Tâches</h1>
            <p className="text-muted-accessible mt-1">Consultez et gérez toutes les tâches de l'ERP</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
              className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 text-muted-accessible hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              aria-label={viewMode === 'list' ? 'Passer en vue Kanban' : 'Passer en vue Liste'}
            >
              {viewMode === 'list' ? (
                <>
                  <FolderKanban className="w-4 h-4" aria-hidden="true" />
                  Kanban
                </>
              ) : (
                <>
                  <ListIcon className="w-4 h-4" aria-hidden="true" />
                  Liste
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-xl mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher par titre, description, assigné..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-lg"
            aria-label="Rechercher des tâches"
          />
        </div>

        {/* Status Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
            Toutes {statusCounts.all}
          </button>
          <button
            onClick={() => setStatusFilter('todo')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              statusFilter === 'todo'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Circle className="w-4 h-4" aria-hidden="true" />
            À faire {statusCounts.todo}
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              statusFilter === 'in_progress'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            En cours {statusCounts.in_progress}
          </button>
          <button
            onClick={() => setStatusFilter('blocked')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              statusFilter === 'blocked'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Ban className="w-4 h-4" aria-hidden="true" />
            Bloquées {statusCounts.blocked}
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              statusFilter === 'completed'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'glass-badge hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Terminées {statusCounts.completed}
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par priorité"
          >
            <option value="all">Toutes les priorités</option>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par équipe"
          >
            <option value="all">Toutes les équipes</option>
            {uniqueTeams.map(teamId => (
              <option key={teamId} value={teamId.toString()}>Équipe {teamId}</option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par projet"
          >
            <option value="all">Tous les projets</option>
            {uniqueProjects.map(projectId => (
              <option key={projectId} value={projectId.toString()}>Projet {projectId}</option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="glass-input px-4 py-2 rounded-lg"
            aria-label="Filtrer par assigné"
          >
            <option value="all">Tous les assignés</option>
            {uniqueAssignees.map(assigneeId => {
              const task = tasks.find(t => t.assignee_id === assigneeId);
              return (
                <option key={assigneeId} value={assigneeId.toString()}>
                  {task?.assignee_name || `Assigné ${assigneeId}`}
                </option>
              );
            })}
          </select>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="glass-input flex-1 px-4 py-2 rounded-lg"
              aria-label="Trier les tâches"
            >
              <option value="created_at">Date de création</option>
              <option value="due_date">Date d'échéance</option>
              <option value="priority">Priorité</option>
              <option value="status">Statut</option>
              <option value="title">Titre</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="glass-input px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={sortDirection === 'asc' ? 'Trier en ordre croissant' : 'Trier en ordre décroissant'}
              title={sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-muted-accessible">
        {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} trouvée{filteredTasks.length > 1 ? 's' : ''}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const statusColors = getStatusColors(task.status);
            const priorityColors = getPriorityColors(task.priority);

            return (
              <div
                key={task.id}
                className="glass-card p-4 rounded-xl hover:scale-[1.005] transition-all border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                onClick={(e) => {
                  // Ne pas ouvrir si on clique sur les boutons d'action
                  if ((e.target as HTMLElement).closest('button')) {
                    return;
                  }
                  handleOpenTaskDetails(task);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                        {statusColors.icon}
                        {task.status === 'todo' ? 'À faire' : 
                         task.status === 'in_progress' ? 'En cours' :
                         task.status === 'blocked' ? 'Bloquée' :
                         task.status === 'to_transfer' ? 'À transférer' :
                         'Terminée'}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
                        {task.priority === 'low' ? 'Basse' :
                         task.priority === 'medium' ? 'Moyenne' :
                         task.priority === 'high' ? 'Haute' :
                         'Urgente'}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-accessible mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-accessible">
                      {task.assignee_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" aria-hidden="true" />
                          <span>{task.assignee_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                      )}
                      {task.estimated_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FolderKanban className="w-4 h-4" aria-hidden="true" />
                        <span>Équipe {task.team_id}</span>
                      </div>
                      {task.project_id && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" aria-hidden="true" />
                          <span>Projet {task.project_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche trouvée"
          description="Essayez de modifier vos filtres pour voir plus de tâches"
          variant="default"
        />
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="glass-button px-6 py-3 rounded-xl text-blue-600 hover:bg-blue-500/10 transition-all"
            aria-label="Charger plus de tâches"
          >
            {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}

      {/* Task Details Drawer */}
      <Drawer
        isOpen={showTaskDrawer}
        onClose={() => {
          setShowTaskDrawer(false);
          setTaskDetails(null);
        }}
        title={taskDetails?.title || ''}
        position="right"
        size="xl"
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        {loadingDetails ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : taskDetails ? (
          <div className="h-full">
            <Tabs
              tabs={[
                {
                  id: 'info',
                  label: 'Informations',
                  icon: <Info className="w-4 h-4" />,
                  content: (
                    <div className="space-y-6">
                      {taskDetails.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Description
                          </h4>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {taskDetails.description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Statut
                          </h4>
                          <span className="text-sm">{STATUS_LABELS[taskDetails.status]}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Priorité
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full text-white ${PRIORITY_COLORS[taskDetails.priority]}`}>
                            {PRIORITY_LABELS[taskDetails.priority]}
                          </span>
                        </div>
                        {taskDetails.due_date && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              Échéance
                            </h4>
                            <span className="text-sm">
                              {new Date(taskDetails.due_date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                        {taskDetails.estimated_hours && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              Heures estimées
                            </h4>
                            <span className="text-sm">{taskDetails.estimated_hours}h</span>
                          </div>
                        )}
                        {taskDetails.assignee_name && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              Assigné à
                            </h4>
                            <span className="text-sm">{taskDetails.assignee_name}</span>
                          </div>
                        )}
                        {taskDetails.team_id && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              Équipe
                            </h4>
                            <span className="text-sm">Équipe {taskDetails.team_id}</span>
                          </div>
                        )}
                        {taskDetails.project_id && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              Projet
                            </h4>
                            <span className="text-sm">Projet {taskDetails.project_id}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-4 border-t border-border">
                        <div className="text-xs text-muted-foreground">
                          <p>Créée le {new Date(taskDetails.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}</p>
                          {taskDetails.updated_at !== taskDetails.created_at && (
                            <p className="mt-1">Modifiée le {new Date(taskDetails.updated_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'comments',
                  label: 'Commentaires',
                  icon: <MessageSquare className="w-4 h-4" />,
                  content: <ProjectComments taskId={taskDetails.id} projectId={taskDetails.project_id || undefined} />,
                },
                {
                  id: 'documents',
                  label: 'Documents',
                  icon: <Paperclip className="w-4 h-4" />,
                  content: <ProjectAttachments taskId={taskDetails.id} projectId={taskDetails.project_id || undefined} />,
                },
              ]}
              defaultTab="info"
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
