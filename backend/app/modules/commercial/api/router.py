"""
Commercial Module Router
Unified router for all commercial endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints.commercial import (
    contacts as contacts_endpoints,
    companies as companies_endpoints,
    opportunities as opportunities_endpoints,
    quotes as quotes_endpoints,
    submissions as submissions_endpoints,
)

# Create main router for commercial module
router = APIRouter(prefix="/commercial", tags=["commercial"])

# Include all commercial sub-routers
router.include_router(contacts_endpoints.router)
router.include_router(companies_endpoints.router)
router.include_router(opportunities_endpoints.router)
router.include_router(quotes_endpoints.router)
router.include_router(submissions_endpoints.router)
