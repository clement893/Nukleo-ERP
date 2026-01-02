'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import EmployeePortalVacations from '@/components/employes/EmployeePortalVacations';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';

export default function MesVacances() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (employeeId && !isNaN(employeeId)) {
      loadEmployee();
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const empData = await employeesAPI.get(employeeId);
      setEmployee(empData);
    } catch (error) {
      logger.error('Error loading employee', error);
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors du chargement des informations de l\'employé',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employeeId || isNaN(employeeId)) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">ID employé invalide</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">Employé non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Vacances
          </h1>
          <p className="text-white/80 text-lg">Gérez vos demandes de congés</p>
        </div>
      </div>

      <EmployeePortalVacations employee={employee} />
    </div>
  );
}
