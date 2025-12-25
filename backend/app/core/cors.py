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
    
    # Use CORSMiddleware - it handles OPTIONS requests automatically
    # If cors_origins is empty, use wildcard for development (not recommended for production)
    if not cors_origins and not is_production:
        logger.warning("⚠️ No CORS origins configured, using wildcard (development only)")
        cors_origins = ["*"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins if cors_origins else ["*"],  # Fallback to wildcard if empty
        allow_credentials=True,  # Required for cookies
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=allowed_headers,
        expose_headers=exposed_headers,
        max_age=3600,  # Cache preflight requests for 1 hour
    )
    
    # Add a middleware to ensure CORS headers are always present
    # This is a safety net in case CORSMiddleware doesn't add headers for some routes
    # Note: In FastAPI, middlewares are executed in reverse order, so this will run AFTER CORSMiddleware
    @app.middleware("http")
    async def add_cors_headers_middleware(request: Request, call_next):
        """Ensure CORS headers are always present"""
        # Get origin from request
        origin = request.headers.get("Origin", "")
        
        # Process the request
        try:
            response = await call_next(request)
        except Exception as e:
            # If there's an error, create a response with CORS headers
            from fastapi.responses import JSONResponse
            logger.error(f"Error in request: {e}", exc_info=True)
            error_response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
            # Add CORS headers to error response
            if origin and cors_origins and validate_origin(origin, cors_origins):
                error_response.headers["Access-Control-Allow-Origin"] = origin
            elif "*" in cors_origins:
                error_response.headers["Access-Control-Allow-Origin"] = "*"
            elif cors_origins:
                error_response.headers["Access-Control-Allow-Origin"] = cors_origins[0]
            error_response.headers["Access-Control-Allow-Credentials"] = "true"
            return error_response
        
        # If response doesn't have CORS headers, add them
        # Check both the headers dict and the response object
        has_cors_origin = (
            "Access-Control-Allow-Origin" in response.headers or
            hasattr(response, "headers") and "Access-Control-Allow-Origin" in getattr(response, "headers", {})
        )
        
        if not has_cors_origin:
            # Validate origin
            if origin and cors_origins and validate_origin(origin, cors_origins):
                response.headers["Access-Control-Allow-Origin"] = origin
            elif "*" in cors_origins:
                response.headers["Access-Control-Allow-Origin"] = "*"
            elif cors_origins:
                response.headers["Access-Control-Allow-Origin"] = cors_origins[0]
            elif not is_production:
                # Development fallback
                response.headers["Access-Control-Allow-Origin"] = origin or "*"
            else:
                # Production: deny if no valid origin
                logger.warning(f"CORS: Origin {origin} not in allowed list {cors_origins}")
            
            # Add other CORS headers if not present
            if "Access-Control-Allow-Credentials" not in response.headers:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            if "Access-Control-Allow-Methods" not in response.headers:
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            if "Access-Control-Allow-Headers" not in response.headers:
                response.headers["Access-Control-Allow-Headers"] = ", ".join(allowed_headers)
        
        return response
    
    logger.info("✅ CORS middleware configured with tightened security")

