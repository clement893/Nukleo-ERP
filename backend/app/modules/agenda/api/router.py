"""
Agenda Module Router
Unified router for all agenda endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints.agenda import events as events_endpoints

# Create main router for agenda module
router = APIRouter(prefix="/agenda", tags=["agenda"])

# Include agenda sub-routers
router.include_router(events_endpoints.router)
