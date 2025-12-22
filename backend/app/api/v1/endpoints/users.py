"""
User Management Endpoints
"""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.models.user import User
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
@cached(expire=300, key_prefix="users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> List[User]:
    """
    Get list of users
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        
    Returns:
        List of users
    """
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.roles),
            selectinload(User.team_memberships)
        )
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get user by ID
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        User information
    """
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.roles),
            selectinload(User.team_memberships)
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user

