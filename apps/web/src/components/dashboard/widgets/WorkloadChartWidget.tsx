'use client';

/**
 * Widget : Charge de Travail
 */

import { Briefcase } from 'lucide-react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { timeEntriesAPI } from '@/lib/api/time-entries';
import { useEffect, useState } from 'react';

export function WorkloadChartWidget({ config, globalFilters }: WidgetProps) {
  const [workloadData, setWorkloadData] = useState<{ name: string; hours: number; capacity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [employees, timeEntries] = await Promise.all([
          employeesAPI.list(),
          timeEntriesAPI.list({}),
        ]);
        
        // Calculate workload for each employee
        const workload = employees.map((emp: any) => {
          // Get time entries for this employee (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const empTimeEntries = timeEntries.filter((entry: any) => {
            if (entry.user_id !== emp.user_id) return false;
            const entryDate = new Date(entry.date);
            return entryDate >= sevenDaysAgo;
          });
          
          const totalHours = empTimeEntries.reduce((sum: number, entry: any) => 
            sum + (entry.duration / 3600), 0
          );
          
          // Capacity is hours per week (default 35)
          const weeklyCapacity = emp.capacity_hours_per_week || 35;
          const capacity = (weeklyCapacity / 7) * 7; // For 7 days
          
          return {
            name: `${emp.first_name} ${emp.last_name}`.trim() || 'Employé',
            hours: totalHours,
            capacity: capacity,
            utilization: capacity > 0 ? (totalHours / capacity) * 100 : 0,
          };
        }).filter(emp => emp.hours > 0) // Only show employees with time entries
          .sort((a, b) => b.utilization - a.utilization)
          .slice(0, 5); // Top 5
        
        setWorkloadData(workload);
      } catch (error) {
        console.error('Error loading workload:', error);
        setWorkloadData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (workloadData.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Aucune charge"
        description="Les données de charge de travail apparaîtront ici."
        variant="compact"
      />
    );
  }

  const maxUtilization = Math.max(...workloadData.map(d => d.utilization), 1);

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">Charge de travail (7 jours)</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {workloadData.length} employé{workloadData.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto space-y-3">
        {workloadData.map((item, index) => {
          const utilization = item.utilization;
          const isOverloaded = utilization > 100;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate flex-1">
                  {item.name}
                </span>
                <span className={`font-medium ${
                  isOverloaded 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {utilization.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isOverloaded 
                      ? 'bg-red-600 dark:bg-red-500' 
                      : 'bg-blue-600 dark:bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{item.hours.toFixed(1)}h</span>
                <span>Capacité: {item.capacity.toFixed(1)}h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
