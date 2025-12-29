"""
Projets Module - Team Model
Modèle pour les équipes
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.database import Base


class Team(Base):
    """Modèle Team pour les Modules Opérations"""
    __tablename__ = "teams"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False, index=True)
    description: Optional[str] = Column(Text, nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Team {self.name}>"
