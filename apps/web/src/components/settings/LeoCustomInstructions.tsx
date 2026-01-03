/**
 * Leo Custom Instructions Component
 * 
 * Component for entering custom instructions for Leo
 */

'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Textarea from '@/components/ui/Textarea';

export interface LeoCustomInstructionsProps {
  value: string;
  onChange: (instructions: string) => void;
}

const MAX_LENGTH = 2000;
const PLACEHOLDER = `Exemples de consignes :
- Toujours mentionner les numéros de version
- Utiliser le format ISO pour les dates
- Référencer la documentation officielle
- Préférer les solutions simples aux solutions complexes`;

export default function LeoCustomInstructions({
  value,
  onChange,
}: LeoCustomInstructionsProps) {
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, MAX_LENGTH);
    setCharCount(newValue.length);
    onChange(newValue);
  };

  return (
    <Card className="glass-card border border-nukleo-lavender/20">
      <div className="p-6">
        <div className="mb-4">
          <label htmlFor="custom-instructions" className="text-lg font-semibold text-gray-900 dark:text-white block">
            Consignes personnalisées
          </label>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez des instructions spécifiques pour guider Leo dans ses réponses
          </p>
        </div>

        <Textarea
          id="custom-instructions"
          value={value}
          onChange={handleChange}
          placeholder={PLACEHOLDER}
          rows={8}
          className="font-mono text-sm"
          maxLength={MAX_LENGTH}
        />

        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Ces instructions seront incluses dans le prompt système de Leo
          </p>
          <span
            className={`text-xs ${
              charCount >= MAX_LENGTH
                ? 'text-red-500'
                : charCount >= MAX_LENGTH * 0.9
                ? 'text-yellow-500'
                : 'text-muted-foreground'
            }`}
          >
            {charCount} / {MAX_LENGTH}
          </span>
        </div>
      </div>
    </Card>
  );
}
