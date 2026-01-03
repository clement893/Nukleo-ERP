'use client';

/**
 * Upcoming Vacations Widget
 * Displays upcoming approved vacations
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui';
import { Calendar, Plane } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { vacationRequestsAPI } from '@/lib/api/vacationRequests';
import type { ManagementWidgetProps } from '@/lib/management/types';

export function UpcomingVacationsWidget({ widgetId: _widgetId, config: _config }: ManagementWidgetProps) {
  const router = useRouter();
  
  const { data: vacationsData, isLoading } = useInfiniteQuery({
    queryKey: ['vacation-requests', 'upcoming-widget'],
    queryFn: ({ pageParam = 0 }) => vacationRequestsAPI.list({ skip: pageParam, limit: 1000 }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  
  const vacations = useMemo(() => vacationsData?.pages.flat() || [], [vacationsData]);
  
  const upcomingVacations = useMemo(() => {
    const now = new Date();
    return vacations
      .filter((v: any) => 
        v.status === 'approved' && 
        new Date(v.start_date) > now
      )
      .sort((a: any, b: any) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
      .slice(0, 5); // Show max 5
  }, [vacations]);

  if (isLoading) {
    return (
      <div className="h-full w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-semibold text-foreground truncate">Vacances à Venir</h3>
        </div>
        {upcomingVacations.length > 0 && (
          <Badge className="bg-blue-500 text-white flex-shrink-0">
            {upcomingVacations.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-3 overflow-auto flex-1 min-h-0">
        {upcomingVacations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune vacance à venir</p>
          </div>
        ) : (
          upcomingVacations.map((vacation: any) => {
            const startDate = new Date(vacation.start_date);
            const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={vacation.id}
                className="p-3 rounded-lg border border-border hover:border-primary-500/30 transition-colors cursor-pointer"
                onClick={() => router.push('/dashboard/management/vacances')}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <p className="text-sm font-medium text-foreground truncate flex-1">
                    {vacation.employee_name || 'Employé'}
                  </p>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border text-xs flex-shrink-0">
                    Approuvé
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {startDate.toLocaleDateString('fr-CA')} - {new Date(vacation.end_date).toLocaleDateString('fr-CA')}
                  </span>
                </div>
                {daysUntil > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
