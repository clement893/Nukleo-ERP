'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Briefcase, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Award,
  Settings,
  RotateCcw,
  GripVertical
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { Responsive, Layout } from 'react-grid-layout';
// @ts-expect-error - WidthProvider is not exported as named export, but exists in the package
import WidthProvider from 'react-grid-layout/lib/components/WidthProvider';
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/resizable.css';

// @ts-expect-error - WidthProvider typing issue
const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types
type WidgetType = 'stats' | 'tasks' | 'events' | 'activity' | 'performance';

interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  type: WidgetType;
}

const defaultLayouts: WidgetLayout[] = [
  { i: 'stats', type: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
  { i: 'tasks', type: 'tasks', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
  { i: 'events', type: 'events', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
  { i: 'activity', type: 'activity', x: 0, y: 6, w: 12, h: 3, minW: 6, minH: 3 },
  { i: 'performance', type: 'performance', x: 0, y: 9, w: 12, h: 2, minW: 6, minH: 2 },
];

export default function PortailEmployeDashboard() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<WidgetLayout[]>(defaultLayouts);

  // Load layouts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('portail-dashboard-layout');
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved layout:', e);
      }
    }
  }, []);

  // Save layouts to localStorage
  const saveLayout = (newLayouts: Layout[]) => {
    const layoutsWithTypes: WidgetLayout[] = newLayouts.map((l: Layout) => {
      // Layout from react-grid-layout has i property, but TypeScript types may not reflect it correctly
      const layoutItem = l as Layout & { i: string };
      const existing = layouts.find(w => w.i === layoutItem.i);
      return { ...layoutItem, type: existing?.type || 'stats' } as WidgetLayout;
    });
    setLayouts(layoutsWithTypes);
    localStorage.setItem('portail-dashboard-layout', JSON.stringify(layoutsWithTypes));
  };

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem('portail-dashboard-layout');
  };

  const stats = [
    { label: 'Tâches en cours', value: '12', total: '18', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Projets actifs', value: '4', total: '5', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { label: 'Heures cette semaine', value: '38.5h', total: '40h', icon: Clock, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'Deadlines à venir', value: '3', total: '7j', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-500/10' },
  ];

  const recentTasks = [
    { id: 1, title: 'Développer API authentification', project: 'Projet Alpha', status: 'En cours', priority: 'Haute', dueDate: '2026-01-05' },
    { id: 2, title: 'Révision code frontend', project: 'Projet Beta', status: 'À faire', priority: 'Moyenne', dueDate: '2026-01-08' },
    { id: 3, title: 'Documentation technique', project: 'Projet Gamma', status: 'En cours', priority: 'Basse', dueDate: '2026-01-10' },
    { id: 4, title: 'Tests unitaires', project: 'Projet Alpha', status: 'À faire', priority: 'Haute', dueDate: '2026-01-06' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Réunion équipe', date: '2026-01-02', time: '10:00', type: 'meeting' },
    { id: 2, title: 'Deadline Projet Alpha', date: '2026-01-05', time: '17:00', type: 'deadline' },
    { id: 3, title: 'Formation React 19', date: '2026-01-08', time: '14:00', type: 'training' },
  ];

  const recentActivities = [
    { id: 1, action: 'Tâche complétée', description: 'Intégration API paiement', time: 'Il y a 2h' },
    { id: 2, action: 'Feuille de temps', description: '8h ajoutées - Projet Alpha', time: 'Il y a 5h' },
    { id: 3, action: 'Commentaire ajouté', description: 'Discussion sur architecture', time: 'Hier' },
    { id: 4, action: 'Demande de vacances', description: '5 jours en février', time: 'Hier' },
  ];

  // Widget components
  const StatsWidget = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.bg} border border-${stat.color.split('-')[1]}-500/30`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">/ {stat.total}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const TasksWidget = () => (
    <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Mes tâches récentes
        </h3>
        <button className="text-sm text-[#523DC9] hover:underline">
          Voir tout
        </button>
      </div>
      <div className="space-y-3">
        {recentTasks.map((task) => (
          <div key={task.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{task.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.project}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                task.priority === 'Haute' ? 'bg-red-500/10 text-red-600' :
                task.priority === 'Moyenne' ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-green-500/10 text-green-600'
              }`}>
                {task.priority}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded ${
                task.status === 'En cours' ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-600'
              }`}>
                {task.status}
              </span>
              <span className="text-gray-500">
                <Calendar className="w-3 h-3 inline mr-1" />
                {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const EventsWidget = () => (
    <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Événements à venir
        </h3>
        <button className="text-sm text-[#523DC9] hover:underline">
          Calendrier
        </button>
      </div>
      <div className="space-y-3">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                event.type === 'meeting' ? 'bg-blue-500/10 border border-blue-500/30' :
                event.type === 'deadline' ? 'bg-red-500/10 border border-red-500/30' :
                'bg-purple-500/10 border border-purple-500/30'
              }`}>
                {event.type === 'meeting' ? <Briefcase className="w-4 h-4 text-blue-600" /> :
                 event.type === 'deadline' ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                 <Award className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {event.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const ActivityWidget = () => (
    <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-full overflow-auto">
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Activité récente
      </h3>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
              <TrendingUp className="w-4 h-4 text-[#523DC9]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{activity.action}</h4>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const PerformanceWidget = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Productivité</div>
        </div>
        <div className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          96%
        </div>
        <p className="text-xs text-gray-500 mt-1">+5% vs semaine dernière</p>
      </Card>

      <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Taux de complétion</div>
        </div>
        <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          67%
        </div>
        <p className="text-xs text-gray-500 mt-1">12 sur 18 tâches</p>
      </Card>

      <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Temps moyen/tâche</div>
        </div>
        <div className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          3.2h
        </div>
        <p className="text-xs text-gray-500 mt-1">-0.5h vs moyenne</p>
      </Card>
    </div>
  );

  const renderWidget = (type: WidgetType) => {
    switch (type) {
      case 'stats':
        return <StatsWidget />;
      case 'tasks':
        return <TasksWidget />;
      case 'events':
        return <EventsWidget />;
      case 'activity':
        return <ActivityWidget />;
      case 'performance':
        return <PerformanceWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Bonjour, Ricardo ! 👋
              </h1>
              <p className="text-white/80 text-lg">
                Voici un aperçu de votre activité
              </p>
            </div>
            <div className="flex gap-2">
              {isEditMode && (
                <Button
                  onClick={resetLayout}
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                className={isEditMode ? "bg-white text-[#523DC9]" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}
              >
                <Settings className="w-4 h-4 mr-2" />
                {isEditMode ? 'Terminer' : 'Personnaliser'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Notice */}
      {isEditMode && (
        <div className="glass-card p-4 rounded-xl border border-[#523DC9]/30 bg-[#523DC9]/5">
          <div className="flex items-center gap-3">
            <GripVertical className="w-5 h-5 text-[#523DC9]" />
            <div>
              <p className="font-medium text-[#523DC9]">Mode personnalisation activé</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Glissez-déposez les widgets pour réorganiser votre tableau de bord. Redimensionnez-les en tirant sur les coins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layouts }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={(layout: Layout[]) => {
          if (isEditMode) {
            saveLayout(layout);
          }
        }}
        draggableHandle={isEditMode ? undefined : ".no-drag"}
        compactType="vertical"
        preventCollision={false}
      >
        {layouts.map((widget) => (
          <div
            key={widget.i}
            className={`${isEditMode ? 'cursor-move' : ''} transition-shadow ${
              isEditMode ? 'ring-2 ring-[#523DC9]/30 ring-offset-2' : ''
            }`}
          >
            {renderWidget(widget.type)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
