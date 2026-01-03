/**
 * useOpportunityNotes Hook
 * 
 * Hook pour gérer l'édition et la sauvegarde automatique des notes d'opportunité
 * avec debounce pour éviter trop de requêtes API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { opportunityKeys } from '@/lib/query/opportunities';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseOpportunityNotesOptions {
  opportunityId: string;
  initialNotes?: string | null;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export interface UseOpportunityNotesResult {
  notes: string;
  setNotes: (notes: string) => void;
  saveStatus: SaveStatus;
  saveNotes: () => Promise<void>;
  error: Error | null;
  lastSavedAt: Date | null;
}

const DEBOUNCE_DELAY = 2500; // 2.5 secondes par défaut

export function useOpportunityNotes({
  opportunityId,
  initialNotes = null,
  debounceMs = DEBOUNCE_DELAY,
  onSaveSuccess,
  onSaveError,
}: UseOpportunityNotesOptions): UseOpportunityNotesResult {
  const [notes, setNotes] = useState<string>(initialNotes || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Mettre à jour les notes quand initialNotes change
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  // Mutation pour sauvegarder les notes
  const saveMutation = useMutation({
    mutationFn: async (notesToSave: string) => {
      return await opportunitiesAPI.update(opportunityId, { notes: notesToSave });
    },
    onMutate: async () => {
      setSaveStatus('saving');
      setError(null);
      
      // Optimistic update
      const queryKey = opportunityKeys.detail(opportunityId);
      await queryClient.cancelQueries({ queryKey });
      const previousOpportunity = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return { ...old, notes };
      });
      
      return { previousOpportunity };
    },
    onSuccess: (data) => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setError(null);
      
      // Invalider et refetch pour avoir les dernières données
      const queryKey = opportunityKeys.detail(opportunityId);
      queryClient.invalidateQueries({ queryKey });
      queryClient.setQueryData(queryKey, data);
      
      onSaveSuccess?.();
      
      // Réinitialiser le statut après 5 secondes
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    },
    onError: (err: unknown, _variables, context) => {
      setSaveStatus('error');
      const appError = handleApiError(err);
      const error = new Error(appError.message || 'Erreur lors de la sauvegarde');
      setError(error);
      
      // Rollback optimistic update
      if (context?.previousOpportunity) {
        const queryKey = opportunityKeys.detail(opportunityId);
        queryClient.setQueryData(queryKey, context.previousOpportunity);
      }
      
      onSaveError?.(error);
    },
  });

  // Fonction de sauvegarde avec debounce
  const saveNotes = useCallback(async () => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si les notes n'ont pas changé, ne rien faire
    if (notes === (initialNotes || '')) {
      setSaveStatus('idle');
      return;
    }

    // Définir un nouveau timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await saveMutation.mutateAsync(notes);
      } catch (err) {
        // L'erreur est déjà gérée dans onError
        console.error('Error saving notes:', err);
      }
    }, debounceMs);
  }, [notes, initialNotes, debounceMs, saveMutation, opportunityId]);

  // Sauvegarder automatiquement quand les notes changent
  useEffect(() => {
    // Ne pas sauvegarder au montage initial
    if (notes === (initialNotes || '')) {
      return;
    }

    saveNotes();

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [notes, initialNotes, saveNotes]);

  // Fonction de sauvegarde manuelle (immédiate)
  const saveNotesImmediate = useCallback(async () => {
    // Annuler le debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Si les notes n'ont pas changé, ne rien faire
    if (notes === (initialNotes || '')) {
      setSaveStatus('idle');
      return;
    }

    try {
      await saveMutation.mutateAsync(notes);
    } catch (err) {
      // L'erreur est déjà gérée dans onError
      console.error('Error saving notes:', err);
    }
  }, [notes, initialNotes, saveMutation]);

  return {
    notes,
    setNotes,
    saveStatus,
    saveNotes: saveNotesImmediate,
    error,
    lastSavedAt,
  };
}
