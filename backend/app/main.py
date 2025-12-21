"""FastAPI application."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import init_db, close_db
from app.api import auth, users, resources, upload, health


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="MODELE-NEXTJS-FULLSTACK API",
    description="Full-stack template with Next.js frontend and FastAPI backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Get additional allowed origins from environment variable (comma-separated)
ADDITIONAL_ORIGINS = os.getenv("ADDITIONAL_ORIGINS", "").split(",")
ADDITIONAL_ORIGINS = [origin.strip() for origin in ADDITIONAL_ORIGINS if origin.strip()]

# Build allowed origins list
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8000",
    "https://modeleweb-production.up.railway.app",  # Production frontend
] + ADDITIONAL_ORIGINS

# Remove duplicates and empty strings
ALLOWED_ORIGINS = list(set([origin for origin in ALLOWED_ORIGINS if origin]))

# Add CORS middleware with regex for Railway domains
# The regex allows all Railway subdomains and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*\.(railway\.app|up\.railway\.app)|http://localhost:\d+",
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Exception handlers to ensure CORS headers are always sent
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with CORS headers."""
    origin = request.headers.get("origin")
    headers = {}
    
    # Add CORS headers if origin is allowed
    if origin and (origin in ALLOWED_ORIGINS or any(
        origin.endswith(domain) for domain in [".railway.app", ".up.railway.app"]
    )):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        headers["Access-Control-Allow-Headers"] = "*"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with CORS headers."""
    origin = request.headers.get("origin")
    headers = {}
    
    # Add CORS headers if origin is allowed
    if origin and (origin in ALLOWED_ORIGINS or any(
        origin.endswith(domain) for domain in [".railway.app", ".up.railway.app"]
    )):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        headers["Access-Control-Allow-Headers"] = "*"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers=headers,
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with CORS headers."""
    origin = request.headers.get("origin")
    headers = {}
    
    # Add CORS headers if origin is allowed
    if origin and (origin in ALLOWED_ORIGINS or any(
        origin.endswith(domain) for domain in [".railway.app", ".up.railway.app"]
    )):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        headers["Access-Control-Allow-Headers"] = "*"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers=headers,
    )

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resources.router)
app.include_router(upload.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to MODELE-NEXTJS-FULLSTACK API",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
