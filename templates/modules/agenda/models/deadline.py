"""
Agenda Module - Deadline Model
Modèle pour les deadlines
"""

from datetime import datetime, date, time
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, Date, Time, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class DeadlinePriority(str, enum.Enum):
    """Priorités des deadlines"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DeadlineStatus(str, enum.Enum):
    """Statuts possibles d'une deadline"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Deadline(Base):
    """Modèle Deadline pour le module Agenda"""
    __tablename__ = "deadlines"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Informations de base
    title: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    priority: DeadlinePriority = Column(SQLEnum(DeadlinePriority), default=DeadlinePriority.MEDIUM, nullable=False)
    status: DeadlineStatus = Column(SQLEnum(DeadlineStatus), default=DeadlineStatus.PENDING, nullable=False)
    
    # Date et heure
    due_date: date = Column(Date, nullable=False)
    due_time: Optional[time] = Column(Time, nullable=True)
    
    # Date de complétion
    completed_at: Optional[datetime] = Column(DateTime, nullable=True)
    
    # Relations
    created_by_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    project_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Deadline {self.title} - {self.due_date}>"
