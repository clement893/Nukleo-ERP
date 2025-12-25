"""
API endpoints for theme management.
"""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from app.schemas.theme import (
    ThemeCreate,
    ThemeUpdate,
    ThemeResponse,
    ThemeListResponse,
    ThemeConfigResponse
)
from app.models.theme import Theme
from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.dependencies import get_current_user, require_superadmin

router = APIRouter()


class ThemeModeUpdate(BaseModel):
    """Schema for updating theme mode (light/dark/system)"""
    mode: str = Field(..., description="Theme mode: 'light', 'dark', or 'system'")
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.mode not in ['light', 'dark', 'system']:
            raise ValueError("Mode must be 'light', 'dark', or 'system'")


@router.get("/active", response_model=ThemeConfigResponse, tags=["themes"])
@cached(expire=3600, key_prefix="theme")  # Cache 1h - themes change rarely
async def get_active_theme(db: AsyncSession = Depends(get_db)):
    """
    Get the currently active theme configuration.
    Public endpoint - no authentication required.
    Returns the global theme that applies to all users.
    """
    result = await db.execute(select(Theme).where(Theme.is_active == True))
    theme = result.scalar_one_or_none()
    if not theme:
        # Return default theme if no active theme exists
        default_config = {
            "mode": "system",  # Default mode: light, dark, or system
            "primary": "#3b82f6",
            "secondary": "#8b5cf6",
            "danger": "#ef4444",
            "warning": "#f59e0b",
            "info": "#06b6d4",
        }
        return ThemeConfigResponse(
            name="default",
            display_name="Default Theme",
            config=default_config,
            updated_at=datetime.now()
        )
    
    # Ensure config has a mode field
    config = theme.config or {}
    if "mode" not in config:
        config["mode"] = "system"
    
    return ThemeConfigResponse(
        name=theme.name,
        display_name=theme.display_name,
        config=config,
        updated_at=theme.updated_at
    )


@router.get("", response_model=ThemeListResponse, tags=["themes"])
@cached(expire=600, key_prefix="themes")  # Cache 10min - themes list
async def list_themes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    List all themes.
    Requires superadmin authentication.
    """
    result = await db.execute(select(Theme).offset(skip).limit(limit))
    themes = result.scalars().all()
    
    active_result = await db.execute(select(Theme).where(Theme.is_active == True))
    active_theme = active_result.scalar_one_or_none()
    
    return ThemeListResponse(
        themes=[ThemeResponse.model_validate(theme) for theme in themes],
        total=len(themes),
        active_theme_id=active_theme.id if active_theme else None
    )


@router.get("/{theme_id}", response_model=ThemeResponse, tags=["themes"])
@cached(expire=600, key_prefix="theme")  # Cache 10min
async def get_theme(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get a specific theme by ID.
    Requires superadmin authentication.
    """
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    return ThemeResponse.model_validate(theme)


@router.post("", response_model=ThemeResponse, status_code=status.HTTP_201_CREATED, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def create_theme(
    theme_data: ThemeCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Create a new theme.
    Requires superadmin authentication.
    If is_active=True, automatically deactivates all other themes.
    """
    # Check if theme name already exists
    result = await db.execute(select(Theme).where(Theme.name == theme_data.name))
    existing_theme = result.scalar_one_or_none()
    if existing_theme:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Theme with name '{theme_data.name}' already exists"
        )
    
    # If activating, deactivate all others
    if theme_data.is_active:
        from sqlalchemy import update
        await db.execute(update(Theme).where(Theme.is_active == True).values(is_active=False))
        await db.commit()
    
    theme = Theme(
        name=theme_data.name,
        display_name=theme_data.display_name,
        description=theme_data.description,
        config=theme_data.config,
        is_active=theme_data.is_active or False,
        created_by=current_user.id
    )
    db.add(theme)
    await db.commit()
    await db.refresh(theme)
    return ThemeResponse.model_validate(theme)


@router.put("/{theme_id}", response_model=ThemeResponse, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def update_theme(
    theme_id: int,
    theme_data: ThemeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Update an existing theme.
    Requires superadmin authentication.
    If is_active=True, automatically deactivates all other themes.
    """
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    # If activating, deactivate all others
    if theme_data.is_active is True:
        from sqlalchemy import update
        await db.execute(update(Theme).where(Theme.is_active == True, Theme.id != theme_id).values(is_active=False))
        await db.commit()
    
    # Update fields
    if theme_data.display_name is not None:
        theme.display_name = theme_data.display_name
    if theme_data.description is not None:
        theme.description = theme_data.description
    if theme_data.config is not None:
        theme.config = theme_data.config
    if theme_data.is_active is not None:
        theme.is_active = theme_data.is_active
    
    await db.commit()
    await db.refresh(theme)
    return ThemeResponse.model_validate(theme)


@router.post("/{theme_id}/activate", response_model=ThemeResponse, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def activate_theme(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Activate a theme (deactivates all others).
    Requires superadmin authentication.
    """
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    # Deactivate all themes
    from sqlalchemy import update
    await db.execute(update(Theme).where(Theme.is_active == True, Theme.id != theme_id).values(is_active=False))
    await db.commit()
    
    # Activate this theme
    theme.is_active = True
    await db.commit()
    await db.refresh(theme)
    return ThemeResponse.model_validate(theme)


@router.put("/active/mode", response_model=ThemeConfigResponse, tags=["themes"])
@invalidate_cache_pattern("theme:*")
async def update_active_theme_mode(
    mode_update: ThemeModeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Update the mode (light/dark/system) of the currently active theme.
    Requires superadmin authentication.
    This affects all users globally.
    """
    result = await db.execute(select(Theme).where(Theme.is_active == True))
    theme = result.scalar_one_or_none()
    
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active theme found. Please activate a theme first."
        )
    
    # Update the mode in config
    config = theme.config or {}
    config["mode"] = mode_update.mode
    theme.config = config
    
    await db.commit()
    await db.refresh(theme)
    
    return ThemeConfigResponse(
        name=theme.name,
        display_name=theme.display_name,
        config=config,
        updated_at=theme.updated_at
    )


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def delete_theme(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Delete a theme.
    Requires superadmin authentication.
    Cannot delete the active theme.
    """
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    # Prevent deletion of active theme
    if theme.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the active theme. Please activate another theme first."
        )
    
    await db.delete(theme)
    await db.commit()

