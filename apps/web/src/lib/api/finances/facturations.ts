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

  /**
   * Generate and download PDF for an invoice
   */
  generatePDF: async (invoiceId: number): Promise<void> => {
    const response = await apiClient.get(`/v1/finances/facturations/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture_${invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Send invoice by email
   */
  sendEmail: async (invoiceId: number): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post(`/v1/finances/facturations/${invoiceId}/send-email`);
    return extractApiData<{ message: string; email: string }>(response);
  },

  /**
   * Duplicate an invoice
   */
  duplicate: async (invoiceId: number): Promise<FinanceInvoice> => {
    const response = await apiClient.post<FinanceInvoice>(`/v1/finances/facturations/${invoiceId}/duplicate`);
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Cancel an invoice
   */
  cancel: async (invoiceId: number): Promise<FinanceInvoice> => {
    const response = await apiClient.post<FinanceInvoice>(`/v1/finances/facturations/${invoiceId}/cancel`);
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Send reminder for an invoice
   */
  remind: async (invoiceId: number): Promise<FinanceInvoice> => {
    const response = await apiClient.post<FinanceInvoice>(`/v1/finances/facturations/${invoiceId}/remind`);
    return extractApiData<FinanceInvoice>(response);
  },

  /**
   * Export invoices to CSV or Excel
   */
  export: async (options?: {
    format?: 'csv' | 'excel';
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<void> => {
    const response = await apiClient.get(`/v1/finances/facturations/export`, {
      params: {
        format: options?.format || 'csv',
        status: options?.status,
        start_date: options?.start_date,
        end_date: options?.end_date,
      },
      responseType: 'blob',
    });
    const format = options?.format || 'csv';
    const blob = new Blob([response.data as BlobPart], {
      type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factures_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download import template
   */
  downloadTemplate: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    const response = await apiClient.get(`/v1/finances/facturations/import/template`, {
      params: { format },
      responseType: 'blob',
    });
    const blob = new Blob([response.data as BlobPart], {
      type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_factures.${format === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get invoice statistics
   */
  getStats: async (options?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total: { amount: number; count: number };
    paid: { amount: number; count: number };
    pending: { amount: number; count: number };
    overdue: { amount: number; count: number };
    by_status: {
      draft: number;
      sent: number;
      paid: number;
      partial: number;
      overdue: number;
      cancelled: number;
    };
  }> => {
    const response = await apiClient.get(`/v1/finances/facturations/stats`, {
      params: {
        start_date: options?.start_date,
        end_date: options?.end_date,
      },
    });
    return extractApiData(response);
  },
};
