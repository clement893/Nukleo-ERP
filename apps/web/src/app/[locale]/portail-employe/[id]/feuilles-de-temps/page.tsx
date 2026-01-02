'use client';

import { useParams } from 'next/navigation';
import EmployeePortalTimeSheets from '@/components/employes/EmployeePortalTimeSheets';
import { EmployeePortalHeader } from '@/components/employes';

export default function MesFeuillesDeTemps() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);

  if (!employeeId || isNaN(employeeId)) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">ID employé invalide</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeePortalHeader
        title="Mes Feuilles de Temps"
        description="Suivez vos heures travaillées"
      />

      <EmployeePortalTimeSheets employeeId={employeeId} />
    </div>
  );
}
