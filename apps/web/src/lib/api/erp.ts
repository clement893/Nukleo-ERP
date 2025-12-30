/**
 * ERP Module API
 * Unified API client for ERP operations
 * 
 * This module provides a unified interface for all ERP operations:
 * - Orders
 * - Invoices
 * - Clients
 * - Inventory
 * - Reports
 * - Dashboard
 */

// Re-export ERP Portal API as unified ERP API
export {
  erpPortalAPI,
  type ERPDashboardStats,
  type ERPInvoice,
  type ERPInvoiceListResponse,
  type ERPClient,
  type ERPClientListResponse,
  type ERPOrder,
  type ERPOrderListResponse,
  type ERPInventoryProduct,
  type ERPInventoryProductListResponse,
  type ERPInventoryMovement,
  type ERPInventoryMovementListResponse,
  type ERPReport,
  type ERPReportListResponse,
} from './erp-portal';

// Alias for convenience
export const erpAPI = erpPortalAPI;
