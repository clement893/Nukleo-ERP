"""
Admin API Endpoints
Endpoints for administrative operations
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import os

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.dependencies import get_current_user, require_superadmin
from app.models.user import User
from app.models.role import Role, UserRole
from app.core.logging import logger

router = APIRouter()


class MakeSuperAdminRequest(BaseModel):
    """Request model for making a user superadmin"""
    email: EmailStr


class MakeSuperAdminResponse(BaseModel):
    """Response model for making a user superadmin"""
    success: bool
    message: str
    user_id: int | None = None
    email: str | None = None


@router.post(
    "/make-superadmin",
    response_model=MakeSuperAdminResponse,
    status_code=status.HTTP_200_OK,
    tags=["admin"]
)
async def make_user_superadmin(
    request: MakeSuperAdminRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Make a user a superadmin.
    Requires superadmin authentication.
    
    Note: If no superadmin exists yet, you can use the script:
    python scripts/make_superadmin.py <email>
    """
    email = request.email.lower().strip()
    
    try:
        # Find or create superadmin role
        result = await db.execute(select(Role).where(Role.slug == "superadmin"))
        superadmin_role = result.scalar_one_or_none()
        
        if not superadmin_role:
            # Create superadmin role if it doesn't exist
            superadmin_role = Role(
                name="Super Admin",
                slug="superadmin",
                description="Super administrator with full system access",
                is_system=True,
                is_active=True
            )
            db.add(superadmin_role)
            await db.commit()
            await db.refresh(superadmin_role)
            logger.info(f"Created superadmin role (ID: {superadmin_role.id})")
        
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email '{email}' not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{email}' is not active"
            )
        
        # Check if user already has superadmin role
        result = await db.execute(
            select(UserRole).where(
                UserRole.user_id == user.id,
                UserRole.role_id == superadmin_role.id
            )
        )
        existing_user_role = result.scalar_one_or_none()
        
        if existing_user_role:
            return MakeSuperAdminResponse(
                success=True,
                message=f"User '{email}' already has superadmin role",
                user_id=user.id,
                email=user.email
            )
        
        # Assign superadmin role to user
        user_role = UserRole(
            user_id=user.id,
            role_id=superadmin_role.id
        )
        db.add(user_role)
        await db.commit()
        
        logger.info(f"Assigned superadmin role to user '{email}' (ID: {user.id})")
        
        return MakeSuperAdminResponse(
            success=True,
            message=f"Successfully assigned superadmin role to '{email}'",
            user_id=user.id,
            email=user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error making user superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to make user superadmin: {str(e)}"
        )


@router.post(
    "/make-superadmin-by-email",
    response_model=MakeSuperAdminResponse,
    status_code=status.HTTP_200_OK,
    tags=["admin"],
    deprecated=True
)
async def make_user_superadmin_by_email(
    email: str = Query(..., description="Email of the user to make superadmin"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Make a user a superadmin by email (query parameter).
    Requires superadmin authentication.
    
    This endpoint is deprecated. Use POST /make-superadmin with JSON body instead.
    """
    request = MakeSuperAdminRequest(email=email)
    return await make_user_superadmin(request, db, current_user, _)


@router.post(
    "/bootstrap-superadmin",
    response_model=MakeSuperAdminResponse,
    status_code=status.HTTP_200_OK,
    tags=["admin"]
)
async def bootstrap_superadmin(
    request: MakeSuperAdminRequest,
    bootstrap_key: str = Header(..., alias="X-Bootstrap-Key", description="Bootstrap key from environment"),
    db: AsyncSession = Depends(get_db)
):
    """
    Bootstrap the first superadmin user.
    This endpoint allows creating the first superadmin without requiring authentication.
    Requires a bootstrap key set in the BOOTSTRAP_SUPERADMIN_KEY environment variable.
    
    Use this only for initial setup. After the first superadmin is created,
    use the regular /make-superadmin endpoint.
    """
    # Check if bootstrap key is configured
    expected_key = os.getenv("BOOTSTRAP_SUPERADMIN_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bootstrap feature is not enabled. Set BOOTSTRAP_SUPERADMIN_KEY environment variable."
        )
    
    # Verify bootstrap key
    if bootstrap_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bootstrap key"
        )
    
    # Check if any superadmin already exists
    result = await db.execute(
        select(UserRole)
        .join(Role)
        .where(Role.slug == "superadmin", Role.is_active == True)
    )
    existing_superadmins = result.scalars().all()
    
    if existing_superadmins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmin already exists. Use the regular /make-superadmin endpoint instead."
        )
    
    email = request.email.lower().strip()
    
    try:
        # Find or create superadmin role
        result = await db.execute(select(Role).where(Role.slug == "superadmin"))
        superadmin_role = result.scalar_one_or_none()
        
        if not superadmin_role:
            # Create superadmin role if it doesn't exist
            superadmin_role = Role(
                name="Super Admin",
                slug="superadmin",
                description="Super administrator with full system access",
                is_system=True,
                is_active=True
            )
            db.add(superadmin_role)
            await db.commit()
            await db.refresh(superadmin_role)
            logger.info(f"Created superadmin role (ID: {superadmin_role.id})")
        
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email '{email}' not found. Please register first."
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{email}' is not active"
            )
        
        # Assign superadmin role to user
        user_role = UserRole(
            user_id=user.id,
            role_id=superadmin_role.id
        )
        db.add(user_role)
        await db.commit()
        
        logger.info(f"Bootstrapped superadmin role to user '{email}' (ID: {user.id})")
        
        return MakeSuperAdminResponse(
            success=True,
            message=f"Successfully bootstrapped superadmin role to '{email}'",
            user_id=user.id,
            email=user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error bootstrapping superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bootstrap superadmin: {str(e)}"
        )


@router.get(
    "/check-superadmin/{email}",
    response_model=dict,
    tags=["admin"]
)
async def check_superadmin_status(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Check if a user has superadmin role.
    Requires superadmin authentication.
    """
    email = email.lower().strip()
    
    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found"
        )
    
    # Check for superadmin role
    result = await db.execute(
        select(UserRole)
        .join(Role)
        .where(
            UserRole.user_id == user.id,
            Role.slug == "superadmin",
            Role.is_active == True
        )
    )
    user_role = result.scalar_one_or_none()
    
    return {
        "email": user.email,
        "user_id": user.id,
        "is_superadmin": user_role is not None,
        "is_active": user.is_active
    }

