/**
 * Expense Accounts API
 * API client for expense accounts endpoints
 */

import { apiClient } from '../client';
import { extractApiData } from '../utils';

export type ExpenseAccountStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'needs_clarification';

export interface ExpenseAccount {
  id: number;
  account_number: string;
  employee_id: number;
  employee_name?: string | null;
  title: string;
  description?: string | null;
  status: ExpenseAccountStatus;
  expense_period_start?: string | null; // ISO date string
  expense_period_end?: string | null; // ISO date string
  total_amount: string; // Decimal as string
  currency: string;
  submitted_at?: string | null; // ISO date string
  reviewed_at?: string | null; // ISO date string
  reviewed_by_id?: number | null;
  reviewer_name?: string | null;
  review_notes?: string | null;
  clarification_request?: string | null;
  rejection_reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseAccountCreate {
  employee_id: number;
  title: string;
  description?: string | null;
  expense_period_start?: string | null; // ISO date string
  expense_period_end?: string | null; // ISO date string
  total_amount: string; // Decimal as string
  currency?: string;
  metadata?: Record<string, unknown> | null;
}

export interface ExpenseAccountUpdate {
  title?: string;
  description?: string | null;
  expense_period_start?: string | null;
  expense_period_end?: string | null;
  total_amount?: string;
  currency?: string;
  metadata?: Record<string, unknown> | null;
}

export interface ExpenseAccountAction {
  notes?: string | null;
  clarification_request?: string | null;
  rejection_reason?: string | null;
}

export interface ExpenseExtractionResult {
  title?: string | null;
  description?: string | null;
  total_amount?: string | null;
  currency?: string | null;
  expense_period_start?: string | null;
  expense_period_end?: string | null;
  metadata?: Record<string, unknown> | null;
  confidence: number;
  extracted_items?: Array<{
    description: string;
    amount: string;
    quantity?: number;
  }> | null;
}

/**
 * Expense Accounts API client
 */
export const expenseAccountsAPI = {
  /**
   * Get list of expense accounts with pagination and filters
   */
  list: async (
    skip = 0,
    limit = 100,
    status?: ExpenseAccountStatus,
    employee_id?: number,
    search?: string
  ): Promise<ExpenseAccount[]> => {
    const params: Record<string, any> = { 
      skip: Number(skip), 
      limit: Number(limit),
      _t: Date.now() 
    };
    if (status) params.status = status;
    if (employee_id !== undefined && employee_id !== null) {
      params.employee_id = Number(employee_id);
    }
    if (search) params.search = search;

    const response = await apiClient.get<ExpenseAccount[]>('/v1/finances/compte-depenses', { 
      params,
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (typeof value === 'number') {
              searchParams.append(key, value.toString());
            } else {
              searchParams.append(key, String(value));
            }
          }
        });
        return searchParams.toString();
      }
    });
    const data = extractApiData<ExpenseAccount[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get an expense account by ID
   */
  get: async (expenseAccountId: number): Promise<ExpenseAccount> => {
    const response = await apiClient.get<ExpenseAccount>(`/v1/finances/compte-depenses/${expenseAccountId}`);
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error(`Expense account not found: ${expenseAccountId}`);
    }
    return data;
  },

  /**
   * Create a new expense account
   */
  create: async (expenseAccount: ExpenseAccountCreate): Promise<ExpenseAccount> => {
    const response = await apiClient.post<ExpenseAccount>('/v1/finances/compte-depenses', expenseAccount);
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to create expense account: no data returned');
    }
    return data;
  },

  /**
   * Update an expense account
   */
  update: async (expenseAccountId: number, expenseAccount: ExpenseAccountUpdate): Promise<ExpenseAccount> => {
    const response = await apiClient.put<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}`, 
      expenseAccount
    );
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to update expense account: no data returned');
    }
    return data;
  },

  /**
   * Delete an expense account
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/compte-depenses/${id}`);
  },

  /**
   * Submit an expense account for review
   */
  submit: async (expenseAccountId: number): Promise<ExpenseAccount> => {
    const response = await apiClient.post<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}/submit`
    );
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to submit expense account: no data returned');
    }
    return data;
  },

  /**
   * Approve an expense account
   */
  approve: async (expenseAccountId: number, action: ExpenseAccountAction): Promise<ExpenseAccount> => {
    const response = await apiClient.post<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}/approve`,
      action
    );
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to approve expense account: no data returned');
    }
    return data;
  },

  /**
   * Reject an expense account
   */
  reject: async (expenseAccountId: number, action: ExpenseAccountAction): Promise<ExpenseAccount> => {
    const response = await apiClient.post<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}/reject`,
      action
    );
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to reject expense account: no data returned');
    }
    return data;
  },

  /**
   * Request clarification for an expense account
   */
  requestClarification: async (
    expenseAccountId: number, 
    action: ExpenseAccountAction
  ): Promise<ExpenseAccount> => {
    const response = await apiClient.post<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}/request-clarification`,
      action
    );
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to request clarification: no data returned');
    }
    return data;
  },

  /**
   * Respond to clarification request (employee only)
   */
  respondClarification: async (
    expenseAccountId: number,
    response: string
  ): Promise<ExpenseAccount> => {
    const response_data = await apiClient.post<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}/respond-clarification`,
      { response }
    );
    const data = extractApiData<ExpenseAccount>(response_data);
    if (!data) {
      throw new Error('Failed to respond to clarification: no data returned');
    }
    return data;
  },

  /**
   * Set expense account status to under review
   */
  setUnderReview: async (expenseAccountId: number): Promise<ExpenseAccount> => {
    const response = await apiClient.post<ExpenseAccount>(
      `/v1/finances/compte-depenses/${expenseAccountId}/set-under-review`
    );
    const data = extractApiData<ExpenseAccount>(response);
    if (!data) {
      throw new Error('Failed to set expense account under review: no data returned');
    }
    return data;
  },

  /**
   * Extract expense account details from an image or PDF using OCR + AI
   */
  extractFromDocument: async (file: File): Promise<ExpenseExtractionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<ExpenseExtractionResult>(
      '/v1/finances/compte-depenses/extract-from-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    const data = extractApiData<ExpenseExtractionResult>(response);
    if (!data) {
      throw new Error('Failed to extract expense data: no data returned');
    }
    return data;
  },
};
