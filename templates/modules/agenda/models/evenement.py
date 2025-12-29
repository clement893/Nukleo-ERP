"""
Agenda Module - Event Model
Modèle pour les événements
"""

from datetime import datetime, date, time
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, Date, Time, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class EventType(str, enum.Enum):
    """Types d'événements"""
    MEETING = "meeting"
    TASK = "task"
    REMINDER = "reminder"
    HOLIDAY = "holiday"
    OTHER = "other"


class EventStatus(str, enum.Enum):
    """Statuts possibles d'un événement"""
    PLANNED = "planned"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Evenement(Base):
    """Modèle Evenement pour le module Agenda"""
    __tablename__ = "evenements"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Informations de base
    title: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    event_type: EventType = Column(SQLEnum(EventType), default=EventType.MEETING, nullable=False)
    status: EventStatus = Column(SQLEnum(EventStatus), default=EventStatus.PLANNED, nullable=False)
    
    # Dates et heures
    start_date: date = Column(Date, nullable=False)
    end_date: Optional[date] = Column(Date, nullable=True)
    start_time: Optional[time] = Column(Time, nullable=True)
    end_time: Optional[time] = Column(Time, nullable=True)
    all_day: bool = Column(Boolean, default=False, nullable=False)
    
    # Localisation
    location: Optional[str] = Column(String(255), nullable=True)
    
    # Relations
    created_by_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Evenement {self.title}>"
