"""
API v1 router registration.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import themes, projects, websocket, admin, auth, two_factor, api_keys, users, health, db_health

api_router = APIRouter()

# Register auth endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

# Register 2FA endpoints
api_router.include_router(
    two_factor.router,
    prefix="/auth/2fa",
    tags=["2fa"]
)

# Register API key endpoints
api_router.include_router(
    api_keys.router,
    prefix="/api-keys",
    tags=["api-keys"]
)

# Register user endpoints (with pagination and optimization)
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# Register theme endpoints
api_router.include_router(
    themes.router,
    prefix="/themes",
    tags=["themes"]
)

# Register project endpoints
api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["projects"]
)

# Register WebSocket endpoints
api_router.include_router(
    websocket.router,
    tags=["websocket"]
)

# Register admin endpoints
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# Register health check endpoints
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

# Register database health check endpoints
api_router.include_router(
    db_health.router,
    prefix="/db-health",
    tags=["database-health"]
)
