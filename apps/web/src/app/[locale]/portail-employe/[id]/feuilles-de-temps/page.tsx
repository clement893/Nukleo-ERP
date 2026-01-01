'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmployeePortalTimeSheets from '@/components/employes/EmployeePortalTimeSheets';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';

export default function EmployeePortalTimeSheetsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const currentUserId = user?.id ? parseInt(user.id) : null;

  useEffect(() => {
    if (!employeeId) {
      setError('ID d\'employé invalide');
      setLoading(false);
      return;
    }
    checkPermissions();
  }, [employeeId, currentUserId]);

  const checkPermissions = async () => {
    if (!employeeId || !currentUserId) {
      setError('ID d\'employé ou utilisateur invalide');
      setLoading(false);
      return;
    }

    try {
      const [status, data] = await Promise.all([
        checkMySuperAdminStatus(),
        employeesAPI.get(employeeId),
      ]);
      
      const isAdmin = status.is_superadmin === true;
      
      if (!isAdmin && data.user_id !== currentUserId) {
        setError('Vous n\'avez pas la permission d\'accéder au portail de cet employé.');
        setLoading(false);
        return;
      }
      
      setEmployee(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la vérification des permissions');
      showToast({
        message: appError.message || 'Erreur lors de la vérification des permissions',
        type: 'error',
      });
      setLoading(false);
    }
  };

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    if (employee) {
      router.push(`/${locale}/portail-employe/${employee.id}`);
    } else {
      router.push(`/${locale}/dashboard/management/employes`);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-12 text-center">
        <Loading />
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Erreur" />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux employés
          </Button>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Employé non trouvé" />
        <Alert variant="error">L'employé demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux employés
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={`Mes feuilles de temps - ${employee.first_name} ${employee.last_name}`}
        description="Gérez vos feuilles de temps"
        actions={
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <EmployeePortalTimeSheets employeeId={employee.id} />
      </div>
    </div>
  );
}
