"""User schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """User creation schema."""

    password: str = Field(..., min_length=8, max_length=255)


class UserUpdate(BaseModel):
    """User update schema."""

    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class UserResponse(UserBase):
    """User response schema."""

    id: UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login schema."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""

    refresh_token: str
