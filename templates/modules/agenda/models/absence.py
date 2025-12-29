"""
Agenda Module - Absence Model
Modèle pour les absences et vacances
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, Date, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class AbsenceType(str, enum.Enum):
    """Types d'absences"""
    VACATION = "vacation"
    SICK_LEAVE = "sick_leave"
    PERSONAL_LEAVE = "personal_leave"
    MATERNITY_LEAVE = "maternity_leave"
    PATERNITY_LEAVE = "paternity_leave"
    UNPAID_LEAVE = "unpaid_leave"
    OTHER = "other"


class AbsenceStatus(str, enum.Enum):
    """Statuts possibles d'une absence"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class Absence(Base):
    """Modèle Absence pour le module Agenda"""
    __tablename__ = "absences"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Informations de base
    absence_type: AbsenceType = Column(SQLEnum(AbsenceType), nullable=False)
    status: AbsenceStatus = Column(SQLEnum(AbsenceStatus), default=AbsenceStatus.PENDING, nullable=False)
    reason: Optional[str] = Column(Text, nullable=True)
    
    # Dates
    start_date: date = Column(Date, nullable=False)
    end_date: date = Column(Date, nullable=False)
    
    # Nombre de jours
    days_count: Optional[int] = Column(Integer, nullable=True)
    
    # Relations
    employee_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    user_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Commentaires
    comments: Optional[str] = Column(Text, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Absence {self.absence_type} - {self.start_date} to {self.end_date}>"
