"""
FastAPI Main Application
Configured with OpenAPI/Swagger auto-generation
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.cache import init_cache, close_cache
from app.core.exceptions import AppException
from app.core.error_handler import (
    app_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler,
)
from app.core.rate_limit import setup_rate_limiting
from app.core.compression import CompressionMiddleware
from app.core.cache_headers import CacheHeadersMiddleware
from app.api.v1.router import api_router
from app.api import email as email_router
from app.api.webhooks import stripe as stripe_webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await init_db()
    await init_cache()
    from app.core.logging import logger
    import os
    logger.info(f"CORS Origins configured: {settings.CORS_ORIGINS}")
    logger.info(f"ENVIRONMENT: {os.getenv('ENVIRONMENT', 'NOT SET')}")
    logger.info(f"RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT', 'NOT SET')}")
    logger.info(f"RAILWAY_SERVICE_NAME: {os.getenv('RAILWAY_SERVICE_NAME', 'NOT SET')}")
    yield
    # Shutdown
    await close_cache()
    await close_db()


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Request logging middleware (before CORS to log all requests)
    @app.middleware("http")
    async def log_requests_middleware(request: Request, call_next):
        from app.core.logging import logger
        import time
        start_time = time.time()
        logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}")
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            logger.info(f"Request completed: {request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)")
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"Request failed: {request.method} {request.url.path} - {str(e)} ({process_time:.4f}s)", exc_info=True)
            raise

    # CORS Middleware - MUST be added first to handle preflight requests
    # Ensure CORS_ORIGINS is a list
    from app.core.logging import logger
    cors_origins = settings.CORS_ORIGINS
    if isinstance(cors_origins, str):
        cors_origins = [cors_origins]
    elif not isinstance(cors_origins, list):
        # Fallback to FRONTEND_URL or localhost if CORS_ORIGINS is not properly configured
        import os
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        cors_origins = [frontend_url]
        logger.warning(f"CORS_ORIGINS not properly configured, using FRONTEND_URL: {frontend_url}")
    
    logger.info(f"CORS Origins configured: {cors_origins}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        expose_headers=["X-Process-Time", "X-Timestamp", "X-Response-Time"],
    )

    # Compression Middleware (after CORS)
    app.add_middleware(CompressionMiddleware)

    # Cache Headers Middleware
    app.add_middleware(CacheHeadersMiddleware, default_max_age=300)

    # Rate Limiting (after CORS to allow preflight requests)
    # Can be disabled by setting DISABLE_RATE_LIMITING=true in environment
    import os
    if not os.getenv("DISABLE_RATE_LIMITING", "").lower() == "true":
        app = setup_rate_limiting(app)
        logger.info("Rate limiting enabled")
    else:
        logger.warning("Rate limiting is DISABLED - not recommended for production")

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Include email router (separate from v1)
    app.include_router(email_router.router)
    
    # Include webhooks (no prefix, no auth)
    app.include_router(stripe_webhook_router.router)

    # Register exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(PydanticValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Add security headers middleware
    @app.middleware("http")
    async def add_security_headers_middleware(request: Request, call_next):
        import time
        from datetime import datetime, timezone
        
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add timestamp headers
        response.headers["X-Response-Time"] = f"{process_time:.4f}s"
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Add security headers
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy (strict in production, relaxed in development)
        import os
        environment = os.getenv("ENVIRONMENT", "development")
        
        if environment == "production":
            # Strict CSP for production - no unsafe-inline or unsafe-eval
            # ⚠️ SECURITY NOTE: Production CSP is strict (no unsafe-inline/unsafe-eval)
            # Use nonces for inline scripts/styles in production
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self'; "  # Strict: no unsafe-inline/eval (use nonces)
                "style-src 'self'; "  # Strict: no unsafe-inline (use nonces)
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
        else:
            # Relaxed CSP for development
            # ⚠️ SECURITY NOTE: CSP is relaxed in development (unsafe-inline/unsafe-eval)
            # This is acceptable for dev but should be tightened in production using nonces
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Development only
                "style-src 'self' 'unsafe-inline'; "  # Development only
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-ancestors 'none';"
            )
        response.headers["Content-Security-Policy"] = csp_policy
        
        return response

    # Custom OpenAPI schema
    def custom_openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=settings.PROJECT_NAME,
            version=settings.VERSION,
            description=settings.DESCRIPTION,
            routes=app.routes,
        )

        # Add custom tags
        openapi_schema["tags"] = [
            {
                "name": "auth",
                "description": "Authentication endpoints",
            },
            {
                "name": "users",
                "description": "User management endpoints",
            },
            {
                "name": "health",
                "description": "Health check endpoints",
            },
        ]

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi

    return app


app = create_app()

