'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  FolderOpen,
  CheckSquare,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Badge, Button, Card, Loading } from '@/components/ui';
import Link from 'next/link';
import { useInfiniteProjects } from '@/lib/query/projects';
import { useInfiniteClients } from '@/lib/query/clients';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { teamsAPI } from '@/lib/api/teams';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#523DC9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function OperationsDashboardPage() {
  const params = useParams();
  const locale = params?.locale as string || 'fr';
  
  // Fetch data
  const { data: projectsData, isLoading: loadingProjects } = useInfiniteProjects(1000);
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['project-tasks', 'all'],
    queryFn: () => projectTasksAPI.list({ limit: 1000 }),
    staleTime: 1000 * 60 * 5,
  });
  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: async () => {
      const response = await teamsAPI.list(0, 1000);
      return response.data?.teams || [];
    },
    staleTime: 1000 * 60 * 5,
  });
  const { data: clientsData, isLoading: loadingClients } = useInfiniteClients(1000);

  const loading = loadingProjects || loadingTasks || loadingTeams || loadingClients;

  // Flatten data
  const projects = useMemo(() => projectsData?.pages.flat() || [], [projectsData]);
  const tasks = useMemo(() => tasksData || [], [tasksData]);
  const teams = useMemo(() => teamsData || [], [teamsData]);
  const clients = useMemo(() => clientsData?.pages.flat() || [], [clientsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    const archivedProjects = projects.filter(p => p.status === 'ARCHIVED').length;
    const onHoldProjects = projects.filter(p => {
      const status = p.status as string;
      return status === 'ON_HOLD' || status === 'on_hold';
    }).length;
    
    const activeTasks = tasks.filter(t => t.status !== 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const urgentTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const daysUntilDue = Math.ceil((new Date(t.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    }).length;

    const activeTeams = teams.filter(t => t.is_active).length;
    const activeClients = clients.filter(c => c.status === 'ACTIVE').length;

    return {
      projects: {
        total: projects.length,
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects,
        onHold: onHoldProjects,
      },
      tasks: {
        total: tasks.length,
        active: activeTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        urgent: urgentTasks,
        completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      },
      teams: {
        total: teams.length,
        active: activeTeams,
      },
      clients: {
        total: clients.length,
        active: activeClients,
      },
    };
  }, [projects, tasks, teams, clients]);

  // Projects needing attention
  const projectsNeedingAttention = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return projects
      .filter(p => {
        if (p.status === 'COMPLETED' || p.status === 'ARCHIVED') return false;
        
        // Projects without team
        if (!p.equipe) return true;
        
        // Projects with overdue deadline
        if (p.deadline) {
          const deadline = new Date(p.deadline);
          deadline.setHours(0, 0, 0, 0);
          if (deadline < today) return true;
        }
        
        // Projects with deadline in next 7 days
        if (p.deadline) {
          const deadline = new Date(p.deadline);
          deadline.setHours(0, 0, 0, 0);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0) return true;
        }
        
        // Projects on hold
        if ((p.status as string) === 'ON_HOLD') return true;
        
        return false;
      })
      .sort((a, b) => {
        // Sort by priority: overdue > deadline soon > on hold > no team
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;
        
        if (aDeadline && bDeadline) {
          return aDeadline.getTime() - bDeadline.getTime();
        }
        if (aDeadline) return -1;
        if (bDeadline) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [projects]);

  // Urgent tasks
  const urgentTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks
      .filter(t => {
        if (t.status === 'completed') return false;
        if (!t.due_date) return false;
        
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return daysUntilDue <= 3 && daysUntilDue >= -7; // 3 days ahead or 7 days overdue
      })
      .sort((a, b) => {
        const aDue = a.due_date ? new Date(a.due_date) : new Date();
        const bDue = b.due_date ? new Date(b.due_date) : new Date();
        return aDue.getTime() - bDue.getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  // Recent projects
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at);
        const bDate = new Date(b.updated_at || b.created_at);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [projects]);

  // Projects by status chart data
  const projectsByStatusData = useMemo(() => {
    return [
      { name: 'Actifs', value: stats.projects.active, color: COLORS[0] },
      { name: 'Terminés', value: stats.projects.completed, color: COLORS[1] },
      { name: 'En pause', value: stats.projects.onHold, color: COLORS[2] },
      { name: 'Archivés', value: stats.projects.archived, color: COLORS[3] },
    ].filter(item => item.value > 0);
  }, [stats.projects]);

  // Tasks by priority chart data
  const tasksByPriorityData = useMemo(() => {
    const priorityCounts = {
      urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
      high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length,
      low: tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length,
    };
    
    return [
      { name: 'Urgent', value: priorityCounts.urgent, color: COLORS[3] },
      { name: 'Haute', value: priorityCounts.high, color: COLORS[2] },
      { name: 'Moyenne', value: priorityCounts.medium, color: COLORS[1] },
      { name: 'Basse', value: priorityCounts.low, color: COLORS[0] },
    ].filter(item => item.value > 0);
  }, [tasks]);


  // Get days until deadline
  const getDaysUntilDeadline = (deadline: string | null | undefined): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="min-h-screen">
      <MotionDiv variant="slideUp" duration="normal" className="space-y-6">
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
                Module Opération
              </h1>
              <p className="text-white/80 text-lg">Vue d'ensemble de vos projets, tâches, équipes et clients</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/projets/projets">
                <Button className="bg-white text-primary-500 hover:bg-white/90">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Projets
                </Button>
              </Link>
              <Link href="/dashboard/projets/taches">
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tâches
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <FolderOpen className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.projects.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Projets</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.projects.active} actifs
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <CheckSquare className="w-6 h-6 text-success-500" />
              </div>
              {stats.tasks.urgent > 0 && (
                <Badge className="bg-danger-500 text-white">{stats.tasks.urgent}</Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.tasks.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tâches</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.tasks.completionRate}% complétées
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <Users className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.teams.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Équipes</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.teams.active} actives
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <Building2 className="w-6 h-6 text-success-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.clients.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Clients</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stats.clients.active} actifs
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Priority Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects Needing Attention */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projets nécessitant une attention</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Projets en retard, avec deadline proche ou nécessitant une action
                  </p>
                </div>
                {projectsNeedingAttention.length > 0 && (
                  <Badge className="bg-danger-500 text-white">{projectsNeedingAttention.length}</Badge>
                )}
              </div>
              <div className="space-y-3">
                {projectsNeedingAttention.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p className="font-medium">Aucun projet nécessitant une attention</p>
                    <p className="text-sm mt-1">Tous vos projets sont à jour</p>
                  </div>
                ) : (
                  projectsNeedingAttention.map((project) => {
                    const daysUntilDeadline = getDaysUntilDeadline(project.deadline);
                    const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;
                    const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
                    
                    return (
                      <div
                        key={project.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <Link href={`/${locale}/dashboard/projets/projets/${project.id}`}>
                                <h4 className="font-semibold text-gray-900 dark:text-white hover:text-primary-500 transition-colors">
                                  {project.name}
                                </h4>
                              </Link>
                              {isOverdue && (
                                <Badge className="bg-danger-500/10 text-danger-500 border-danger-500/30 border text-xs">
                                  En retard
                                </Badge>
                              )}
                              {isUrgent && !isOverdue && (
                                <Badge className="bg-warning-500/10 text-warning-500 border-warning-500/30 border text-xs">
                                  Deadline proche
                                </Badge>
                              )}
                              {(project.status as string) === 'ON_HOLD' && (
                                <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/30 border text-xs">
                                  En pause
                                </Badge>
                              )}
                              {!project.equipe && (
                                <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30 border text-xs">
                                  Sans équipe
                                </Badge>
                              )}
                            </div>
                            {project.client_name && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {project.client_name}
                              </p>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              {project.etape && (
                                <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30">
                                  {project.etape}
                                </Badge>
                              )}
                              {project.deadline && (
                                <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {isOverdue && 'Dépassé'}
                                  {!isOverdue && daysUntilDeadline === 0 && "Aujourd'hui"}
                                  {!isOverdue && daysUntilDeadline === 1 && 'Demain'}
                                  {!isOverdue && daysUntilDeadline && daysUntilDeadline > 1 && `${daysUntilDeadline} jours`}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <Link href={`/${locale}/dashboard/projets/projets/${project.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Voir le projet
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Urgent Tasks */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tâches urgentes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tâches avec deadline dans les 3 prochains jours ou en retard
                  </p>
                </div>
                {urgentTasks.length > 0 && (
                  <Badge className="bg-danger-500 text-white">{urgentTasks.length}</Badge>
                )}
              </div>
              <div className="space-y-3">
                {urgentTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p className="font-medium">Aucune tâche urgente</p>
                    <p className="text-sm mt-1">Toutes vos tâches sont à jour</p>
                  </div>
                ) : (
                  urgentTasks.map((task) => {
                    const daysUntilDue = getDaysUntilDeadline(task.due_date);
                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                    
                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {task.title}
                              </h4>
                              {isOverdue && (
                                <Badge className="bg-danger-500/10 text-danger-500 border-danger-500/30 border text-xs">
                                  En retard
                                </Badge>
                              )}
                              {!isOverdue && (
                                <Badge className={`${
                                  task.priority === 'urgent' ? 'bg-danger-500/10 text-danger-500 border-danger-500/30' :
                                  task.priority === 'high' ? 'bg-warning-500/10 text-warning-500 border-warning-500/30' :
                                  'bg-primary-500/10 text-primary-500 border-primary-500/30'
                                } border text-xs`}>
                                  {task.priority === 'urgent' ? 'Urgent' : task.priority === 'high' ? 'Haute' : 'Normale'}
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              {task.due_date && (
                                <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {isOverdue && 'Dépassé'}
                                  {!isOverdue && daysUntilDue === 0 && "Aujourd'hui"}
                                  {!isOverdue && daysUntilDue === 1 && 'Demain'}
                                  {!isOverdue && daysUntilDue && daysUntilDue > 1 && `${daysUntilDue} jours`}
                                </Badge>
                              )}
                              {task.assignee_name && (
                                <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30 text-xs">
                                  {task.assignee_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Overview & Quick Access */}
          <div className="space-y-6">
            {/* Projects Overview Chart */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Répartition des projets</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Par statut</p>
              </div>
              {projectsByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectsByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucun projet</p>
                </div>
              )}
            </Card>

            {/* Tasks by Priority Chart */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Tâches par priorité</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tâches actives</p>
              </div>
              {tasksByPriorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tasksByPriorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#523DC9" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucune tâche</p>
                </div>
              )}
            </Card>

            {/* Quick Access */}
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Accès rapide</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Navigation vers les modules</p>
              </div>
              <div className="space-y-3">
                <Link href={`/${locale}/dashboard/projets/projets`}>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30">
                          <FolderOpen className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Projets</h4>
                          <p className="text-xs text-gray-500">{stats.projects.active} actifs</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
                <Link href={`/${locale}/dashboard/projets/taches`}>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success-500/10 border border-success-500/30">
                          <CheckSquare className="w-5 h-5 text-success-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Tâches</h4>
                          <p className="text-xs text-gray-500">{stats.tasks.active} en cours</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
                <Link href={`/${locale}/dashboard/projets/equipes`}>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning-500/10 border border-warning-500/30">
                          <Users className="w-5 h-5 text-warning-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Équipes</h4>
                          <p className="text-xs text-gray-500">{stats.teams.active} actives</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
                <Link href={`/${locale}/dashboard/projets/clients`}>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success-500/10 border border-success-500/30">
                          <Building2 className="w-5 h-5 text-success-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Clients</h4>
                          <p className="text-xs text-gray-500">{stats.clients.active} actifs</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Projects */}
        <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projets récents</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Derniers projets créés ou modifiés
              </p>
            </div>
            <Link href={`/${locale}/dashboard/projets/projets`}>
              <Button variant="outline" size="sm">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aucun projet</p>
                <p className="text-sm mt-1">Créez votre premier projet pour commencer</p>
              </div>
            ) : (
              recentProjects.map((project) => {
                const statusConfig: Record<string, { label: string; color: string }> = {
                  ACTIVE: { label: 'Actif', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
                  COMPLETED: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
                  ARCHIVED: { label: 'Archivé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
                  ON_HOLD: { label: 'En pause', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
                };
                const status = (statusConfig[project.status as string] ?? statusConfig.ACTIVE) as { label: string; color: string };
                
                return (
                  <Link key={project.id} href={`/${locale}/dashboard/projets/projets/${project.id}`}>
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {project.name}
                        </h4>
                        <Badge className={`${status.color} border text-xs flex-shrink-0 ml-2`}>
                          {status.label}
                        </Badge>
                      </div>
                      {project.client_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {project.client_name}
                        </p>
                      )}
                      {project.etape && (
                        <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30 text-xs">
                          {project.etape}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
