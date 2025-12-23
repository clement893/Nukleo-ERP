"""
API v1 router registration.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import themes

api_router = APIRouter()

# Register theme endpoints
api_router.include_router(
    themes.router,
    prefix="/themes",
    tags=["themes"]
)
