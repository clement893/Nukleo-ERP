/**
 * Transactions API
 * API client for financial transactions (revenues and expenses)
 */

import { apiClient } from '../client';
import { extractApiData } from '../utils';

export type TransactionType = 'revenue' | 'expense';
export type TransactionStatus = 'pending' | 'paid' | 'cancelled';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  description: string;
  amount: string; // Decimal as string
  currency: string;
  category?: string | null;
  transaction_date: string; // ISO date string
  payment_date?: string | null; // ISO date string
  status: TransactionStatus;
  supplier_id?: number | null;
  supplier_name?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  is_recurring: string; // "true" or "false"
  recurring_id?: number | null;
  metadata?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  type: TransactionType;
  description: string;
  amount: number | string;
  currency?: string;
  category?: string | null;
  transaction_date: string; // ISO date string
  payment_date?: string | null; // ISO date string
  status?: TransactionStatus;
  supplier_id?: number | null;
  supplier_name?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  is_recurring?: string;
  recurring_id?: number | null;
  metadata?: string | null;
}

export interface TransactionUpdate {
  description?: string;
  amount?: number | string;
  currency?: string;
  category?: string | null;
  transaction_date?: string;
  payment_date?: string | null;
  status?: TransactionStatus;
  supplier_id?: number | null;
  supplier_name?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  is_recurring?: string;
  recurring_id?: number | null;
  metadata?: string | null;
}

export interface TransactionSummary {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  transaction_count: number;
}

/**
 * Transactions API client
 */
export const transactionsAPI = {
  /**
   * Get list of transactions with filters
   */
  list: async (params?: {
    skip?: number;
    limit?: number;
    type?: TransactionType;
    status?: TransactionStatus;
    category?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>('/v1/finances/transactions', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 100,
        ...(params?.type && { type: params.type }),
        ...(params?.status && { status: params.status }),
        ...(params?.category && { category: params.category }),
        ...(params?.start_date && { start_date: params.start_date }),
        ...(params?.end_date && { end_date: params.end_date }),
      },
    });
    const data = extractApiData<Transaction[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a transaction by ID
   */
  get: async (transactionId: number): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/v1/finances/transactions/${transactionId}`);
    const data = extractApiData<Transaction>(response);
    if (!data) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    return data;
  },

  /**
   * Create a new transaction
   */
  create: async (transaction: TransactionCreate): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/v1/finances/transactions', transaction);
    const data = extractApiData<Transaction>(response);
    if (!data) {
      throw new Error('Failed to create transaction: no data returned');
    }
    return data;
  },

  /**
   * Update a transaction
   */
  update: async (transactionId: number, transaction: TransactionUpdate): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(
      `/v1/finances/transactions/${transactionId}`,
      transaction
    );
    const data = extractApiData<Transaction>(response);
    if (!data) {
      throw new Error('Failed to update transaction: no data returned');
    }
    return data;
  },

  /**
   * Delete a transaction
   */
  delete: async (transactionId: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/transactions/${transactionId}`);
  },

  /**
   * Get transaction summary statistics
   */
  getSummary: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<TransactionSummary> => {
    const response = await apiClient.get<TransactionSummary>('/v1/finances/transactions/stats/summary', {
      params: {
        ...(params?.start_date && { start_date: params.start_date }),
        ...(params?.end_date && { end_date: params.end_date }),
      },
    });
    const data = extractApiData<TransactionSummary>(response);
    if (!data) {
      throw new Error('Failed to get transaction summary: no data returned');
    }
    return data;
  },
};
