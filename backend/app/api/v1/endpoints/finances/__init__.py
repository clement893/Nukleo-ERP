"""
Finances Module Endpoints
API endpoints for managing finances, invoices, reports, and expense accounts
"""

from .facturations import router as facturations_router
from .rapport import router as rapport_router
from .compte_depenses import router as compte_depenses_router

__all__ = [
    "facturations_router",
    "rapport_router",
    "compte_depenses_router",
]
