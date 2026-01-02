"""
Invitation Schemas
Pydantic schemas for invitations
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class InvitationBase(BaseModel):
    """Base invitation schema"""
    email: EmailStr = Field(..., description="Email address to invite")
    team_id: Optional[int] = Field(None, description="Team ID (if team invitation)")
    role_id: Optional[int] = Field(None, description="Role ID to assign")
    message: Optional[str] = Field(None, description="Custom invitation message")
    expires_in_days: int = Field(7, ge=1, le=30, description="Days until expiration")


class InvitationCreate(InvitationBase):
    """Schema for creating an invitation"""
    pass


class InvitationResponse(InvitationBase):
    """Schema for invitation response"""
    id: int
    token: str
    status: str  # pending, accepted, expired, cancelled
    invited_by_id: int
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    team: Optional[Dict[str, Any]] = None
    role: Optional[Dict[str, Any]] = None
    invited_by: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}
    
    @field_validator("invited_by", mode="before")
    @classmethod
    def convert_invited_by_to_dict(cls, v: Any) -> Optional[Dict[str, Any]]:
        """Convert User object to dictionary"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        # It's a SQLAlchemy User object
        if hasattr(v, "id"):
            return {
                "id": getattr(v, "id", None),
                "email": getattr(v, "email", None),
                "first_name": getattr(v, "first_name", None),
                "last_name": getattr(v, "last_name", None),
            }
        return v
    
    @field_validator("team", mode="before")
    @classmethod
    def convert_team_to_dict(cls, v: Any) -> Optional[Dict[str, Any]]:
        """Convert Team object to dictionary"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        # It's a SQLAlchemy Team object
        if hasattr(v, "id"):
            return {
                "id": getattr(v, "id", None),
                "name": getattr(v, "name", None),
                "slug": getattr(v, "slug", None),
            }
        return v
    
    @field_validator("role", mode="before")
    @classmethod
    def convert_role_to_dict(cls, v: Any) -> Optional[Dict[str, Any]]:
        """Convert Role object to dictionary"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        # It's a SQLAlchemy Role object
        if hasattr(v, "id"):
            return {
                "id": getattr(v, "id", None),
                "name": getattr(v, "name", None),
                "slug": getattr(v, "slug", None),
            }
        return v


class InvitationAccept(BaseModel):
    """Schema for accepting an invitation"""
    token: str = Field(..., description="Invitation token")


class InvitationListResponse(BaseModel):
    """Schema for invitation list response"""
    invitations: List[InvitationResponse]
    total: int

