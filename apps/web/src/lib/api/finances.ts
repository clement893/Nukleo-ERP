/**
 * Finances Module API
 * Unified API client for financial operations
 * 
 * This module provides a unified interface for all financial operations:
 * - Facturations (Invoices)
 * - Rapports (Reports)
 * - Compte de Dépenses (Expense Accounts)
 */

// Note: Finances endpoints are currently basic/stub implementations
// This file is prepared for future implementation

/**
 * Unified Finances API
 * Provides access to all financial operations through a single interface
 */
export const financesAPI = {
  facturations: {
    list: async () => {
      // TODO: Implement when backend is ready
      return [];
    },
    get: async (id: number) => {
      // TODO: Implement when backend is ready
      return { id };
    },
  },
  rapports: {
    list: async () => {
      // TODO: Implement when backend is ready
      return [];
    },
    get: async (id: number) => {
      // TODO: Implement when backend is ready
      return { id };
    },
  },
  compteDepenses: {
    list: async () => {
      // TODO: Implement when backend is ready
      return [];
    },
    get: async (id: number) => {
      // TODO: Implement when backend is ready
      return { id };
    },
  },
};
