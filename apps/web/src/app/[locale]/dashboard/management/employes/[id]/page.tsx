'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import EmployeeDetail from '@/components/employes/EmployeeDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_deleting, setDeleting] = useState(false);

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

  const handleEdit = () => {
    if (employee) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/management/employes/${employee.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!employee || !confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      setDeleting(true);
      await employeesAPI.delete(employee.id);
      showToast({
        message: 'Employé supprimé avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/management/employes`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression');
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setDeleting(false);
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
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Management', href: `/${params?.locale || 'fr'}/dashboard/management` },
            { label: 'Employés', href: `/${params?.locale || 'fr'}/dashboard/management/employes` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/management/employes`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux employés
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
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Management', href: `/${params?.locale || 'fr'}/dashboard/management` },
            { label: 'Employés', href: `/${params?.locale || 'fr'}/dashboard/management/employes` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">L'employé demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/management/employes`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux employés
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/management/employes`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
          { label: 'Module Management', href: `/${params?.locale || 'fr'}/dashboard/management` },
          { label: 'Employés', href: `/${params?.locale || 'fr'}/dashboard/management/employes` },
          { label: `${employee.first_name} ${employee.last_name}` },
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

      <div className="mt-6">
        <EmployeeDetail
          employee={employee}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
