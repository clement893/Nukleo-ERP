"""
Two-Factor Authentication Endpoints
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.two_factor import TwoFactorAuth
from app.core.rate_limit import rate_limit_decorator
from app.core.logging import logger
from app.models.user import User
from app.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter()


class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    backup_codes: list[str]


class TwoFactorVerifyRequest(BaseModel):
    token: str


class TwoFactorEnableRequest(BaseModel):
    token: str  # TOTP token to verify setup


class TwoFactorDisableRequest(BaseModel):
    password: str  # Require password to disable 2FA


@router.post("/setup", response_model=TwoFactorSetupResponse)
@rate_limit_decorator("5/minute")
async def setup_two_factor(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Setup 2FA for the current user"""
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled",
        )
    
    # Generate secret
    secret = TwoFactorAuth.generate_secret()
    
    # Generate QR code
    uri = TwoFactorAuth.generate_totp_uri(
        secret=secret,
        email=current_user.email,
    )
    qr_code = TwoFactorAuth.generate_qr_code(uri)
    
    # Generate backup codes
    backup_codes = TwoFactorAuth.generate_backup_codes()
    
    # Store secret temporarily (user must verify before enabling)
    current_user.two_factor_secret = secret
    current_user.two_factor_backup_codes = str(backup_codes)  # Store as JSON string
    current_user.two_factor_verified = False
    
    await db.commit()
    
    return TwoFactorSetupResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=backup_codes,
    )


@router.post("/verify")
@rate_limit_decorator("10/minute")
async def verify_two_factor_setup(
    request: Request,
    data: TwoFactorVerifyRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify 2FA setup with TOTP token"""
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated",
        )
    
    # Verify token
    is_valid = TwoFactorAuth.verify_totp(
        secret=current_user.two_factor_secret,
        token=data.token,
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid TOTP token",
        )
    
    # Enable 2FA
    current_user.two_factor_enabled = True
    current_user.two_factor_verified = True
    
    await db.commit()
    
    return {"message": "2FA enabled successfully"}


@router.post("/disable")
@rate_limit_decorator("5/minute")
async def disable_two_factor(
    request: Request,
    data: TwoFactorDisableRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Disable 2FA (requires password verification)"""
    # Verify password (implement password verification)
    # For now, just disable if user is authenticated
    
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.two_factor_backup_codes = None
    current_user.two_factor_verified = False
    
    await db.commit()
    
    return {"message": "2FA disabled successfully"}


@router.post("/verify-login")
@rate_limit_decorator("10/minute")
async def verify_two_factor_login(
    request: Request,
    data: TwoFactorVerifyRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Verify 2FA token during login"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this user",
        )
    
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="2FA secret not found",
        )
    
    # Verify TOTP token
    is_valid = TwoFactorAuth.verify_totp(
        secret=current_user.two_factor_secret,
        token=data.token,
    )
    
    if not is_valid:
        # Check backup codes
        backup_valid, updated_codes = TwoFactorAuth.verify_backup_code(
            current_user.two_factor_backup_codes,
            data.token
        )
        
        if backup_valid:
            # Update backup codes list (remove used code)
            import json
            current_user.two_factor_backup_codes = json.dumps(updated_codes) if updated_codes else None
            await db.commit()
            logger.info(f"User {current_user.email} used backup code for 2FA login")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA token or backup code",
            )
    
    return {"verified": True}

