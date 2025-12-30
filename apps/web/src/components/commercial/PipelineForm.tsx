'use client';

import { useState } from 'react';
import { Pipeline, PipelineCreate, PipelineUpdate, PipelineStageCreate } from '@/lib/api/pipelines';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';

interface PipelineFormProps {
  pipeline?: Pipeline | null;
  onSubmit: (data: PipelineCreate | PipelineUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DEFAULT_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange-600
];

export default function PipelineForm({
  pipeline,
  onSubmit,
  onCancel,
  loading = false,
}: PipelineFormProps) {
  const { showToast } = useToast();
  const [stages, setStages] = useState<PipelineStageCreate[]>(
    pipeline?.stages?.map(stage => ({
      name: stage.name,
      description: stage.description || null,
      color: stage.color || DEFAULT_COLORS[0],
      order: stage.order,
    })) || [
      { name: 'Nouveau', description: null, color: DEFAULT_COLORS[0], order: 0 },
    ]
  );
  
  const [formData, setFormData] = useState<PipelineCreate>({
    name: pipeline?.name || '',
    description: pipeline?.description || null,
    is_default: pipeline?.is_default || false,
    is_active: pipeline?.is_active !== undefined ? pipeline.is_active : true,
    stages: stages,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast({
        message: 'Le nom du pipeline est requis',
        type: 'error',
      });
      return;
    }

    if (stages.length === 0) {
      showToast({
        message: 'Veuillez ajouter au moins une étape',
        type: 'error',
      });
      return;
    }

    // Validate stages
    for (let i = 0; i < stages.length; i++) {
      if (!stages[i].name?.trim()) {
        showToast({
          message: `L'étape ${i + 1} doit avoir un nom`,
          type: 'error',
        });
        return;
      }
    }

    try {
      const submitData = {
        ...formData,
        stages: stages.map((stage, index) => ({
          ...stage,
          order: index,
        })),
      };
      await onSubmit(submitData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const addStage = () => {
    const nextColor = DEFAULT_COLORS[stages.length % DEFAULT_COLORS.length];
    setStages([
      ...stages,
      {
        name: '',
        description: null,
        color: nextColor,
        order: stages.length,
      },
    ]);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 1) {
      showToast({
        message: 'Un pipeline doit avoir au moins une étape',
        type: 'error',
      });
      return;
    }
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, updates: Partial<PipelineStageCreate>) => {
    setStages(stages.map((stage, i) => (i === index ? { ...stage, ...updates } : stage)));
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    setStages(newStages);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations générales</h3>
        
        <Input
          label="Nom du pipeline *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Pipeline Ventes"
          required
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            placeholder="Description du pipeline..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default || false}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              disabled={loading}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">Pipeline par défaut</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active !== undefined ? formData.is_active : true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={loading}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">Actif</span>
          </label>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Étapes du pipeline</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStage}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une étape
          </Button>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg bg-background space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => moveStage(index, 'up')}
                    disabled={index === 0 || loading}
                    className={clsx(
                      'p-1 rounded hover:bg-muted',
                      index === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <GripVertical className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(index, 'down')}
                    disabled={index === stages.length - 1 || loading}
                    className={clsx(
                      'p-1 rounded hover:bg-muted',
                      index === stages.length - 1 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <Input
                      label="Nom de l'étape *"
                      value={stage.name || ''}
                      onChange={(e) => updateStage(index, { name: e.target.value })}
                      placeholder="Ex: Prospection"
                      required
                      disabled={loading}
                      className="flex-1"
                    />
                    <div className="w-32">
                      <label className="block text-sm font-medium mb-2">Couleur</label>
                      <input
                        type="color"
                        value={stage.color || DEFAULT_COLORS[0]}
                        onChange={(e) => updateStage(index, { color: e.target.value })}
                        disabled={loading}
                        className="w-full h-10 rounded border border-border cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={stage.description || ''}
                      onChange={(e) => updateStage(index, { description: e.target.value || null })}
                      placeholder="Description de l'étape..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeStage(index)}
                  disabled={stages.length <= 1 || loading}
                  className="mt-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {pipeline ? 'Mettre à jour' : 'Créer le pipeline'}
        </Button>
      </div>
    </form>
  );
}
