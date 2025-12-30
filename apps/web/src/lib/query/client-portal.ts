/**
 * React Query hooks for Client Portal Module
 * Unified hooks for all client portal operations
 */

// Note: Client Portal currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export Client Portal API
export { clientPortalAPI, clientPortalModuleAPI } from '../api/client-portal-unified';
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
} from '../api/client-portal-unified';

// Unified query keys for client portal module
export const clientPortalKeys = {
  all: ['client-portal'] as const,
  dashboard: () => [...clientPortalKeys.all, 'dashboard'] as const,
  invoices: () => [...clientPortalKeys.all, 'invoices'] as const,
  invoice: (id: number) => [...clientPortalKeys.invoices(), id] as const,
  projects: () => [...clientPortalKeys.all, 'projects'] as const,
  project: (id: number) => [...clientPortalKeys.projects(), id] as const,
  tickets: () => [...clientPortalKeys.all, 'tickets'] as const,
  ticket: (id: number) => [...clientPortalKeys.tickets(), id] as const,
  orders: () => [...clientPortalKeys.all, 'orders'] as const,
  order: (id: number) => [...clientPortalKeys.orders(), id] as const,
};
