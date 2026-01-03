'use client';

/**
 * Time Tracking Widget
 * Displays time tracking summary (total hours, average, etc.)
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { Clock } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { timeEntriesAPI } from '@/lib/api/time-entries';
import type { ManagementWidgetProps } from '@/lib/management/types';

export function TimeTrackingWidget({ widgetId: _widgetId, config: _config }: ManagementWidgetProps) {
  const router = useRouter();
  
  const { data: timeEntriesData, isLoading } = useInfiniteQuery({
    queryKey: ['time-entries', 'widget'],
    queryFn: ({ pageParam = 0 }) => timeEntriesAPI.list({ skip: pageParam, limit: 1000 }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  
  const timeEntries = useMemo(() => timeEntriesData?.pages.flat() || [], [timeEntriesData]);
  
  const stats = useMemo(() => {
    const totalHours = timeEntries.reduce((sum: number, entry: any) => {
      return sum + (entry.duration / 3600); // Convert seconds to hours
    }, 0);
    
    const avgHours = timeEntries.length > 0 
      ? (totalHours / timeEntries.length).toFixed(1)
      : '0.0';
    
    // This week's hours
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekHours = timeEntries
      .filter((entry: any) => new Date(entry.date) >= startOfWeek)
      .reduce((sum: number, entry: any) => sum + (entry.duration / 3600), 0);
    
    return {
      totalHours: totalHours.toFixed(1),
      avgHours,
      thisWeekHours: thisWeekHours.toFixed(1),
      totalEntries: timeEntries.length,
    };
  }, [timeEntries]);

  if (isLoading) {
    return (
      <Card className="glass-card p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div 
      className="h-full w-full cursor-pointer"
      onClick={() => router.push('/dashboard/management/feuilles-temps')}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30 flex-shrink-0">
          <Clock className="w-5 h-5 text-primary-500" />
        </div>
        <h3 className="font-semibold text-foreground truncate">Suivi du Temps</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-foreground mb-1 truncate">
            {stats.totalHours}h
          </div>
          <div className="text-sm text-muted-foreground truncate">Heures totales</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-foreground truncate">{stats.avgHours}h</div>
            <div className="text-xs text-muted-foreground truncate">Moyenne</div>
          </div>
          
          <div className="min-w-0">
            <div className="text-lg font-semibold text-foreground truncate">{stats.thisWeekHours}h</div>
            <div className="text-xs text-muted-foreground truncate">Cette semaine</div>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="text-sm text-muted-foreground truncate">
            {stats.totalEntries} entrées enregistrées
          </div>
        </div>
      </div>
    </div>
  );
}
