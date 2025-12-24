"""
Authentication Endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlencode

import httpx
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limit_decorator
from app.core.logging import logger
from app.models.user import User
from app.schemas.auth import Token, TokenData, UserCreate, UserResponse, RefreshTokenRequest

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Try bcrypt directly first (for new hashes), fallback to passlib for compatibility
    try:
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            # Remove incomplete UTF-8 sequences
            while len(password_bytes) > 0:
                try:
                    password_bytes.decode('utf-8')
                    break
                except UnicodeDecodeError:
                    password_bytes = password_bytes[:-1]
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        # Fallback to passlib for old hashes
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly (bypassing passlib to avoid 72-byte limit issues)"""
    # Bcrypt has a 72-byte limit, so truncate password to 72 bytes if needed
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Truncate to 72 bytes, ensuring we don't break UTF-8 characters
        password_bytes = password_bytes[:72]
        # Remove any incomplete UTF-8 sequences at the end
        while len(password_bytes) > 0:
            try:
                password_bytes.decode('utf-8')
                break
            except UnicodeDecodeError:
                password_bytes = password_bytes[:-1]
        # Use the truncated bytes directly
        password_bytes = password_bytes
    else:
        password_bytes = password.encode('utf-8')
    
    # Use bcrypt directly instead of passlib to avoid compatibility issues
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


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
        logger.info(f"Decoding token: {token[:20]}...")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.info(f"Token decoded successfully, payload: {payload}")
        # Verify token type
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning(f"Invalid token type: {token_type}, expected 'access'")
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            logger.warning("No 'sub' claim in token payload")
            raise credentials_exception
        token_data = TokenData(username=username)
        logger.info(f"Token data extracted, username: {username}")
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception

    # Get user from database
    try:
        logger.info(f"Querying database for user with email: {token_data.username}")
        result = await db.execute(
            select(User).where(User.email == token_data.username)
        )
        user = result.scalar_one_or_none()
        if user is None:
            logger.warning(f"User not found in database: {token_data.username}")
            raise credentials_exception
        logger.info(f"User found: {user.email}, id: {user.id}")
        return user
    except Exception as e:
        logger.error(f"Database error in get_current_user: {e}", exc_info=True)
        raise credentials_exception


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


@router.post("/refresh", response_model=Token)
@rate_limit_decorator("10/minute")
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    """
    Refresh access token
    
    Accepts either:
    - An expired access token (if still valid for refresh)
    - A refresh token (if refresh tokens are implemented)
    
    Args:
        refresh_data: Request with either "token" (expired access token) or "refresh_token"
        db: Database session
        
    Returns:
        New access token
    """
    # Try to get token from refresh_data
    token = refresh_data.token or refresh_data.refresh_token
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token or refresh_token is required",
        )
    
    try:
        # Try to decode the token (even if expired, we can still read the payload)
        # Use verify_exp=False to read expired tokens
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_exp": False})
        
        # Verify token type
        token_type = payload.get("type", "access")
        if token_type not in ("access", "refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user email from token
        username = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify user still exists and is active
        result = await db.execute(
            select(User).where(User.email == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not active",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "type": "access"},
            expires_delta=access_token_expires,
        )
        
        logger.info(f"Token refreshed for user {user.email}")
        
        return Token(access_token=access_token, token_type="bearer")
        
    except jwt.ExpiredSignatureError:
        # Token is expired, but we can still refresh it if user exists
        # This allows refreshing expired tokens
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_exp": False})
            username = payload.get("sub")
            if username:
                result = await db.execute(
                    select(User).where(User.email == username)
                )
                user = result.scalar_one_or_none()
                if user and user.is_active:
                    # Create new access token
                    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
                    access_token = create_access_token(
                        data={"sub": user.email, "type": "access"},
                        expires_delta=access_token_expires,
                    )
                    logger.info(f"Expired token refreshed for user {user.email}")
                    return Token(access_token=access_token, token_type="bearer")
        except Exception:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired and cannot be refreshed",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e:
        logger.warning(f"JWT error during refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """
    Get current user information
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User information
    """
    try:
        logger.info(f"Getting user info for: {current_user.email}")
        # Convert User model to UserResponse schema
        # This ensures relations are not loaded unnecessarily
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            is_active=current_user.is_active,
            # theme_preference is deprecated but kept for API compatibility
            theme_preference=current_user.theme_preference or 'system',
            created_at=current_user.created_at.isoformat() if current_user.created_at else "",
            updated_at=current_user.updated_at.isoformat() if current_user.updated_at else "",
        )
    except Exception as e:
        logger.error(f"Error in get_current_user_info: {e}", exc_info=True)
        raise


@router.get("/google", response_model=dict)
async def get_google_auth_url(
    request: Request,
    redirect: Annotated[str | None, Query(description="Frontend redirect URL after authentication")] = None,
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
        logger.info(f"Google OAuth request received, redirect: {redirect}")
        
        if not settings.GOOGLE_CLIENT_ID:
            logger.warning("Google OAuth not configured: GOOGLE_CLIENT_ID missing")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        # Build redirect URI - use the configured one or construct from request
        callback_uri = settings.GOOGLE_REDIRECT_URI
        if not callback_uri:
            # Use BASE_URL from settings if available, otherwise construct from request
            if settings.BASE_URL:
                backend_base_url = settings.BASE_URL.rstrip("/")
                logger.info(f"Using BASE_URL from settings: {backend_base_url}")
            else:
                try:
                    backend_base_url = str(request.base_url).rstrip("/")
                    logger.info(f"Using request.base_url: {backend_base_url}")
                except Exception as e:
                    logger.error(f"Error getting base_url from request: {e}")
                    # Fallback to BASE_URL from settings or environment variable
                    import os
                    backend_base_url = os.getenv("BASE_URL", "http://localhost:8000")
                    logger.warning(f"Using fallback base_url from environment: {backend_base_url}")
            callback_uri = f"{backend_base_url}{settings.API_V1_STR}/auth/google/callback"
        
        logger.info(f"Google OAuth callback URI: {callback_uri}")
        logger.info(f"GOOGLE_REDIRECT_URI from settings: {settings.GOOGLE_REDIRECT_URI}")
        logger.info(f"BASE_URL from settings: {settings.BASE_URL}")
        
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
    code: Annotated[str, Query(description="Authorization code from Google")],
    db: Annotated[AsyncSession, Depends(get_db)],
    state: Annotated[str | None, Query(description="State parameter (frontend redirect URL)")] = None,
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
        # Use BASE_URL from settings if available, otherwise construct from request
        if settings.BASE_URL:
            backend_base_url = settings.BASE_URL.rstrip("/")
        else:
            backend_base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{backend_base_url}{settings.API_V1_STR}/auth/google/callback"
    
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
                select(User).where(User.email == email)
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
                # Bcrypt has a 72-byte limit, so we use token_hex(32) which generates 64 hex characters (64 bytes)
                # This is safely under the 72-byte limit
                import secrets
                random_password = secrets.token_hex(32)  # 32 bytes * 2 = 64 hex characters = 64 bytes (safe)
                logger.debug(f"Generated password for Google OAuth user: {len(random_password)} chars, {len(random_password.encode('utf-8'))} bytes")
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
            # If state is already a full URL (starts with http), use it directly
            # Otherwise, construct the URL from state or use FRONTEND_URL from settings
            import os
            frontend_base = os.getenv("FRONTEND_URL", "http://localhost:3000")
            
            if state and state.startswith(("http://", "https://")):
                # State is already a full URL, use it directly
                frontend_url = state.rstrip("/")
                redirect_url = f"{frontend_url}?token={jwt_token}&type=google"
            elif state:
                # State is a relative path (e.g., "/auth/callback")
                # Ensure it starts with / and doesn't end with /
                state_path = state if state.startswith("/") else f"/{state}"
                state_path = state_path.rstrip("/")
                redirect_url = f"{frontend_base}{state_path}?token={jwt_token}&type=google"
            else:
                # No state provided, use default callback URL
                redirect_url = f"{frontend_base}/auth/callback?token={jwt_token}&type=google"
            
            logger.info(f"Google OAuth successful for user {email}, redirecting to {redirect_url}")
            
            return RedirectResponse(url=redirect_url)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

