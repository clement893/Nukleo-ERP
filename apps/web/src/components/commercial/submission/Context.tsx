'use client';

import { SubmissionWizardData } from '../SubmissionWizard';

interface ContextProps {
  data: SubmissionWizardData;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

export default function SubmissionContext({
  data,
  onChange,
}: ContextProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Contexte</h2>
        <p className="text-muted-foreground">
          Décrivez le contexte du projet et la situation actuelle
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Contexte du projet
        </label>
        <textarea
          value={data.context}
          onChange={(e) => onChange({ context: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[300px]"
          placeholder="Décrivez le contexte, les enjeux, les défis actuels..."
          rows={12}
        />
      </div>
    </div>
  );
}
