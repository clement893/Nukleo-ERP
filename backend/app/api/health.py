"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
    }


@router.get("/api/health")
async def api_health_check():
    """API health check endpoint."""
    return {
        "status": "ok",
        "service": "backend",
        "version": "1.0.0",
    }
