'use client';

/**
 * Vacation Overview Widget
 * Displays vacation statistics (on vacation, pending, upcoming)
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge } from '@/components/ui';
import { Plane, Clock, CheckCircle } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { vacationRequestsAPI } from '@/lib/api/vacationRequests';
import type { ManagementWidgetProps } from '@/lib/management/types';

export function VacationOverviewWidget({ widgetId, config }: ManagementWidgetProps) {
  const router = useRouter();
  
  const { data: vacationsData, isLoading } = useInfiniteQuery({
    queryKey: ['vacation-requests', 'widget'],
    queryFn: ({ pageParam = 0 }) => vacationRequestsAPI.list({ skip: pageParam, limit: 1000 }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  
  const vacations = useMemo(() => vacationsData?.pages.flat() || [], [vacationsData]);
  
  const stats = useMemo(() => {
    const now = new Date();
    
    const onVacation = vacations.filter((v: any) => 
      v.status === 'approved' && 
      new Date(v.start_date) <= now && 
      new Date(v.end_date) >= now
    ).length;
    
    const pending = vacations.filter((v: any) => v.status === 'pending').length;
    
    const upcoming = vacations.filter((v: any) => 
      v.status === 'approved' && 
      new Date(v.start_date) > now
    ).length;
    
    return { onVacation, pending, upcoming, total: vacations.length };
  }, [vacations]);

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
    <Card 
      className="glass-card p-6 h-full cursor-pointer hover:border-primary-500/40 transition-all"
      onClick={() => router.push('/dashboard/management/vacances')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-warning-500/10 border border-warning-500/30">
            <Plane className="w-5 h-5 text-warning-500" />
          </div>
          <h3 className="font-semibold text-foreground">Vacances</h3>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {stats.onVacation}
          </div>
          <div className="text-sm text-muted-foreground">En vacances</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <div>
              <div className="text-lg font-semibold text-foreground">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-lg font-semibold text-foreground">{stats.upcoming}</div>
              <div className="text-xs text-muted-foreground">À venir</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
