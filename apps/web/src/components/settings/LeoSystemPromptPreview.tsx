/**
 * Leo System Prompt Preview Component
 * 
 * Component for previewing the generated system prompt
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Copy, Loader2, Check } from 'lucide-react';
import { leoSettingsAPI } from '@/lib/api/leo-settings';
import { useToast } from '@/components/ui';
import { useState } from 'react';

export default function LeoSystemPromptPreview() {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const { data: systemPrompt, isLoading } = useQuery({
    queryKey: ['leo-system-prompt'],
    queryFn: () => leoSettingsAPI.getSystemPrompt(),
  });

  const handleCopy = async () => {
    if (!systemPrompt) return;
    try {
      await navigator.clipboard.writeText(systemPrompt);
      setCopied(true);
      showToast({
        message: 'Prompt copié dans le presse-papiers',
        type: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast({
        message: 'Erreur lors de la copie',
        type: 'error',
      });
    }
  };

  return (
    <Card className="glass-card border border-nukleo-lavender/20">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aperçu du System Prompt
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Prévisualisation du prompt système généré à partir de vos paramètres
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!systemPrompt || isLoading}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copier
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-muted-foreground">Génération du prompt...</span>
          </div>
        ) : (
          <div className="relative">
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {systemPrompt || 'Aucun prompt disponible'}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
