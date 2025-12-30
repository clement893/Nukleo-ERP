'use client';

import { SubmissionWizardData } from '../SubmissionWizard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface MandateProps {
  data: SubmissionWizardData;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

export default function SubmissionMandate({
  data,
  onChange,
}: MandateProps) {
  const addObjective = () => {
    onChange({
      objectives: [...data.objectives, ''],
    });
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...data.objectives];
    newObjectives[index] = value;
    onChange({ objectives: newObjectives });
  };

  const removeObjective = (index: number) => {
    const newObjectives = data.objectives.filter((_, i) => i !== index);
    onChange({ objectives: newObjectives });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Mandat</h2>
        <p className="text-muted-foreground">
          Décrivez le mandat et les objectifs du projet
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Description du mandat
        </label>
        <textarea
          value={data.mandate}
          onChange={(e) => onChange({ mandate: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px]"
          placeholder="Décrivez le mandat, la portée du projet, les livrables attendus..."
          rows={8}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Objectifs du projet
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addObjective}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter un objectif
          </Button>
        </div>

        {data.objectives.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <p>Aucun objectif défini</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter un objectif" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.objectives.map((objective, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder={`Objectif ${index + 1}`}
                  fullWidth
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeObjective(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
