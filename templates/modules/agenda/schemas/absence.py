"""
Agenda Module - Absence Schemas
Schemas Pydantic pour les absences
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from templates.modules.agenda.models.absence import AbsenceType, AbsenceStatus


class AbsenceBase(BaseModel):
    """Schema de base pour Absence"""
    absence_type: AbsenceType
    status: AbsenceStatus = AbsenceStatus.PENDING
    reason: Optional[str] = None
    start_date: date
    end_date: date
    days_count: Optional[int] = None
    comments: Optional[str] = None


class AbsenceCreate(AbsenceBase):
    """Schema pour création de Absence"""
    employee_id: Optional[UUID] = None
    user_id: UUID
    approved_by_id: Optional[UUID] = None


class AbsenceUpdate(BaseModel):
    """Schema pour mise à jour de Absence"""
    absence_type: Optional[AbsenceType] = None
    status: Optional[AbsenceStatus] = None
    reason: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    days_count: Optional[int] = None
    comments: Optional[str] = None
    employee_id: Optional[UUID] = None
    approved_by_id: Optional[UUID] = None


class AbsenceResponse(AbsenceBase):
    """Schema pour réponse Absence"""
    id: UUID
    employee_id: Optional[UUID] = None
    user_id: UUID
    approved_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
