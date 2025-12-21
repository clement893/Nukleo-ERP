/**
 * Email API Client
 * 
 * Client for sending transactional emails via SendGrid backend API.
 * Provides methods for all email types including welcome, invoices, subscriptions, etc.
 * 
 * All methods return promises and handle errors appropriately.
 * 
 * @example
 * ```typescript
 * import { emailAPI } from '@/lib/email/client';
 * 
 * // Send welcome email
 * await emailAPI.sendWelcome('user@example.com');
 * 
 * // Send invoice
 * await emailAPI.sendInvoice({
 *   to_email: 'user@example.com',
 *   name: 'John Doe',
 *   invoice_number: 'INV-001',
 *   invoice_date: '2025-01-27',
 *   amount: 99.99,
 *   currency: 'EUR'
 * });
 * ```
 */

import { apiClient } from '@/lib/api/client';

export interface SendEmailRequest {
  to_email: string;
  subject: string;
  html_content: string;
  text_content?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailResponse {
  status: string;
  status_code?: number;
  message_id?: string;
  to: string;
  task_id?: string;
}

export interface InvoiceEmailRequest {
  to_email: string;
  name: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  currency?: string;
  invoice_url?: string;
  items?: Array<{ description: string; amount: number }>;
}

export interface SubscriptionEmailRequest {
  to_email: string;
  name: string;
  plan_name: string;
  amount: number;
  currency?: string;
}

export interface SubscriptionCancelledEmailRequest {
  to_email: string;
  name: string;
  plan_name: string;
  end_date: string;
}

export interface TrialEndingEmailRequest {
  to_email: string;
  name: string;
  days_remaining: number;
  upgrade_url?: string;
}

export const emailAPI = {
  /**
   * Send a custom email
   */
  send: async (data: SendEmailRequest): Promise<EmailResponse> => {
    return apiClient.post('/email/send', data);
  },

  /**
   * Send a test email
   */
  sendTest: async (toEmail: string): Promise<EmailResponse> => {
    return apiClient.post('/email/test', { to_email: toEmail });
  },

  /**
   * Send welcome email
   */
  sendWelcome: async (toEmail: string, name?: string): Promise<EmailResponse> => {
    return apiClient.post('/email/welcome', { to_email: toEmail });
  },

  /**
   * Send invoice email
   */
  sendInvoice: async (data: InvoiceEmailRequest): Promise<EmailResponse> => {
    return apiClient.post('/email/invoice', data);
  },

  /**
   * Send subscription created email
   */
  sendSubscriptionCreated: async (data: SubscriptionEmailRequest): Promise<EmailResponse> => {
    return apiClient.post('/email/subscription/created', data);
  },

  /**
   * Send subscription cancelled email
   */
  sendSubscriptionCancelled: async (data: SubscriptionCancelledEmailRequest): Promise<EmailResponse> => {
    return apiClient.post('/email/subscription/cancelled', data);
  },

  /**
   * Send trial ending email
   */
  sendTrialEnding: async (data: TrialEndingEmailRequest): Promise<EmailResponse> => {
    return apiClient.post('/email/trial/ending', data);
  },

  /**
   * Check email service health
   */
  health: async (): Promise<{ configured: boolean; from_email?: string; from_name?: string; status: string }> => {
    return apiClient.get('/email/health');
  },

  /**
   * Get email API info
   */
  info: async (): Promise<any> => {
    return apiClient.get('/email/info');
  },
};

