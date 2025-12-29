'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { opportunitiesAPI, Opportunity, OpportunityUpdate } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, Card } from '@/components/ui';
import OpportunityForm from '@/components/commercial/OpportunityForm';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import MotionDiv from '@/components/motion/MotionDiv';

export default function OpportunityEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opportunityId = params?.id ? String(params.id) : null;

  useEffect(() => {
    if (!opportunityId) {
      setError('ID d\'opportunité invalide');
      setLoading(false);
      return;
    }

    loadOpportunity();
  }, [opportunityId]);

  const loadOpportunity = async () => {
    if (!opportunityId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await opportunitiesAPI.get(opportunityId);
      setOpportunity(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de l\'opportunité');
      showToast({
        message: appError.message || 'Erreur lors du chargement de l\'opportunité',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: OpportunityUpdate) => {
    if (!opportunityId) return;

    try {
      setSaving(true);
      setError(null);
      await opportunitiesAPI.update(opportunityId, data);
      showToast({
        message: 'Opportunité modifiée avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/commercial/opportunites/${opportunityId}`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification');
      showToast({
        message: appError.message || 'Erreur lors de la modification',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/commercial/opportunites/${opportunityId}`);
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

  if (error && !opportunity) {
    return (
      <PageContainer>
        <Alert variant="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!opportunity) {
    return (
      <PageContainer>
        <Alert variant="error">Opportunité non trouvée</Alert>
      </PageContainer>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title={`Modifier: ${opportunity.name}`}
        description="Modifiez les informations de l'opportunité"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Opportunités', href: '/dashboard/commercial/opportunites' },
          { label: opportunity.name, href: `/dashboard/commercial/opportunites/${opportunity.id}` },
          { label: 'Modifier' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        }
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <Card>
        <div className="p-6">
          <OpportunityForm
            opportunity={opportunity}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={saving}
          />
        </div>
      </Card>
    </MotionDiv>
  );
}
