/**
 * useCompanyNotes Hook
 * 
 * Hook pour gérer l'édition et la sauvegarde automatique des notes d'une entreprise
 * avec debounce pour éviter trop de requêtes API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesAPI } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { companyKeys } from '@/lib/query/companies';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseCompanyNotesOptions {
  companyId: number;
  initialNotes?: string | null;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export interface UseCompanyNotesResult {
  notes: string;
  setNotes: (notes: string) => void;
  saveStatus: SaveStatus;
  saveNotes: () => Promise<void>;
  error: Error | null;
  lastSavedAt: Date | null;
}

const DEBOUNCE_DELAY = 2500; // 2.5 secondes par défaut

export function useCompanyNotes({
  companyId,
  initialNotes = null,
  debounceMs = DEBOUNCE_DELAY,
  onSaveSuccess,
  onSaveError,
}: UseCompanyNotesOptions): UseCompanyNotesResult {
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
      return await companiesAPI.update(companyId, { notes: notesToSave });
    },
    onMutate: async () => {
      setSaveStatus('saving');
      setError(null);
      
      // Optimistic update
      const queryKey = companyKeys.detail(companyId);
      await queryClient.cancelQueries({ queryKey });
      const previousCompany = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return { ...old, notes };
      });
      
      return { previousCompany };
    },
    onSuccess: (data) => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setError(null);
      
      // Invalider et refetch pour avoir les dernières données
      const queryKey = companyKeys.detail(companyId);
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
      if (context?.previousCompany) {
        const queryKey = companyKeys.detail(companyId);
        queryClient.setQueryData(queryKey, context.previousCompany);
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
  }, [notes, initialNotes, debounceMs, saveMutation, companyId]);

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
