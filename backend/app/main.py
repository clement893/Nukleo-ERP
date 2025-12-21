"""FastAPI application."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# In production, be more permissive with Railway domains
if ENVIRONMENT == "production" or "railway" in str(ALLOWED_ORIGINS).lower():
    # Allow all Railway subdomains
    ALLOWED_ORIGINS.extend([
        "https://*.up.railway.app",
        "https://*.railway.app",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in str(ALLOWED_ORIGINS) else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
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
