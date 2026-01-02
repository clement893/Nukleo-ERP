'use client';

/**
 * Widget: Vacances de l'employé
 */

import { useEffect, useState } from 'react';
import { Calendar, Plane } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { vacationRequestsAPI, type VacationRequest } from '@/lib/api/vacationRequests';
import EmptyState from '@/components/ui/EmptyState';
import { useEmployeePortalDashboardStore } from '@/lib/dashboard/employeePortalStore';

export function EmployeeVacationsWidget({ config, globalFilters }: WidgetProps) {
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { employeeId } = useEmployeePortalDashboardStore();

  useEffect(() => {
    const loadVacations = async () => {
      try {
        setIsLoading(true);
        const idToUse = employeeId || (globalFilters?.employee_id as number);
        if (!idToUse) {
          setIsLoading(false);
          return;
        }
        
        const data = await vacationRequestsAPI.list({ employee_id: idToUse });
        setVacations(data);
      } catch (error) {
        console.error('Error loading vacations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVacations();
  }, [employeeId, globalFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingVacations = vacations
    .filter((v: VacationRequest) => {
      const startDate = new Date(v.start_date);
      return startDate >= new Date() && v.status === 'approved';
    })
    .sort((a: VacationRequest, b: VacationRequest) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    .slice(0, 5);

  const pendingVacations = vacations.filter((v: VacationRequest) => v.status === 'pending');

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{config.title || 'Mes Vacances'}</h3>
        {pendingVacations.length > 0 && (
          <div className="text-sm text-orange-600 dark:text-orange-400 mb-2">
            {pendingVacations.length} demande{pendingVacations.length !== 1 ? 's' : ''} en attente
          </div>
        )}
      </div>

      {upcomingVacations.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="Aucune vacance à venir"
          description="Vous n'avez pas de vacances planifiées"
          variant="compact"
        />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {upcomingVacations.map((vacation) => {
            const startDate = new Date(vacation.start_date);
            const endDate = vacation.end_date ? new Date(vacation.end_date) : startDate;
            const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            return (
              <div
                key={vacation.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">
                      {vacation.reason || 'Congés'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {startDate.toLocaleDateString('fr-FR')} - {endDate.toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {daysDiff} jour{daysDiff !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
