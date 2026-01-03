'use client';

/**
 * Widget : Budget vs Dépensé
 * Graphique comparatif par projet avec détection des dépassements
 */

import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsAPI } from '@/lib/api/projects';
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
  Legend,
} from 'recharts';

interface ProjectBudget {
  name: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const budget = payload.find((p: any) => p.dataKey === 'budget');
    const actual = payload.find((p: any) => p.dataKey === 'actual');
    
    if (!budget || !actual) return null;
    
    const variance = (actual.value as number) - (budget.value as number);
    const variancePercent = budget.value > 0 
      ? (variance / (budget.value as number)) * 100 
      : 0;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Budget: </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(budget.value as number)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Réel: </span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(actual.value as number)}
            </span>
          </p>
          <p className={`text-sm font-bold ${
            variance >= 0 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            Écart: {variance >= 0 ? '+' : ''}
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(variance)}
            ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function BudgetVsActualWidget({ }: WidgetProps) {
  const [projectsData, setProjectsData] = useState<ProjectBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overBudgetCount, setOverBudgetCount] = useState(0);
  const [totalVariance, setTotalVariance] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projects = await projectsAPI.list();
        
        // Filter projects with budget
        const projectsWithBudget = projects.filter(p => p.budget && p.budget > 0);
        
        if (projectsWithBudget.length === 0) {
          setProjectsData([]);
          setIsLoading(false);
          return;
        }

        // Get tasks for all projects to calculate actual costs
        // For now, we'll estimate based on tasks (simplified - in real app, use time entries)
        const tasks = await projectTasksAPI.list();
        
        // Calculate actual costs per project
        // Simplified calculation: estimate cost based on number of tasks
        // In a real app, this would use time entries × hourly rate
        const projectData: ProjectBudget[] = projectsWithBudget.map(project => {
          const projectTasks = tasks.filter(t => t.project_id === project.id);
          const completedTasks = projectTasks.filter(t => t.status === 'completed');
          
          // Estimate: each task costs ~500€ on average (simplified)
          // In real app, calculate from time entries
          const estimatedCostPerTask = 500;
          const actual = completedTasks.length * estimatedCostPerTask;
          
          const budget = project.budget || 0;
          const variance = actual - budget;
          const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
          
          return {
            name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
            budget,
            actual,
            variance,
            variancePercent,
          };
        });

        // Sort by variance (worst first)
        projectData.sort((a, b) => b.variance - a.variance);
        
        // Take top 10 projects
        const topProjects = projectData.slice(0, 10);
        
        setProjectsData(topProjects);
        
        const overBudget = topProjects.filter(p => p.variance > 0).length;
        setOverBudgetCount(overBudget);
        
        const totalVar = topProjects.reduce((sum, p) => sum + p.variance, 0);
        setTotalVariance(totalVar);
      } catch (error) {
        console.error('Error loading budget vs actual:', error);
        setProjectsData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (projectsData.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucun projet avec budget"
        description="Ajoutez des budgets à vos projets pour voir la comparaison."
        variant="compact"
      />
    );
  }

  const chartData = projectsData.map(p => ({
    name: p.name,
    budget: p.budget,
    actual: p.actual,
  }));

  const isPositiveVariance = totalVariance <= 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header stats */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Projets en dépassement</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              {overBudgetCount > 0 && <AlertTriangle className="w-5 h-5" />}
              {overBudgetCount}/{projectsData.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Écart total</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              isPositiveVariance
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositiveVariance ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(Math.abs(totalVariance))}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[0, 4, 4, 0]} />
            <Bar dataKey="actual" fill="#10b981" name="Réel" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
