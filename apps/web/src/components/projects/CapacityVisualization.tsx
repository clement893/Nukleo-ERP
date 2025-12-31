'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Clock, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ProjectTask } from '@/lib/api/project-tasks';
import type { Employee } from '@/lib/api/employees';
import { formatDurationHours } from '@/lib/utils/timesheet';
import { calculateWeeklyCapacity } from '@/lib/utils/capacity';
import { vacationRequestsAPI, type VacationRequest } from '@/lib/api/vacationRequests';

interface CapacityVisualizationProps {
  tasks: ProjectTask[];
  employees: Employee[];
  teamId?: number;
  startDate?: Date;
  endDate?: Date;
  holidays?: Array<{ id: number; name: string; date: string; year?: number | null; is_active: boolean }>;
}

interface EmployeeCapacity {
  employee: Employee;
  capacityHoursPerWeek: number;
  estimatedHours: number;
  utilization: number; // Percentage
  status: 'under' | 'optimal' | 'over';
  actualCapacityHours?: number;
  workingDays?: number;
}

export default function CapacityVisualization({
  tasks,
  employees,
  teamId,
  startDate,
  endDate,
  holidays = [],
}: CapacityVisualizationProps) {
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [_loadingVacations, setLoadingVacations] = useState(false);
  // Calculate weeks in date range
  const weeks = useMemo(() => {
    if (!startDate || !endDate) {
      // Default to next 4 weeks
      const today = new Date();
      const weeks: Date[] = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + i * 7);
        weeks.push(weekStart);
      }
      return weeks;
    }

    const weeks: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }, [startDate, endDate]);

  // Filter tasks by team and date range
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (teamId && task.team_id !== teamId) return false;
      if (startDate && task.due_date && new Date(task.due_date) < startDate) return false;
      if (endDate && task.due_date && new Date(task.due_date) > endDate) return false;
      return true;
    });
  }, [tasks, teamId, startDate, endDate]);

  // Load vacations - only for employees being analyzed
  useEffect(() => {
    const loadVacations = async () => {
      if (employees.length === 0) return;
      
      try {
        setLoadingVacations(true);
        // Get employee IDs from the employees list
        const employeeIds = employees.map(emp => emp.id).filter(Boolean);
        
        // Load vacations for these specific employees
        // Note: API might not support filtering by multiple employee_ids, so we load all and filter
        const allVacations = await vacationRequestsAPI.list({ status: 'approved' });
        
        // Filter to only include vacations for employees in the current analysis
        const relevantVacations = allVacations.filter(vac => 
          employeeIds.includes(vac.employee_id)
        );
        
        setVacations(relevantVacations);
      } catch (err) {
        console.error('Error loading vacations:', err);
        // Don't fail the entire component if vacations can't be loaded
        setVacations([]);
      } finally {
        setLoadingVacations(false);
      }
    };
    loadVacations();
  }, [employees]);

  // Convert vacations to absences format
  const absences = useMemo(() => {
    return vacations.map(vac => ({
      id: vac.id,
      employee_id: vac.employee_id,
      start_date: vac.start_date,
      end_date: vac.end_date,
      type: 'vacation' as const,
      status: 'approved' as const,
    }));
  }, [vacations]);

  // Create mapping: user_id -> employee
  const employeeByUserIdMap = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach((employee) => {
      if (employee.user_id) {
        map.set(employee.user_id, employee);
      }
    });
    return map;
  }, [employees]);

  // Calculate capacity per employee
  const employeeCapacities = useMemo<EmployeeCapacity[]>(() => {
    const capacityMap = new Map<number, EmployeeCapacity>();

    employees.forEach((employee) => {
      // Use user_id as primary key for mapping with tasks (assignee_id = user_id)
      // If no user_id, still calculate capacity but tasks won't be mapped
      const key = employee.user_id || employee.id;
      
      // Calculate actual capacity considering holidays and absences
      const capacityInfo = calculateWeeklyCapacity(employee, weeks, holidays, absences);
      
      capacityMap.set(key, {
        employee,
        capacityHoursPerWeek: capacityInfo.capacityHoursPerWeek,
        estimatedHours: 0,
        utilization: 0,
        status: 'under',
        actualCapacityHours: capacityInfo.totalCapacityHours,
        workingDays: capacityInfo.totalWorkingDays,
      });
    });

    // Sum estimated hours per assignee
    // Only count tasks that are within the analyzed period and not completed
    filteredTasks.forEach((task) => {
      if (!task.assignee_id || !task.estimated_hours) return;
      
      // Check if task is in the analyzed period
      if (startDate && task.due_date && new Date(task.due_date) < startDate) return;
      if (endDate && task.due_date && new Date(task.due_date) > endDate) return;
      
      // Optionally exclude completed tasks (they're already done)
      // if (task.status === 'completed') return;
      
      // Try to find capacity by user_id first (primary mapping)
      let capacity = capacityMap.get(task.assignee_id);
      
      // If not found, try to find employee by user_id and use employee.id as fallback
      if (!capacity) {
        const employee = employeeByUserIdMap.get(task.assignee_id);
        if (employee) {
          capacity = capacityMap.get(employee.id);
        }
      }
      
      if (capacity) {
        capacity.estimatedHours += task.estimated_hours;
      } else {
        // Task assigned to a user_id that doesn't match any employee
        // This is expected if the user doesn't have an employee record
        // Only log in development to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Task ${task.id} assigned to user_id ${task.assignee_id} but no matching employee found`);
        }
      }
    });

    // Calculate utilization using actual capacity
    capacityMap.forEach((capacity) => {
      const totalCapacity = capacity.actualCapacityHours || capacity.capacityHoursPerWeek * weeks.length;
      capacity.utilization = totalCapacity > 0 
        ? (capacity.estimatedHours / totalCapacity) * 100 
        : 0;
      
      if (capacity.utilization > 100) {
        capacity.status = 'over';
      } else if (capacity.utilization > 80) {
        capacity.status = 'optimal';
      } else {
        capacity.status = 'under';
      }
    });

    return Array.from(capacityMap.values()).sort((a, b) => b.utilization - a.utilization);
  }, [employees, filteredTasks, weeks, holidays, absences, employeeByUserIdMap]);

  // Calculate team totals
  const teamStats = useMemo(() => {
    const totalCapacity = employeeCapacities.reduce(
      (sum, cap) => sum + (cap.actualCapacityHours || cap.capacityHoursPerWeek * weeks.length),
      0
    );
    const totalEstimated = employeeCapacities.reduce(
      (sum, cap) => sum + cap.estimatedHours,
      0
    );
    const avgUtilization = employeeCapacities.length > 0
      ? employeeCapacities.reduce((sum, cap) => sum + cap.utilization, 0) / employeeCapacities.length
      : 0;

    return {
      totalCapacity,
      totalEstimated,
      avgUtilization,
      overCapacity: employeeCapacities.filter((cap) => cap.status === 'over').length,
    };
  }, [employeeCapacities, weeks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'optimal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return <AlertTriangle className="w-4 h-4" />;
      case 'optimal':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Capacité de l'équipe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Capacité totale</p>
            <p className="text-2xl font-bold text-foreground">
              {formatDurationHours(teamStats.totalCapacity * 3600)}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {weeks.length} semaine{weeks.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Heures prévues</p>
            <p className="text-2xl font-bold text-foreground">
              {formatDurationHours(teamStats.totalEstimated * 3600)}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Utilisation moyenne</p>
            <p className="text-2xl font-bold text-foreground">
              {teamStats.avgUtilization.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {employeeCapacities.length} employé{employeeCapacities.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Surcapacité</p>
            <p className={`text-2xl font-bold ${teamStats.overCapacity > 0 ? 'text-red-600' : 'text-foreground'}`}>
              {teamStats.overCapacity}
            </p>
            <p className="text-xs text-muted-foreground mt-1">employé{teamStats.overCapacity > 1 ? 's' : ''}</p>
          </div>
        </div>
      </Card>

      {/* Employee Capacity List */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Capacité par employé</h3>
        <div className="space-y-4">
          {employeeCapacities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun employé avec des tâches assignées
            </p>
          ) : (
            employeeCapacities.map((capacity) => {
              const totalCapacity = capacity.actualCapacityHours || capacity.capacityHoursPerWeek * weeks.length;
              const remaining = totalCapacity - capacity.estimatedHours;
              
              return (
                <div
                  key={capacity.employee.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {capacity.employee.first_name} {capacity.employee.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {capacity.capacityHoursPerWeek}h/semaine × {weeks.length} semaine{weeks.length > 1 ? 's' : ''} = {formatDurationHours(totalCapacity * 3600)}h
                        {capacity.workingDays !== undefined && (
                          <span className="ml-2 text-xs">
                            ({capacity.workingDays} jours ouvrables)
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge className={getStatusColor(capacity.status)}>
                      {getStatusIcon(capacity.status)}
                      <span className="ml-1">{capacity.utilization.toFixed(1)}%</span>
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          capacity.status === 'over'
                            ? 'bg-red-500'
                            : capacity.status === 'optimal'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(capacity.utilization, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Prévu</p>
                      <p className="font-medium text-foreground">
                        {formatDurationHours(capacity.estimatedHours * 3600)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Restant</p>
                      <p className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-foreground'}`}>
                        {formatDurationHours(remaining * 3600)}h
                      </p>
                    </div>
                    {capacity.workingDays !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Jours ouvrables</p>
                        <p className="font-medium text-foreground">
                          {capacity.workingDays}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Tâches</p>
                      <p className="font-medium text-foreground">
                        {filteredTasks.filter((t) => {
                          const employeeKey = capacity.employee.user_id || capacity.employee.id;
                          return t.assignee_id === employeeKey;
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
