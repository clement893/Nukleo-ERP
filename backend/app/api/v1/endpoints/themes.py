"""
API endpoints for theme management.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.theme import (
    ThemeCreate,
    ThemeUpdate,
    ThemeResponse,
    ThemeListResponse,
    ThemeConfigResponse
)
from app.services.theme_service import ThemeService
from app.dependencies import get_db, get_current_user, require_superadmin

router = APIRouter()


@router.get("/active", response_model=ThemeConfigResponse, tags=["themes"])
async def get_active_theme(db: Session = Depends(get_db)):
    """
    Get the currently active theme configuration.
    Public endpoint - no authentication required.
    """
    theme = ThemeService.get_active_theme(db)
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active theme found"
        )
    
    return ThemeConfigResponse(
        name=theme.name,
        display_name=theme.display_name,
        config=theme.config,
        updated_at=theme.updated_at
    )


@router.get("", response_model=ThemeListResponse, tags=["themes"])
async def list_themes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    List all themes.
    Requires superadmin authentication.
    """
    themes = ThemeService.get_all_themes(db, skip=skip, limit=limit)
    active_theme = ThemeService.get_active_theme(db)
    
    return ThemeListResponse(
        themes=[ThemeResponse.from_orm(theme) for theme in themes],
        total=len(themes),
        active_theme_id=active_theme.id if active_theme else None
    )


@router.get("/{theme_id}", response_model=ThemeResponse, tags=["themes"])
async def get_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get a specific theme by ID.
    Requires superadmin authentication.
    """
    theme = ThemeService.get_theme_by_id(db, theme_id)
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    return ThemeResponse.from_orm(theme)


@router.post("", response_model=ThemeResponse, status_code=status.HTTP_201_CREATED, tags=["themes"])
async def create_theme(
    theme_data: ThemeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Create a new theme.
    Requires superadmin authentication.
    If is_active=True, automatically deactivates all other themes.
    """
    # Check if theme name already exists
    existing_theme = ThemeService.get_theme_by_name(db, theme_data.name)
    if existing_theme:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Theme with name '{theme_data.name}' already exists"
        )
    
    theme = ThemeService.create_theme(db, theme_data, created_by=current_user.id)
    return ThemeResponse.from_orm(theme)


@router.put("/{theme_id}", response_model=ThemeResponse, tags=["themes"])
async def update_theme(
    theme_id: int,
    theme_data: ThemeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Update an existing theme.
    Requires superadmin authentication.
    If is_active=True, automatically deactivates all other themes.
    """
    theme = ThemeService.update_theme(db, theme_id, theme_data)
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    return ThemeResponse.from_orm(theme)


@router.post("/{theme_id}/activate", response_model=ThemeResponse, tags=["themes"])
async def activate_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Activate a theme (deactivates all others).
    Requires superadmin authentication.
    """
    theme = ThemeService.activate_theme(db, theme_id)
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    return ThemeResponse.from_orm(theme)


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["themes"])
async def delete_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Delete a theme.
    Requires superadmin authentication.
    Cannot delete the active theme.
    """
    try:
        success = ThemeService.delete_theme(db, theme_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Theme with ID {theme_id} not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

