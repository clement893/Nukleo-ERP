'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Badge, Button, Loading, Alert, Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Users, Clock, AlertCircle, CheckCircle, 
  Lock, Package, ShoppingCart, Calendar, TrendingUp, User
} from 'lucide-react';
import { useTeamBySlug, useCreateTeam } from '@/lib/query/queries';
import { useProjectTasks, useUpdateProjectTask } from '@/lib/query/project-tasks';
import { useEmployees } from '@/lib/query/queries';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import type { ProjectTask } from '@/lib/api/project-tasks';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
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

type ViewMode = 'board' | 'capacity';

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

// Drop Zone Component for sections
function DropZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ 
    id,
    data: {
      type: 'section',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ''} ${isOver ? 'ring-2 ring-[#523DC9] bg-[#523DC9]/5 transition-all' : ''}`}
    >
      {children}
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
  const { setNodeRef, isOver } = useDroppable({ 
    id: `employee-${employee.id}`,
    data: {
      type: 'employee',
      employeeId: employee.id,
    },
  });

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
      className={`glass-card p-4 rounded-xl border transition-all ${
        isOver 
          ? 'border-[#523DC9] bg-[#523DC9]/5 scale-105 ring-2 ring-[#523DC9]' 
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
  const { showToast } = useToast();
  const teamSlug = params?.slug as string;
  
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  
  // Use React Query hooks
  const { data: team, isLoading: teamLoading, error: teamError } = useTeamBySlug(teamSlug);
  const createTeamMutation = useCreateTeam();
  const updateTaskMutation = useUpdateProjectTask();
  
  // Load tasks for this team
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useProjectTasks({
    team_id: team?.id,
    enabled: !!team?.id,
  });
  
  // Load employees for this team
  const { data: employeesData = [], isLoading: employeesLoading } = useEmployees({
    team_id: team?.id,
    enabled: !!team?.id,
  });
  
  const loading = teamLoading || tasksLoading || employeesLoading;
  const error = teamError ? handleApiError(teamError).message : null;

  // Drag & Drop sensors - improved for better touch and mouse support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Increased from 3 to prevent accidental drags
      },
    })
  );
  
  // Ensure team exists if not found
  useEffect(() => {
    if (teamError && teamSlug) {
      const appError = handleApiError(teamError);
      if (appError.statusCode === 404) {
        const requiredTeams = [
          { name: 'Le Bureau', slug: 'le-bureau' },
          { name: 'Le Studio', slug: 'le-studio' },
          { name: 'Le Lab', slug: 'le-lab' },
          { name: 'Équipe Gestion', slug: 'equipe-gestion' },
        ];
        
        const teamToCreate = requiredTeams.find(t => t.slug === teamSlug);
        if (teamToCreate) {
          createTeamMutation.mutate({
            name: teamToCreate.name,
            slug: teamToCreate.slug,
            description: `Équipe ${teamToCreate.name}`,
          }, {
            onError: (err) => {
              const createError = handleApiError(err);
              showToast({
                message: createError.message || 'Erreur lors de la création de l\'équipe',
                type: 'error',
              });
            },
          });
        }
      }
    }
  }, [teamError, teamSlug, createTeamMutation, showToast]);
  
  // Build employees with current tasks
  const employees = useMemo(() => {
    if (!employeesData.length || !tasks.length) return [];
    
    return employeesData.map((emp) => {
      const currentTask = tasks.find(
        (t) => {
          // Use employee_assignee_id logic: if task has assignee_id, check if it matches employee's user_id
          // Otherwise, check if employee_assignee_id matches (though this is not in the API response)
          return t.assignee_id === emp.user_id && t.status === 'in_progress';
        }
      );
      
      return {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email || '',
        currentTask: currentTask || null,
      };
    });
  }, [employeesData, tasks]);


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id.toString() === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      // Dropped outside any drop zone, cancel
      return;
    }

    // If dropped on the same item, do nothing
    if (active.id === over.id) return;

    const taskId = parseInt(active.id as string);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus: ProjectTask['status'] = task.status;
    let newAssigneeId: number | null = task.assignee_id ?? null;

    // Déterminer la nouvelle destination
    const overId = over.id.toString();
    
    if (overId === 'shelf') {
      newStatus = 'todo';
      newAssigneeId = null;
    } else if (overId === 'storage') {
      newStatus = 'blocked';
      newAssigneeId = null;
    } else if (overId === 'checkout') {
      newStatus = 'to_transfer';
      newAssigneeId = null;
    } else if (overId.startsWith('employee-')) {
      const employeeId = parseInt(overId.replace('employee-', ''));
      const employee = employees.find(e => e.id === employeeId);
      
      if (!employee) {
        showToast({
          message: 'Employé non trouvé',
          type: 'error',
        });
        return;
      }
      
      // Vérifier si l'employé a déjà une tâche en cours
      if (employee?.currentTask) {
        showToast({
          message: `${employee.name} a déjà une tâche en cours`,
          type: 'error',
        });
        return;
      }
      
      newStatus = 'in_progress';
      // Use employee.id (not user_id) because API expects employee_assignee_id
      newAssigneeId = employeeId;
    } else {
      // Dropped on another task or unknown zone, check if it's a valid task ID
      const droppedOnTaskId = parseInt(overId);
      if (!isNaN(droppedOnTaskId)) {
        // Dropped on another task - find which section it belongs to
        const droppedOnTask = tasks.find(t => t.id === droppedOnTaskId);
        if (droppedOnTask) {
          // Use the same status as the task we dropped on
          newStatus = droppedOnTask.status;
          newAssigneeId = droppedOnTask.assignee_id ?? null;
        } else {
          // Unknown drop target, cancel
          return;
        }
      } else {
        // Unknown drop target, cancel
        return;
      }
    }

    // Don't update if nothing changed
    if (newStatus === task.status && newAssigneeId === (task.assignee_id ?? null)) {
      return;
    }

    // Update on server using React Query mutation (no optimistic update to avoid ID mismatch)
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: {
          status: newStatus,
          employee_assignee_id: newAssigneeId, // API will map employee_id to user_id automatically
        },
      });
      
      // Refetch tasks to get updated data from server
      await refetchTasks();
      
      showToast({
        message: 'Tâche mise à jour',
        type: 'success',
      });
    } catch (err) {
      // Revert on error (React Query will handle the revert automatically)
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
  const checkoutTasks = tasks.filter(t => t.status === 'to_transfer' || t.status === 'completed');

  // Calculate capacity using actual employee capacity
  const totalHoursPerWeek = useMemo(() => {
    return employeesData.reduce((sum, emp) => {
      return sum + (emp.capacity_hours_per_week || 35); // Default 35h if not specified
    }, 0);
  }, [employeesData]);
  
  const usedHours = useMemo(() => {
    return tasks
      .filter(t => t.status === 'in_progress' || t.status === 'to_transfer')
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  }, [tasks]);
  
  const availableHours = totalHoursPerWeek - usedHours;
  const capacityPercentage = totalHoursPerWeek > 0 
    ? Math.round((usedHours / totalHoursPerWeek) * 100) 
    : 0;

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
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'board' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Employees Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                👥 Équipe ({employees.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    task={employee.currentTask}
                  />
                ))}
              </div>
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
                <DropZone id="shelf" className="min-h-[400px]">
                  <SortableContext
                    items={shelfTasks.map(t => t.id.toString())}
                    strategy={verticalListSortingStrategy}
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
                </DropZone>
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
                <DropZone id="storage" className="min-h-[400px]">
                  <SortableContext
                    items={storageTasks.map(t => t.id.toString())}
                    strategy={verticalListSortingStrategy}
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
                </DropZone>
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
                <DropZone id="checkout" className="min-h-[400px]">
                  <SortableContext
                    items={checkoutTasks.map(t => t.id.toString())}
                    strategy={verticalListSortingStrategy}
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
                </DropZone>
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
                  // Find tasks assigned to this employee: assignee_id is user_id, so match with employee's user_id
                  // But we need to find employee by matching user_id from tasks with employee.user_id
                  const employeeTasks = tasks.filter(t => {
                    const taskEmployee = employeesData.find(emp => emp.user_id === t.assignee_id);
                    return taskEmployee?.id === employee.id && t.status === 'in_progress';
                  });
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

        {/* Timeline mode removed - not implemented */}
        {false && (viewMode as string) === 'timeline' && (
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
                      to_transfer: { label: 'À transférer', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: AlertCircle },
                      completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
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
