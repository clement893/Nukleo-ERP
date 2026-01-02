/**
 * Facturations API
 * API client for finance invoices (facturations)
 */

import { apiClient } from '../client';
import { extractApiData } from '../utils';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceInvoice {
  id: number;
  user_id: number;
  invoice_number: string;
  project_id?: number | null;
  client_data: ClientData;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  amount_paid: number;
  amount_due: number;
  paid_date?: string | null;
  last_reminder_date?: string | null;
  notes?: string | null;
  terms?: string | null;
  pdf_url?: string | null;
  created_at: string;
  updated_at: string;
  payments: Payment[];
}

export interface FinanceInvoiceCreate {
  invoice_number?: string;
  project_id?: number | null;
  client_data: ClientData;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string;
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes?: string | null;
  terms?: string | null;
}

export interface FinanceInvoiceUpdate {
  invoice_number?: string;
  project_id?: number | null;
  client_data?: ClientData;
  line_items?: InvoiceLineItem[];
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  issue_date?: string;
  due_date?: string;
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes?: string | null;
  terms?: string | null;
  last_reminder_date?: string | null;
}

export interface PaymentCreate {
  amount: number;
  payment_date: string;
  payment_method: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  reference?: string;
  notes?: string;
}

export interface FinanceInvoiceListResponse {
  items: FinanceInvoice[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Facturations API client
 */
export const facturationsAPI = {
  /**
   * Get list of invoices
   */
  list: async (options?: {
    skip?: number;
    limit?: number;
    status?: string;
    project_id?: number;
  }): Promise<FinanceInvoiceListResponse> => {
    const response = await apiClient.get<FinanceInvoiceListResponse>('/v1/finances/facturations', {
      params: {
        skip: options?.skip || 0,
        limit: options?.limit || 100,
        status: options?.status,
        project_id: options?.project_id,
      },
    });
    return extractApiData<FinanceInvoiceListResponse>(response);
  },

  /**
   * Get a specific invoice by ID
   */
  get: async (invoiceId: number): Promise<FinanceInvoice> => {
    const response = await apiClient.get<FinanceInvoice>(`/v1/finances/facturations/${invoiceId}`);
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Create a new invoice
   */
  create: async (invoiceData: FinanceInvoiceCreate): Promise<FinanceInvoice> => {
    const response = await apiClient.post<FinanceInvoice>('/v1/finances/facturations', invoiceData);
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Update an existing invoice
   */
  update: async (invoiceId: number, invoiceData: FinanceInvoiceUpdate): Promise<FinanceInvoice> => {
    const response = await apiClient.put<FinanceInvoice>(
      `/v1/finances/facturations/${invoiceId}`,
      invoiceData
    );
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Delete an invoice
   */
  delete: async (invoiceId: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/facturations/${invoiceId}`);
  },

  /**
   * Send an invoice (mark as sent)
   */
  send: async (invoiceId: number): Promise<FinanceInvoice> => {
    const response = await apiClient.post<FinanceInvoice>(
      `/v1/finances/facturations/${invoiceId}/send`
    );
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Record a payment for an invoice
   */
  createPayment: async (invoiceId: number, paymentData: PaymentCreate): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/v1/finances/facturations/${invoiceId}/payments`,
      paymentData
    );
    return extractApiData<Payment>(response);
  },

  /**
   * Delete a payment
   */
  deletePayment: async (invoiceId: number, paymentId: number): Promise<void> => {
    await apiClient.delete(`/v1/finances/facturations/${invoiceId}/payments/${paymentId}`);
  },
};
