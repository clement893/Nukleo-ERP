/**
 * Client Portal Module API
 * Unified API client for client portal operations
 * 
 * This module provides a unified interface for all client portal operations:
 * - Dashboard
 * - Invoices
 * - Projects
 * - Tickets
 * - Orders
 */

// Re-export Client Portal API as unified interface
export {
  clientPortalAPI,
  type ClientDashboardStats,
  type ClientInvoice,
  type ClientInvoiceListResponse,
  type ClientProject,
  type ClientProjectListResponse,
  type ClientTicket,
  type ClientTicketListResponse,
  type ClientOrder,
  type ClientOrderListResponse,
} from './client-portal';

// Alias for convenience
export const clientPortalModuleAPI = clientPortalAPI;
