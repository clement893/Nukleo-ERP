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

// Import Client Portal API
import {
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

// Re-export types
export type {
  ClientDashboardStats,
  ClientInvoice,
  ClientInvoiceListResponse,
  ClientProject,
  ClientProjectListResponse,
  ClientTicket,
  ClientTicketListResponse,
  ClientOrder,
  ClientOrderListResponse,
};

// Re-export API
export { clientPortalAPI };

// Alias for convenience
export const clientPortalModuleAPI = clientPortalAPI;
