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

    # Rate Limiting
    app = setup_rate_limiting(app)

    # Compression Middleware (should be before CORS)
    app.add_middleware(CompressionMiddleware)

    # Cache Headers Middleware
    app.add_middleware(CacheHeadersMiddleware, default_max_age=300)

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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

    # Add timestamp middleware (optimized - uses headers instead of body manipulation)
    @app.middleware("http")
    async def add_timestamp_middleware(request: Request, call_next):
        from datetime import datetime
        response = await call_next(request)
        # Add timestamp in header instead of manipulating JSON body
        response.headers["X-Response-Time"] = datetime.utcnow().isoformat()
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
