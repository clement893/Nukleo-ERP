"""
People Model
SQLAlchemy model for people module
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, func, Enum, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class PeopleStatus(PyEnum):
    """People status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class People(Base):
    """People model for operations module"""
    __tablename__ = "people"
    __table_args__ = (
        Index("idx_people_name", "name"),
        Index("idx_people_status", "status"),
        Index("idx_people_responsable_id", "responsable_id"),
        Index("idx_people_created_at", "created_at"),
        Index("idx_people_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    status = Column(Enum(PeopleStatus), default=PeopleStatus.ACTIVE, nullable=False, index=True)
    responsable_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    portal_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    responsable = relationship("Employee", foreign_keys=[responsable_id], backref="managed_people", lazy="select")

    def __repr__(self) -> str:
        return f"<People(id={self.id}, name={self.name}, status={self.status})>"
