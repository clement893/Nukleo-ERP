'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee, EmployeeCreate, EmployeeUpdate } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import EmployeeForm from '@/components/employes/EmployeeForm';
import { Loading, Alert, Card } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function EmployeeEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const locale = params?.locale as string || 'fr';

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

  const handleUpdate = async (data: EmployeeCreate | EmployeeUpdate) => {
    if (!employeeId) return;

    try {
      setSaving(true);
      setError(null);
      await employeesAPI.update(employeeId, data as EmployeeUpdate);
      showToast({
        message: 'Employé modifié avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/management/employes/${employeeId}`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification de l\'employé');
      showToast({
        message: appError.message || 'Erreur lors de la modification de l\'employé',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (employeeId) {
      router.push(`/${locale}/dashboard/management/employes/${employeeId}`);
    } else {
      router.push(`/${locale}/dashboard/management/employes`);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !employee) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Module Management', href: `/${locale}/dashboard/management` },
            { label: 'Employés', href: `/${locale}/dashboard/management/employes` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <PageHeader
          title="Employé non trouvé"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Module Management', href: `/${locale}/dashboard/management` },
            { label: 'Employés', href: `/${locale}/dashboard/management/employes` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">L'employé demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux employés
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Modifier ${employee.first_name} ${employee.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${locale}/dashboard` },
          { label: 'Module Management', href: `/${locale}/dashboard/management` },
          { label: 'Employés', href: `/${locale}/dashboard/management/employes` },
          { label: employee.first_name + ' ' + employee.last_name, href: `/${locale}/dashboard/management/employes/${employee.id}` },
          { label: 'Modification' },
        ]}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <EmployeeForm
              employee={employee}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              loading={saving}
            />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
