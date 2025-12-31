/**
 * ERP Module API
 * Unified API client for ERP operations
 * 
 * This module provides a unified interface for all ERP operations:
 * - Orders
 * - Invoices
 * - Inventory
 * - Reports
 * - Dashboard
 */

// Import ERP Portal API
import {
  erpPortalAPI,
  type ERPDashboardStats,
  type ERPInvoice,
  type ERPInvoiceListResponse,
  type ERPOrder,
  type ERPOrderListResponse,
  type ERPInventoryProduct,
  type ERPInventoryProductListResponse,
  type ERPInventoryMovement,
  type ERPInventoryMovementListResponse,
  type ERPReport,
  type ERPReportListResponse,
} from './erp-portal';

// Re-export types
export type {
  ERPDashboardStats,
  ERPInvoice,
  ERPInvoiceListResponse,
  ERPOrder,
  ERPOrderListResponse,
  ERPInventoryProduct,
  ERPInventoryProductListResponse,
  ERPInventoryMovement,
  ERPInventoryMovementListResponse,
  ERPReport,
  ERPReportListResponse,
};

// Re-export API
export { erpPortalAPI };

// Alias for convenience
export const erpAPI = erpPortalAPI;
