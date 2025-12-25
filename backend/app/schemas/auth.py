"""
Authentication Schemas
Pydantic v2 models for authentication
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    """Token response schema"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    token: Optional[str] = Field(None, description="Expired access token to refresh")
    refresh_token: Optional[str] = Field(None, description="Refresh token (if implemented)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }
        }
    }


class TokenData(BaseModel):
    """Token data schema"""
    username: Optional[str] = None


class UserCreate(BaseModel):
    """User creation schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123",
                "first_name": "John",
                "last_name": "Doe",
            }
        }
    }


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    # DEPRECATED: theme_preference is kept for API compatibility only
    # Theme management is now handled globally via the theme system
    theme_preference: str = Field(
        default='system', 
        description="DEPRECATED: Theme is now global. This field is kept for backward compatibility only."
    )
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

