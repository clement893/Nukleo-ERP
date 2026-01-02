'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesAPI, Company } from '@/lib/api/companies';
import { useUpdateCompany, useInfiniteCompanies } from '@/lib/query/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import CompanyForm from '@/components/commercial/CompanyForm';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useMemo } from 'react';

export default function CompanyEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const updateCompanyMutation = useUpdateCompany();
  
  // Load companies for parent company selection
  const { data: companiesData } = useInfiniteCompanies(1000);
  const parentCompanies = useMemo(() => 
    companiesData?.pages.flat().map(c => ({ id: c.id, name: c.name })) || [],
    [companiesData]
  );

  const companyId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (!companyId) {
      setError('ID d\'entreprise invalide');
      setLoading(false);
      return;
    }

    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await companiesAPI.get(companyId);
      setCompany(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de l\'entreprise');
      showToast({
        message: appError.message || 'Erreur lors du chargement de l\'entreprise',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!company) return;

    try {
      setError(null);
      await updateCompanyMutation.mutateAsync({
        id: company.id,
        data,
      });
      
      showToast({
        message: 'Entreprise mise à jour avec succès',
        type: 'success',
      });
      
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/reseau/entreprises/${company.id}`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la mise à jour');
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour',
        type: 'error',
      });
      throw err;
    }
  };

  const handleCancel = () => {
    if (company) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/reseau/entreprises/${company.id}`);
    } else {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/reseau/entreprises`);
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

  if (error && !company) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          description={error}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Réseau', href: '/dashboard/reseau' },
            { label: 'Entreprises', href: '/dashboard/reseau/entreprises' },
            { label: 'Modification' },
          ]}
          actions={
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour
            </Button>
          }
        />
        <Alert variant="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Modifier ${company.name}`}
        description="Modifiez les informations de l'entreprise"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Entreprises', href: '/dashboard/reseau/entreprises' },
          { label: company.name, href: `/dashboard/reseau/entreprises/${company.id}` },
          { label: 'Modification' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Annuler
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mt-6">
        <CompanyForm
          company={company}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={updateCompanyMutation.isPending}
          parentCompanies={parentCompanies}
        />
      </div>
    </PageContainer>
  );
}
