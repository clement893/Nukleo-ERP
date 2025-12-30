"""
Client Portal Module Router
Unified router for all client portal endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints.client import (
    dashboard as dashboard_endpoints,
    invoices as invoices_endpoints,
    projects as projects_endpoints,
    tickets as tickets_endpoints,
    orders as orders_endpoints,
)

# Create main router for client portal module
router = APIRouter(prefix="/client", tags=["client-portal"])

# Include all client portal sub-routers
router.include_router(dashboard_endpoints.router)
router.include_router(invoices_endpoints.router)
router.include_router(projects_endpoints.router)
router.include_router(tickets_endpoints.router)
router.include_router(orders_endpoints.router)
