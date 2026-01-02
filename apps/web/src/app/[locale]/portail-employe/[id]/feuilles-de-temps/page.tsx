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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Feuilles de Temps
          </h1>
          <p className="text-white/80 text-lg">Suivez vos heures travaillées</p>
        </div>
      </div>

      <EmployeePortalTimeSheets employeeId={employeeId} />
    </div>
  );
}
