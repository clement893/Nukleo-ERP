"""
Content Module Router
Unified router for all content/CMS endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    posts as posts_endpoints,
    pages as pages_endpoints,
    media as media_endpoints,
    forms as forms_endpoints,
    menus as menus_endpoints,
    templates as templates_endpoints,
    tags as tags_endpoints,
)

# Create main router for content module
router = APIRouter(prefix="/content", tags=["content"])

# Include all content sub-routers
router.include_router(posts_endpoints.router, prefix="/posts")
router.include_router(pages_endpoints.router, prefix="/pages")
router.include_router(media_endpoints.router, prefix="/media")
router.include_router(forms_endpoints.router, prefix="/forms")
router.include_router(menus_endpoints.router, prefix="/menus")
router.include_router(templates_endpoints.router, prefix="/templates")
router.include_router(tags_endpoints.router, prefix="/tags")
