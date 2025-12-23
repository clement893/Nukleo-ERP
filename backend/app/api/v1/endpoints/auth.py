"""
Authentication Endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from fastapi.responses import RedirectResponse
from starlette.requests import Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limit_decorator
from app.core.logging import logger
from app.models.user import User
from app.schemas.auth import Token, TokenData, UserCreate, UserResponse

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Verify token type
        token_type = payload.get("type")
        if token_type != "access":
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    # Get user from database
    result = await db.execute(
        User.__table__.select().where(User.email == token_data.username)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_decorator("3/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Register a new user
    
    Args:
        user_data: User registration data
        db: Database session
        
    Returns:
        Created user
    """
    # Check if user already exists
    result = await db.execute(
        User.__table__.select().where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
@rate_limit_decorator("5/minute")
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    """
    Login endpoint
    
    Args:
        form_data: OAuth2 password form data
        db: Database session
        
    Returns:
        Access token
    """
    # Get user from database
    result = await db.execute(
        User.__table__.select().where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires,
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Get current user information
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User information
    """
    return current_user


@router.get("/google")
async def get_google_auth_url(
    request: Request,
    redirect: str = Query(None, description="Frontend redirect URL after authentication")
):
    """
    Get Google OAuth authorization URL
    
    Args:
        request: FastAPI request object
        redirect: Optional frontend URL to redirect to after authentication
    
    Returns:
        Authorization URL for Google OAuth
    """
    try:
        if not settings.GOOGLE_CLIENT_ID:
            logger.warning("Google OAuth not configured: GOOGLE_CLIENT_ID missing")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        # Build redirect URI - use the configured one or construct from request
        callback_uri = settings.GOOGLE_REDIRECT_URI
        if not callback_uri:
            # Construct callback URL from request
            backend_base_url = str(request.base_url).rstrip("/")
            callback_uri = f"{backend_base_url}{settings.API_V1_STR}/auth/google/callback"
        
        logger.info(f"Google OAuth callback URI: {callback_uri}")
        
        # Google OAuth 2.0 authorization endpoint
        google_auth_base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": callback_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        
        # Add state parameter if frontend redirect URL is provided
        if redirect:
            params["state"] = redirect
        
        auth_url = f"{google_auth_base_url}?{urlencode(params)}"
        
        logger.info(f"Generated Google OAuth URL (length: {len(auth_url)})")
        
        return {"auth_url": auth_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating Google OAuth URL: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Google OAuth URL: {str(e)}"
        )


@router.get("/google/callback")
async def google_oauth_callback(
    request: Request,
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(None, description="State parameter (frontend redirect URL)"),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    """
    Handle Google OAuth callback
    
    Args:
        request: FastAPI request object
        code: Authorization code from Google
        state: Optional state parameter (frontend redirect URL)
        db: Database session
    
    Returns:
        Redirect to frontend with token
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    # Build redirect URI - must match the one used in /google endpoint
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    if not redirect_uri:
        # Construct callback URL from request (must match the one in /google)
        base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{base_url}{settings.API_V1_STR}/auth/google/callback"
    
    try:
        # Exchange authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            
            if token_response.status_code != 200:
                logger.error(f"Google token exchange failed: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code"
                )
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No access token received from Google"
                )
            
            # Get user info from Google
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if userinfo_response.status_code != 200:
                logger.error(f"Google userinfo failed: {userinfo_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user information from Google"
                )
            
            google_user = userinfo_response.json()
            email = google_user.get("email")
            name = google_user.get("name", "")
            picture = google_user.get("picture")
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )
            
            # Split name into first_name and last_name
            name_parts = name.split(" ", 1) if name else ["", ""]
            first_name = name_parts[0] if len(name_parts) > 0 else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            # Check if user exists
            result = await db.execute(
                User.__table__.select().where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            # Create or update user
            if user:
                # Update existing user
                user.first_name = first_name or user.first_name
                user.last_name = last_name or user.last_name
                # Mark as active if not already
                if not user.is_active:
                    user.is_active = True
            else:
                # Create new user
                # Generate a random password since Google OAuth users don't have passwords
                import secrets
                random_password = secrets.token_urlsafe(32)
                hashed_password = get_password_hash(random_password)
                
                user = User(
                    email=email,
                    hashed_password=hashed_password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )
                db.add(user)
            
            await db.commit()
            await db.refresh(user)
            
            # Create JWT token (use email as subject, consistent with login endpoint)
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            jwt_token = create_access_token(
                data={"sub": user.email, "type": "access"},
                expires_delta=access_token_expires,
            )
            
            # Determine frontend redirect URL
            frontend_url = state or "https://modele-nextjs-fullstack-production-1e92.up.railway.app"
            
            # Remove trailing slash and add token as query parameter
            frontend_url = frontend_url.rstrip("/")
            redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}&type=google"
            
            logger.info(f"Google OAuth successful for user {email}, redirecting to {frontend_url}")
            
            return RedirectResponse(url=redirect_url)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

