'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Button, Loading, Badge, Modal } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, ArrowRight, Target, Layers, TrendingUp, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui';
import { pipelinesAPI, Pipeline, PipelineCreate, PipelineUpdate } from '@/lib/api/pipelines';
import PipelineForm from '@/components/commercial/PipelineForm';
import { handleApiError } from '@/lib/errors/api';

function PipelinesListContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load pipelines
  const loadPipelines = async () => {
    try {
      setLoading(true);
      const data = await pipelinesAPI.list(0, 1000);
      setPipelines(data);
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors du chargement des pipelines',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  const handleCreatePipeline = () => {
    setShowCreateModal(true);
  };

  const handleSubmitPipeline = async (pipelineData: PipelineCreate | PipelineUpdate) => {
    try {
      setCreating(true);
      const createData = pipelineData as PipelineCreate;
      if (!createData.name) {
        throw new Error('Le nom du pipeline est requis');
      }
      await pipelinesAPI.create(createData);
      await loadPipelines();
      setShowCreateModal(false);
      showToast({
        message: 'Pipeline créé avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la création du pipeline',
        type: 'error',
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleOpenPipeline = (pipelineId: string) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/pipeline-client/${pipelineId}`);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalPipelines = pipelines.length;
    const totalOpportunities = pipelines.reduce((sum, p) => sum + (p.opportunity_count || 0), 0);
    const totalStages = pipelines.reduce((sum, p) => sum + (p.stages?.length || 0), 0);
    const avgStagesPerPipeline = totalPipelines > 0 ? (totalStages / totalPipelines).toFixed(1) : '0';

    return {
      totalPipelines,
      totalOpportunities,
      totalStages,
      avgStagesPerPipeline,
    };
  }, [pipelines]);

  if (loading) {
  return (
    <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Pipelines
              </h1>
              <p className="text-white/80 text-lg">Gérez vos pipelines commerciaux</p>
            </div>
            <Button 
              className="bg-white text-primary-500 hover:bg-white/90"
              onClick={handleCreatePipeline}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau pipeline
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Layers className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalPipelines}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pipelines actifs</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Target className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalOpportunities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités totales</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <BarChart3 className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalStages}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Étapes totales</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgStagesPerPipeline}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Étapes par pipeline</div>
          </div>
        </div>

        {/* Pipelines Grid */}
        {pipelines.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aucun pipeline trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Créez votre premier pipeline pour commencer
            </p>
            <Button onClick={handleCreatePipeline}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un pipeline
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-101 hover:border-primary-500/40 transition-all duration-200 cursor-pointer group"
                onClick={() => handleOpenPipeline(pipeline.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors font-nukleo">
                      {pipeline.name}
                    </h3>
                    {pipeline.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {pipeline.description}
                      </p>
                    )}
                  </div>
                  {pipeline.is_default && (
                    <Badge className="bg-primary-500/10 text-primary-500 border border-primary-500/30 ml-2">
                      Par défaut
                    </Badge>
                  )}
                </div>

                {/* Stages preview */}
                <div className="mb-4">
                  <div className="flex items-center gap-1 flex-wrap">
                    {pipeline.stages.slice(0, 5).map((stage) => (
                      <div
                        key={stage.id}
                        className="h-2 rounded-full flex-1 min-w-[40px]"
                        style={{ backgroundColor: stage.color || '#3B82F6' }}
                        title={stage.name}
                      />
                    ))}
                    {pipeline.stages.length > 5 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                        +{pipeline.stages.length - 5}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {pipeline.stages.length} étape{pipeline.stages.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {pipeline.opportunity_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Opportunités</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPipeline(pipeline.id);
                    }}
                  >
                    Ouvrir
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </MotionDiv>

      {/* Create Pipeline Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un pipeline"
        size="lg"
      >
        <PipelineForm
          onSubmit={handleSubmitPipeline}
          onCancel={() => setShowCreateModal(false)}
          loading={creating}
        />
      </Modal>
    </PageContainer>
  );
}

export default function PipelinesListPage() {
  return <PipelinesListContent />;
}
