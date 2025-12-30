"""
ERP Module Schemas
Pydantic schemas for ERP operations
"""

# Re-export all ERP schemas from app.schemas.erp
from app.schemas.erp import (
    ERPOrderBase,
    ERPOrderResponse,
    ERPOrderListResponse,
    ERPInventoryProductBase,
    ERPInventoryProductResponse,
    ERPInventoryProductListResponse,
    ERPInventoryMovementBase,
    ERPInventoryMovementResponse,
    ERPInventoryMovementListResponse,
    ERPClientBase,
    ERPClientResponse,
    ERPClientListResponse,
    ERPInvoiceBase,
    ERPInvoiceResponse,
    ERPInvoiceListResponse,
    ERPReportBase,
    ERPReportResponse,
    ERPReportListResponse,
    ERPDashboardStats,
)

__all__ = [
    "ERPOrderBase",
    "ERPOrderResponse",
    "ERPOrderListResponse",
    "ERPInventoryProductBase",
    "ERPInventoryProductResponse",
    "ERPInventoryProductListResponse",
    "ERPInventoryMovementBase",
    "ERPInventoryMovementResponse",
    "ERPInventoryMovementListResponse",
    "ERPClientBase",
    "ERPClientResponse",
    "ERPClientListResponse",
    "ERPInvoiceBase",
    "ERPInvoiceResponse",
    "ERPInvoiceListResponse",
    "ERPReportBase",
    "ERPReportResponse",
    "ERPReportListResponse",
    "ERPDashboardStats",
]
