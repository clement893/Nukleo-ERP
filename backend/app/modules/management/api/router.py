"""
Management Module Router
Unified router for all management endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import teams as teams_endpoints, employees as employees_endpoints

# Create main router for management module
router = APIRouter(prefix="/management", tags=["management"])

# Include management sub-routers
router.include_router(teams_endpoints.router, prefix="/teams")
router.include_router(employees_endpoints.router, prefix="/employees")
