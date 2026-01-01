'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { opportunitiesAPI, Opportunity } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { NukleoPageHeader } from '@/components/nukleo';
import { Loading, Alert, Badge, Button } from '@/components/ui';
import { ArrowLeft, Edit, FileText, Calendar, MessageSquare, Users, Link as LinkIcon, MapPin, Tag } from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import OpportunityContacts from '@/components/commercial/OpportunityContacts';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleEdit = () => {
    if (opportunity) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/commercial/opportunites/${opportunity.id}/edit`);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      <NukleoPageHeader
        title={opportunity.name}
        description={`Opportunité commerciale - ${opportunity.stage_name || 'Non défini'}`}
        compact
      />
      
      <div className="flex gap-2 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button onClick={handleEdit} className="hover-nukleo">
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status and Pipeline */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Statut</h3>
                <Badge className="badge-nukleo">
                  {opportunity.stage_name || 'Non défini'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline</p>
                <p className="font-medium">{opportunity.pipeline_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {opportunity.description && (
            <div className="glass-card rounded-xl border border-border p-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
              </div>
            </div>
          )}

          {/* Tasks - Placeholder */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Liste des tâches
              </h3>
              <p className="text-muted-foreground text-sm">Les tâches seront affichées ici une fois l'intégration avec le module de tâches complétée.</p>
            </div>
          </div>

          {/* Comments & Notes */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Commentaires & Notes
              </h3>
              {opportunity.notes ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Aucune note pour le moment.</p>
              )}
            </div>
          </div>

          {/* Discussions - Placeholder */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Discussions
              </h3>
              <p className="text-muted-foreground text-sm">Les discussions seront affichées ici une fois l'intégration avec le module de commentaires complétée.</p>
            </div>
          </div>

          {/* Documents - Placeholder */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Liens vers les documents (soumission)
              </h3>
              {opportunity.service_offer_link ? (
                <a
                  href={opportunity.service_offer_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  {opportunity.service_offer_link}
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun lien vers l'offre de service.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Key Information */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations clés</h3>
              
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="font-medium text-lg">{formatCurrency(opportunity.amount)}</p>
              </div>

              {opportunity.probability !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Probabilité</p>
                  <p className="font-medium">{opportunity.probability}%</p>
                </div>
              )}

              {opportunity.expected_close_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Date de fermeture prévue</p>
                  <p className="font-medium">{formatDate(opportunity.expected_close_date)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dates
              </h3>
              
              <div>
                <p className="text-sm text-muted-foreground">Date d'ouverture</p>
                <p className="font-medium">{formatDate(opportunity.opened_at)}</p>
              </div>

              {opportunity.closed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Date de fermeture</p>
                  <p className="font-medium">{formatDate(opportunity.closed_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Company & Contacts */}
          <div className="glass-card rounded-xl border border-border p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Entreprise & Contacts
              </h3>
              
              {opportunity.company_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{opportunity.company_name}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Contacts liés</p>
                <OpportunityContacts
                  opportunity={opportunity}
                  onUpdate={loadOpportunity}
                />
              </div>
            </div>
          </div>

          {/* Segment & Region */}
          {(opportunity.segment || opportunity.region) && (
            <div className="glass-card rounded-xl border border-border p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Segment & Région
                </h3>
                
                {opportunity.segment && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Segment
                    </p>
                    <p className="font-medium">{opportunity.segment}</p>
                  </div>
                )}

                {opportunity.region && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Région
                    </p>
                    <p className="font-medium">{opportunity.region}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned To */}
          {opportunity.assigned_to_name && (
            <div className="glass-card rounded-xl border border-border p-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Assigné à</h3>
                <p className="font-medium">{opportunity.assigned_to_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  );
}
