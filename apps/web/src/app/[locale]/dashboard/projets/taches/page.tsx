'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
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
  Loader2
} from 'lucide-react';
import { Badge, Button, Card, Input, useToast, Loading } from '@/components/ui';
import { useInfiniteProjectTasks, useDeleteProjectTask } from '@/lib/query/project-tasks';
import type { ProjectTask, TaskStatus, TaskPriority } from '@/lib/api/project-tasks';

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
  const router = useRouter();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tasks
  const { data, isLoading, error } = useInfiniteProjectTasks(100);
  const tasks = useMemo(() => data?.pages.flat() || [], [data]);

  // Delete mutation
  const deleteTaskMutation = useDeleteProjectTask();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.assignee_name && task.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchQuery]);

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
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [filteredTasks, groupBy]);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
      await deleteTaskMutation.mutateAsync(id);
      showToast({ message: 'Tâche supprimée avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleView = (id: number) => {
    router.push(`/dashboard/projets/taches/${id}`);
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
    <PageContainer>
      <MotionDiv variant="slideUp" duration="medium">
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
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle tâche
              </Button>
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

            {/* Filters */}
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
                    {groupTasks.map((task) => {
                      const StatusIcon = statusConfig[task.status].icon;
                      return (
                        <Card key={task.id} className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
                          <div className="flex items-center gap-3">
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
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleView(task.id)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDelete(task.id)}
                                disabled={deleteTaskMutation.isPending}
                              >
                                {deleteTaskMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupTasks.map((task) => {
                      const StatusIcon = statusConfig[task.status].icon;
                      return (
                        <Card key={task.id} className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
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
                          <div className="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
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
    </PageContainer>
  );
}
