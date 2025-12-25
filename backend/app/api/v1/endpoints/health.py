"""
Health Check Endpoint
Comprehensive health checks for deployment verification
"""

from datetime import datetime, timezone
from typing import Dict, Any
import os
import sys

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.database import AsyncSessionLocal, engine
from app.core.cache import get_redis_client
from app.core.config import settings

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    
    Returns:
        Status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("VERSION", "1.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@router.get("/ready", response_model=Dict[str, Any])
async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check endpoint
    Checks if the service is ready to accept traffic
    
    Returns:
        Ready status with component checks
    """
    checks = {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {},
    }
    
    # Database check
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            checks["checks"]["database"] = "healthy"
    except Exception as e:
        checks["checks"]["database"] = f"unhealthy: {str(e)}"
        checks["status"] = "not_ready"
    
    # Cache check (optional)
    try:
        redis_client = get_redis_client()
        if redis_client:
            await redis_client.ping()
            checks["checks"]["cache"] = "healthy"
        else:
            checks["checks"]["cache"] = "not_configured"
    except Exception as e:
        checks["checks"]["cache"] = f"unhealthy: {str(e)}"
        # Cache is optional, don't fail readiness if cache is down
    
    if checks["status"] == "not_ready":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=checks
        )
    
    return checks


@router.get("/live", response_model=Dict[str, Any])
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check endpoint
    Kubernetes-style liveness probe
    
    Returns:
        Liveness status
    """
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/startup", response_model=Dict[str, Any])
async def startup_check() -> Dict[str, Any]:
    """
    Startup check endpoint
    Kubernetes-style startup probe
    
    Returns:
        Startup status with all component checks
    """
    checks = {
        "status": "started",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("VERSION", "1.0.0"),
        "checks": {},
    }
    
    all_healthy = True
    
    # Database check
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            checks["checks"]["database"] = {
                "status": "healthy",
                "connection_pool_size": engine.pool.size(),
            }
    except Exception as e:
        checks["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        all_healthy = False
    
    # Cache check
    try:
        redis_client = get_redis_client()
        if redis_client:
            await redis_client.ping()
            checks["checks"]["cache"] = {
                "status": "healthy",
                "configured": True,
            }
        else:
            checks["checks"]["cache"] = {
                "status": "not_configured",
                "configured": False,
            }
    except Exception as e:
        checks["checks"]["cache"] = {
            "status": "unhealthy",
            "error": str(e),
            "configured": True,
        }
        # Cache is optional, don't fail startup
    
    # Environment check
    checks["checks"]["environment"] = {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "debug": os.getenv("DEBUG", "false"),
    }
    
    if not all_healthy:
        checks["status"] = "starting"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=checks
        )
    
    return checks


@router.get("/detailed", response_model=Dict[str, Any])
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check endpoint
    Comprehensive health check for deployment verification
    
    Returns:
        Detailed status of all components
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("VERSION", "1.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "components": {},
    }
    
    overall_healthy = True
    
    # Database detailed check
    db_status = {"status": "healthy"}
    try:
        async with AsyncSessionLocal() as session:
            # Test query
            result = await session.execute(text("SELECT version()"))
            db_version = result.scalar()
            db_status["version"] = db_version[:50] if db_version else "unknown"
            
            # Check connection pool
            db_status["pool_size"] = engine.pool.size()
            db_status["checked_out"] = engine.pool.checkedout()
            db_status["overflow"] = engine.pool.overflow()
            
            # Test write capability
            await session.execute(text("SELECT 1"))
            await session.commit()
            db_status["write_capable"] = True
    except Exception as e:
        db_status["status"] = "unhealthy"
        db_status["error"] = str(e)
        overall_healthy = False
    
    health_status["components"]["database"] = db_status
    
    # Cache detailed check
    cache_status = {"status": "not_configured"}
    try:
        redis_client = get_redis_client()
        if redis_client:
            await redis_client.ping()
            cache_status["status"] = "healthy"
            cache_status["configured"] = True
            # Get cache info
            try:
                info = await redis_client.info("server")
                cache_status["redis_version"] = info.get("redis_version", "unknown")
            except:
                pass
        else:
            cache_status["configured"] = False
    except Exception as e:
        cache_status["status"] = "unhealthy"
        cache_status["error"] = str(e)
        cache_status["configured"] = True
        # Cache is optional
    
    health_status["components"]["cache"] = cache_status
    
    # Application info
    health_status["components"]["application"] = {
        "status": "healthy",
        "python_version": sys.version.split()[0],
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
    
    if not overall_healthy:
        health_status["status"] = "degraded"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status

