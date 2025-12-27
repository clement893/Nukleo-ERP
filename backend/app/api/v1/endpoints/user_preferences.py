"""
User Preferences API Endpoints
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel

from app.services.user_preference_service import UserPreferenceService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class PreferenceUpdate(BaseModel):
    value: Any


class PreferenceResponse(BaseModel):
    key: str
    value: Any

    class Config:
        from_attributes = True


@router.get("/preferences", response_model=Dict[str, Any], tags=["user-preferences"])
async def get_all_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all preferences for the current user"""
    try:
        service = UserPreferenceService(db)
        preferences = await service.get_all_preferences(current_user.id)
        return preferences
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error getting preferences: {e}", exc_info=True)
        # Return empty dict if there's an error (e.g., table doesn't exist yet)
        return {}


@router.get("/preferences/{key}", tags=["user-preferences"])
async def get_preference(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific preference for the current user"""
    try:
        service = UserPreferenceService(db)
        preference = await service.get_preference(current_user.id, key)
        if not preference:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preference not found"
            )
        return {"key": preference.key, "value": preference.value}
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error getting preference {key}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )


@router.put("/preferences/{key}", response_model=PreferenceResponse, tags=["user-preferences"])
async def set_preference(
    key: str,
    preference_data: PreferenceUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set a preference for the current user"""
    try:
        service = UserPreferenceService(db)
        preference = await service.set_preference(
            current_user.id,
            key,
            preference_data.value
        )
        return PreferenceResponse(key=preference.key, value=preference.value)
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error setting preference {key}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preference"
        )


@router.put("/preferences", tags=["user-preferences"])
async def set_preferences(
    preferences: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set multiple preferences at once"""
    try:
        service = UserPreferenceService(db)
        await service.set_preferences(current_user.id, preferences)
        return {"success": True, "message": "Preferences updated successfully"}
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error setting preferences: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )


@router.delete("/preferences/{key}", tags=["user-preferences"])
async def delete_preference(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific preference"""
    service = UserPreferenceService(db)
    success = await service.delete_preference(current_user.id, key)
    if success:
        return {"success": True, "message": "Preference deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Preference not found"
    )


@router.delete("/preferences", tags=["user-preferences"])
async def delete_all_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all preferences for the current user"""
    service = UserPreferenceService(db)
    count = await service.delete_all_preferences(current_user.id)
    return {"success": True, "message": f"Deleted {count} preferences"}




