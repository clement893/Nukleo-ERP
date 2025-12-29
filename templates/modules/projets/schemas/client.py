"""
Projets Module - Client Schemas
Schemas Pydantic pour les clients
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ClientBase(BaseModel):
    """Schema de base pour Client"""
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    """Schema pour création de Client"""
    pass


class ClientUpdate(BaseModel):
    """Schema pour mise à jour de Client"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientResponse(ClientBase):
    """Schema pour réponse Client"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
