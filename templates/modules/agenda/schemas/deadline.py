"""
Agenda Module - Deadline Schemas
Schemas Pydantic pour les deadlines
"""

from datetime import datetime, date, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from templates.modules.agenda.models.deadline import DeadlinePriority, DeadlineStatus


class DeadlineBase(BaseModel):
    """Schema de base pour Deadline"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: DeadlinePriority = DeadlinePriority.MEDIUM
    status: DeadlineStatus = DeadlineStatus.PENDING
    due_date: date
    due_time: Optional[time] = None
    completed_at: Optional[datetime] = None


class DeadlineCreate(DeadlineBase):
    """Schema pour création de Deadline"""
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None
    project_id: Optional[UUID] = None


class DeadlineUpdate(BaseModel):
    """Schema pour mise à jour de Deadline"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[DeadlinePriority] = None
    status: Optional[DeadlineStatus] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    completed_at: Optional[datetime] = None
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None
    project_id: Optional[UUID] = None


class DeadlineResponse(DeadlineBase):
    """Schema pour réponse Deadline"""
    id: UUID
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
