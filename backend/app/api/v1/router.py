"""
API v1 router registration.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import themes, projects, websocket, admin, auth, two_factor, api_keys, users, health, db_health, newsletter, exports, imports, search, tags, activities, comments, favorites, templates, versions, shares, feature_flags, user_preferences
from app.api import ai as ai_router

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

# Register AI endpoints
api_router.include_router(
    ai_router.router,
    tags=["ai"]
)

# Register newsletter endpoints
api_router.include_router(
    newsletter.router,
    prefix="/newsletter",
    tags=["newsletter"]
)

# Register export endpoints
api_router.include_router(
    exports.router,
    prefix="/exports",
    tags=["exports"]
)

# Register import endpoints
api_router.include_router(
    imports.router,
    prefix="/imports",
    tags=["imports"]
)

# Register search endpoints
api_router.include_router(
    search.router,
    prefix="/search",
    tags=["search"]
)

# Register tags and categories endpoints
api_router.include_router(
    tags.router,
    prefix="/tags",
    tags=["tags", "categories"]
)

# Register activity endpoints
api_router.include_router(
    activities.router,
    prefix="/activities",
    tags=["activities"]
)

# Register comments endpoints
api_router.include_router(
    comments.router,
    prefix="/comments",
    tags=["comments"]
)

# Register favorites endpoints
api_router.include_router(
    favorites.router,
    prefix="/favorites",
    tags=["favorites"]
)

# Register templates endpoints
api_router.include_router(
    templates.router,
    prefix="/templates",
    tags=["templates"]
)

# Register versions endpoints
api_router.include_router(
    versions.router,
    prefix="/versions",
    tags=["versions"]
)

# Register shares endpoints
api_router.include_router(
    shares.router,
    prefix="/shares",
    tags=["shares"]
)

# Register feature flags endpoints
api_router.include_router(
    feature_flags.router,
    prefix="/feature-flags",
    tags=["feature-flags"]
)

# Register user preferences endpoints
api_router.include_router(
    user_preferences.router,
    prefix="/users",
    tags=["user-preferences"]
)
