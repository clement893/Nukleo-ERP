"""
Projets Module - Project Schemas
Schemas Pydantic pour les projets
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from templates.modules.projets.models.project import ProjectStatus


class ProjectBase(BaseModel):
    """Schema de base pour Project"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING


class ProjectCreate(ProjectBase):
    """Schema pour création de Project"""
    client_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    """Schema pour mise à jour de Project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    client_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class ProjectResponse(ProjectBase):
    """Schema pour réponse Project"""
    id: UUID
    client_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
