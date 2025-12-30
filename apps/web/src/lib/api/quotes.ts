/**
 * Quotes API
 * API client for commercial quotes endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Quote {
  id: number;
  quote_number: string;
  company_id: number | null;
  company_name?: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  status: string;
  valid_until: string | null;
  notes: string | null;
  user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteCreate {
  quote_number?: string;
  company_id?: number | null;
  title: string;
  description?: string | null;
  amount?: number | null;
  currency?: string;
  status?: string;
  valid_until?: string | null;
  notes?: string | null;
}

export interface QuoteUpdate extends Partial<QuoteCreate> {}

/**
 * Quotes API client
 */
export const quotesAPI = {
  /**
   * Get list of quotes with pagination
   */
  list: async (skip = 0, limit = 100, company_id?: number, status?: string): Promise<Quote[]> => {
    const response = await apiClient.get<Quote[]>('/v1/commercial/quotes', {
      params: { 
        skip, 
        limit,
        company_id,
        status,
        _t: Date.now(),
      },
    });
    
    const data = extractApiData<Quote[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get a quote by ID
   */
  get: async (quoteId: number): Promise<Quote> => {
    const response = await apiClient.get<Quote>(`/v1/commercial/quotes/${quoteId}`);
    const data = extractApiData<Quote>(response);
    if (!data) {
      throw new Error(`Quote not found: ${quoteId}`);
    }
    return data;
  },

  /**
   * Create a new quote
   */
  create: async (quote: QuoteCreate): Promise<Quote> => {
    const response = await apiClient.post<Quote>('/v1/commercial/quotes', quote);
    const data = extractApiData<Quote>(response);
    if (!data) {
      throw new Error('Failed to create quote: no data returned');
    }
    return data;
  },

  /**
   * Update a quote
   */
  update: async (quoteId: number, quote: QuoteUpdate): Promise<Quote> => {
    const response = await apiClient.put<Quote>(`/v1/commercial/quotes/${quoteId}`, quote);
    const data = extractApiData<Quote>(response);
    if (!data) {
      throw new Error('Failed to update quote: no data returned');
    }
    return data;
  },

  /**
   * Delete a quote
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/commercial/quotes/${id}`);
  },
};
