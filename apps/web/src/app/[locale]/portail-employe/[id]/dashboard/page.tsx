'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  GripVertical,
  Loader2
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { Responsive, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { vacationRequestsAPI, type VacationRequest } from '@/lib/api/vacationRequests';

// WidthProvider is not available in types, so we use a workaround
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WidthProvider = require('react-grid-layout').WidthProvider || ((c: typeof Responsive) => c);
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
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<WidgetLayout[]>(defaultLayouts);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Array<{ id?: number | null; name?: string }>>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [vacations, setVacations] = useState<VacationRequest[]>([]);

  // Load layouts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`portail-dashboard-layout-${employeeId}`);
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved layout:', e);
      }
    }
  }, [employeeId]);

  // Load employee data
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
    }
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Load employee info
      const empData = await employeesAPI.get(employeeId);
      setEmployee(empData);
      
      // Load tasks assigned to this employee
      const tasksData = await projectTasksAPI.list({ assignee_id: employeeId });
      setTasks(tasksData);
      
      // Load projects
      const projectsData = await projectsAPI.list();
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
      setProjects(projectsList);
      
      // Load time entries for this week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const timeEntriesData = await timeEntriesAPI.list({
        user_id: employeeId,
        start_date: startOfWeek.toISOString().split('T')[0] || startOfWeek.toISOString().substring(0, 10),
      });
      setTimeEntries(timeEntriesData);
      
      // Load vacations
      const vacationsData = await vacationRequestsAPI.list({ employee_id: employeeId });
      setVacations(vacationsData);
      
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save layouts to localStorage
  const saveLayout = (newLayouts: Layout[]) => {
    const layoutsWithTypes: WidgetLayout[] = newLayouts.map((l: Layout) => {
      const layoutItem = l as unknown as Layout & { i: string; x: number; y: number; w: number; h: number };
      const existing = layouts.find((w: WidgetLayout) => w.i === layoutItem.i);
      return { ...layoutItem, type: existing?.type || 'stats' } as unknown as WidgetLayout;
    });
    setLayouts(layoutsWithTypes);
    localStorage.setItem(`portail-dashboard-layout-${employeeId}`, JSON.stringify(layoutsWithTypes));
  };

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem(`portail-dashboard-layout-${employeeId}`);
  };

  // Calculate stats from real data
  const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
  const totalTasks = tasks.length;
  
  const activeProjects = projects.filter(p => 
    tasks.some(t => t.project_id === p.id && t.assignee_id === employeeId)
  ).length;
  
  const hoursThisWeek = timeEntries.reduce((sum, entry) => sum + ((entry.duration || 0) / 3600), 0);
  
  const upcomingDeadlines = tasks.filter((t: ProjectTask) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const stats = [
    { 
      label: 'Tâches en cours', 
      value: tasksInProgress.toString(), 
      total: totalTasks.toString(), 
      icon: CheckSquare, 
      color: 'text-blue-600', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Projets actifs', 
      value: activeProjects.toString(), 
      total: projects.length.toString(), 
      icon: Briefcase, 
      color: 'text-purple-600', 
      bg: 'bg-purple-500/10' 
    },
    { 
      label: 'Heures cette semaine', 
      value: `${hoursThisWeek.toFixed(1)}h`, 
      total: '40h', 
      icon: Clock, 
      color: 'text-green-600', 
      bg: 'bg-green-500/10' 
    },
    { 
      label: 'Deadlines à venir', 
      value: upcomingDeadlines.toString(), 
      total: '7j', 
      icon: AlertCircle, 
      color: 'text-orange-600', 
      bg: 'bg-orange-500/10' 
    },
  ];

  // Recent tasks (real data)
  const recentTasks = tasks
    .filter((t: ProjectTask) => t.status === 'in_progress' || t.status === 'todo')
    .slice(0, 4)
    .map((t: ProjectTask) => ({
      id: t.id,
      title: t.title,
      project: 'Sans projet',
      status: t.status === 'in_progress' ? 'En cours' : 'À faire',
      priority: t.priority === 'high' ? 'Haute' : t.priority === 'medium' ? 'Moyenne' : 'Basse',
      dueDate: t.due_date || '',
    }));

  // Upcoming events (vacations + deadlines)
  const upcomingEvents = [
    ...vacations
      .filter((v: VacationRequest) => new Date(v.start_date) >= new Date())
      .slice(0, 2)
      .map((v: VacationRequest) => ({
        id: `vacation-${v.id}`,
        title: `Vacances: ${v.reason || 'Congés'}`,
        date: v.start_date,
        time: '',
        type: 'vacation' as const,
      })),
    ...tasks
      .filter((t: ProjectTask) => t.due_date && new Date(t.due_date) >= new Date())
      .sort((a: ProjectTask, b: ProjectTask) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 3)
      .map((t: ProjectTask) => ({
        id: `deadline-${t.id}`,
        title: `Deadline: ${t.title}`,
        date: t.due_date!,
        time: '17:00',
        type: 'deadline' as const,
      })),
  ].slice(0, 3);

  // Recent activities (from time entries and tasks)
  const recentActivities = [
    ...timeEntries.slice(0, 2).map((entry: TimeEntry) => ({
      id: `time-${entry.id}`,
      action: 'Temps enregistré',
      description: `${(entry.duration || 0) / 3600}h sur ${entry.project_name || 'un projet'}`,
      time: new Date(entry.date).toLocaleDateString('fr-FR'),
    })),
    ...tasks
      .filter((t: ProjectTask) => t.updated_at)
      .sort((a: ProjectTask, b: ProjectTask) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
      .slice(0, 2)
      .map((t: ProjectTask) => ({
        id: `task-${t.id}`,
        action: 'Tâche mise à jour',
        description: t.title,
        time: new Date(t.updated_at!).toLocaleDateString('fr-FR'),
      })),
  ].slice(0, 4);

  // Performance metrics
  const completedTasks = tasks.filter((t: ProjectTask) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const productivity = hoursThisWeek > 0 ? Math.min(Math.round((hoursThisWeek / 40) * 100), 100) : 0;
  const avgTimePerTask = completedTasks > 0 ? (hoursThisWeek / completedTasks).toFixed(1) : '0';

  const performanceMetrics = [
    { label: 'Productivité', value: `${productivity}%`, change: '+5%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Taux de complétion', value: `${completionRate}%`, change: '', icon: Award, color: 'text-blue-600' },
    { label: 'Temps moyen/tâche', value: `${avgTimePerTask}h`, change: '-0.5h', icon: Clock, color: 'text-purple-600' },
  ];

  const getPriorityColor = (priority: string) => {
    const colors = {
      'Haute': 'text-red-600 bg-red-100 dark:bg-red-900/30',
      'Moyenne': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      'Basse': 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
    };
    return colors[priority as keyof typeof colors] || colors['Moyenne'];
  };

  const getEventIcon = (type: string) => {
    const icons = {
      vacation: Calendar,
      deadline: AlertCircle,
      meeting: Calendar,
      training: Award,
    };
    return icons[type as keyof typeof icons] || Calendar;
  };

  const getEventColor = (type: string) => {
    const colors = {
      vacation: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      deadline: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      meeting: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      training: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    };
    return colors[type as keyof typeof colors] || colors['meeting'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

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
                Bonjour, {employee?.first_name} !
              </h1>
              <p className="text-white/80 text-lg">Voici votre tableau de bord personnalisé</p>
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button
                    onClick={resetLayout}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={() => setIsEditMode(false)}
                    className="bg-white text-[#523DC9] hover:bg-white/90"
                  >
                    Terminer
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Personnaliser
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Notice */}
      {isEditMode && (
        <Card className="glass-card p-4 rounded-xl border border-[#523DC9]/40 bg-[#523DC9]/5">
          <div className="flex items-center gap-3 text-[#523DC9]">
            <GripVertical className="w-5 h-5" />
            <p className="text-sm font-medium">
              Mode édition activé - Glissez les widgets pour les réorganiser
            </p>
          </div>
        </Card>
      )}

      {/* Customizable Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layouts }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={(layout: Layout[]) => isEditMode && saveLayout(layout)}
        compactType="vertical"
      >
        {layouts.map((widget) => (
          <div
            key={widget.i}
            className={`${isEditMode ? 'ring-2 ring-[#523DC9]/30 cursor-move' : ''}`}
          >
            {widget.type === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                {stats.map((stat, index) => (
                  <Card key={index} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-lg ${stat.bg} border border-${stat.color.replace('text-', '')}/30`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {stat.value}
                      {stat.total && <span className="text-lg text-gray-500 ml-1">/ {stat.total}</span>}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </Card>
                ))}
              </div>
            )}

            {widget.type === 'tasks' && (
              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-full overflow-auto">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Tâches récentes
                </h3>
                <div className="space-y-3">
                  {recentTasks.map((task: { id: number; title: string; project: string; status: string; priority: string; dueDate: string }) => (
                    <div key={task.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{task.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{task.project}</span>
                        <span>{task.status}</span>
                      </div>
                      {task.dueDate && (
                        <div className="mt-2 text-xs text-gray-500">
                          Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  ))}
                  {recentTasks.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucune tâche en cours</p>
                  )}
                </div>
              </Card>
            )}

            {widget.type === 'events' && (
              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-full overflow-auto">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Événements à venir
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const Icon = getEventIcon(event.type);
                    return (
                      <div key={event.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                              {event.time && ` • ${event.time}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {upcomingEvents.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucun événement à venir</p>
                  )}
                </div>
              </Card>
            )}

            {widget.type === 'activity' && (
              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-full overflow-auto">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Activité récente
                </h3>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucune activité récente</p>
                  )}
                </div>
              </Card>
            )}

            {widget.type === 'performance' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {performanceMetrics.map((metric, index) => (
                  <Card key={index} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                    <div className="flex items-center justify-between mb-3">
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      {metric.change && (
                        <span className="text-xs text-green-600 font-medium">{metric.change}</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
