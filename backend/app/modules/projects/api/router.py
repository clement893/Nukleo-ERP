"""
Projects Module Router
Unified router for all projects endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import projects as projects_endpoints

# Create main router for projects module
router = APIRouter(prefix="/projects", tags=["projects"])

# Include projects router
router.include_router(projects_endpoints.router)
