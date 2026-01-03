'use client';

/**
 * Pending Requests Widget
 * Displays pending vacation and expense requests
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { AlertCircle, Calendar, Plane } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { vacationRequestsAPI } from '@/lib/api/vacationRequests';
import type { ManagementWidgetProps } from '@/lib/management/types';

export function PendingRequestsWidget({ widgetId: _widgetId, config: _config }: ManagementWidgetProps) {
  const router = useRouter();
  
  const { data: vacationsData, isLoading } = useInfiniteQuery({
    queryKey: ['vacation-requests', 'pending-widget'],
    queryFn: ({ pageParam = 0 }) => vacationRequestsAPI.list({ skip: pageParam, limit: 1000 }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 1000) return undefined;
      return allPages.length * 1000;
    },
    initialPageParam: 0,
  });
  
  const vacations = useMemo(() => vacationsData?.pages.flat() || [], [vacationsData]);
  
  const pendingRequests = useMemo(() => {
    return vacations
      .filter((v: any) => v.status === 'pending')
      .slice(0, 5); // Show max 5
  }, [vacations]);

  if (isLoading) {
    return (
      <Card className="glass-card p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-warning-500/10 border border-warning-500/30">
            <AlertCircle className="w-5 h-5 text-warning-500" />
          </div>
          <h3 className="font-semibold text-foreground">Demandes en Attente</h3>
        </div>
        {pendingRequests.length > 0 && (
          <Badge className="bg-warning-500 text-white">
            {pendingRequests.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune demande en attente</p>
          </div>
        ) : (
          <>
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="p-3 rounded-lg border border-border hover:border-primary-500/30 transition-colors cursor-pointer"
                onClick={() => router.push('/dashboard/management/vacances')}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">
                    {request.employee_name || 'Employé'}
                  </p>
                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 border text-xs">
                    En attente
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(request.start_date).toLocaleDateString('fr-CA')} - {new Date(request.end_date).toLocaleDateString('fr-CA')}
                  </span>
                </div>
              </div>
            ))}
            
            {pendingRequests.length >= 5 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push('/dashboard/management/vacances')}
              >
                Voir toutes les demandes
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
