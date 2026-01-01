'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  ArrowLeft, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Trash2, 
  Plus,
  Settings,
  Calendar,
  Building2
} from 'lucide-react';
import { Badge, Button, Loading, Alert } from '@/components/ui';
import { pipelinesAPI, type Pipeline } from '@/lib/api/pipelines';
import { opportunitiesAPI, type Opportunity } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import Link from 'next/link';

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'stages'>('overview');

  const pipelineId = params?.id ? String(params.id) : null;
  const locale = params?.locale as string || 'fr';

  useEffect(() => {
    if (!pipelineId) {
      setError('ID de pipeline invalide');
      setLoading(false);
      return;
    }

    loadData();
  }, [pipelineId]);

  const loadData = async () => {
    if (!pipelineId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load pipeline
      const pipelineData = await pipelinesAPI.get(pipelineId);
      setPipeline(pipelineData);

      // Load opportunities for this pipeline
      try {
        const oppsData = await opportunitiesAPI.list(0, 100, { pipeline_id: pipelineId });
        setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      } catch (err) {
        console.error('Error loading opportunities:', err);
        setOpportunities([]);
      }
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement du pipeline');
      showToast({
        message: appError.message || 'Erreur lors du chargement du pipeline',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pipeline || !confirm('Êtes-vous sûr de vouloir supprimer ce pipeline ?')) return;

    try {
      await pipelinesAPI.delete(pipeline.id);
      showToast({
        message: 'Pipeline supprimé avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/commercial/pipeline-client`);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getOpportunityStageColor = (stage: string | null | undefined) => {
    if (!stage) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('découverte')) return 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400';
    if (lowerStage.includes('qualif')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    if (lowerStage.includes('propos')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (lowerStage.includes('négoc')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    if (lowerStage.includes('clos') || lowerStage.includes('gagn')) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  // Calculate stats
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const weightedValue = opportunities.reduce((sum, opp) => sum + ((opp.amount || 0) * (opp.probability || 0) / 100), 0);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !pipeline) {
    return (
      <PageContainer>
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Link href={`/${locale}/dashboard/commercial/pipeline-client`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux pipelines
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (!pipeline) {
    return (
      <PageContainer>
        <Alert variant="error">Pipeline non trouvé</Alert>
        <div className="mt-4">
          <Link href={`/${locale}/dashboard/commercial/pipeline-client`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux pipelines
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <Link href={`/${locale}/dashboard/commercial/pipeline-client`}>
              <button className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Retour aux pipelines</span>
              </button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {pipeline.name}
                  </h1>
                </div>
                {pipeline.description && (
                  <p className="text-white/80 text-lg">{pipeline.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {pipeline.is_default && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      Par défaut
                    </Badge>
                  )}
                  <span className="text-sm text-white/70">
                    {pipeline.stages?.length || 0} étapes
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/${locale}/dashboard/commercial/opportunites?pipeline=${pipeline.id}`}>
                  <Button className="bg-white text-[#523DC9] hover:bg-white/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle opportunité
                  </Button>
                </Link>
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Target className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {opportunities.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(weightedValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur pondérée</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Settings className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {pipeline.stages?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Étapes</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'opportunities'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Opportunités ({opportunities.length})
              </button>
              <button
                onClick={() => setActiveTab('stages')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'stages'
                    ? 'border-b-2 border-[#523DC9] text-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Étapes ({pipeline.stages?.length || 0})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Informations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nom</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.name}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.description || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre d'étapes</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.stages?.length || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pipeline par défaut</p>
                      <p className="font-medium text-gray-900 dark:text-white">{pipeline.is_default ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                </div>

                {pipeline.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{pipeline.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Opportunités ({opportunities.length})
                  </h3>
                  <Link href={`/${locale}/dashboard/commercial/opportunites?pipeline=${pipeline.id}`}>
                    <Button size="sm" className="hover-nukleo">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle opportunité
                    </Button>
                  </Link>
                </div>
                
                {opportunities.length > 0 ? (
                  <div className="space-y-3">
                    {opportunities.map((opp) => (
                      <Link key={opp.id} href={`/${locale}/dashboard/commercial/opportunites/${opp.id}`}>
                        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{opp.name}</h4>
                              {opp.company_name && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Building2 className="w-4 h-4" />
                                  <span>{opp.company_name}</span>
                                </div>
                              )}
                            </div>
                            <Badge className={getOpportunityStageColor(opp.stage_name)}>
                              {opp.stage_name || 'Non défini'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(opp.amount || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {opp.probability || 0}%
                              </span>
                            </div>
                            {opp.expected_close_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {formatDate(opp.expected_close_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune opportunité dans ce pipeline</p>
                    <Link href={`/${locale}/dashboard/commercial/opportunites?pipeline=${pipeline.id}`}>
                      <Button size="sm" className="hover-nukleo">
                        <Plus className="w-4 h-4 mr-2" />
                        Créer une opportunité
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stages' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Étapes du pipeline ({pipeline.stages?.length || 0})
                  </h3>
                </div>
                
                {pipeline.stages && pipeline.stages.length > 0 ? (
                  <div className="space-y-3">
                    {pipeline.stages
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((stage, index) => (
                        <div key={stage.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#523DC9]/10 flex items-center justify-center text-[#523DC9] font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h4>
                              {stage.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {stage.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Aucune étape définie</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {(pipeline.created_at || pipeline.updated_at) && (
          <div className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
              {pipeline.created_at && (
                <span>Créé le: {formatDate(pipeline.created_at)}</span>
              )}
              {pipeline.updated_at && (
                <span>Dernière modification: {formatDate(pipeline.updated_at)}</span>
              )}
            </div>
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
