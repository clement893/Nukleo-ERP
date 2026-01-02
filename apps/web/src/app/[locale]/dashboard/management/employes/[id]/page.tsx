'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { employeesAPI } from '@/lib/api/employees';
import type { Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import EmployeeDetail from '@/components/employes/EmployeeDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft, Shield, UserCircle, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import Card from '@/components/ui/Card';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import EmployeePortalPermissionsEditor from '@/components/employes/EmployeePortalPermissionsEditor';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');

  const employeeId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (!employeeId) {
      setError('ID d\'employé invalide');
      setLoading(false);
      setCheckingAdmin(false);
      return;
    }

    checkAdminStatus();
  }, [employeeId, user]);

  const checkAdminStatus = async () => {
    try {
      setCheckingAdmin(true);
      const status = await checkMySuperAdminStatus();
      setIsAdmin(status.is_superadmin === true);
      await loadEmployee();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la vérification des permissions');
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

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
      router.push(`/dashboard/management/employes/${employee.id}/edit`);
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
      router.push(`/dashboard/management/employes`);
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

  if (loading || checkingAdmin) {
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
            { label: 'Dashboard', href: `/dashboard` },
            { label: 'Module Management', href: `/dashboard/management` },
            { label: 'Employés', href: `/dashboard/management/employes` },
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
            { label: 'Dashboard', href: `/dashboard` },
            { label: 'Module Management', href: `/dashboard/management` },
            { label: 'Employés', href: `/dashboard/management/employes` },
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
    router.push(`/dashboard/management/employes`);
  };

  const handleOpenPortal = () => {
    if (employee) {
      router.push(`/portail-employe/${employee.id}`);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPortal}
              className="text-xs px-3 py-1.5 h-auto"
              title="Accéder au portail employé"
            >
              <UserCircle className="w-3.5 h-3.5 mr-1.5" />
              Portail
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: `/dashboard` },
          { label: 'Module Management', href: `/dashboard/management` },
          { label: 'Employés', href: `/dashboard/management/employes` },
          { label: `${employee.first_name} ${employee.last_name}` },
        ]}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        {isAdmin ? (
          <Card>
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'details' | 'permissions')}>
              <TabList className="border-b border-border px-4 sm:px-6 lg:px-8">
                <Tab value="details">
                  Détails
                </Tab>
                <Tab value="permissions">
                  <Shield className="w-4 h-4 mr-2 inline" />
                  Permissions du portail
                </Tab>
              </TabList>

              <TabPanels className="px-4 sm:px-6 lg:px-8 py-6">
                <TabPanel value="details">
                  <EmployeeDetail
                    employee={employee}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPhotoUpdate={(updatedEmployee) => {
                      setEmployee(updatedEmployee);
                    }}
                  />
                </TabPanel>
                <TabPanel value="permissions">
                  <EmployeePortalPermissionsEditor
                    employeeId={employee.id}
                    onUpdate={() => {
                      // Optionnel: recharger les données si nécessaire
                    }}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        ) : (
          <div className="mb-4">
            <Alert variant="warning">
              Vous devez être administrateur pour accéder à cette page.
            </Alert>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
