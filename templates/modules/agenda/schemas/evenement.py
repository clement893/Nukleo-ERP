"""
Agenda Module - Event Schemas
Schemas Pydantic pour les événements
"""

from datetime import datetime, date, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from templates.modules.agenda.models.evenement import EventType, EventStatus


class EvenementBase(BaseModel):
    """Schema de base pour Evenement"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: EventType = EventType.MEETING
    status: EventStatus = EventStatus.PLANNED
    start_date: date
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    all_day: bool = False
    location: Optional[str] = Field(None, max_length=255)


class EvenementCreate(EvenementBase):
    """Schema pour création de Evenement"""
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None


class EvenementUpdate(BaseModel):
    """Schema pour mise à jour de Evenement"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    all_day: Optional[bool] = None
    location: Optional[str] = Field(None, max_length=255)
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None


class EvenementResponse(EvenementBase):
    """Schema pour réponse Evenement"""
    id: UUID
    created_by_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
