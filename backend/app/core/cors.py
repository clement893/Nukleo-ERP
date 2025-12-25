"""
Enhanced CORS Configuration
Tightened CORS settings for better security
"""

import os
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request

from app.core.config import settings
from app.core.logging import logger


def validate_origin(origin: str, allowed_origins: List[str]) -> bool:
    """Validate origin against allowed origins list"""
    # Exact match
    if origin in allowed_origins:
        return True
    
    # Wildcard subdomain matching (e.g., *.example.com)
    for allowed in allowed_origins:
        if allowed.startswith("*."):
            domain = allowed[2:]  # Remove "*."
            if origin.endswith(domain):
                return True
    
    return False


def get_cors_origins() -> List[str]:
    """Get CORS origins with validation and environment-based defaults"""
    import os
    
    # Detect environment
    is_production = (
        os.getenv("ENVIRONMENT", "").lower() == "production" or
        os.getenv("RAILWAY_ENVIRONMENT") is not None
    )
    
    # Get origins from settings
    cors_origins = settings.CORS_ORIGINS
    
    # Ensure it's a list
    if isinstance(cors_origins, str):
        cors_origins = [cors_origins]
    
    # In production, be strict - only allow explicitly configured origins
    if is_production:
        if not cors_origins or cors_origins == ["http://localhost:3000"]:
            logger.warning(
                "⚠️ CORS_ORIGINS not properly configured for production! "
                "Using FRONTEND_URL as fallback. This should be explicitly set."
            )
            frontend_url = os.getenv("FRONTEND_URL")
            if frontend_url:
                cors_origins = [frontend_url]
            else:
                logger.error(
                    "❌ No CORS origins configured for production! "
                    "Set CORS_ORIGINS or FRONTEND_URL environment variable."
                )
                cors_origins = []  # Deny all in production if not configured
    
    # Remove duplicates and empty strings
    cors_origins = list(set([origin.strip() for origin in cors_origins if origin.strip()]))
    
    logger.info(f"✅ CORS Origins configured ({len(cors_origins)}): {cors_origins}")
    
    return cors_origins


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with tightened security"""
    cors_origins = get_cors_origins()
    
    # Determine if we're in production
    is_production = (
        os.getenv("ENVIRONMENT", "").lower() == "production" or
        os.getenv("RAILWAY_ENVIRONMENT") is not None
    )
    
    # Allowed headers - minimal set for security
    allowed_headers = [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-API-Key",  # For API key authentication
        "X-Signature",  # For request signing
        "X-Timestamp",  # For request signing
        "X-CSRF-Token",  # For CSRF protection
    ]
    
    # Exposed headers - minimal set
    exposed_headers = [
        "X-Process-Time",
        "X-Timestamp",
        "X-Response-Time",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,  # Required for cookies
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=allowed_headers,
        expose_headers=exposed_headers,
        max_age=3600,  # Cache preflight requests for 1 hour
    )
    
    # Add explicit OPTIONS handler for all routes to ensure preflight requests are handled
    @app.options("/{full_path:path}")
    async def options_handler(request: Request):
        """Explicit OPTIONS handler for CORS preflight requests"""
        from fastapi.responses import Response
        
        # Get origin from request
        origin = request.headers.get("Origin", "")
        
        # Validate origin against allowed origins
        if origin and validate_origin(origin, cors_origins):
            allow_origin = origin
        elif "*" in cors_origins:
            allow_origin = "*"
        elif cors_origins:
            # Use first allowed origin as fallback
            allow_origin = cors_origins[0]
        else:
            # No CORS configured, deny
            return Response(status_code=403)
        
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": allow_origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": ", ".join(allowed_headers),
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "3600",
            }
        )
    
    logger.info("✅ CORS middleware configured with tightened security")

