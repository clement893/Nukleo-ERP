'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesAPI, Company } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import CompanyDetail from '@/components/commercial/CompanyDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = params?.id ? parseInt(String(params.id)) : null;
  const locale = params?.locale as string || 'fr';

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

  const handleEdit = () => {
    if (company) {
      router.push(`/${locale}/dashboard/commercial/companies/${company.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!company) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      await companiesAPI.delete(company.id);
      showToast({
        message: 'Entreprise supprimée avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/commercial/companies`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression de l\'entreprise');
      showToast({
        message: appError.message || 'Erreur lors de la suppression de l\'entreprise',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/${locale}/dashboard/commercial/companies`);
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Chargement..."
          breadcrumbs={[
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Module Commercial', href: `/${locale}/dashboard/commercial` },
            { label: 'Entreprises', href: `/${locale}/dashboard/commercial/companies` },
            { label: 'Chargement...' },
          ]}
        />
        <div className="mt-8">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error || !company) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Module Commercial', href: `/${locale}/dashboard/commercial` },
            { label: 'Entreprises', href: `/${locale}/dashboard/commercial/companies` },
            { label: 'Erreur' },
          ]}
        />
        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={company.name}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${locale}/dashboard` },
          { label: 'Module Commercial', href: `/${locale}/dashboard/commercial` },
          { label: 'Entreprises', href: `/${locale}/dashboard/commercial/companies` },
          { label: company.name },
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
        <CompanyDetail
          company={company}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
}
