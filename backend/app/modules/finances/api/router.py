"""
Finances Module Router
Unified router for all finances endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints.finances import (
    facturations as facturations_endpoints,
    rapport as rapport_endpoints,
    compte_depenses as compte_depenses_endpoints,
)

# Create main router for finances module
router = APIRouter(prefix="/finances", tags=["finances"])

# Include all finances sub-routers
router.include_router(facturations_endpoints.router)
router.include_router(rapport_endpoints.router)
router.include_router(compte_depenses_endpoints.router)
