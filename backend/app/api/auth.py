"""Authentication endpoints."""

import os
from datetime import timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.httpx_client import AsyncOAuth2Client

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, RefreshTokenRequest
from app.services.user_service import UserService
from app.core.security import create_access_token, create_refresh_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


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


@router.get("/google")
async def google_auth():
    """Initiate Google OAuth flow."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Please contact the administrator.",
        )
    
    # Google OAuth endpoints
    authorization_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
    
    # Build authorization URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    auth_url = f"{authorization_endpoint}?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured",
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided",
        )
    
    try:
        # Exchange code for token
        async with AsyncOAuth2Client(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
        ) as client:
            token_endpoint = "https://oauth2.googleapis.com/token"
            token_response = await client.fetch_token(
                token_endpoint,
                code=code,
                redirect_uri=GOOGLE_REDIRECT_URI,
            )
            
            access_token = token_response.get("access_token")
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get access token from Google",
                )
            
            # Get user info from Google
            userinfo_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
            userinfo_response = await client.get(userinfo_endpoint, token=access_token)
            userinfo = userinfo_response.json()
            
            email = userinfo.get("email")
            name = userinfo.get("name", email.split("@")[0])
            google_id = userinfo.get("id")
            
            if not email or not google_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google",
                )
            
            # Get or create user
            service = UserService(db)
            user = await service.get_or_create_oauth_user(
                email=email,
                name=name,
                provider="google",
                provider_id=google_id,
            )
            
            # Create JWT tokens
            access_token_jwt = create_access_token(
                data={"sub": str(user.id)},
                expires_delta=timedelta(minutes=30),
            )
            
            refresh_token_jwt = create_refresh_token(
                data={"sub": str(user.id)},
            )
            
            # Redirect to frontend with tokens
            params = {
                "access_token": access_token_jwt,
                "refresh_token": refresh_token_jwt,
                "token_type": "bearer",
            }
            
            redirect_url = f"{FRONTEND_URL}/auth/callback?{urlencode(params)}"
            return RedirectResponse(url=redirect_url)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(e)}",
        )
