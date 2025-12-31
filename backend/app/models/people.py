"""
People Model
SQLAlchemy model for people module
Modèle indépendant pour les personnes (non lié à Employee)
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Integer, String, Text, func, Enum, Index, Date

from app.core.database import Base


class PeopleStatus(PyEnum):
    """People status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class People(Base):
    """People model - Modèle indépendant pour les personnes"""
    __tablename__ = "people"
    __table_args__ = (
        Index("idx_people_first_name", "first_name"),
        Index("idx_people_last_name", "last_name"),
        Index("idx_people_email", "email"),
        Index("idx_people_status", "status"),
        Index("idx_people_created_at", "created_at"),
        Index("idx_people_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    linkedin = Column(String(500), nullable=True)
    photo_url = Column(String(1000), nullable=True)  # S3 URL
    photo_filename = Column(String(500), nullable=True)  # Filename for photo matching during import
    birthday = Column(Date, nullable=True)  # Anniversaire
    
    # Informations additionnelles
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    portal_url = Column(String(500), nullable=True)
    
    # Statut
    status = Column(Enum(PeopleStatus), default=PeopleStatus.ACTIVE, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<People(id={self.id}, name={self.first_name} {self.last_name}, status={self.status})>"
