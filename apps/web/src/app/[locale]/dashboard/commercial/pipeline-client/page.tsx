'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Loading, Badge } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui';

// Types temporaires - à remplacer par les types générés depuis l'API
interface Pipeline {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  stages: PipelineStage[];
  opportunity_count?: number;
}

interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
}

function PipelinesListContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);

  // Load pipelines (mock data pour l'instant)
  useEffect(() => {
    // TODO: Remplacer par un appel API réel
    setLoading(true);
    setTimeout(() => {
      const mockPipelines: Pipeline[] = [
        {
          id: '1',
          name: 'Pipeline Ventes',
          description: 'Pipeline principal pour les ventes',
          is_default: true,
          is_active: true,
          stages: [
            { id: 'stage-1', name: 'Prospection', description: '', color: '#EF4444', order: 0 },
            { id: 'stage-2', name: 'Qualification', description: '', color: '#F59E0B', order: 1 },
            { id: 'stage-3', name: 'Proposition', description: '', color: '#3B82F6', order: 2 },
            { id: 'stage-4', name: 'Négociation', description: '', color: '#8B5CF6', order: 3 },
            { id: 'stage-5', name: 'Fermeture', description: '', color: '#10B981', order: 4 },
          ],
          opportunity_count: 12,
        },
        {
          id: '2',
          name: 'Pipeline Partenaires',
          description: 'Pipeline pour les partenariats stratégiques',
          is_default: false,
          is_active: true,
          stages: [
            { id: 'stage-6', name: 'Contact initial', description: '', color: '#EF4444', order: 0 },
            { id: 'stage-7', name: 'Évaluation', description: '', color: '#F59E0B', order: 1 },
            { id: 'stage-8', name: 'Accord', description: '', color: '#10B981', order: 2 },
          ],
          opportunity_count: 5,
        },
      ];
      setPipelines(mockPipelines);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreatePipeline = () => {
    // TODO: Ouvrir modal de création
    showToast({
      message: 'Fonctionnalité de création à venir',
      type: 'info',
    });
  };

  const handleOpenPipeline = (pipelineId: string) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/commercial/pipeline-client/${pipelineId}`);
  };

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Pipelines"
          description="Gérez vos pipelines commerciaux et vos opportunités"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Commercial', href: '/dashboard/commercial' },
            { label: 'Pipelines' },
          ]}
        />
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Pipelines"
        description="Gérez vos pipelines commerciaux et vos opportunités"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Pipelines' },
        ]}
        actions={
          <Button onClick={handleCreatePipeline}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau pipeline
          </Button>
        }
      />

      {pipelines.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun pipeline trouvé</p>
            <Button onClick={handleCreatePipeline}>
              <Plus className="w-4 h-4 mr-2" />
              Créer votre premier pipeline
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
              onClick={() => handleOpenPipeline(pipeline.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {pipeline.name}
                    </h3>
                    {pipeline.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {pipeline.description}
                      </p>
                    )}
                  </div>
                  {pipeline.is_default && (
                    <Badge variant="default" className="ml-2">
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
                      <span className="text-xs text-muted-foreground ml-2">
                        +{pipeline.stages.length - 5}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {pipeline.stages.length} étape{pipeline.stages.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {pipeline.opportunity_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Opportunités</p>
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
            </Card>
          ))}
        </div>
      )}
    </MotionDiv>
  );
}

export default function PipelinesListPage() {
  return <PipelinesListContent />;
}
