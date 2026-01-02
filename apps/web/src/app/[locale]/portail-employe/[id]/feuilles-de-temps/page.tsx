'use client';

import { useParams } from 'next/navigation';
import EmployeePortalTimeSheets from '@/components/employes/EmployeePortalTimeSheets';

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

  return <EmployeePortalTimeSheets employeeId={employeeId} />;
}
