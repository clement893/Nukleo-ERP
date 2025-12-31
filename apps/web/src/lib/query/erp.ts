/**
 * React Query hooks for ERP Module
 * Unified hooks for all ERP operations
 */

// Note: ERP Portal currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation

// Re-export ERP Portal API
export { erpAPI, erpPortalAPI } from '../api/erp';
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
} from '../api/erp';

// Unified query keys for ERP module
export const erpKeys = {
  all: ['erp'] as const,
  dashboard: () => [...erpKeys.all, 'dashboard'] as const,
  orders: () => [...erpKeys.all, 'orders'] as const,
  invoices: () => [...erpKeys.all, 'invoices'] as const,
  inventory: () => [...erpKeys.all, 'inventory'] as const,
  reports: () => [...erpKeys.all, 'reports'] as const,
};
