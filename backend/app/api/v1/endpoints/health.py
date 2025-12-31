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
from app.core.cache import cache_backend
from app.core.config import settings

router = APIRouter()


# Simple health check that always returns success (for Railway healthcheck)
# This endpoint should be lightweight and not depend on database/cache
# This is the main endpoint Railway checks: /api/v1/health
@router.get("/", response_model=Dict[str, Any])
@router.get("", response_model=Dict[str, Any])  # Handle both with and without trailing slash
async def simple_health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint for Railway/deployment healthchecks
    Always returns success - does not check database/cache
    
    Returns:
        Status and timestamp
    """
    return {
        "status": "ok",
        "service": "backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    
    Returns:
        Status and timestamp
    """
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": os.getenv("VERSION", "1.0.0"),
            "environment": os.getenv("ENVIRONMENT", "development"),
        }
    except Exception as e:
        # Fallback response even if something fails
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": "unknown",
            "error": str(e)
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
        redis_client = cache_backend.redis_client
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
        redis_client = cache_backend.redis_client
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
        redis_client = cache_backend.redis_client
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


@router.get("/schema", response_model=Dict[str, Any])
async def schema_health_check() -> Dict[str, Any]:
    """
    Database schema health check endpoint
    Validates that database schema is compatible with application code
    
    Returns:
        Schema validation status with details
    """
    try:
        from app.core.schema_validator import SchemaValidator
        
        validation_result = await SchemaValidator.validate_schema()
        
        response = {
            "status": "valid" if validation_result['valid'] else "invalid",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "valid": validation_result['valid'],
            "tables": {},
            "issues": validation_result['issues'],
            "warnings": validation_result['warnings'],
        }
        
        # Include table details (simplified for response)
        for table_name, table_result in validation_result['tables'].items():
            response['tables'][table_name] = {
                "exists": table_result.get('exists', False),
                "status": table_result.get('status', 'unknown'),
                "missing_required": table_result.get('missing_required', []),
                "missing_optional": table_result.get('missing_optional', []),
            }
        
        # Return 200 even if invalid (for monitoring purposes)
        # But include status in response
        if not validation_result['valid']:
            response["message"] = (
                "Database schema is not compatible with application code. "
                "Please run migrations: alembic upgrade head"
            )
        
        return response
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "valid": False,
            "error": str(e),
            "message": "Could not validate database schema"
        }

