/**
 * React Query hooks for Finances Module
 * Unified hooks for all financial operations
 */

// Note: Finances currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Finances API
export { financesAPI } from '../api/finances';

// Unified query keys for finances module
export const financesKeys = {
  all: ['finances'] as const,
  facturations: () => [...financesKeys.all, 'facturations'] as const,
  facturation: (id: number) => [...financesKeys.facturations(), id] as const,
  rapports: () => [...financesKeys.all, 'rapports'] as const,
  rapport: (id: number) => [...financesKeys.rapports(), id] as const,
  compteDepenses: () => [...financesKeys.all, 'compte-depenses'] as const,
  compteDepense: (id: number) => [...financesKeys.compteDepenses(), id] as const,
};
