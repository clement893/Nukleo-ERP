'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Star, 
  Share2, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FolderOpen,
  Activity,
  MessageSquare,
  Paperclip,

} from 'lucide-react';

type TabId = 'overview' | 'tasks' | 'timeline' | 'files' | 'team' | 'activity';
type TaskPriority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  priority: TaskPriority;
  dueDate?: string;
  commentsCount: number;
  attachmentsCount: number;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export default function DemoProjectPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isFavorite, setIsFavorite] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const project = {
    name: 'Refonte Site Web Client X',
    client: 'Acme Corporation',
    progress: 65,
    startDate: '2024-11-15',
    endDate: '2025-02-28',
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'tasks' as TabId, label: 'Tâches', icon: CheckSquare, count: 24 },
    { id: 'timeline' as TabId, label: 'Timeline', icon: Calendar },
    { id: 'files' as TabId, label: 'Fichiers', icon: FolderOpen, count: 23 },
    { id: 'team' as TabId, label: 'Équipe', icon: Users, count: 5 },
    { id: 'activity' as TabId, label: 'Activité', icon: Activity },
  ];

  const columns: Column[] = [
    {
      id: 'todo',
      title: 'À faire',
      color: 'bg-gray-400',
      tasks: [
        {
          id: '1',
          title: 'Optimiser les performances',
          description: 'Améliorer le temps de chargement',
          assignee: 'Thomas',
          priority: 'high',
          dueDate: '2025-01-10',
          commentsCount: 2,
          attachmentsCount: 1
        },
        {
          id: '2',
          title: 'Ajouter tests unitaires',
          assignee: 'Sophie',
          priority: 'medium',
          dueDate: '2025-01-15',
          commentsCount: 0,
          attachmentsCount: 0
        },
        {
          id: '3',
          title: 'Documentation API',
          assignee: 'Lucas',
          priority: 'low',
          commentsCount: 1,
          attachmentsCount: 2
        }
      ]
    },
    {
      id: 'in-progress',
      title: 'En cours',
      color: 'bg-blue-500',
      tasks: [
        {
          id: '4',
          title: 'Intégration paiement Stripe',
          description: 'Webhooks et checkout',
          assignee: 'Marie',
          priority: 'high',
          dueDate: '2025-01-08',
          commentsCount: 5,
          attachmentsCount: 3
        },
        {
          id: '5',
          title: 'Design page produit',
          assignee: 'Emma',
          priority: 'medium',
          commentsCount: 3,
          attachmentsCount: 8
        },
        {
          id: '6',
          title: 'Configuration CI/CD',
          assignee: 'Thomas',
          priority: 'medium',
          commentsCount: 1,
          attachmentsCount: 0
        },
        {
          id: '7',
          title: 'Migration base de données',
          assignee: 'Lucas',
          priority: 'high',
          dueDate: '2025-01-09',
          commentsCount: 4,
          attachmentsCount: 2
        },
        {
          id: '8',
          title: 'Responsive mobile',
          assignee: 'Sophie',
          priority: 'medium',
          commentsCount: 2,
          attachmentsCount: 1
        }
      ]
    },
    {
      id: 'review',
      title: 'En revue',
      color: 'bg-purple-500',
      tasks: [
        {
          id: '9',
          title: 'Système d\'authentification',
          assignee: 'Thomas',
          priority: 'high',
          commentsCount: 7,
          attachmentsCount: 2
        },
        {
          id: '10',
          title: 'Dashboard analytics',
          assignee: 'Marie',
          priority: 'medium',
          commentsCount: 3,
          attachmentsCount: 5
        },
        {
          id: '11',
          title: 'Email notifications',
          assignee: 'Emma',
          priority: 'low',
          commentsCount: 2,
          attachmentsCount: 1
        }
      ]
    },
    {
      id: 'done',
      title: 'Terminé',
      color: 'bg-green-500',
      tasks: [
        {
          id: '12',
          title: 'Setup projet Next.js',
          assignee: 'Thomas',
          priority: 'high',
          commentsCount: 1,
          attachmentsCount: 0
        },
        {
          id: '13',
          title: 'Design system',
          assignee: 'Marie',
          priority: 'high',
          commentsCount: 12,
          attachmentsCount: 15
        },
        {
          id: '14',
          title: 'Logo et branding',
          assignee: 'Emma',
          priority: 'medium',
          commentsCount: 8,
          attachmentsCount: 20
        },
        {
          id: '15',
          title: 'Architecture backend',
          assignee: 'Lucas',
          priority: 'high',
          commentsCount: 6,
          attachmentsCount: 3
        },
        {
          id: '16',
          title: 'Maquettes homepage',
          assignee: 'Marie',
          priority: 'high',
          commentsCount: 15,
          attachmentsCount: 25
        }
      ]
    }
  ];

  const priorityColors = {
    high: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    low: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30'
  };

  const priorityLabels = {
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour au dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`glass-button p-2 rounded-lg transition-all ${
                isFavorite ? 'text-yellow-500' : 'text-gray-400'
              }`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="glass-button px-4 py-2 rounded-lg flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Partager</span>
            </button>
            <button className="glass-button p-2 rounded-lg">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Client: <span className="font-semibold">{project.client}</span>
            </p>
          </div>

          <div className="glass-badge px-4 py-2 rounded-full border bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-semibold text-sm">En cours</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progression globale
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {project.progress}%
            </span>
          </div>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Début:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {new Date(project.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Fin prévue:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {new Date(project.endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-xl p-2 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                  transition-all duration-200 min-w-fit
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
                {tab.count && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Tâches complétées
              </h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                16<span className="text-lg text-gray-600 dark:text-gray-400">/24</span>
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '67%' }} />
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="glass-badge p-3 rounded-lg bg-blue-500/10">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Temps passé
              </h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                145<span className="text-lg text-gray-600 dark:text-gray-400">h</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sur 200h estimées
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="glass-badge p-3 rounded-lg bg-purple-500/10">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Budget utilisé
              </h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                45k€
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sur 60k€ budget
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="glass-badge p-3 rounded-lg bg-amber-500/10">
                  <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Équipe
              </h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                5
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                23 fichiers
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Activité récente
            </h3>
            <div className="space-y-3">
              {[
                { user: 'Marie Dubois', action: 'a complété la tâche "Design homepage"', time: 'Il y a 2 heures' },
                { user: 'Thomas Martin', action: 'a ajouté 3 fichiers au projet', time: 'Il y a 4 heures' },
                { user: 'Sophie Bernard', action: 'a commenté sur "API Integration"', time: 'Il y a 6 heures' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span>
                      {' '}
                      <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des tâches
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-blue-500 text-white'
                    : 'glass-button'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'glass-button'
                }`}
              >
                Liste
              </button>
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column) => (
                <div key={column.id} className="flex-shrink-0 w-80">
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {column.title}
                        </h3>
                        <span className="glass-badge px-2 py-0.5 rounded-full text-xs font-bold">
                          {column.tasks.length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {column.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="glass-card p-4 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">
                              {task.title}
                            </h4>
                            <span className={`glass-badge px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[task.priority]}`}>
                              {priorityLabels[task.priority]}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {task.commentsCount > 0 && (
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <MessageSquare className="w-3 h-3" />
                                  <span className="text-xs">{task.commentsCount}</span>
                                </div>
                              )}
                              {task.attachmentsCount > 0 && (
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Paperclip className="w-3 h-3" />
                                  <span className="text-xs">{task.attachmentsCount}</span>
                                </div>
                              )}
                            </div>

                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                              {task.assignee.charAt(0)}
                            </div>
                          </div>

                          {task.dueDate && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6">
              <div className="space-y-2">
                {columns.flatMap(column => column.tasks).map((task) => (
                  <div
                    key={task.id}
                    className="glass-card p-4 rounded-lg hover:shadow-lg transition-all cursor-pointer flex items-center gap-4"
                  >
                    <input type="checkbox" className="w-5 h-5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span className={`glass-badge px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {task.assignee.charAt(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Tabs */}
      {activeTab !== 'overview' && activeTab !== 'tasks' && (
        <div className="glass-card p-12 rounded-xl text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            En cours de développement...
          </p>
        </div>
      )}
    </div>
  );
}
