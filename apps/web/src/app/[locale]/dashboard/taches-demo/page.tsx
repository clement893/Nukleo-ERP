'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
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
  Ban
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

type ViewMode = 'list' | 'kanban';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Mock data pour la démo
const mockTasks = [
  {
    id: 1,
    title: 'Implémenter l\'authentification OAuth',
    description: 'Ajouter la connexion via Google et GitHub',
    status: 'IN_PROGRESS' as TaskStatus,
    priority: 'HIGH' as TaskPriority,
    assignee: 'Marie Dubois',
    project: 'Refonte Site Web',
    dueDate: '2026-01-15',
    tags: ['Backend', 'Sécurité']
  },
  {
    id: 2,
    title: 'Designer les maquettes mobile',
    description: 'Créer les écrans pour iOS et Android',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assignee: 'Jean Martin',
    project: 'Application Mobile',
    dueDate: '2026-01-20',
    tags: ['Design', 'UI/UX']
  },
  {
    id: 3,
    title: 'Optimiser les requêtes SQL',
    description: 'Améliorer les performances de la base de données',
    status: 'BLOCKED' as TaskStatus,
    priority: 'URGENT' as TaskPriority,
    assignee: 'Sophie Laurent',
    project: 'Dashboard Analytics',
    dueDate: '2026-01-10',
    tags: ['Backend', 'Performance']
  },
  {
    id: 4,
    title: 'Tests unitaires API',
    description: 'Couvrir 80% du code backend',
    status: 'DONE' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assignee: 'Pierre Durand',
    project: 'API Integration',
    dueDate: '2026-01-05',
    tags: ['Tests', 'Backend']
  },
  {
    id: 5,
    title: 'Documentation utilisateur',
    description: 'Rédiger le guide d\'utilisation',
    status: 'IN_PROGRESS' as TaskStatus,
    priority: 'LOW' as TaskPriority,
    assignee: 'Claire Petit',
    project: 'Plateforme E-commerce',
    dueDate: '2026-01-25',
    tags: ['Documentation']
  },
  {
    id: 6,
    title: 'Intégration Stripe',
    description: 'Configurer les paiements en ligne',
    status: 'TODO' as TaskStatus,
    priority: 'HIGH' as TaskPriority,
    assignee: 'Luc Bernard',
    project: 'Plateforme E-commerce',
    dueDate: '2026-01-18',
    tags: ['Backend', 'Paiements']
  },
  {
    id: 7,
    title: 'Responsive design tablette',
    description: 'Adapter l\'interface pour tablettes',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assignee: 'Emma Rousseau',
    project: 'Refonte Site Web',
    dueDate: '2026-01-22',
    tags: ['Frontend', 'Responsive']
  },
  {
    id: 8,
    title: 'Migration base de données',
    description: 'Passer de MySQL à PostgreSQL',
    status: 'DONE' as TaskStatus,
    priority: 'URGENT' as TaskPriority,
    assignee: 'Thomas Moreau',
    project: 'Migration Infrastructure',
    dueDate: '2025-12-30',
    tags: ['DevOps', 'Database']
  },
];

const statusConfig = {
  TODO: { 
    label: 'À faire', 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    icon: Circle,
    iconColor: 'text-gray-500'
  },
  IN_PROGRESS: { 
    label: 'En cours', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: Play,
    iconColor: 'text-blue-500'
  },
  BLOCKED: { 
    label: 'Bloqué', 
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: Ban,
    iconColor: 'text-red-500'
  },
  DONE: { 
    label: 'Terminé', 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
};

const priorityConfig = {
  LOW: { label: 'Basse', color: 'bg-gray-500/10 text-gray-600' },
  MEDIUM: { label: 'Moyenne', color: 'bg-blue-500/10 text-blue-600' },
  HIGH: { label: 'Haute', color: 'bg-orange-500/10 text-orange-600' },
  URGENT: { label: 'Urgente', color: 'bg-red-500/10 text-red-600' },
};

type GroupBy = 'none' | 'project' | 'assignee' | 'team';

export default function TachesDemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  // Calculate stats
  const totalTasks = mockTasks.length;
  const todoTasks = mockTasks.filter(t => t.status === 'TODO').length;
  const inProgressTasks = mockTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const blockedTasks = mockTasks.filter(t => t.status === 'BLOCKED').length;
  const doneTasks = mockTasks.filter(t => t.status === 'DONE').length;

  // Filter tasks
  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group tasks by status for kanban view
  const tasksByStatus = {
    TODO: filteredTasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS'),
    BLOCKED: filteredTasks.filter(t => t.status === 'BLOCKED'),
    DONE: filteredTasks.filter(t => t.status === 'DONE'),
  };

  // Group tasks by selected criteria
  const groupedTasks = () => {
    if (groupBy === 'none') return { 'Toutes les tâches': filteredTasks };
    
    if (groupBy === 'project') {
      const groups: Record<string, typeof filteredTasks> = {};
      filteredTasks.forEach(task => {
        if (!groups[task.project]) groups[task.project] = [];
        groups[task.project].push(task);
      });
      return groups;
    }
    
    if (groupBy === 'assignee') {
      const groups: Record<string, typeof filteredTasks> = {};
      filteredTasks.forEach(task => {
        if (!groups[task.assignee]) groups[task.assignee] = [];
        groups[task.assignee].push(task);
      });
      return groups;
    }
    
    // Team grouping (mock - group by first letter of assignee name)
    if (groupBy === 'team') {
      const groups: Record<string, typeof filteredTasks> = {};
      filteredTasks.forEach(task => {
        const team = task.assignee[0] < 'M' ? 'Équipe Alpha' : 'Équipe Beta';
        if (!groups[team]) groups[team] = [];
        groups[team].push(task);
      });
      return groups;
    }
    
    return { 'Toutes les tâches': filteredTasks };
  };

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
                Tâches
              </h1>
              <p className="text-white/80 text-lg">
                Organisez et suivez toutes vos tâches en un seul endroit
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <CheckSquare className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Circle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {todoTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">À faire</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Play className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {inProgressTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En cours</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <Ban className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {blockedTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Bloqué</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {doneTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Terminé</div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className="hover-nukleo"
              size="sm"
            >
              Tous
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                onClick={() => setStatusFilter(status as TaskStatus)}
                className="hover-nukleo"
                size="sm"
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="none">Sans groupement</option>
              <option value="project">Par projet</option>
              <option value="assignee">Par employé</option>
              <option value="team">Par équipe</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              onClick={() => setViewMode('list')}
              className="hover-nukleo"
            >
              <ListIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'outline'}
              onClick={() => setViewMode('kanban')}
              className="hover-nukleo"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tasks View */}
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {Object.entries(groupedTasks()).map(([groupName, tasks]) => (
              <div key={groupName}>
                {groupBy !== 'none' && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-[#523DC9]">{groupName}</span>
                    <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30 border">
                      {tasks.length}
                    </Badge>
                  </h3>
                )}
                <div className="space-y-2">
                  {tasks.map((task) => {
              const StatusIcon = statusConfig[task.status].icon;
              return (
                <Card key={task.id} className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${statusConfig[task.status].color.split(' ')[0]}/20`}>
                      <StatusIcon className={`w-4 h-4 ${statusConfig[task.status].iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors truncate">
                          {task.title}
                        </h3>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Badge className={`${statusConfig[task.status].color} border text-xs px-2 py-0.5`}>
                            {statusConfig[task.status].label}
                          </Badge>
                          <Badge className={`${priorityConfig[task.priority].color} text-xs px-2 py-0.5`}>
                            {priorityConfig[task.priority].label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{task.project}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(task.dueDate).toLocaleDateString('fr-CA')}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {task.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(tasksByStatus).map(([status, tasks]) => {
              const StatusIcon = statusConfig[status as TaskStatus].icon;
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <StatusIcon className={`w-5 h-5 ${statusConfig[status as TaskStatus].iconColor}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {statusConfig[status as TaskStatus].label}
                    </h3>
                    <Badge className="ml-auto">{tasks.length}</Badge>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <Card key={task.id} className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                        <div className="flex items-start justify-between mb-1.5">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-xs group-hover:text-[#523DC9] transition-colors line-clamp-2 flex-1">
                            {task.title}
                          </h4>
                          <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0.5 ml-2 flex-shrink-0`}>
                            {priorityConfig[task.priority].label}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span className="truncate">{task.assignee}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString('fr-CA')}</span>
                          </div>
                        </div>

                        <div className="flex gap-1 mt-2 flex-wrap">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
