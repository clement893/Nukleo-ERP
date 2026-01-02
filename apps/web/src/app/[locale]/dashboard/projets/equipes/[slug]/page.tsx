'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Badge, Button, Loading, Alert, Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, Users, ArrowLeft, Clock, AlertCircle, CheckCircle, 
  Lock, Package, ShoppingCart, Calendar, TrendingUp, User
} from 'lucide-react';
import { teamsAPI } from '@/lib/api/teams';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api';
import { employeesAPI, type Employee as EmployeeType } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { extractApiData } from '@/lib/api/utils';
import { useRouter } from '@/i18n/routing';
import type { Team, TeamMember } from '@/lib/api/teams';
import type { ProjectTask } from '@/lib/api/project-tasks';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
interface Employee {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  currentTask?: ProjectTask | null;
}

type TaskSection = 'shelf' | 'storage' | 'checkout' | 'employee';
type ViewMode = 'board' | 'capacity' | 'timeline';

// Task Card Component
function TaskCard({ task, isDragging }: { task: ProjectTask; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 border-gray-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <Card className="glass-card p-3 rounded-lg border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 hover:shadow-md transition-all duration-200 group mb-2">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm group-hover:text-[#523DC9] transition-colors line-clamp-2 flex-1">
            {task.title}
          </h4>
          {task.priority && (
            <Badge className={`${getPriorityColor(task.priority)} border text-xs ml-2 flex-shrink-0`}>
              {task.priority}
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {task.project_name && (
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {task.project_name}
            </span>
          )}
          {task.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimated_hours}h
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}

// Employee Card Component
function EmployeeCard({ 
  employee, 
  task 
}: { 
  employee: Employee; 
  task?: ProjectTask | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: `employee-${employee.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass-card p-4 rounded-xl border transition-all ${
        isOver 
          ? 'border-[#523DC9] bg-[#523DC9]/5 scale-105' 
          : 'border-[#A7A2CF]/20'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
          {getInitials(employee.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{employee.name}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{employee.email}</p>
        </div>
      </div>
      
      {task ? (
        <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">En cours</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
            {task.title}
          </p>
        </div>
      ) : (
        <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
          <span className="text-xs font-medium text-green-600">Disponible</span>
        </div>
      )}
    </div>
  );
}

function TeamProjectManagementContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const teamSlug = params?.slug as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  useEffect(() => {
    if (teamSlug) {
      loadTeamData();
    }
  }, [teamSlug]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let foundTeam: Team | null = null;
      
      // Récupérer l'équipe directement par slug
      try {
        const teamResponse = await teamsAPI.getTeamBySlug(teamSlug);
        foundTeam = extractApiData<Team>(teamResponse);
        
        if (!foundTeam) {
          setError('Équipe non trouvée');
          return;
        }
      } catch (err) {
        const appError = handleApiError(err);
        if (appError.statusCode === 404) {
          const requiredTeams = [
            { name: 'Le Bureau', slug: 'le-bureau' },
            { name: 'Le Studio', slug: 'le-studio' },
            { name: 'Le Lab', slug: 'le-lab' },
            { name: 'Équipe Gestion', slug: 'equipe-gestion' },
          ];
          
          const teamToCreate = requiredTeams.find(t => t.slug === teamSlug);
          if (teamToCreate) {
            try {
              const createResponse = await teamsAPI.create({
                name: teamToCreate.name,
                slug: teamToCreate.slug,
                description: `Équipe ${teamToCreate.name}`,
              });
              foundTeam = extractApiData<Team>(createResponse) as Team | null;
            } catch (createErr) {
              console.error('Error creating team:', createErr);
            }
          }
        }
        
        if (!foundTeam) {
          setError(appError.message || 'Équipe non trouvée');
          return;
        }
      }
      
      if (!foundTeam) {
        setError('Équipe non trouvée');
        return;
      }
      
      setTeam(foundTeam);
      
      // Charger les tâches de l'équipe
      try {
        const teamTasks = await projectTasksAPI.list({ team_id: foundTeam.id });
        setTasks(teamTasks);
      } catch (taskErr) {
        console.error('Error loading team tasks:', taskErr);
        setTasks([]);
      }
      
      // Charger les employés
      try {
        const allEmployees = await employeesAPI.list();
        const teamEmployeesData = allEmployees.filter(
          (emp) => emp.team_id === foundTeam.id
        );
        
        // Convertir en Employee avec tâche en cours
        const employeesWithTasks: Employee[] = teamEmployeesData.map(emp => {
          const currentTask = teamTasks.find(
            t => t.assignee_id === emp.id && t.status === 'in_progress'
          );
          
          return {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email || '',
            currentTask: currentTask || null,
          };
        });
        
        setEmployees(employeesWithTasks);
      } catch (empErr) {
        console.error('Error loading employees:', empErr);
        setEmployees([]);
      }
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des données');
      showToast({
        message: appError.message || 'Erreur lors du chargement des données',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id.toString() === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const taskId = parseInt(active.id as string);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus: ProjectTask['status'] = task.status;
    let newAssigneeId: number | null = task.assignee_id;

    // Déterminer la nouvelle destination
    if (over.id === 'shelf') {
      newStatus = 'todo';
      newAssigneeId = null;
    } else if (over.id === 'storage') {
      newStatus = 'blocked';
      newAssigneeId = null;
    } else if (over.id === 'checkout') {
      newStatus = 'review';
      newAssigneeId = null;
    } else if (over.id.toString().startsWith('employee-')) {
      const employeeId = parseInt(over.id.toString().replace('employee-', ''));
      const employee = employees.find(e => e.id === employeeId);
      
      // Vérifier si l'employé a déjà une tâche en cours
      if (employee?.currentTask) {
        showToast({
          message: `${employee.name} a déjà une tâche en cours`,
          type: 'error',
        });
        return;
      }
      
      newStatus = 'in_progress';
      newAssigneeId = employeeId;
    }

    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, assignee_id: newAssigneeId }
          : t
      )
    );

    // Update employees
    if (newAssigneeId) {
      setEmployees(prev =>
        prev.map(e =>
          e.id === newAssigneeId
            ? { ...e, currentTask: task }
            : e
        )
      );
    }

    // Update on server
    try {
      await projectTasksAPI.update(taskId, {
        status: newStatus,
        employee_assignee_id: newAssigneeId,
      });
      showToast({
        message: 'Tâche mise à jour',
        type: 'success',
      });
    } catch (err) {
      // Revert on error
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? task
            : t
        )
      );
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour',
        type: 'error',
      });
    }
  };

  // Group tasks by section
  const shelfTasks = tasks.filter(t => t.status === 'todo' && !t.assignee_id);
  const storageTasks = tasks.filter(t => t.status === 'blocked');
  const checkoutTasks = tasks.filter(t => t.status === 'review' || t.status === 'done');

  // Calculate capacity
  const totalHoursPerWeek = employees.length * 40;
  const usedHours = tasks
    .filter(t => t.status === 'in_progress' || t.status === 'review')
    .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const availableHours = totalHoursPerWeek - usedHours;
  const capacityPercentage = Math.round((usedHours / totalHoursPerWeek) * 100);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error || !team) {
    return (
      <PageContainer>
        <MotionDiv variant="slideUp" duration="normal" className="space-y-6">
          <Alert variant="error">{error || 'Équipe non trouvée'}</Alert>
        </MotionDiv>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal" className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {team.name}
                  </h1>
                  <p className="text-white/80 text-lg">{employees.length} membres • {tasks.length} tâches</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('board')}
                  className={viewMode === 'board' ? 'bg-white text-[#523DC9]' : 'bg-white/20 text-white border-white/30'}
                >
                  Board
                </Button>
                <Button
                  onClick={() => setViewMode('capacity')}
                  className={viewMode === 'capacity' ? 'bg-white text-[#523DC9]' : 'bg-white/20 text-white border-white/30'}
                >
                  Capacité
                </Button>
                <Button
                  onClick={() => setViewMode('timeline')}
                  className={viewMode === 'timeline' ? 'bg-white text-[#523DC9]' : 'bg-white/20 text-white border-white/30'}
                >
                  Timeline
                </Button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'board' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Employees Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                👥 Équipe ({employees.length})
              </h2>
              <SortableContext
                items={employees.map(e => `employee-${e.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {employees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      task={employee.currentTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>

            {/* Task Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Le Shelf */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Le Shelf
                  </h3>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    {shelfTasks.length}
                  </Badge>
                </div>
                <SortableContext
                  items={shelfTasks.map(t => t.id.toString())}
                  strategy={verticalListSortingStrategy}
                  id="shelf"
                >
                  <div className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 min-h-[400px]">
                    {shelfTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {shelfTasks.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune tâche à faire</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>

              {/* Le Storage */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Le Storage
                  </h3>
                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                    {storageTasks.length}
                  </Badge>
                </div>
                <SortableContext
                  items={storageTasks.map(t => t.id.toString())}
                  strategy={verticalListSortingStrategy}
                  id="storage"
                >
                  <div className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 min-h-[400px]">
                    {storageTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {storageTasks.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune tâche bloquée</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>

              {/* Le Checkout */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Le Checkout
                  </h3>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                    {checkoutTasks.length}
                  </Badge>
                </div>
                <SortableContext
                  items={checkoutTasks.map(t => t.id.toString())}
                  strategy={verticalListSortingStrategy}
                  id="checkout"
                >
                  <div className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 min-h-[400px]">
                    {checkoutTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {checkoutTasks.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune tâche à passer</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard task={activeTask} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {viewMode === 'capacity' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Capacité de l'équipe
            </h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {totalHoursPerWeek}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Capacité totale / semaine</div>
              </Card>

              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {usedHours}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Heures utilisées</div>
              </Card>

              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {availableHours}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Heures disponibles</div>
              </Card>

              <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {capacityPercentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Utilisation</div>
              </Card>
            </div>

            {/* Capacity Bar */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Utilisation de la capacité
              </h3>
              <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                    capacityPercentage > 90 ? 'bg-red-500' :
                    capacityPercentage > 75 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                  {usedHours}h / {totalHoursPerWeek}h
                </div>
              </div>
            </Card>

            {/* Employee Capacity */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Capacité par employé
              </h3>
              <div className="space-y-4">
                {employees.map((employee) => {
                  const employeeTasks = tasks.filter(t => t.assignee_id === employee.id && t.status === 'in_progress');
                  const employeeHours = employeeTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
                  const employeeCapacity = (employeeHours / 40) * 100;

                  return (
                    <div key={employee.id} className="flex items-center gap-4">
                      <div className="w-32 flex-shrink-0">
                        <p className="font-medium text-sm truncate">{employee.name}</p>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                              employeeCapacity > 90 ? 'bg-red-500' :
                              employeeCapacity > 75 ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(employeeCapacity, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 flex-shrink-0 text-right">
                        <span className="text-sm font-medium">{employeeHours}h / 40h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Timeline des tâches
            </h2>
            
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <div className="space-y-4">
                {tasks
                  .filter(t => t.created_at)
                  .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
                  .map((task) => {
                    const employee = employees.find(e => e.id === task.assignee_id);
                    const statusConfig = {
                      todo: { label: 'À faire', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: Package },
                      in_progress: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Clock },
                      blocked: { label: 'Bloqué', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Lock },
                      review: { label: 'Révision', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: AlertCircle },
                      done: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
                    };
                    const config = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
                    const Icon = config.icon;

                    return (
                      <div key={task.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}/20 border ${config.color.split(' ')[2]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{task.title}</h4>
                            <Badge className={`${config.color} border flex-shrink-0`}>
                              {config.label}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {employee && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {employee.name}
                              </span>
                            )}
                            {task.project_name && (
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {task.project_name}
                              </span>
                            )}
                            {task.created_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}

export default function TeamProjectManagementPage() {
  return <TeamProjectManagementContent />;
}
