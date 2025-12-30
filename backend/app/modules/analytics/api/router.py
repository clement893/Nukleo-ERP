"""
Analytics Module Router
Unified router for all analytics endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import analytics as analytics_endpoints, insights as insights_endpoints, reports as reports_endpoints

# Create main router for analytics module
router = APIRouter(prefix="/analytics", tags=["analytics"])

# Include all analytics sub-routers
router.include_router(analytics_endpoints.router)
router.include_router(insights_endpoints.router, prefix="/insights")
router.include_router(reports_endpoints.router, prefix="/reports")
