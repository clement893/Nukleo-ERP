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
from app.core.migrations import ensure_theme_preference_column
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
from app.core.csrf import CSRFMiddleware
from app.core.request_limits import RequestSizeLimitMiddleware
from app.core.cors import setup_cors
from app.core.api_versioning import setup_api_versioning
from app.core.ip_whitelist import setup_ip_whitelist
from app.core.request_signing import RequestSigningMiddleware
from app.api.v1.router import api_router
from app.api import email as email_router
from app.api.webhooks import stripe as stripe_webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events"""
    from app.core.logging import logger
    import os
    
    # Startup
    await init_db()
    await init_cache()
    # Ensure required columns exist (auto-migration)
    await ensure_theme_preference_column()
    
    # Create recommended indexes (non-blocking, runs concurrently)
    try:
        from app.core.database_indexes import create_recommended_indexes, analyze_tables
        from app.core.database import AsyncSessionLocal
        
        async with AsyncSessionLocal() as session:
            index_results = await create_recommended_indexes(session)
            if index_results["created"]:
                logger.info(f"Created {len(index_results['created'])} indexes")
            if index_results["errors"]:
                logger.warning(f"Failed to create {len(index_results['errors'])} indexes")
            
            # Analyze tables to update statistics
            await analyze_tables(session)
    except Exception as e:
        logger.warning(f"Index creation/analysis skipped: {e}")
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
    from app.core.logging import logger
    import os
    
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
    # Using enhanced CORS configuration with tightened security
    setup_cors(app)

    # Compression Middleware (after CORS)
    # Enhanced compression with Brotli support
    app.add_middleware(
        CompressionMiddleware,
        min_size=1024,  # Only compress responses > 1KB
        compress_level=6,  # Balance between speed and compression ratio
        use_brotli=True,  # Use Brotli if client supports it
    )

    # Cache Headers Middleware
    app.add_middleware(CacheHeadersMiddleware, default_max_age=300)

    # Request Size Limits Middleware (before CSRF to prevent large request processing)
    app.add_middleware(
        RequestSizeLimitMiddleware,
        default_limit=10 * 1024 * 1024,  # 10 MB default
        json_limit=1 * 1024 * 1024,  # 1 MB for JSON
        file_upload_limit=50 * 1024 * 1024,  # 50 MB for file uploads
    )

    # API Versioning Middleware (after CORS, before other middleware)
    setup_api_versioning(app, default_version="v1", supported_versions=["v1"])

    # IP Whitelist Middleware (before CSRF, for admin endpoints)
    setup_ip_whitelist(app, admin_paths=["/api/v1/admin"])

    # Request Signing Middleware (optional, for enhanced API security)
    if os.getenv("ENABLE_REQUEST_SIGNING", "").lower() == "true":
        app.add_middleware(
            RequestSigningMiddleware,
            secret_key=settings.SECRET_KEY,
            header_name="X-Signature",
            timestamp_header="X-Timestamp",
            max_age=300,  # 5 minutes
        )
        logger.info("Request signing enabled")

    # CSRF Protection Middleware (after CORS, before routes)
    # Skip CSRF for webhooks and public endpoints
    if not os.getenv("DISABLE_CSRF", "").lower() == "true":
        app.add_middleware(
            CSRFMiddleware,
            secret_key=settings.SECRET_KEY,
            cookie_name="csrf_token",
        )
        logger.info("CSRF protection enabled")
    else:
        logger.warning("CSRF protection is DISABLED - not recommended for production")

    # Rate Limiting (after CORS to allow preflight requests)
    # Can be disabled by setting DISABLE_RATE_LIMITING=true in environment
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
        environment = os.getenv("ENVIRONMENT", "development")
        
        if environment == "production":
            # Strict CSP for production - no unsafe-inline or unsafe-eval
            # 
            # SECURITY: Production CSP is strict (no unsafe-inline/unsafe-eval)
            # Use nonces for inline scripts/styles in production
            # See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
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
            # 
            # SECURITY: CSP is relaxed in development (unsafe-inline/unsafe-eval)
            # This is acceptable for dev but MUST be tightened in production using nonces
            # See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
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

