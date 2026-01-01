'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Calendar, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { useInfiniteProjects } from '@/lib/query/projects';
import { useInfiniteProjectTasks } from '@/lib/query/project-tasks';

type DeadlineStatus = 'overdue' | 'today' | 'upcoming' | 'completed';

interface DeadlineItem {
  id: string;
  title: string;
  projectName: string;
  projectId: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  status: DeadlineStatus;
  daysRemaining: number;
}

const priorityConfig = {
  high: { label: 'Haute', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  medium: { label: 'Moyenne', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  low: { label: 'Basse', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' }
};

const statusConfig = {
  overdue: { label: 'En retard', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle },
  today: { label: 'Aujourd\'hui', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Clock },
  upcoming: { label: 'À venir', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Calendar },
  completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle }
};

function calculateDeadlineStatus(dueDate: string, taskStatus: string): { status: DeadlineStatus; daysRemaining: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (taskStatus === 'completed' || taskStatus === 'done') {
    return { status: 'completed', daysRemaining: 0 };
  }
  
  if (diffDays < 0) {
    return { status: 'overdue', daysRemaining: diffDays };
  } else if (diffDays === 0) {
    return { status: 'today', daysRemaining: 0 };
  } else {
    return { status: 'upcoming', daysRemaining: diffDays };
  }
}

export default function DeadlinesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'high' | 'medium' | 'low' | 'all'>('all');

  const { data: projectsData, isLoading: projectsLoading } = useInfiniteProjects();
  const { data: tasksData, isLoading: tasksLoading } = useInfiniteProjectTasks();

  const projects = projectsData?.pages.flatMap(page => page) || [];
  const tasks = tasksData?.pages.flatMap(page => page) || [];

  const deadlines: DeadlineItem[] = useMemo(() => {
    return tasks
      .filter(task => task.due_date)
      .map(task => {
        const project = projects.find(p => p.id === task.project_id);
        const { status, daysRemaining } = calculateDeadlineStatus(task.due_date!, task.status);
        
        return {
          id: String(task.id),
          title: task.title,
          projectName: project?.name || 'Projet inconnu',
          projectId: task.project_id ? String(task.project_id) : '',
          dueDate: task.due_date!,
          priority: (task.priority as 'high' | 'medium' | 'low') || 'medium',
          assignedTo: task.assignee_name || undefined,
          status,
          daysRemaining
        };
      })
      .sort((a, b) => {
        // Sort by status priority (overdue > today > upcoming > completed)
        const statusPriority = { overdue: 0, today: 1, upcoming: 2, completed: 3 };
        if (statusPriority[a.status] !== statusPriority[b.status]) {
          return statusPriority[a.status] - statusPriority[b.status];
        }
        // Then by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, projects]);

  const filteredDeadlines = deadlines.filter(deadline => {
    const matchesSearch = !searchQuery ||
      deadline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deadline.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deadline.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || deadline.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    ongoing: deadlines.filter(d => d.status !== 'completed').length,
    overdue: deadlines.filter(d => d.status === 'overdue').length,
    today: deadlines.filter(d => d.status === 'today').length,
    upcoming: deadlines.filter(d => d.status === 'upcoming').length
  };

  const isLoading = projectsLoading || tasksLoading;

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Échéances Projets
                </h1>
                <p className="text-white/80 text-sm">Suivez les deadlines de vos projets et tâches</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.ongoing}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En cours</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.overdue}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En retard</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.today}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Aujourd'hui</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.upcoming}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">À venir</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une échéance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant={statusFilter === 'all' ? 'primary' : 'outline'} onClick={() => setStatusFilter('all')}>
                  Tous
                </Button>
                <Button size="sm" variant={statusFilter === 'overdue' ? 'primary' : 'outline'} onClick={() => setStatusFilter('overdue')}>
                  En retard
                </Button>
                <Button size="sm" variant={statusFilter === 'today' ? 'primary' : 'outline'} onClick={() => setStatusFilter('today')}>
                  Aujourd'hui
                </Button>
                <Button size="sm" variant={statusFilter === 'upcoming' ? 'primary' : 'outline'} onClick={() => setStatusFilter('upcoming')}>
                  À venir
                </Button>
                <Button size="sm" variant={statusFilter === 'completed' ? 'primary' : 'outline'} onClick={() => setStatusFilter('completed')}>
                  Terminé
                </Button>
              </div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex gap-2">
                <Button size="sm" variant={priorityFilter === 'all' ? 'primary' : 'outline'} onClick={() => setPriorityFilter('all')}>
                  Toutes priorités
                </Button>
                <Button size="sm" variant={priorityFilter === 'high' ? 'primary' : 'outline'} onClick={() => setPriorityFilter('high')}>
                  Haute
                </Button>
                <Button size="sm" variant={priorityFilter === 'medium' ? 'primary' : 'outline'} onClick={() => setPriorityFilter('medium')}>
                  Moyenne
                </Button>
                <Button size="sm" variant={priorityFilter === 'low' ? 'primary' : 'outline'} onClick={() => setPriorityFilter('low')}>
                  Basse
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Deadlines List */}
        {isLoading ? (
          <Card className="glass-card p-8 rounded-xl border border-[#A7A2CF]/20 text-center">
            <div className="text-gray-600 dark:text-gray-400">Chargement des échéances...</div>
          </Card>
        ) : filteredDeadlines.length === 0 ? (
          <Card className="glass-card p-8 rounded-xl border border-[#A7A2CF]/20 text-center">
            <div className="text-gray-600 dark:text-gray-400">Aucune échéance trouvée</div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDeadlines.map((deadline) => {
              const StatusIcon = statusConfig[deadline.status].icon;
              return (
                <Card key={deadline.id} className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] flex flex-col items-center justify-center text-white">
                        <div className="text-xs font-medium">
                          {new Date(deadline.dueDate).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {new Date(deadline.dueDate).getDate()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{deadline.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Projet: {deadline.projectName}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Badge className={`${priorityConfig[deadline.priority].color} border`}>
                            {priorityConfig[deadline.priority].label}
                          </Badge>
                          <Badge className={`${statusConfig[deadline.status].color} border flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[deadline.status].label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {deadline.assignedTo && (
                          <div className="flex items-center gap-1.5">
                            <span>Assigné à: {deadline.assignedTo}</span>
                          </div>
                        )}
                        {deadline.status !== 'completed' && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                              {deadline.daysRemaining === 0 
                                ? "Aujourd'hui" 
                                : deadline.daysRemaining < 0
                                  ? `En retard de ${Math.abs(deadline.daysRemaining)} jour${Math.abs(deadline.daysRemaining) > 1 ? 's' : ''}`
                                  : `Dans ${deadline.daysRemaining} jour${deadline.daysRemaining > 1 ? 's' : ''}`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
