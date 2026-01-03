/**
 * Leo Tone Selector Component
 * 
 * Component for selecting Leo's tone
 */

'use client';

import { type LeoSettings } from '@/lib/api/leo-settings';
import Card from '@/components/ui/Card';
import Radio from '@/components/ui/Radio';

const TONE_OPTIONS: Array<{
  value: LeoSettings['tone'];
  label: string;
  description: string;
}> = [
  {
    value: 'professionnel',
    label: 'Professionnel',
    description: 'Ton formel et adapté au contexte professionnel',
  },
  {
    value: 'decontracte',
    label: 'Décontracté',
    description: 'Ton informel et accessible',
  },
  {
    value: 'technique',
    label: 'Technique',
    description: 'Ton précis avec terminologie technique',
  },
  {
    value: 'amical',
    label: 'Amical',
    description: 'Ton chaleureux et convivial',
  },
  {
    value: 'formel',
    label: 'Formel',
    description: 'Ton respectueux et soutenu',
  },
];

export interface LeoToneSelectorProps {
  value: LeoSettings['tone'];
  onChange: (tone: LeoSettings['tone']) => void;
}

export default function LeoToneSelector({ value, onChange }: LeoToneSelectorProps) {
  return (
    <Card className="glass-card border border-nukleo-lavender/20">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ton de Leo
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choisissez le ton que Leo doit utiliser dans ses réponses
        </p>

        <div className="space-y-4" role="radiogroup">
          {TONE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => onChange(option.value)}
            >
              <div className="mt-1">
                <Radio
                  name="tone"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  id={`tone-${option.value}`}
                />
              </div>
              <label
                htmlFor={`tone-${option.value}`}
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
