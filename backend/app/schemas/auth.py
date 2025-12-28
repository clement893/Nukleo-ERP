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
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength - standardized with user.py schema"""
        if not v or len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password cannot exceed 128 characters")
        # Check for at least one letter and one number
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        # Check for uppercase and lowercase (recommended but not required for compatibility)
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty', 'abc123', 'password123', 
                         'admin123', 'letmein', 'welcome', 'monkey', '1234567890']
        if v.lower() in weak_passwords:
            raise ValueError("Password is too weak. Please choose a stronger password")
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


class TokenWithUser(BaseModel):
    """Token response schema with user data"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    user: UserResponse = Field(..., description="User data")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "is_active": True,
                    "theme_preference": "system",
                    "created_at": "2025-01-01T00:00:00Z",
                    "updated_at": "2025-01-01T00:00:00Z"
                }
            }
        }
    }