'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { opportunitiesAPI, Opportunity } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { Loading, Alert, Badge, Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Tag,
  DollarSign,
  TrendingUp,
  Target,
  Building2,
  User
} from 'lucide-react';
import Link from 'next/link';
import { OpportunityNotesEditor } from '@/components/commercial/OpportunityNotesEditor';
import { OpportunityDocuments } from '@/components/commercial/OpportunityDocuments';
import { OpportunityActivities } from '@/components/commercial/OpportunityActivities';
import { OpportunityOverviewEditor } from '@/components/commercial/OpportunityOverviewEditor';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'documents' | 'notes'>('overview');

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

  const getStageColor = (stage: string | null | undefined) => {
    if (!stage) return 'bg-gray-100 text-gray-700 border-gray-300';
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('qualif')) return 'bg-primary-100 text-primary-700 border-primary-300';
    if (lowerStage.includes('propos') || lowerStage.includes('demo')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (lowerStage.includes('négoc')) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (lowerStage.includes('clos') || lowerStage.includes('gagn')) return 'bg-green-100 text-green-700 border-green-300';
    if (lowerStage.includes('perdu')) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Stats calculation
  const stats = opportunity ? [
    { icon: DollarSign, label: 'Montant', value: formatCurrency(opportunity.amount), color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: TrendingUp, label: 'Probabilité', value: opportunity.probability ? `${opportunity.probability}%` : '-', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Target, label: 'Valeur pondérée', value: opportunity.amount && opportunity.probability ? formatCurrency(opportunity.amount * opportunity.probability / 100) : '-', color: 'text-primary-600', bgColor: 'bg-primary-100' },
    { icon: Calendar, label: 'Clôture prévue', value: formatDate(opportunity.expected_close_date), color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ] : [];

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
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/commercial/opportunites`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux opportunités
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!opportunity) {
    return (
      <PageContainer>
        <Alert variant="error">Opportunité non trouvée</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/commercial/opportunites`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux opportunités
          </Button>
        </div>
      </PageContainer>
    );
  }

  const locale = params?.locale as string || 'fr';

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-6 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Bouton retour - juste une flèche sans background */}
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href={`/${locale}/dashboard/commercial/opportunites`}
              className="inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            {/* Header compact */}
            <div className="flex-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary-500 font-nukleo">
                {opportunity.name}
              </h1>
              <Badge className={`${getStageColor(opportunity.stage_name)} px-2 py-0.5 text-xs font-medium border`}>
                {opportunity.stage_name || 'Non défini'}
              </Badge>
              {opportunity.company_name && (
                <div className="flex items-center gap-1.5 text-foreground/60 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{opportunity.company_name}</span>
                </div>
              )}
              {opportunity.status && (
                <Badge variant="outline" className="text-xs">
                  {opportunity.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats Cards - plus compactes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card p-3 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-lg font-bold text-foreground truncate">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex gap-2 border-b border-border">
              {[
                { key: 'overview', label: 'Vue d\'ensemble' },
                { key: 'activities', label: 'Activités' },
                { key: 'documents', label: 'Documents' },
                { key: 'notes', label: 'Notes' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-primary-500'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nukleo-gradient" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <OpportunityOverviewEditor
                opportunity={opportunity}
                opportunityId={opportunity.id}
                onUpdate={(updatedOpportunity) => {
                  setOpportunity(updatedOpportunity);
                  loadOpportunity();
                  showToast({
                    message: 'Opportunité mise à jour avec succès',
                    type: 'success',
                  });
                }}
                onError={(error) => {
                  showToast({
                    message: error.message || 'Erreur lors de la mise à jour',
                    type: 'error',
                  });
                }}
              />
            )}

            {activeTab === 'activities' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Activités
                </h3>
                <OpportunityActivities
                  opportunityId={opportunity.id}
                  opportunity={opportunity}
                />
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Documents
                </h3>
                <OpportunityDocuments
                  opportunityId={opportunity.id}
                  opportunity={opportunity}
                  onUpdate={loadOpportunity}
                />
              </Card>
            )}

            {activeTab === 'notes' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Notes
                </h3>
                <OpportunityNotesEditor
                  opportunityId={opportunity.id}
                  initialNotes={opportunity.notes}
                  updatedAt={opportunity.updated_at}
                  onSaveSuccess={() => {
                    // Rafraîchir les données de l'opportunité
                    loadOpportunity();
                    showToast({
                      message: 'Notes enregistrées avec succès',
                      type: 'success',
                    });
                  }}
                  onSaveError={(error) => {
                    showToast({
                      message: error.message || 'Erreur lors de la sauvegarde des notes',
                      type: 'error',
                    });
                  }}
                />
              </Card>
            )}
          </div>

          {/* Metadata */}
          <Card className="glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2">
                {opportunity.created_at && (
                  <span>Créé le: {new Date(opportunity.created_at).toLocaleDateString('fr-FR')}</span>
                )}
                {opportunity.updated_at && (
                  <span>Dernière modification: {new Date(opportunity.updated_at).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
              {opportunity.assigned_to_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Assigné à: {opportunity.assigned_to_name}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

    </PageContainer>
  );
}
