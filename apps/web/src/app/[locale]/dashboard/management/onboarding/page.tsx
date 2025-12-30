'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Button, Input, Textarea, Alert, Loading } from '@/components/ui';
import { useToast } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  FileText, 
  Link as LinkIcon, 
  Video, 
  Save,
  X,
  Edit2
} from 'lucide-react';

// Types
type ResourceType = 'document' | 'link' | 'video';

interface OnboardingResource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  description?: string;
}

interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  resources: OnboardingResource[];
}

interface OnboardingTemplate {
  id?: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
}

function OnboardingContent() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<OnboardingTemplate>({
    name: '',
    description: '',
    steps: [],
  });
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Add new step
  const addStep = () => {
    const newStep: OnboardingStep = {
      id: generateId(),
      order: template.steps.length + 1,
      title: '',
      description: '',
      resources: [],
    };
    setTemplate({
      ...template,
      steps: [...template.steps, newStep],
    });
    setEditingStepId(newStep.id);
  };

  // Update step
  const updateStep = (stepId: string, updates: Partial<OnboardingStep>) => {
    setTemplate({
      ...template,
      steps: template.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    });
  };

  // Delete step
  const deleteStep = (stepId: string) => {
    const updatedSteps = template.steps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));
    setTemplate({
      ...template,
      steps: updatedSteps,
    });
    if (editingStepId === stepId) {
      setEditingStepId(null);
    }
  };

  // Add resource to step
  const addResource = (stepId: string, type: ResourceType) => {
    const newResource: OnboardingResource = {
      id: generateId(),
      type,
      title: '',
      url: '',
      description: '',
    };
    updateStep(stepId, {
      resources: [...template.steps.find((s) => s.id === stepId)?.resources || [], newResource],
    });
    setEditingResourceId(newResource.id);
  };

  // Update resource
  const updateResource = (stepId: string, resourceId: string, updates: Partial<OnboardingResource>) => {
    const step = template.steps.find((s) => s.id === stepId);
    if (!step) return;

    const updatedResources = step.resources.map((resource) =>
      resource.id === resourceId ? { ...resource, ...updates } : resource
    );
    updateStep(stepId, { resources: updatedResources });
  };

  // Delete resource
  const deleteResource = (stepId: string, resourceId: string) => {
    const step = template.steps.find((s) => s.id === stepId);
    if (!step) return;

    updateStep(stepId, {
      resources: step.resources.filter((r) => r.id !== resourceId),
    });
    if (editingResourceId === resourceId) {
      setEditingResourceId(null);
    }
  };

  // Move step up/down
  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = template.steps.findIndex((s) => s.id === stepId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === template.steps.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSteps = [...template.steps];
    [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];
    
    // Update order
    newSteps.forEach((step, index) => {
      step.order = index + 1;
    });

    setTemplate({ ...template, steps: newSteps });
  };

  // Save template
  const handleSave = async () => {
    // Validation
    if (!template.name.trim()) {
      setError('Le nom de l\'onboarding est requis');
      showToast({
        message: 'Le nom de l\'onboarding est requis',
        type: 'error',
      });
      return;
    }

    if (template.steps.length === 0) {
      setError('Au moins une étape est requise');
      showToast({
        message: 'Au moins une étape est requise',
        type: 'error',
      });
      return;
    }

    // Validate steps
    for (const step of template.steps) {
      if (!step.title.trim()) {
        setError(`L'étape ${step.order} doit avoir un titre`);
        showToast({
          message: `L'étape ${step.order} doit avoir un titre`,
          type: 'error',
        });
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement API call to save onboarding template
      // await onboardingAPI.createTemplate(template);
      
      showToast({
        message: 'Onboarding créé avec succès',
        type: 'success',
      });
      
      // Reset form
      setTemplate({
        name: '',
        description: '',
        steps: [],
      });
      setEditingStepId(null);
      setEditingResourceId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'link':
        return <LinkIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
    }
  };

  const getResourceTypeLabel = (type: ResourceType) => {
    switch (type) {
      case 'document':
        return 'Document';
      case 'link':
        return 'Lien';
      case 'video':
        return 'Vidéo';
    }
  };

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Créer un Onboarding Personnalisé"
        description="Créez des parcours d'onboarding étape par étape pour vos employés avec des documents, liens et vidéos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Onboarding' },
        ]}
      />

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Main Form */}
      <Card title="Informations générales">
        <div className="space-y-4">
          <Input
            label="Nom de l'onboarding"
            placeholder="Ex: Onboarding Développeur"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            required
            fullWidth
          />

          <Textarea
            label="Description"
            placeholder="Décrivez le parcours d'onboarding..."
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            rows={3}
            fullWidth
          />
        </div>
      </Card>

      {/* Steps Section */}
      <Card 
        title={`Étapes (${template.steps.length})`}
        footer={
          <Button
            variant="primary"
            onClick={addStep}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Ajouter une étape
          </Button>
        }
      >
        {template.steps.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>Aucune étape créée. Cliquez sur "Ajouter une étape" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {template.steps.map((step, index) => (
              <Card
                key={step.id}
                className="border-2"
                title={
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-5 h-5 cursor-move" />
                      <span className="font-semibold">Étape {step.order}</span>
                    </div>
                    {editingStepId === step.id ? (
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(step.id, { title: e.target.value })}
                        placeholder="Titre de l'étape"
                        className="flex-1"
                        onBlur={() => {
                          if (step.title.trim()) {
                            setEditingStepId(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="flex-1 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
                        onClick={() => setEditingStepId(step.id)}
                      >
                        {step.title || 'Titre de l\'étape (cliquez pour modifier)'}
                      </span>
                    )}
                  </div>
                }
                footer={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === template.steps.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteStep(step.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Supprimer
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  {/* Step Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description de l'étape
                    </label>
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateStep(step.id, { description: e.target.value })}
                      placeholder="Décrivez ce que l'employé doit faire dans cette étape..."
                      rows={3}
                      fullWidth
                    />
                  </div>

                  {/* Resources Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium">
                        Ressources ({step.resources.length})
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addResource(step.id, 'document')}
                          leftIcon={<FileText className="w-4 h-4" />}
                        >
                          Document
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addResource(step.id, 'link')}
                          leftIcon={<LinkIcon className="w-4 h-4" />}
                        >
                          Lien
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addResource(step.id, 'video')}
                          leftIcon={<Video className="w-4 h-4" />}
                        >
                          Vidéo
                        </Button>
                      </div>
                    </div>

                    {step.resources.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                        Aucune ressource. Ajoutez des documents, liens ou vidéos.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {step.resources.map((resource) => (
                          <Card key={resource.id} className="border">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getResourceIcon(resource.type)}
                                  <span className="text-sm font-medium">
                                    {getResourceTypeLabel(resource.type)}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteResource(step.id, resource.id)}
                                  leftIcon={<Trash2 className="w-4 h-4" />}
                                >
                                  Supprimer
                                </Button>
                              </div>

                              <Input
                                label="Titre"
                                value={resource.title}
                                onChange={(e) =>
                                  updateResource(step.id, resource.id, { title: e.target.value })
                                }
                                placeholder={`Titre du ${getResourceTypeLabel(resource.type).toLowerCase()}`}
                                fullWidth
                              />

                              <Input
                                label={resource.type === 'link' ? 'URL' : resource.type === 'video' ? 'URL de la vidéo' : 'URL du document'}
                                type="url"
                                value={resource.url}
                                onChange={(e) =>
                                  updateResource(step.id, resource.id, { url: e.target.value })
                                }
                                placeholder={
                                  resource.type === 'link'
                                    ? 'https://example.com'
                                    : resource.type === 'video'
                                    ? 'https://youtube.com/watch?v=...'
                                    : 'https://example.com/document.pdf'
                                }
                                fullWidth
                              />

                              <Textarea
                                label="Description (optionnel)"
                                value={resource.description || ''}
                                onChange={(e) =>
                                  updateResource(step.id, resource.id, { description: e.target.value })
                                }
                                placeholder="Description de la ressource..."
                                rows={2}
                                fullWidth
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setTemplate({
              name: '',
              description: '',
              steps: [],
            });
            setEditingStepId(null);
            setEditingResourceId(null);
            setError(null);
          }}
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={loading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Sauvegarder l'onboarding
        </Button>
      </div>
    </MotionDiv>
  );
}

export default function OnboardingPage() {
  return <OnboardingContent />;
}
