/**
 * Treasury API
 * API client for treasury management endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

// ==================== Types ====================

export interface BankAccount {
  id: number;
  user_id: number;
  name: string;
  account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  bank_name: string | null;
  account_number: string | null;
  initial_balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  current_balance?: number;
}

export interface BankAccountCreate {
  name: string;
  account_type?: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  bank_name?: string | null;
  account_number?: string | null;
  initial_balance?: number;
  currency?: string;
  is_active?: boolean;
  notes?: string | null;
}

export interface BankAccountUpdate extends Partial<BankAccountCreate> {}

export interface TransactionCategory {
  id: number;
  user_id: number;
  name: string;
  type: 'entry' | 'exit';
  parent_id: number | null;
  is_active: boolean;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategoryCreate {
  name: string;
  type: 'entry' | 'exit';
  parent_id?: number | null;
  is_active?: boolean;
  description?: string | null;
  color?: string | null;
}

export interface TransactionCategoryUpdate extends Partial<TransactionCategoryCreate> {}

export interface Transaction {
  id: number;
  user_id: number;
  bank_account_id: number;
  type: 'entry' | 'exit';
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  category_id: number | null;
  status: 'confirmed' | 'pending' | 'projected' | 'cancelled';
  invoice_id: number | null;
  expense_account_id: number | null;
  project_id: number | null;
  payment_method: string | null;
  reference_number: string | null;
  is_recurring: boolean;
  recurring_parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  bank_account_id: number;
  type: 'entry' | 'exit';
  amount: number;
  date: string;
  description: string;
  notes?: string | null;
  category_id?: number | null;
  status?: 'confirmed' | 'pending' | 'projected' | 'cancelled';
  invoice_id?: number | null;
  expense_account_id?: number | null;
  project_id?: number | null;
  payment_method?: string | null;
  reference_number?: string | null;
  is_recurring?: boolean;
}

export interface TransactionUpdate extends Partial<TransactionCreate> {}

export interface CashflowWeek {
  week_start: string;
  week_end: string;
  entries: number;
  exits: number;
  balance: number;
  is_projected: boolean;
}

export interface CashflowResponse {
  weeks: CashflowWeek[];
  total_entries: number;
  total_exits: number;
  current_balance: number;
  projected_balance?: number | null;
}

export interface TreasuryStats {
  total_entries: number;
  total_exits: number;
  current_balance: number;
  projected_balance_30d?: number | null;
  variation_percent?: number | null;
}

export interface InvoiceToBill {
  id: number;
  invoice_number: string | null;
  amount_due: number;
  due_date: string | null;
  status: string;
  probability: number;
  days_until_due: number | null;
  is_overdue: boolean;
}

export interface RevenueForecast {
  week_start: string;
  week_end: string;
  confirmed_amount: number;
  probable_amount: number;
  projected_amount: number;
  invoices_count: number;
}

export interface ForecastResponse {
  revenue_forecast: RevenueForecast[];
  invoices_to_bill: InvoiceToBill[];
  total_confirmed: number;
  total_probable: number;
  total_projected: number;
}

export interface AlertResponse {
  overdue_invoices: InvoiceToBill[];
  low_balance_accounts: Array<{
    id: number;
    name: string;
    current_balance: number;
    threshold: number;
  }>;
  upcoming_due_dates: InvoiceToBill[];
}

// ==================== API Client ====================

export const tresorerieAPI = {
  // Bank Accounts
  listBankAccounts: async (params?: { is_active?: boolean }): Promise<BankAccount[]> => {
    const response = await apiClient.get<BankAccount[]>('/v1/finances/tresorerie/accounts', {
      params,
    });
    return extractApiData(response) || [];
  },

  getBankAccount: async (id: number): Promise<BankAccount> => {
    const response = await apiClient.get<BankAccount>(`/v1/finances/tresorerie/accounts/${id}`);
    const data = extractApiData<BankAccount>(response);
    if (!data) {
      throw new Error(`Bank account not found: ${id}`);
    }
    return data as BankAccount;
  },

  createBankAccount: async (data: BankAccountCreate): Promise<BankAccount> => {
    const response = await apiClient.post<BankAccount>('/v1/finances/tresorerie/accounts', data);
    const result = extractApiData<BankAccount>(response);
    if (!result) {
      throw new Error('Failed to create bank account: no data returned');
    }
    return result as BankAccount;
  },

  updateBankAccount: async (id: number, data: BankAccountUpdate): Promise<BankAccount> => {
    const response = await apiClient.put<BankAccount>(`/v1/finances/tresorerie/accounts/${id}`, data);
    const result = extractApiData<BankAccount>(response);
    if (!result) {
      throw new Error('Failed to update bank account: no data returned');
    }
    return result as BankAccount;
  },

  deleteBankAccount: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/tresorerie/accounts/${id}`);
  },

  // Transaction Categories
  listCategories: async (params?: { type?: 'entry' | 'exit'; is_active?: boolean }): Promise<TransactionCategory[]> => {
    const response = await apiClient.get<TransactionCategory[]>('/v1/finances/tresorerie/categories', {
      params,
    });
    return extractApiData(response) || [];
  },

  createCategory: async (data: TransactionCategoryCreate): Promise<TransactionCategory> => {
    const response = await apiClient.post<TransactionCategory>('/v1/finances/tresorerie/categories', data);
    const result = extractApiData<TransactionCategory>(response);
    if (!result) {
      throw new Error('Failed to create category: no data returned');
    }
    return result as TransactionCategory;
  },

  updateCategory: async (id: number, data: TransactionCategoryUpdate): Promise<TransactionCategory> => {
    const response = await apiClient.put<TransactionCategory>(`/v1/finances/tresorerie/categories/${id}`, data);
    const result = extractApiData<TransactionCategory>(response);
    if (!result) {
      throw new Error('Failed to update category: no data returned');
    }
    return result as TransactionCategory;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/tresorerie/categories/${id}`);
  },

  // Transactions
  listTransactions: async (params?: {
    bank_account_id?: number;
    type?: 'entry' | 'exit';
    category_id?: number;
    status?: 'confirmed' | 'pending' | 'projected' | 'cancelled';
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>('/v1/finances/tresorerie/transactions', {
      params: { skip: 0, limit: 1000, ...params },
    });
    return extractApiData(response) || [];
  },

  getTransaction: async (id: number): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/v1/finances/tresorerie/transactions/${id}`);
    const data = extractApiData<Transaction>(response);
    if (!data) {
      throw new Error(`Transaction not found: ${id}`);
    }
    return data as Transaction;
  },

  createTransaction: async (data: TransactionCreate): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/v1/finances/tresorerie/transactions', data);
    const result = extractApiData<Transaction>(response);
    if (!result) {
      throw new Error('Failed to create transaction: no data returned');
    }
    return result as Transaction;
  },

  updateTransaction: async (id: number, data: TransactionUpdate): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(`/v1/finances/tresorerie/transactions/${id}`, data);
    const result = extractApiData<Transaction>(response);
    if (!result) {
      throw new Error('Failed to update transaction: no data returned');
    }
    return result as Transaction;
  },

  deleteTransaction: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/tresorerie/transactions/${id}`);
  },

  // Cashflow
  getWeeklyCashflow: async (params?: {
    bank_account_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<CashflowResponse> => {
    const response = await apiClient.get<CashflowResponse>('/v1/finances/tresorerie/cashflow/weekly', {
      params,
    });
    const data = extractApiData<CashflowResponse>(response);
    if (!data) {
      throw new Error('Failed to get cashflow');
    }
    return data as CashflowResponse;
  },

  getStats: async (params?: {
    bank_account_id?: number;
    period_days?: number;
  }): Promise<TreasuryStats> => {
    const response = await apiClient.get<TreasuryStats>('/v1/finances/tresorerie/stats', {
      params,
    });
    const data = extractApiData<TreasuryStats>(response);
    if (!data) {
      throw new Error('Failed to get stats');
    }
    return data as TreasuryStats;
  },

  // Forecast
  getInvoicesToBill: async (params?: {
    include_draft?: boolean;
    include_open?: boolean;
    days_ahead?: number;
  }): Promise<InvoiceToBill[]> => {
    const response = await apiClient.get<InvoiceToBill[]>('/v1/finances/tresorerie/forecast/invoices-to-bill', {
      params,
    });
    return extractApiData(response) || [];
  },

  getDetailedForecast: async (params?: {
    bank_account_id?: number;
    weeks?: number;
  }): Promise<ForecastResponse> => {
    const response = await apiClient.get<ForecastResponse>('/v1/finances/tresorerie/forecast/detailed', {
      params,
    });
    const data = extractApiData<ForecastResponse>(response);
    if (!data) {
      throw new Error('Failed to get forecast');
    }
    return data as ForecastResponse;
  },

  getRevenueForecast: async (params?: {
    weeks?: number;
  }): Promise<RevenueForecast[]> => {
    const response = await apiClient.get<RevenueForecast[]>('/v1/finances/tresorerie/forecast/revenue', {
      params,
    });
    return extractApiData(response) || [];
  },

  getAlerts: async (params?: {
    low_balance_threshold?: number;
    days_ahead?: number;
  }): Promise<AlertResponse> => {
    const response = await apiClient.get<AlertResponse>('/v1/finances/tresorerie/alerts', {
      params,
    });
    const data = extractApiData<AlertResponse>(response);
    if (!data) {
      throw new Error('Failed to get alerts');
    }
    return data as AlertResponse;
  },

  // Integration
  getInvoices: async (params?: {
    status?: string;
  }): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/v1/finances/tresorerie/invoices', {
      params,
    });
    return extractApiData(response) || [];
  },

  getExpenses: async (params?: {
    status?: string;
  }): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/v1/finances/tresorerie/expenses', {
      params,
    });
    return extractApiData(response) || [];
  },

  // Import
  importTransactions: async (
    file: File,
    params?: {
      bank_account_id?: number;
      dry_run?: boolean;
    }
  ): Promise<{
    success: boolean;
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    created_count: number;
    errors: Array<{ row: any; error: string }>;
    warnings: Array<{ row: any; warning: string }>;
    instructions?: string;
    transactions?: Array<{
      id: number;
      type: string;
      amount: number;
      date: string;
      description: string;
    }>;
    dry_run?: boolean;
    preview?: any[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams: Record<string, string> = {};
    if (params?.bank_account_id) {
      queryParams.bank_account_id = params.bank_account_id.toString();
    }
    if (params?.dry_run !== undefined) {
      queryParams.dry_run = params.dry_run.toString();
    }

    const response = await apiClient.post<{
      success?: boolean;
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      created_count?: number;
      errors: Array<{ row: any; error: string }>;
      warnings: Array<{ row: any; warning: string }>;
      instructions?: string;
      transactions?: Array<{
        id: number;
        type: string;
        amount: number;
        date: string;
        description: string;
      }>;
      dry_run?: boolean;
      preview?: any[];
    }>('/v1/finances/tresorerie/import', formData, {
      params: queryParams,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = extractApiData<{
      success?: boolean;
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      created_count?: number;
      errors?: Array<{ row: any; error: string }>;
      warnings?: Array<{ row: any; warning: string }>;
      instructions?: string;
      transactions?: Array<{
        id: number;
        type: string;
        amount: number;
        date: string;
        description: string;
      }>;
      dry_run?: boolean;
      preview?: any[];
    }>(response);
    if (!data || typeof data !== 'object') {
      throw new Error('Failed to import transactions');
    }
    return {
      success: data.success ?? true,
      total_rows: data.total_rows,
      valid_rows: data.valid_rows,
      invalid_rows: data.invalid_rows,
      created_count: data.created_count ?? 0,
      errors: data.errors || [],
      warnings: data.warnings || [],
      instructions: data.instructions,
      transactions: data.transactions,
      dry_run: data.dry_run,
      preview: data.preview,
    };
  },

  downloadImportTemplate: async (format: 'zip' | 'csv' | 'excel' = 'zip'): Promise<Blob> => {
    // Use axios directly for blob responses
    const axios = (await import('axios')).default;
    const { getApiUrl } = await import('../api');
    const { TokenStorage } = await import('../auth/tokenStorage');
    
    const apiUrl = getApiUrl();
    const token = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
    
    const response = await axios.get(`${apiUrl}/api/v1/finances/tresorerie/import/template`, {
      params: { format },
      responseType: 'blob',
      withCredentials: true,
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
    });
    
    // Check if response is actually an error (blob containing JSON error)
    if (response.status >= 400) {
      const text = await (response.data as Blob).text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.detail || 'Failed to download template');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Failed to download template') {
          throw e;
        }
        throw new Error('Failed to download template');
      }
    }
    
    return response.data as Blob;
  },
};
