'use client';

import { useState } from 'react';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectTabs, TabId } from './components/ProjectTabs';
import { OverviewTab } from './components/OverviewTab';
import { TasksTab } from './components/TasksTab';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const mockProject = {
  id: 'testrefactor',
  name: 'Refonte Site Web Client X',
  client: 'Acme Corporation',
  status: 'active' as const,
  progress: 65,
  startDate: '2024-11-15',
  endDate: '2025-02-28',
  isFavorite: true
};

const mockOverviewData = {
  tasksCompleted: 16,
  tasksTotal: 24,
  timeSpent: 145,
  timeEstimated: 200,
  budgetUsed: 45000,
  budgetTotal: 60000,
  teamSize: 5,
  filesCount: 23,
  milestones: [
    {
      id: '1',
      name: 'Maquettes UI/UX validées',
      date: '2024-12-15',
      completed: true
    },
    {
      id: '2',
      name: 'Développement frontend',
      date: '2025-01-20',
      completed: true
    },
    {
      id: '3',
      name: 'Intégration backend',
      date: '2025-02-10',
      completed: false
    },
    {
      id: '4',
      name: 'Tests et déploiement',
      date: '2025-02-28',
      completed: false
    }
  ],
  recentActivity: [
    {
      id: '1',
      user: 'Marie Dubois',
      action: 'a complété la tâche "Design homepage"',
      time: 'Il y a 2 heures'
    },
    {
      id: '2',
      user: 'Thomas Martin',
      action: 'a ajouté 3 fichiers au projet',
      time: 'Il y a 4 heures'
    },
    {
      id: '3',
      user: 'Sophie Bernard',
      action: 'a commenté sur "API Integration"',
      time: 'Il y a 6 heures'
    },
    {
      id: '4',
      user: 'Lucas Petit',
      action: 'a créé une nouvelle tâche',
      time: 'Hier à 16:30'
    },
    {
      id: '5',
      user: 'Emma Leroy',
      action: 'a mis à jour le budget',
      time: 'Hier à 14:20'
    }
  ]
};

const mockTasksData = {
  columns: [
    {
      id: 'todo',
      title: 'À faire',
      color: 'bg-gray-400',
      tasks: [
        {
          id: '1',
          title: 'Optimiser les performances',
          description: 'Améliorer le temps de chargement des pages',
          assignee: 'Thomas',
          priority: 'high' as const,
          dueDate: '2025-01-10',
          commentsCount: 2,
          attachmentsCount: 1
        },
        {
          id: '2',
          title: 'Ajouter tests unitaires',
          description: 'Couvrir les composants critiques',
          assignee: 'Sophie',
          priority: 'medium' as const,
          dueDate: '2025-01-15',
          commentsCount: 0,
          attachmentsCount: 0
        },
        {
          id: '3',
          title: 'Documentation API',
          assignee: 'Lucas',
          priority: 'low' as const,
          dueDate: '2025-01-20',
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
          description: 'Configurer les webhooks et le checkout',
          assignee: 'Marie',
          priority: 'high' as const,
          dueDate: '2025-01-08',
          commentsCount: 5,
          attachmentsCount: 3
        },
        {
          id: '5',
          title: 'Design page produit',
          description: 'Créer les maquettes Figma',
          assignee: 'Emma',
          priority: 'medium' as const,
          dueDate: '2025-01-12',
          commentsCount: 3,
          attachmentsCount: 8
        },
        {
          id: '6',
          title: 'Configuration CI/CD',
          assignee: 'Thomas',
          priority: 'medium' as const,
          commentsCount: 1,
          attachmentsCount: 0
        },
        {
          id: '7',
          title: 'Migration base de données',
          description: 'Migrer vers PostgreSQL',
          assignee: 'Lucas',
          priority: 'high' as const,
          dueDate: '2025-01-09',
          commentsCount: 4,
          attachmentsCount: 2
        },
        {
          id: '8',
          title: 'Responsive mobile',
          assignee: 'Sophie',
          priority: 'medium' as const,
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
          description: 'OAuth + JWT implementation',
          assignee: 'Thomas',
          priority: 'high' as const,
          commentsCount: 7,
          attachmentsCount: 2
        },
        {
          id: '10',
          title: 'Dashboard analytics',
          assignee: 'Marie',
          priority: 'medium' as const,
          commentsCount: 3,
          attachmentsCount: 5
        },
        {
          id: '11',
          title: 'Email notifications',
          description: 'Templates et envoi automatique',
          assignee: 'Emma',
          priority: 'low' as const,
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
          priority: 'high' as const,
          commentsCount: 1,
          attachmentsCount: 0
        },
        {
          id: '13',
          title: 'Design system',
          description: 'Composants UI réutilisables',
          assignee: 'Marie',
          priority: 'high' as const,
          commentsCount: 12,
          attachmentsCount: 15
        },
        {
          id: '14',
          title: 'Logo et branding',
          assignee: 'Emma',
          priority: 'medium' as const,
          commentsCount: 8,
          attachmentsCount: 20
        },
        {
          id: '15',
          title: 'Architecture backend',
          assignee: 'Lucas',
          priority: 'high' as const,
          commentsCount: 6,
          attachmentsCount: 3
        },
        {
          id: '16',
          title: 'Maquettes homepage',
          assignee: 'Marie',
          priority: 'high' as const,
          commentsCount: 15,
          attachmentsCount: 25
        }
      ]
    }
  ]
};

export default function TestRefactorPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabCounts = {
    tasks: mockTasksData.columns.reduce((acc, col) => acc + col.tasks.length, 0),
    files: mockOverviewData.filesCount,
    team: mockOverviewData.teamSize
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <ProjectHeader project={mockProject} />

      {/* Tabs Navigation */}
      <ProjectTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab data={mockOverviewData} />}
          {activeTab === 'tasks' && <TasksTab columns={mockTasksData.columns} />}
          {activeTab === 'timeline' && (
            <div className="glass-card p-12 rounded-xl text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Timeline
              </h3>
              <p className="text-muted-accessible">
                Vue timeline avec Gantt chart - En cours de développement
              </p>
            </div>
          )}
          {activeTab === 'files' && (
            <div className="glass-card p-12 rounded-xl text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Fichiers
              </h3>
              <p className="text-muted-accessible">
                Gestion des fichiers et documents - En cours de développement
              </p>
            </div>
          )}
          {activeTab === 'team' && (
            <div className="glass-card p-12 rounded-xl text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Équipe
              </h3>
              <p className="text-muted-accessible">
                Gestion de l'équipe et permissions - En cours de développement
              </p>
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="glass-card p-12 rounded-xl text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Activité
              </h3>
              <p className="text-muted-accessible">
                Feed d'activité complet - En cours de développement
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
