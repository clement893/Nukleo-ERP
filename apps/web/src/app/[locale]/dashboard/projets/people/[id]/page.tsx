'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employeesAPI } from '@/lib/api/employees';
import { projectsAPI } from '@/lib/api/projects';
import { contactsAPI } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import PeopleDetail from '@/components/projects/PeopleDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';

export default function PeopleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [_deleting, setDeleting] = useState(false);

  const employeeId = params?.id ? parseInt(String(params.id)) : null;

  // Fetch employee
  const { data: employee, isLoading: loadingEmployee, error: employeeError } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeId ? employeesAPI.get(employeeId) : null,
    enabled: !!employeeId,
  });

  // Fetch all projects
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list(0, 1000),
    enabled: !!employeeId,
  });

  // Filter projects by employee responsable_id
  const projects = useMemo(() => {
    if (!employeeId || !allProjects) return [];
    return allProjects.filter(p => p.responsable_id === employeeId);
  }, [allProjects, employeeId]);

  // Fetch contacts linked to this employee (via user_id)
  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.list(0, 1000),
    enabled: !!employee?.user_id,
  });

  // Filter contacts by employee user_id
  const contacts = useMemo(() => {
    if (!employee?.user_id || !allContacts) return [];
    return allContacts.filter(c => c.employee_id === employee.user_id);
  }, [allContacts, employee?.user_id]);

  const loading = loadingEmployee;
  const error = employeeError ? handleApiError(employeeError).message : null;

  const handleEdit = () => {
    if (employee) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/projets/people/${employee.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!employee || !confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
      return;
    }

    try {
      setDeleting(true);
      await employeesAPI.delete(employee.id);
      showToast({
        message: 'Personne supprimée avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/projets/people`);
    } catch (err) {
      const appError = handleApiError(err);
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
            { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
            { label: 'People', href: `/${params?.locale || 'fr'}/dashboard/projets/people` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/projets/people`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à People
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer>
        <PageHeader
          title="Personne non trouvée"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
            { label: 'People', href: `/${params?.locale || 'fr'}/dashboard/projets/people` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">La personne demandée n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/projets/people`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à People
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/projets/people`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
          { label: 'Modules Opérations', href: `/${params?.locale || 'fr'}/dashboard/projets` },
          { label: 'People', href: `/${params?.locale || 'fr'}/dashboard/projets/people` },
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
        <PeopleDetail
          employee={employee}
          projects={projects}
          contacts={contacts as unknown as Record<string, unknown>[]}
          portalUrl={employee.user_id ? `/erp/dashboard` : null} // TODO: Get actual portal URL from backend
          notes={null} // TODO: Add notes field to Employee model
          comments={null} // TODO: Add comments field to Employee model
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
