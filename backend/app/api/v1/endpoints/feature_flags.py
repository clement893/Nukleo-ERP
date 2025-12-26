"""
Feature Flags API Endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.feature_flag_service import FeatureFlagService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


class FeatureFlagCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100, description="Unique flag key")
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    enabled: bool = Field(False)
    rollout_percentage: float = Field(0.0, ge=0.0, le=100.0)
    target_users: Optional[List[int]] = None
    target_teams: Optional[List[int]] = None
    is_ab_test: bool = Field(False)
    variants: Optional[Dict[str, Any]] = None


class FeatureFlagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    enabled: Optional[bool] = None
    rollout_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    target_users: Optional[List[int]] = None
    target_teams: Optional[List[int]] = None
    is_ab_test: Optional[bool] = None
    variants: Optional[Dict[str, Any]] = None


class FeatureFlagResponse(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: float
    target_users: Optional[List[int]]
    target_teams: Optional[List[int]]
    is_ab_test: bool
    variants: Optional[Dict[str, Any]]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("/feature-flags", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED, tags=["feature-flags"])
async def create_feature_flag(
    flag_data: FeatureFlagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new feature flag"""
    try:
        service = FeatureFlagService(db)
        flag = await service.create_flag(
            key=flag_data.key,
            name=flag_data.name,
            description=flag_data.description,
            enabled=flag_data.enabled,
            rollout_percentage=flag_data.rollout_percentage,
            target_users=flag_data.target_users,
            target_teams=flag_data.target_teams,
            is_ab_test=flag_data.is_ab_test,
            variants=flag_data.variants,
            created_by_id=current_user.id
        )
        return FeatureFlagResponse.model_validate(flag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/feature-flags", response_model=List[FeatureFlagResponse], tags=["feature-flags"])
async def get_feature_flags(
    enabled_only: bool = Query(False, description="Return only enabled flags"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all feature flags"""
    service = FeatureFlagService(db)
    flags = await service.get_all_flags(enabled_only=enabled_only)
    return [FeatureFlagResponse.model_validate(f) for f in flags]


@router.get("/feature-flags/{key}", response_model=FeatureFlagResponse, tags=["feature-flags"])
async def get_feature_flag(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a feature flag by key"""
    service = FeatureFlagService(db)
    flag = await service.get_flag(key)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found"
        )
    return FeatureFlagResponse.model_validate(flag)


@router.get("/feature-flags/{key}/check", tags=["feature-flags"])
async def check_feature_flag(
    key: str,
    team_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if a feature flag is enabled for current user"""
    service = FeatureFlagService(db)
    is_enabled = await service.is_enabled(key, user_id=current_user.id, team_id=team_id)
    variant = None
    if is_enabled:
        variant = await service.get_variant(key, user_id=current_user.id)
    
    return {
        "enabled": is_enabled,
        "variant": variant
    }


@router.put("/feature-flags/{flag_id}", response_model=FeatureFlagResponse, tags=["feature-flags"])
async def update_feature_flag(
    flag_id: int,
    flag_data: FeatureFlagUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a feature flag"""
    service = FeatureFlagService(db)
    updates = flag_data.model_dump(exclude_unset=True)
    flag = await service.update_flag(flag_id, updates)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found"
        )
    return FeatureFlagResponse.model_validate(flag)


@router.delete("/feature-flags/{flag_id}", tags=["feature-flags"])
async def delete_feature_flag(
    flag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a feature flag"""
    service = FeatureFlagService(db)
    success = await service.delete_flag(flag_id)
    if success:
        return {"success": True, "message": "Feature flag deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Feature flag not found"
    )


@router.get("/feature-flags/{flag_id}/stats", tags=["feature-flags"])
async def get_feature_flag_stats(
    flag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for a feature flag"""
    service = FeatureFlagService(db)
    stats = await service.get_flag_stats(flag_id)
    return stats

