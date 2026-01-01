'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, ArrowRight, MoreVertical, Target, TrendingUp } from 'lucide-react';
import { Button, Input, Modal, Textarea, Badge } from '@/components/ui';

// Mock data
const mockPipelines = [
  {
    id: '1',
    name: 'Pipeline Ventes B2B',
    description: 'Pipeline principal pour les ventes aux entreprises',
    is_default: true,
    stages: [
      { id: '1', name: 'Lead', color: '#6B7280', order: 1 },
      { id: '2', name: 'Qualifié', color: '#3B82F6', order: 2 },
      { id: '3', name: 'Proposition', color: '#F59E0B', order: 3 },
      { id: '4', name: 'Négociation', color: '#F97316', order: 4 },
      { id: '5', name: 'Gagné', color: '#10B981', order: 5 },
    ],
    opportunity_count: 24,
    total_value: 450000,
    created_at: '2024-01-10',
  },
  {
    id: '2',
    name: 'Pipeline Partenariats',
    description: 'Gestion des opportunités de partenariat stratégique',
    is_default: false,
    stages: [
      { id: '1', name: 'Contact initial', color: '#6B7280', order: 1 },
      { id: '2', name: 'Discussion', color: '#3B82F6', order: 2 },
      { id: '3', name: 'Proposition', color: '#F59E0B', order: 3 },
      { id: '4', name: 'Accord', color: '#10B981', order: 4 },
    ],
    opportunity_count: 8,
    total_value: 180000,
    created_at: '2024-01-15',
  },
  {
    id: '3',
    name: 'Pipeline Consulting',
    description: 'Opportunités de missions de consulting',
    is_default: false,
    stages: [
      { id: '1', name: 'Demande', color: '#6B7280', order: 1 },
      { id: '2', name: 'Analyse', color: '#3B82F6', order: 2 },
      { id: '3', name: 'Devis', color: '#F59E0B', order: 3 },
      { id: '4', name: 'Validation', color: '#F97316', order: 4 },
      { id: '5', name: 'Démarrage', color: '#10B981', order: 5 },
    ],
    opportunity_count: 12,
    total_value: 320000,
    created_at: '2023-12-20',
  },
];

export default function PipelinesDemoPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pipelineForm, setPipelineForm] = useState({
    name: '',
    description: '',
    is_default: false,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalStats = {
    pipelines: mockPipelines.length,
    opportunities: mockPipelines.reduce((sum, p) => sum + p.opportunity_count, 0),
    totalValue: mockPipelines.reduce((sum, p) => sum + p.total_value, 0),
  };

  const handleCreatePipeline = () => {
    console.log('Creating pipeline:', pipelineForm);
    setShowCreateModal(false);
    setPipelineForm({ name: '', description: '', is_default: false });
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Hero Header with Aurora Borealis Gradient */}
      <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-6 pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
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
          <Button className="bg-white text-[#523DC9] hover:bg-white/90" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau pipeline
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
              <Target className="w-6 h-6 text-[#523DC9]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalStats.pipelines}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pipelines actifs</div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
              <TrendingUp className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalStats.opportunities}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités totales</div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
              <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatCurrency(totalStats.totalValue)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
        </div>
      </div>

      {/* Pipelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPipelines.map((pipeline) => (
          <div
            key={pipeline.id}
            className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
            onClick={() => router.push(`/dashboard/pipeline-client-demo`)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {pipeline.name}
                </h3>
                {pipeline.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {pipeline.description}
                  </p>
                )}
                {pipeline.is_default && (
                  <Badge className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30">
                    Par défaut
                  </Badge>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Stages Preview */}
            <div className="mb-4">
              <div className="flex items-center gap-1">
                {pipeline.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="h-2 rounded-full flex-1"
                    style={{ backgroundColor: stage.color }}
                    title={stage.name}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {pipeline.stages.length} étape{pipeline.stages.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {pipeline.opportunity_count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Opportunités</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(pipeline.total_value)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Valeur</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/pipeline-client-demo`);
                }}
              >
                Ouvrir
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Création Pipeline */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title=""
        size="md"
        footer={null}
      >
        <div className="p-6">
          {/* Header Modal */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Plus className="w-6 h-6 text-[#523DC9]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Nouveau pipeline
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Créez un nouveau pipeline de vente</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom du pipeline <span className="text-red-500">*</span>
              </label>
              <Input
                value={pipelineForm.name}
                onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                placeholder="Ex: Pipeline Ventes B2B"
                fullWidth
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <Textarea
                value={pipelineForm.description}
                onChange={(e) => setPipelineForm({ ...pipelineForm, description: e.target.value })}
                placeholder="Décrivez l'objectif de ce pipeline..."
                rows={3}
                fullWidth
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={pipelineForm.is_default}
                onChange={(e) => setPipelineForm({ ...pipelineForm, is_default: e.target.checked })}
                className="w-4 h-4 text-[#523DC9] border-gray-300 rounded focus:ring-[#523DC9]"
              />
              <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">
                Définir comme pipeline par défaut
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreatePipeline} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Créer le pipeline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
