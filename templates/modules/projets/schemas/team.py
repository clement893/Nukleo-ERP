"""
Projets Module - Team Schemas
Schemas Pydantic pour les équipes
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TeamBase(BaseModel):
    """Schema de base pour Team"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    """Schema pour création de Team"""
    pass


class TeamUpdate(BaseModel):
    """Schema pour mise à jour de Team"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class TeamResponse(TeamBase):
    """Schema pour réponse Team"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
