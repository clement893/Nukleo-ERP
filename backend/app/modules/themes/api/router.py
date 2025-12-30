"""
Themes Module Router
Unified router for all themes endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import themes as themes_endpoints, theme_fonts as theme_fonts_endpoints

# Create main router for themes module
router = APIRouter(prefix="/themes", tags=["themes"])

# Include all themes sub-routers
router.include_router(themes_endpoints.router)
router.include_router(theme_fonts_endpoints.router, prefix="/fonts")
