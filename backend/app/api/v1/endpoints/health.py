"""
Health Check Endpoint
"""

from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter

router = APIRouter()


@router.get("/", response_model=Dict[str, str])
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint
    
    Returns:
        Status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready", response_model=Dict[str, str])
async def readiness_check() -> Dict[str, str]:
    """
    Readiness check endpoint
    
    Returns:
        Ready status
    """
    return {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

