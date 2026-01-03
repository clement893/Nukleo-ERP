/**
 * useOpportunityEditor Hook
 * 
 * Hook pour gérer l'édition et la sauvegarde automatique d'une opportunité
 * avec debounce pour éviter trop de requêtes API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesAPI, Opportunity, OpportunityUpdate } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';
import { opportunityKeys } from '@/lib/query/opportunities';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseOpportunityEditorOptions {
  opportunityId: string;
  initialOpportunity: Opportunity;
  debounceMs?: number;
  onSaveSuccess?: (updatedOpportunity: Opportunity) => void;
  onSaveError?: (error: Error) => void;
}

export interface UseOpportunityEditorResult {
  opportunity: Opportunity;
  updateField: <K extends keyof Opportunity>(field: K, value: Opportunity[K]) => void;
  updateFields: (fields: Partial<OpportunityUpdate>) => void;
  saveStatus: SaveStatus;
  saveOpportunity: () => Promise<void>;
  error: Error | null;
  lastSavedAt: Date | null;
  hasChanges: boolean;
}

const DEBOUNCE_DELAY = 2500; // 2.5 secondes par défaut

export function useOpportunityEditor({
  opportunityId,
  initialOpportunity,
  debounceMs = DEBOUNCE_DELAY,
  onSaveSuccess,
  onSaveError,
}: UseOpportunityEditorOptions): UseOpportunityEditorResult {
  const [opportunity, setOpportunity] = useState<Opportunity>(initialOpportunity);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Mettre à jour l'opportunité quand initialOpportunity change
  useEffect(() => {
    setOpportunity(initialOpportunity);
  }, [initialOpportunity]);

  // Mutation pour sauvegarder l'opportunité
  const saveMutation = useMutation({
    mutationFn: async (updates: OpportunityUpdate) => {
      return await opportunitiesAPI.update(opportunityId, updates);
    },
    onMutate: async (updates) => {
      setSaveStatus('saving');
      setError(null);
      
      // Optimistic update
      const queryKey = opportunityKeys.detail(opportunityId);
      await queryClient.cancelQueries({ queryKey });
      const previousOpportunity = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
      
      return { previousOpportunity };
    },
    onSuccess: (data) => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setError(null);
      
      // Mettre à jour l'état local
      setOpportunity(data);
      
      // Invalider et refetch pour avoir les dernières données
      const queryKey = opportunityKeys.detail(opportunityId);
      queryClient.invalidateQueries({ queryKey });
      queryClient.setQueryData(queryKey, data);
      
      onSaveSuccess?.(data);
      
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
        setOpportunity(context.previousOpportunity as Opportunity);
      }
      
      onSaveError?.(error);
    },
  });

  // Fonction pour mettre à jour un champ
  const updateField = useCallback(<K extends keyof Opportunity>(field: K, value: Opportunity[K]) => {
    setOpportunity(prev => ({ ...prev, [field]: value }));
  }, []);

  // Fonction pour mettre à jour plusieurs champs
  const updateFields = useCallback((fields: Partial<OpportunityUpdate>) => {
    setOpportunity(prev => ({ ...prev, ...fields }));
  }, []);

  // Fonction de sauvegarde avec debounce
  const saveOpportunity = useCallback(async () => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Préparer les updates (seulement les champs modifiables)
    const updates: OpportunityUpdate = {};
    const editableFields: (keyof OpportunityUpdate)[] = [
      'name',
      'description',
      'amount',
      'probability',
      'expected_close_date',
      'status',
      'segment',
      'region',
      'service_offer_link',
      'pipeline_id',
      'stage_id',
      'company_id',
      'assigned_to_id',
      'opened_at',
      'closed_at',
      'contact_ids',
    ];

    let hasChanges = false;
    editableFields.forEach(field => {
      const currentValue = opportunity[field as keyof Opportunity];
      const initialValue = initialOpportunity[field as keyof Opportunity];
      
      if (currentValue !== initialValue) {
        (updates as any)[field] = currentValue;
        hasChanges = true;
      }
    });

    // Si aucun changement, ne rien faire
    if (!hasChanges) {
      setSaveStatus('idle');
      return;
    }

    // Définir un nouveau timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await saveMutation.mutateAsync(updates);
      } catch (err) {
        // L'erreur est déjà gérée dans onError
        console.error('Error saving opportunity:', err);
      }
    }, debounceMs);
  }, [opportunity, initialOpportunity, debounceMs, saveMutation, opportunityId]);

  // Sauvegarder automatiquement quand l'opportunité change
  useEffect(() => {
    // Ne pas sauvegarder au montage initial
    const hasChanges = JSON.stringify(opportunity) !== JSON.stringify(initialOpportunity);
    if (!hasChanges) {
      return;
    }

    saveOpportunity();

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [opportunity, initialOpportunity, saveOpportunity]);

  // Fonction de sauvegarde manuelle (immédiate)
  const saveOpportunityImmediate = useCallback(async () => {
    // Annuler le debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Préparer les updates
    const updates: OpportunityUpdate = {};
    const editableFields: (keyof OpportunityUpdate)[] = [
      'name',
      'description',
      'amount',
      'probability',
      'expected_close_date',
      'status',
      'segment',
      'region',
      'service_offer_link',
      'pipeline_id',
      'stage_id',
      'company_id',
      'assigned_to_id',
      'opened_at',
      'closed_at',
      'contact_ids',
    ];

    let hasChanges = false;
    editableFields.forEach(field => {
      const currentValue = opportunity[field as keyof Opportunity];
      const initialValue = initialOpportunity[field as keyof Opportunity];
      
      if (currentValue !== initialValue) {
        (updates as any)[field] = currentValue;
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      setSaveStatus('idle');
      return;
    }

    try {
      await saveMutation.mutateAsync(updates);
    } catch (err) {
      // L'erreur est déjà gérée dans onError
      console.error('Error saving opportunity:', err);
    }
  }, [opportunity, initialOpportunity, saveMutation]);

  const hasChanges = JSON.stringify(opportunity) !== JSON.stringify(initialOpportunity);

  return {
    opportunity,
    updateField,
    updateFields,
    saveStatus,
    saveOpportunity: saveOpportunityImmediate,
    error,
    lastSavedAt,
    hasChanges,
  };
}
