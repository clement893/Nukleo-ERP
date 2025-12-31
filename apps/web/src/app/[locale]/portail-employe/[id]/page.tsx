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
import EmployeePortalTabs from '@/components/employes/EmployeePortalTabs';

export default function EmployeePortalPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (!employeeId) {
      setError('ID d\'employé invalide');
      setLoading(false);
      return;
    }

    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await employeesAPI.get(employeeId);
      setEmployee(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de l\'employé');
      showToast({
        message: appError.message || 'Erreur lors du chargement de l\'employé',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/management/employes`);
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
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Management', href: `/${params?.locale || 'fr'}/dashboard/management` },
            { label: 'Employés', href: `/${params?.locale || 'fr'}/dashboard/management/employes` },
            { label: 'Portail' },
          ]}
        />
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
        <PageHeader
          title="Employé non trouvé"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Management', href: `/${params?.locale || 'fr'}/dashboard/management` },
            { label: 'Employés', href: `/${params?.locale || 'fr'}/dashboard/management/employes` },
            { label: 'Portail' },
          ]}
        />
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
    <div className="w-full">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={`Portail de ${employee.first_name} ${employee.last_name}`}
          description="Accédez à toutes les informations et outils de l'employé"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Management', href: `/${params?.locale || 'fr'}/dashboard/management` },
            { label: 'Employés', href: `/${params?.locale || 'fr'}/dashboard/management/employes` },
            { label: `${employee.first_name} ${employee.last_name}`, href: `/${params?.locale || 'fr'}/dashboard/management/employes/${employee.id}` },
            { label: 'Portail' },
          ]}
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
      </div>

      <div className="w-full">
        <EmployeePortalTabs employee={employee} />
      </div>
    </div>
  );
}
