'use client';

/**
 * Widget : Progression des Objectifs
 */

import { Target, CheckCircle2 } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { projectsAPI } from '@/lib/api/projects';
import { useEffect, useState } from 'react';

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export function GoalsProgressWidget({ config, globalFilters }: WidgetProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load opportunities and projects to create goals
        const [opportunities, projects] = await Promise.all([
          opportunitiesAPI.list(0, 100),
          projectsAPI.list(),
        ]);
        
        const goalsList: Goal[] = [];
        
        // Goal 1: Opportunities won
        const wonOpportunities = opportunities.filter((opp: any) => opp.status === 'won');
        const totalOpportunitiesValue = wonOpportunities.reduce((sum: number, opp: any) => 
          sum + (opp.amount || 0), 0
        );
        goalsList.push({
          id: 'opportunities-won',
          name: 'Opportunités gagnées',
          target: 1000000, // 1M target
          current: totalOpportunitiesValue,
          unit: '€',
        });
        
        // Goal 2: Projects completed
        const completedProjects = projects.filter((p: any) => p.status === 'COMPLETED');
        goalsList.push({
          id: 'projects-completed',
          name: 'Projets terminés',
          target: 10,
          current: completedProjects.length,
          unit: '',
        });
        
        // Goal 3: Active projects
        const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE');
        goalsList.push({
          id: 'projects-active',
          name: 'Projets actifs',
          target: 20,
          current: activeProjects.length,
          unit: '',
        });
        
        setGoals(goalsList);
      } catch (error) {
        console.error('Error loading goals:', error);
        setGoals([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Aucun objectif"
        description="Les objectifs apparaîtront ici."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-4">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = goal.current >= goal.target;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {goal.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.current.toLocaleString('fr-FR')}{goal.unit} / {goal.target.toLocaleString('fr-FR')}{goal.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCompleted 
                      ? 'bg-green-600 dark:bg-green-500' 
                      : 'bg-blue-600 dark:bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress.toFixed(0)}% complété
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
