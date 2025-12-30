'use client';

import { SubmissionWizardData } from '../SubmissionWizard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface ProcessProps {
  data: SubmissionWizardData;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

export default function SubmissionProcess({
  data,
  onChange,
}: ProcessProps) {
  const addStep = () => {
    onChange({
      processSteps: [
        ...data.processSteps,
        { title: '', description: '', duration: '' },
      ],
    });
  };

  const updateStep = (index: number, field: 'title' | 'description' | 'duration', value: string) => {
    const newSteps = [...data.processSteps];
    const currentStep = newSteps[index] || { title: '', description: '', duration: '' };
    newSteps[index] = { 
      ...currentStep,
      [field]: value 
    };
    // Ensure required fields are strings
    if (!newSteps[index].title) newSteps[index].title = '';
    if (!newSteps[index].description) newSteps[index].description = '';
    onChange({ processSteps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = data.processSteps.filter((_, i) => i !== index);
    onChange({ processSteps: newSteps });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Processus</h2>
        <p className="text-muted-foreground">
          Définissez les étapes du processus de réalisation du projet
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Étapes du processus
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStep}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter une étape
          </Button>
        </div>

        {data.processSteps.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <p>Aucune étape définie</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter une étape" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.processSteps.map((step, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg bg-muted/30 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Étape {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  label="Titre de l'étape"
                  value={step.title}
                  onChange={(e) => updateStep(index, 'title', e.target.value)}
                  fullWidth
                  placeholder="Ex: Phase 1 - Analyse"
                />

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    Description
                  </label>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Décrivez les activités de cette étape..."
                  />
                </div>

                <Input
                  label="Durée estimée"
                  value={step.duration || ''}
                  onChange={(e) => updateStep(index, 'duration', e.target.value)}
                  fullWidth
                  placeholder="Ex: 2 semaines"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
