'use client';

import { SubmissionWizardData } from '../SubmissionWizard';

interface IntroductionProps {
  data: SubmissionWizardData;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

export default function SubmissionIntroduction({
  data,
  onChange,
}: IntroductionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Introduction</h2>
        <p className="text-muted-foreground">
          Présentez votre entreprise et votre approche
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Introduction
        </label>
        <textarea
          value={data.introduction}
          onChange={(e) => onChange({ introduction: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[300px]"
          placeholder="Présentez votre entreprise, votre expertise, votre vision du projet..."
          rows={12}
        />
      </div>
    </div>
  );
}
