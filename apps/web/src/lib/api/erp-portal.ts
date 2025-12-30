/**
 * ERP/Employee Portal API Client
 * 
 * API functions for ERP/Employee portal endpoints.
 * All endpoints provide access to all system data (not scoped to user).
 * 
 * @module ERPPortalAPI
 * @see {@link https://docs.example.com/erp-portal ERP Portal Documentation}
 */

import { apiClient } from './client';

/**
 * ERP Dashboard Statistics
 */
export interface ERPDashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  total_clients: number;
  active_clients: number;
  total_products: number;
  low_stock_products: number;
  total_revenue: string; // Decimal as string
  pending_revenue: string; // Decimal as string
  department_stats?: Record<string, unknown>;
}

/**
 * ERP Invoice
 */
export interface ERPInvoice {
  id: number;
  invoice_number: string;
  amount: string;
  amount_paid: string;
  currency: string;
  status: string;
  invoice_date: string;
  due_date?: string;
  paid_at?: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * ERP Invoice List Response
 */
export interface ERPInvoiceListResponse {
  items: ERPInvoice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Client
 */
export interface ERPClient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address?: string;
  is_active: boolean;
  total_orders: number;
  total_spent: string; // Decimal as string
  created_at: string;
  updated_at: string;
}

/**
 * ERP Client List Response
 */
export interface ERPClientListResponse {
  items: ERPClient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Order
 */
export interface ERPOrder {
  id: number;
  order_number: string;
  status: string;
  total_amount: string; // Decimal as string
  order_date: string;
  delivery_date?: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * ERP Order List Response
 */
export interface ERPOrderListResponse {
  items: ERPOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Inventory Product
 */
export interface ERPInventoryProduct {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: string; // Decimal as string
  stock_quantity: number;
  low_stock_threshold: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

/**
 * ERP Inventory Product List Response
 */
export interface ERPInventoryProductListResponse {
  items: ERPInventoryProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Inventory Movement
 */
export interface ERPInventoryMovement {
  id: number;
  product_id: number;
  product_name?: string;
  movement_type: string; // 'in', 'out', 'adjustment'
  quantity: number;
  reference_type?: string; // 'order', 'invoice', etc.
  reference_id?: number;
  notes?: string;
  created_by_id?: number;
  created_by_name?: string;
  created_at: string;
}

/**
 * ERP Inventory Movement List Response
 */
export interface ERPInventoryMovementListResponse {
  items: ERPInventoryMovement[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Report
 */
export interface ERPReport {
  id: number;
  report_type: string;
  title: string;
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  filters?: Record<string, unknown>;
  generated_by_id?: number;
  generated_by_name?: string;
  created_at: string;
}

/**
 * ERP Report List Response
 */
export interface ERPReportListResponse {
  items: ERPReport[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * ERP Portal API
 * 
 * Provides methods to interact with ERP portal endpoints.
 * All methods require ERP portal permissions.
 */
export const erpPortalAPI = {
  /**
   * Get ERP dashboard statistics
   * 
   * @param department Optional department filter
   * @returns Dashboard statistics including orders, invoices, clients, products
   * @requires ERP_VIEW_REPORTS permission
   * @example
   * ```ts
   * const stats = await erpPortalAPI.getDashboardStats('sales');
   * logger.log('', { message: stats.total_orders });
   * ```
   */
  getDashboardStats: async (department?: string): Promise<ERPDashboardStats> => {
    const params = department ? { department } : undefined;
    const response = await apiClient.get<ERPDashboardStats>('/v1/erp/dashboard/stats', { params });
    if (!response.data) {
      throw new Error('Failed to fetch dashboard stats: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of all invoices
   * 
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of all invoices
   * @requires ERP_VIEW_INVOICES permission
   */
  getInvoices: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    client_id?: number;
  }): Promise<ERPInvoiceListResponse> => {
    const response = await apiClient.get<ERPInvoiceListResponse>('/v1/erp/invoices', { params });
    if (!response.data) {
      throw new Error('Failed to fetch invoices: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific invoice by ID
   * 
   * @param invoiceId Invoice ID
   * @returns Invoice details
   * @requires ERP_VIEW_INVOICES permission
   */
  getInvoice: async (invoiceId: number): Promise<ERPInvoice> => {
    const response = await apiClient.get<ERPInvoice>(`/v1/erp/invoices/${invoiceId}`);
    if (!response.data) {
      throw new Error('Failed to fetch invoice: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of all clients
   * 
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of all clients
   * @requires ERP_VIEW_CLIENTS permission
   */
  getClients: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<ERPClientListResponse> => {
    const response = await apiClient.get<ERPClientListResponse>('/v1/erp/clients', { params });
    if (!response.data) {
      throw new Error('Failed to fetch clients: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific client by ID
   * 
   * @param clientId Client ID
   * @returns Client details
   * @requires ERP_VIEW_CLIENTS permission
   */
  getClient: async (clientId: number): Promise<ERPClient> => {
    const response = await apiClient.get<ERPClient>(`/v1/erp/clients/${clientId}`);
    if (!response.data) {
      throw new Error('Failed to fetch client: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of all orders
   * 
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of all orders
   * @requires ERP_VIEW_ALL_ORDERS permission
   */
  getOrders: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    client_id?: number;
  }): Promise<ERPOrderListResponse> => {
    const response = await apiClient.get<ERPOrderListResponse>('/v1/erp/orders', { params });
    if (!response.data) {
      throw new Error('Failed to fetch orders: no data returned');
    }
    return response.data;
  },

  /**
   * Get a specific order by ID
   * 
   * @param orderId Order ID
   * @returns Order details
   * @requires ERP_VIEW_ALL_ORDERS permission
   */
  getOrder: async (orderId: number): Promise<ERPOrder> => {
    const response = await apiClient.get<ERPOrder>(`/v1/erp/orders/${orderId}`);
    if (!response.data) {
      throw new Error('Failed to fetch order: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of inventory products
   * 
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of inventory products
   * @requires ERP_VIEW_INVENTORY permission
   */
  getInventoryProducts: async (params?: {
    skip?: number;
    limit?: number;
    low_stock_only?: boolean;
  }): Promise<ERPInventoryProductListResponse> => {
    const response = await apiClient.get<ERPInventoryProductListResponse>('/v1/erp/inventory/products', { params });
    if (!response.data) {
      throw new Error('Failed to fetch inventory products: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of inventory movements
   * 
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of inventory movements
   * @requires ERP_VIEW_INVENTORY permission
   */
  getInventoryMovements: async (params?: {
    skip?: number;
    limit?: number;
    product_id?: number;
    movement_type?: string;
  }): Promise<ERPInventoryMovementListResponse> => {
    const response = await apiClient.get<ERPInventoryMovementListResponse>('/v1/erp/inventory/movements', { params });
    if (!response.data) {
      throw new Error('Failed to fetch inventory movements: no data returned');
    }
    return response.data;
  },

  /**
   * Get list of reports
   * 
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of reports
   * @requires ERP_VIEW_REPORTS permission
   */
  getReports: async (params?: {
    skip?: number;
    limit?: number;
    report_type?: string;
  }): Promise<ERPReportListResponse> => {
    const response = await apiClient.get<ERPReportListResponse>('/v1/erp/reports', { params });
    if (!response.data) {
      throw new Error('Failed to fetch reports: no data returned');
    }
    return response.data;
  },
};

