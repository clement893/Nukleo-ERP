/**
 * useCompanyEditor Hook
 * 
 * Hook pour gérer l'édition et la sauvegarde automatique d'une entreprise
 * avec debounce pour éviter trop de requêtes API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesAPI, Company, CompanyUpdate } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { companyKeys } from '@/lib/query/companies';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseCompanyEditorOptions {
  companyId: number;
  initialCompany: Company;
  debounceMs?: number;
  onSaveSuccess?: (updatedCompany: Company) => void;
  onSaveError?: (error: Error) => void;
}

export interface UseCompanyEditorResult {
  company: Company;
  updateField: <K extends keyof Company>(field: K, value: Company[K]) => void;
  updateFields: (fields: Partial<CompanyUpdate>) => void;
  saveStatus: SaveStatus;
  saveCompany: () => Promise<void>;
  error: Error | null;
  lastSavedAt: Date | null;
  hasChanges: boolean;
}

const DEBOUNCE_DELAY = 2500; // 2.5 secondes par défaut

export function useCompanyEditor({
  companyId,
  initialCompany,
  debounceMs = DEBOUNCE_DELAY,
  onSaveSuccess,
  onSaveError,
}: UseCompanyEditorOptions): UseCompanyEditorResult {
  const [company, setCompany] = useState<Company>(initialCompany);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Mettre à jour l'entreprise quand initialCompany change
  useEffect(() => {
    setCompany(initialCompany);
  }, [initialCompany]);

  // Mutation pour sauvegarder l'entreprise
  const saveMutation = useMutation({
    mutationFn: async (updates: CompanyUpdate) => {
      return await companiesAPI.update(companyId, updates);
    },
    onMutate: async (updates) => {
      setSaveStatus('saving');
      setError(null);
      
      // Optimistic update
      const queryKey = companyKeys.detail(companyId);
      await queryClient.cancelQueries({ queryKey });
      const previousCompany = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
      
      return { previousCompany };
    },
    onSuccess: (data) => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setError(null);
      
      // Mettre à jour l'état local
      setCompany(data);
      
      // Invalider et refetch pour avoir les dernières données
      const queryKey = companyKeys.detail(companyId);
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
      if (context?.previousCompany) {
        const queryKey = companyKeys.detail(companyId);
        queryClient.setQueryData(queryKey, context.previousCompany);
        setCompany(context.previousCompany as Company);
      }
      
      onSaveError?.(error);
    },
  });

  // Fonction pour mettre à jour un champ
  const updateField = useCallback(<K extends keyof Company>(field: K, value: Company[K]) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  }, []);

  // Fonction pour mettre à jour plusieurs champs
  const updateFields = useCallback((fields: Partial<CompanyUpdate>) => {
    setCompany(prev => ({ ...prev, ...fields }));
  }, []);

  // Fonction de sauvegarde avec debounce
  const saveCompany = useCallback(async () => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Préparer les updates (seulement les champs modifiables)
    const updates: CompanyUpdate = {};
    const editableFields: (keyof CompanyUpdate)[] = [
      'name',
      'parent_company_id',
      'description',
      'website',
      'email',
      'phone',
      'address',
      'city',
      'country',
      'is_client',
      'facebook',
      'instagram',
      'linkedin',
      'notes',
    ];

    let hasChanges = false;
    editableFields.forEach(field => {
      const currentValue = company[field as keyof Company];
      const initialValue = initialCompany[field as keyof Company];
      
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
        console.error('Error saving company:', err);
      }
    }, debounceMs);
  }, [company, initialCompany, debounceMs, saveMutation, companyId]);

  // Sauvegarder automatiquement quand l'entreprise change
  useEffect(() => {
    // Ne pas sauvegarder au montage initial
    const hasChanges = JSON.stringify(company) !== JSON.stringify(initialCompany);
    if (!hasChanges) {
      return;
    }

    saveCompany();

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [company, initialCompany, saveCompany]);

  // Fonction de sauvegarde manuelle (immédiate)
  const saveCompanyImmediate = useCallback(async () => {
    // Annuler le debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Préparer les updates
    const updates: CompanyUpdate = {};
    const editableFields: (keyof CompanyUpdate)[] = [
      'name',
      'parent_company_id',
      'description',
      'website',
      'email',
      'phone',
      'address',
      'city',
      'country',
      'is_client',
      'facebook',
      'instagram',
      'linkedin',
      'notes',
    ];

    let hasChanges = false;
    editableFields.forEach(field => {
      const currentValue = company[field as keyof Company];
      const initialValue = initialCompany[field as keyof Company];
      
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
      console.error('Error saving company:', err);
    }
  }, [company, initialCompany, saveMutation]);

  const hasChanges = JSON.stringify(company) !== JSON.stringify(initialCompany);

  return {
    company,
    updateField,
    updateFields,
    saveStatus,
    saveCompany: saveCompanyImmediate,
    error,
    lastSavedAt,
    hasChanges,
  };
}
