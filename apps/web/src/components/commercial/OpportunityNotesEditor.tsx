/**
 * OpportunityNotesEditor Component
 * 
 * Composant pour éditer les notes d'une opportunité directement dans l'onglet,
 * avec sauvegarde automatique et indicateurs visuels.
 */

'use client';

import { useRef, useEffect } from 'react';
import { useOpportunityNotes } from '@/hooks/useOpportunityNotes';
import { Button, Card } from '@/components/ui';
import { Loader2, Check, AlertCircle, Save } from 'lucide-react';

export interface OpportunityNotesEditorProps {
  opportunityId: string;
  initialNotes?: string | null;
  updatedAt?: string | null;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function OpportunityNotesEditor({
  opportunityId,
  initialNotes = null,
  updatedAt = null,
  onSaveSuccess,
  onSaveError,
}: OpportunityNotesEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    notes,
    setNotes,
    saveStatus,
    saveNotes,
    error,
    lastSavedAt,
  } = useOpportunityNotes({
    opportunityId,
    initialNotes,
    onSaveSuccess,
    onSaveError,
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 150), 400);
      textarea.style.height = `${newHeight}px`;
    };

    adjustHeight();
    textarea.addEventListener('input', adjustHeight);
    
    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [notes]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `il y a ${diff} seconde${diff > 1 ? 's' : ''}`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''}`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} heure${Math.floor(diff / 3600) > 1 ? 's' : ''}`;
    return `il y a ${Math.floor(diff / 86400)} jour${Math.floor(diff / 86400) > 1 ? 's' : ''}`;
  };

  const getStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enregistrement...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            <span>{lastSavedAt ? formatTimeAgo(lastSavedAt) : 'Enregistré'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Erreur de sauvegarde</span>
          </div>
        );
      default:
        return null;
    }
  };

  const hasChanges = notes !== (initialNotes || '');

  return (
    <div className="space-y-4">
      {/* Zone d'édition */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajoutez vos notes ici..."
          className="w-full min-h-[150px] max-h-[400px] px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none overflow-y-auto whitespace-pre-wrap"
          style={{ height: '150px' }}
        />
        
        {/* Indicateurs et actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIndicator()}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error.message}
              </div>
            )}
          </div>
          
          {hasChanges && saveStatus !== 'saving' && (
            <Button
              size="sm"
              variant="outline"
              onClick={saveNotes}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer maintenant
            </Button>
          )}
        </div>
      </div>

      {/* Affichage des notes existantes (si présentes et non en édition) */}
      {!notes && !hasChanges && (
        <Card className="glass-card p-6">
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">Aucune note pour cette opportunité.</p>
            <p className="text-sm">Commencez à écrire ci-dessus pour ajouter des notes.</p>
          </div>
        </Card>
      )}

      {/* Date de dernière modification (si disponible) */}
      {updatedAt && !hasChanges && notes && (
        <div className="text-xs text-muted-foreground">
          Dernière modification: {new Date(updatedAt).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}
