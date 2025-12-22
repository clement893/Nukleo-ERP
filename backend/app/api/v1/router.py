"""
API v1 Router
Main router that includes all v1 endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, users, rbac, teams, invitations, subscriptions

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rbac.router, tags=["rbac"])
api_router.include_router(teams.router, tags=["teams"])
api_router.include_router(invitations.router, tags=["invitations"])
api_router.include_router(subscriptions.router, tags=["subscriptions"])

