"""
Projets Module - Project Model
Modèle pour les projets
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class ProjectStatus(str, enum.Enum):
    """Statuts possibles d'un projet"""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Project(Base):
    """Modèle Project pour le module Projets"""
    __tablename__ = "projects"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    status: ProjectStatus = Column(SQLEnum(ProjectStatus), default=ProjectStatus.PLANNING, nullable=False)
    
    # Relations
    client_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    team_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Project {self.name}>"
