"""Authentication endpoints."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, RefreshTokenRequest
from app.services.user_service import UserService
from app.core.security import create_access_token, create_refresh_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user."""
    service = UserService(db)

    try:
        user = await service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login user."""
    service = UserService(db)

    user = await service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30),
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token."""
    # Decode refresh token
    payload = decode_token(refresh_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    # Verify token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Fetch user from database
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Create new access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30),
    )
    
    # Create new refresh token
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user,
    )
