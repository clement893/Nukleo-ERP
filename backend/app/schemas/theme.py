"""
Pydantic schemas for Theme API endpoints.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class ThemeBase(BaseModel):
    """Base schema for Theme."""
    name: str = Field(..., min_length=1, max_length=100, description="Unique theme identifier")
    display_name: str = Field(..., min_length=1, max_length=200, description="Display name for the theme")
    description: Optional[str] = Field(None, description="Theme description")
    config: Dict[str, Any] = Field(default_factory=dict, description="Theme configuration (CSS variables, colors, etc.)")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate theme name format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Theme name must contain only alphanumeric characters, hyphens, and underscores')
        return v.lower()


class ThemeCreate(ThemeBase):
    """Schema for creating a new theme."""
    is_active: Optional[bool] = Field(False, description="Whether this theme should be activated immediately")


class ThemeUpdate(BaseModel):
    """Schema for updating an existing theme."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ThemeResponse(ThemeBase):
    """Schema for theme response."""
    id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ThemeListResponse(BaseModel):
    """Schema for theme list response."""
    themes: list[ThemeResponse]
    total: int
    active_theme_id: Optional[int] = None


class ThemeConfigResponse(BaseModel):
    """Schema for active theme configuration (public endpoint)."""
    id: int = Field(..., description="Theme ID")
    name: str
    display_name: str
    config: Dict[str, Any]
    updated_at: datetime
    
    class Config:
        from_attributes = True


