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
  Edit, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Users, 
  Tag,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  Building2,
  User
} from 'lucide-react';
import Link from 'next/link';

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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Bouton retour */}
          <Link href={`/${locale}/dashboard/commercial/opportunites`} className="inline-block">
            <Button variant="ghost" size="sm" className="hover:glass-card">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux opportunités
            </Button>
          </Link>

          {/* Header Card */}
          <Card className="glass-card p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-nukleo-gradient rounded-2xl opacity-20 blur-lg" />
                <div className="relative w-24 h-24 rounded-2xl bg-nukleo-gradient flex items-center justify-center shadow-xl">
                  <Target className="w-12 h-12 text-white" />
                </div>
              </div>
              
              {/* Infos */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-primary-500 mb-3 font-nukleo">
                  {opportunity.name}
                </h1>
                {opportunity.description && (
                  <p className="text-xl text-foreground/80 mb-4">{opportunity.description}</p>
                )}
                
                {/* Stage Badge */}
                <div className="mb-4">
                  <Badge className={`${getStageColor(opportunity.stage_name)} px-4 py-1.5 text-sm font-medium border`}>
                    {opportunity.stage_name || 'Non défini'}
                  </Badge>
                </div>
                
                {/* Company info */}
                {opportunity.company_name && (
                  <div className="flex items-center gap-2 text-foreground/70 mb-4">
                    <Building2 className="w-5 h-5" />
                    <span className="text-lg">{opportunity.company_name}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="mb-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                    Informations
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Montant</p>
                        <p className="text-foreground font-semibold">{formatCurrency(opportunity.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Probabilité</p>
                        <p className="text-foreground font-semibold">{opportunity.probability ? `${opportunity.probability}%` : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de clôture prévue</p>
                        <p className="text-foreground">{formatDate(opportunity.expected_close_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Entreprise</p>
                        <p className="text-foreground">{opportunity.company_name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Étape</p>
                        <Badge className={getStageColor(opportunity.stage_name)}>
                          {opportunity.stage_name || 'Non défini'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Contacts */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                    Contacts ({opportunity.contact_names?.length || 0})
                  </h3>
                  {opportunity.contact_names && opportunity.contact_names.length > 0 ? (
                    <div className="space-y-3">
                      {opportunity.contact_names.map((name, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun contact associé</p>
                    </div>
                  )}
                </Card>

                {/* Description */}
                {opportunity.description && (
                  <Card className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                      Description
                    </h3>
                    <p className="text-foreground/80 leading-relaxed">{opportunity.description}</p>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Activités récentes
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité enregistrée pour cette opportunité.</p>
                </div>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Documents
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun document associé à cette opportunité.</p>
                </div>
              </Card>
            )}

            {activeTab === 'notes' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Notes
                </h3>
                {opportunity.notes ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-foreground whitespace-pre-wrap">{opportunity.notes}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Les notes peuvent être modifiées depuis le formulaire d'édition de l'opportunité.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune note pour cette opportunité.</p>
                    <p className="text-sm mt-2">Ajoutez des notes depuis le formulaire d'édition.</p>
                  </div>
                )}
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

      {/* Quick Action - Edit Button (Floating) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleEdit}
          className="w-14 h-14 bg-gradient-to-br from-[#523DC9] to-[#5F2B75] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Modifier l'opportunité"
          title="Modifier l'opportunité"
        >
          <Edit className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    </PageContainer>
  );
}
