/**
 * Leo Approach Selector Component
 * 
 * Component for selecting Leo's response approach
 */

'use client';

import { type LeoSettings } from '@/lib/api/leo-settings';
import Card from '@/components/ui/Card';
import Radio from '@/components/ui/Radio';

const APPROACH_OPTIONS: Array<{
  value: LeoSettings['approach'];
  label: string;
  description: string;
}> = [
  {
    value: 'concis',
    label: 'Concis',
    description: 'Réponses courtes et directes',
  },
  {
    value: 'detaille',
    label: 'Détaillé',
    description: 'Réponses complètes avec explications',
  },
  {
    value: 'avec_exemples',
    label: 'Avec exemples',
    description: 'Inclut toujours des exemples concrets',
  },
  {
    value: 'pas_a_pas',
    label: 'Pas à pas',
    description: 'Structure les réponses en étapes numérotées',
  },
];

export interface LeoApproachSelectorProps {
  value: LeoSettings['approach'];
  onChange: (approach: LeoSettings['approach']) => void;
}

export default function LeoApproachSelector({
  value,
  onChange,
}: LeoApproachSelectorProps) {
  return (
    <Card className="glass-card border border-nukleo-lavender/20">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Approche de réponse
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Définissez comment Leo doit structurer ses réponses
        </p>

        <div className="space-y-4" role="radiogroup">
          {APPROACH_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => onChange(option.value)}
            >
              <div className="mt-1">
                <Radio
                  name="approach"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  id={`approach-${option.value}`}
                />
              </div>
              <label
                htmlFor={`approach-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.label}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
