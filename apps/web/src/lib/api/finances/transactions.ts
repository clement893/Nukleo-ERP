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
  tax_amount?: string | null; // Decimal as string - Montant des taxes
  currency: string;
  category?: string | null;
  transaction_date: string; // ISO date string - Date d'émission
  expected_payment_date?: string | null; // ISO date string - Date de réception prévue
  payment_date?: string | null; // ISO date string - Date de réception réelle
  status: TransactionStatus;
  client_id?: number | null; // Pour les revenus
  client_name?: string | null; // Nom du client
  supplier_id?: number | null; // Pour les dépenses
  supplier_name?: string | null; // Nom du fournisseur
  invoice_number?: string | null;
  notes?: string | null;
  is_recurring: string; // "true" or "false"
  recurring_id?: number | null;
  transaction_metadata?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  type: TransactionType;
  description: string;
  amount: number | string;
  tax_amount?: number | string | null; // Montant des taxes
  currency?: string;
  category?: string | null;
  transaction_date: string; // ISO date string - Date d'émission
  expected_payment_date?: string | null; // ISO date string - Date de réception prévue
  payment_date?: string | null; // ISO date string - Date de réception réelle
  status?: TransactionStatus;
  client_id?: number | null; // Pour les revenus
  client_name?: string | null; // Nom du client
  supplier_id?: number | null; // Pour les dépenses
  supplier_name?: string | null; // Nom du fournisseur
  invoice_number?: string | null;
  notes?: string | null;
  is_recurring?: string;
  recurring_id?: number | null;
  transaction_metadata?: string | null;
}

export interface TransactionUpdate {
  description?: string;
  amount?: number | string;
  tax_amount?: number | string | null;
  currency?: string;
  category?: string | null;
  transaction_date?: string;
  expected_payment_date?: string | null;
  payment_date?: string | null;
  status?: TransactionStatus;
  client_id?: number | null;
  client_name?: string | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  is_recurring?: string;
  recurring_id?: number | null;
  transaction_metadata?: string | null;
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

  /**
   * Import transactions from file
   */
  import: async (
    file: File,
    dryRun: boolean = false
  ): Promise<{
    success: boolean;
    created_count: number;
    error_count: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    warnings?: Array<{ row: number; type: string; message: string }>;
    transactions?: Transaction[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{
      success: boolean;
      created_count: number;
      error_count: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{ row: number; type: string; message: string }>;
      transactions?: Transaction[];
    }>(`/v1/finances/transactions/import?dry_run=${dryRun}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const data = extractApiData<{
      success: boolean;
      created_count: number;
      error_count: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{ row: number; type: string; message: string }>;
      transactions?: Transaction[];
    }>(response);
    if (!data) {
      throw new Error('Failed to import transactions: no data returned');
    }
    return data as {
      success: boolean;
      created_count: number;
      error_count: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{ row: number; type: string; message: string }>;
      transactions?: Transaction[];
    };
  },

  /**
   * Download import template
   */
  downloadTemplate: async (format: 'zip' | 'csv' | 'excel' = 'zip'): Promise<Blob> => {
    try {
      // Use axios directly to handle blob responses properly
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('@/lib/api');
      const { TokenStorage } = await import('../../auth/tokenStorage');
      
      const baseURL = getApiUrl().replace(/\/$/, '').replace(/\/api$/, '');
      const token = TokenStorage.getToken();
      
      const response = await axios.get(
        `${baseURL}/api/v1/finances/transactions/import/template?format=${format}`,
        {
          responseType: 'blob',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          withCredentials: true,
        }
      );
      
      if (response.status >= 400) {
        // Try to parse blob as JSON error
        const text = await (response.data as Blob).text();
        let errorData: unknown;
        try {
          errorData = JSON.parse(text);
        } catch (parseError) {
          // If not JSON, create error object with text
          errorData = { detail: text || 'Download failed' };
        }
        
        // Create AxiosError-like object
        const axiosError = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
            headers: response.headers,
            config: response.config,
          },
          config: response.config,
          isAxiosError: true,
          name: 'AxiosError',
          message: `Request failed with status code ${response.status}`,
        };
        
        throw axiosError;
      }
      
      if (!response.data || (response.data as Blob).size === 0) {
        throw new Error('Download failed: empty response');
      }
      
      return response.data as Blob;
    } catch (error: unknown) {
      // If error response is a blob, convert it to JSON first
      const axiosError = error as { response?: { data?: Blob } };
      if (axiosError.response?.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text();
          let errorData: unknown;
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            // If not JSON, create error object with text
            errorData = { detail: text || 'Download failed' };
          }
          // Replace blob with parsed JSON
          (error as { response: { data: unknown } }).response.data = errorData;
        } catch (blobError) {
          // If we can't read the blob, use a generic error
          (error as { response: { data: unknown } }).response.data = { detail: 'Download failed' };
        }
      }
      
      // Re-throw with proper error handling
      const { handleApiError } = await import('../../errors/api');
      throw handleApiError(error);
    }
  },
};
