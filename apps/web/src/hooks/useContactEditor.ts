/**
 * useContactEditor Hook
 * 
 * Hook pour gérer l'édition et la sauvegarde automatique d'un contact
 * avec debounce pour éviter trop de requêtes API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI, Contact, ContactUpdate } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
import { contactKeys } from '@/lib/query/contacts';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseContactEditorOptions {
  contactId: number;
  initialContact: Contact;
  debounceMs?: number;
  onSaveSuccess?: (updatedContact: Contact) => void;
  onSaveError?: (error: Error) => void;
}

export interface UseContactEditorResult {
  contact: Contact;
  updateField: <K extends keyof Contact>(field: K, value: Contact[K]) => void;
  updateFields: (fields: Partial<ContactUpdate>) => void;
  saveStatus: SaveStatus;
  saveContact: () => Promise<void>;
  error: Error | null;
  lastSavedAt: Date | null;
  hasChanges: boolean;
}

const DEBOUNCE_DELAY = 2500; // 2.5 secondes par défaut

export function useContactEditor({
  contactId,
  initialContact,
  debounceMs = DEBOUNCE_DELAY,
  onSaveSuccess,
  onSaveError,
}: UseContactEditorOptions): UseContactEditorResult {
  const [contact, setContact] = useState<Contact>(initialContact);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Mettre à jour le contact quand initialContact change
  useEffect(() => {
    setContact(initialContact);
  }, [initialContact]);

  // Mutation pour sauvegarder le contact
  const saveMutation = useMutation({
    mutationFn: async (updates: ContactUpdate) => {
      return await contactsAPI.update(contactId, updates);
    },
    onMutate: async (updates) => {
      setSaveStatus('saving');
      setError(null);
      
      // Optimistic update
      const queryKey = contactKeys.detail(contactId);
      await queryClient.cancelQueries({ queryKey });
      const previousContact = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
      
      return { previousContact };
    },
    onSuccess: (data) => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setError(null);
      
      // Mettre à jour l'état local
      setContact(data);
      
      // Invalider et refetch pour avoir les dernières données
      const queryKey = contactKeys.detail(contactId);
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
      if (context?.previousContact) {
        const queryKey = contactKeys.detail(contactId);
        queryClient.setQueryData(queryKey, context.previousContact);
        setContact(context.previousContact as Contact);
      }
      
      onSaveError?.(error);
    },
  });

  // Fonction pour mettre à jour un champ
  const updateField = useCallback(<K extends keyof Contact>(field: K, value: Contact[K]) => {
    setContact(prev => ({ ...prev, [field]: value }));
  }, []);

  // Fonction pour mettre à jour plusieurs champs
  const updateFields = useCallback((fields: Partial<ContactUpdate>) => {
    setContact(prev => {
      // Créer un nouvel objet avec les champs mis à jour
      const updated: Contact = { ...prev };
      
      // Appliquer les champs avec conversion de null en undefined pour company_name
      for (const [key, value] of Object.entries(fields)) {
        if (key === 'company_name') {
          // Contact.company_name est string | undefined, pas null
          updated.company_name = value === null ? undefined : value as string | undefined;
        } else {
          (updated as any)[key] = value;
        }
      }
      
      return updated;
    });
  }, []);

  // Fonction de sauvegarde avec debounce
  const saveContact = useCallback(async () => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Préparer les updates (seulement les champs modifiables)
    const updates: ContactUpdate = {};
    const editableFields: (keyof ContactUpdate)[] = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'position',
      'company_id',
      'circle',
      'city',
      'country',
      'birthday',
      'language',
      'linkedin',
      'employee_id',
      'notes',
    ];

    let hasChanges = false;
    editableFields.forEach(field => {
      const currentValue = contact[field as keyof Contact];
      const initialValue = initialContact[field as keyof Contact];
      
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
        console.error('Error saving contact:', err);
      }
    }, debounceMs);
  }, [contact, initialContact, debounceMs, saveMutation, contactId]);

  // Sauvegarder automatiquement quand le contact change
  useEffect(() => {
    // Ne pas sauvegarder au montage initial
    const hasChanges = JSON.stringify(contact) !== JSON.stringify(initialContact);
    if (!hasChanges) {
      return;
    }

    saveContact();

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [contact, initialContact, saveContact]);

  // Fonction de sauvegarde manuelle (immédiate)
  const saveContactImmediate = useCallback(async () => {
    // Annuler le debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Préparer les updates
    const updates: ContactUpdate = {};
    const editableFields: (keyof ContactUpdate)[] = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'position',
      'company_id',
      'circle',
      'city',
      'country',
      'birthday',
      'language',
      'linkedin',
      'employee_id',
      'notes',
    ];

    let hasChanges = false;
    editableFields.forEach(field => {
      const currentValue = contact[field as keyof Contact];
      const initialValue = initialContact[field as keyof Contact];
      
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
      console.error('Error saving contact:', err);
    }
  }, [contact, initialContact, saveMutation]);

  const hasChanges = JSON.stringify(contact) !== JSON.stringify(initialContact);

  return {
    contact,
    updateField,
    updateFields,
    saveStatus,
    saveContact: saveContactImmediate,
    error,
    lastSavedAt,
    hasChanges,
  };
}
