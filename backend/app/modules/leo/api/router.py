"""
Leo Module Router
Main router for Leo AI assistant module
"""

from fastapi import APIRouter

from .endpoints import documentation

# Create main router for Leo module
router = APIRouter(prefix="/ai/leo", tags=["leo"])

# Include endpoint routers
router.include_router(documentation.router)