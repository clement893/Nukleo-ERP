"""
ERP Module Router
Unified router for all ERP endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints.erp import (
    orders as orders_endpoints,
    invoices as invoices_endpoints,
    clients as clients_endpoints,
    inventory as inventory_endpoints,
    reports as reports_endpoints,
    dashboard as dashboard_endpoints,
)

# Create main router for ERP module
router = APIRouter(prefix="/erp", tags=["erp"])

# Include all ERP sub-routers
router.include_router(orders_endpoints.router)
router.include_router(invoices_endpoints.router)
router.include_router(clients_endpoints.router)
router.include_router(inventory_endpoints.router)
router.include_router(reports_endpoints.router)
router.include_router(dashboard_endpoints.router)
