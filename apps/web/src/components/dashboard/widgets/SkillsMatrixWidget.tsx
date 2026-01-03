'use client';

/**
 * Widget : Matrice de Compétences
 * Vue d'ensemble des compétences par département/rôle (basé sur job_title)
 */

import { Brain } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SkillsData {
  department: string;
  employees: number;
  tasksCompleted: number;
  expertise: number; // Calculated based on tasks completed per employee
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.department}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-600 dark:text-gray-400">Employés: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.employees}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Tâches complétées: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.tasksCompleted}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Indice expertise: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.expertise.toFixed(1)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function SkillsMatrixWidget({ }: WidgetProps) {
  const [skillsData, setSkillsData] = useState<SkillsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        const tasks = await projectTasksAPI.list();
        
        // Filter active employees
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        // Group by department
        const byDepartment: Record<string, { employees: any[]; employeeIds: Set<number> }> = {};
        
        activeEmployees.forEach((emp: any) => {
          const dept = emp.department || 'Non spécifié';
          if (!byDepartment[dept]) {
            byDepartment[dept] = { employees: [], employeeIds: new Set() };
          }
          byDepartment[dept].employees.push(emp);
          if (emp.user_id) {
            byDepartment[dept].employeeIds.add(emp.user_id);
          }
        });
        
        // Calculate skills metrics for each department
        const skills: SkillsData[] = Object.entries(byDepartment).map(([department, data]) => {
          const employeeIds = Array.from(data.employeeIds);
          
          // Count completed tasks for employees in this department
          const completedTasks = tasks.filter((task: any) => 
            task.status === 'completed' && 
            employeeIds.includes(task.assignee_id || task.user_id || 0)
          );
          
          const employeeCount = data.employees.length;
          const tasksCompleted = completedTasks.length;
          
          // Expertise index: tasks completed per employee (normalized)
          const expertise = employeeCount > 0 ? (tasksCompleted / employeeCount) : 0;
          
          return {
            department,
            employees: employeeCount,
            tasksCompleted,
            expertise: Math.min(100, expertise * 10), // Scale to 0-100
          };
        })
        .filter(d => d.employees > 0)
        .sort((a, b) => b.expertise - a.expertise);

        setSkillsData(skills);
      } catch (error) {
        console.error('Error loading skills matrix:', error);
        setSkillsData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (skillsData.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title="Aucune donnée"
        description="Les données de compétences apparaîtront ici."
        variant="compact"
      />
    );
  }

  const getBarColor = (expertise: number) => {
    if (expertise >= 70) return '#10b981'; // green
    if (expertise >= 40) return '#3b82f6'; // blue
    if (expertise >= 20) return '#f59e0b'; // amber
    return '#6b7280'; // gray
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Départements</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{skillsData.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expertise moyenne</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              {(skillsData.reduce((sum, d) => sum + d.expertise, 0) / skillsData.length).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={skillsData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              type="category"
              dataKey="department"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="expertise" radius={[0, 4, 4, 0]}>
              {skillsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.expertise)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
