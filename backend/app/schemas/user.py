"""
User Schemas
Pydantic v2 models for user management
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import re


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr = Field(..., description="User email address", strip_whitespace=True)
    first_name: Optional[str] = Field(None, max_length=100, description="First name", strip_whitespace=True)
    last_name: Optional[str] = Field(None, max_length=100, description="Last name", strip_whitespace=True)
    is_active: bool = Field(default=True, description="User active status")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate and normalize email"""
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        # Normalize email (lowercase)
        return v.strip().lower()
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate name fields"""
        if v is not None:
            cleaned = v.strip()
            if cleaned and len(cleaned) > 100:
                raise ValueError('Name cannot exceed 100 characters')
            # Reject names with only special characters
            if cleaned and not re.match(r'^[a-zA-ZÀ-ÿ\s\-\']+$', cleaned):
                raise ValueError('Name can only contain letters, spaces, hyphens, and apostrophes')
            return cleaned if cleaned else None
        return v


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if not v or len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password cannot exceed 128 characters')
        # Check for at least one letter and one number
        if not re.search(r'[a-zA-Z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty', 'abc123', 'password123']
        if v.lower() in weak_passwords:
            raise ValueError('Password is too weak. Please choose a stronger password')
        return v


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = Field(None, strip_whitespace=True)
    first_name: Optional[str] = Field(None, max_length=100, strip_whitespace=True)
    last_name: Optional[str] = Field(None, max_length=100, strip_whitespace=True)
    is_active: Optional[bool] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize email"""
        if v is not None:
            cleaned = v.strip().lower()
            if not cleaned:
                raise ValueError('Email cannot be empty')
            return cleaned
        return v
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate name fields"""
        if v is not None:
            cleaned = v.strip()
            if cleaned and len(cleaned) > 100:
                raise ValueError('Name cannot exceed 100 characters')
            # Reject names with only special characters
            if cleaned and not re.match(r'^[a-zA-ZÀ-ÿ\s\-\']+$', cleaned):
                raise ValueError('Name can only contain letters, spaces, hyphens, and apostrophes')
            return cleaned if cleaned else None
        return v


class User(UserBase):
    """User response schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInDB(User):
    """User in database schema"""
    hashed_password: str


# Alias for API responses
UserResponse = User