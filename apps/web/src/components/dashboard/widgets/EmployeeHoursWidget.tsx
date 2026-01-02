'use client';

/**
 * Widget: Heures travaillées de l'employé
 */

import { useEffect, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
// Card not needed here
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';

export function EmployeeHoursWidget({ config, globalFilters }: WidgetProps) {
  const [hoursThisWeek, setHoursThisWeek] = useState(0);
  const [hoursThisMonth, setHoursThisMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { employeeId } = useEmployeePortalDashboardStore();

  useEffect(() => {
    const idToUse = employeeId || (globalFilters?.employee_id as number);
    if (!idToUse) {
      setIsLoading(false);
      return;
    }
    
    const loadHours = async () => {
      try {
        setIsLoading(true);
        
        const now = new Date();
        
        // Cette semaine
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Ce mois
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const [weekEntries, monthEntries] = await Promise.all([
          timeEntriesAPI.list({
            user_id: idToUse,
            start_date: startOfWeek.toISOString().split('T')[0] || startOfWeek.toISOString().substring(0, 10),
          }),
          timeEntriesAPI.list({
            user_id: idToUse,
            start_date: startOfMonth.toISOString().split('T')[0] || startOfMonth.toISOString().substring(0, 10),
          }),
        ]);

        const weekHours = weekEntries.reduce((sum, entry) => sum + ((entry.duration || 0) / 3600), 0);
        const monthHours = monthEntries.reduce((sum, entry) => sum + ((entry.duration || 0) / 3600), 0);
        
        setHoursThisWeek(weekHours);
        setHoursThisMonth(monthHours);
      } catch (error) {
        console.error('Error loading hours:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHours();
  }, [employeeId, globalFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weeklyTarget = 40;
  const weeklyProgress = Math.min((hoursThisWeek / weeklyTarget) * 100, 100);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">{config.title || 'Mes Heures'}</h3>
      
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Cette semaine</span>
            <span className="text-2xl font-bold">{hoursThisWeek.toFixed(1)}h</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                weeklyProgress >= 100 ? 'bg-green-500' :
                weeklyProgress >= 75 ? 'bg-blue-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {weeklyTarget}h cible • {weeklyProgress.toFixed(0)}%
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ce mois</span>
            <span className="text-xl font-bold">{hoursThisMonth.toFixed(1)}h</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span>
            {hoursThisWeek >= weeklyTarget ? 'Objectif atteint !' :
             `Encore ${(weeklyTarget - hoursThisWeek).toFixed(1)}h pour atteindre l'objectif`}
          </span>
        </div>
      </div>
    </div>
  );
}
