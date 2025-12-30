"""
Client Model
SQLAlchemy model for project clients
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Text, Enum, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClientStatus(str, PyEnum):
    """Client status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class Client(Base):
    """Client model for projects module"""
    __tablename__ = "clients"
    __table_args__ = (
        Index("idx_clients_company_id", "company_id"),
        Index("idx_clients_responsible_id", "responsible_id"),
        Index("idx_clients_status", "status"),
        Index("idx_clients_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    status = Column(Enum(ClientStatus), default=ClientStatus.ACTIVE, nullable=False, index=True)
    responsible_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    portal_url = Column(String(500), nullable=True)  # URL du portail client
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    company = relationship("Company", backref="client", lazy="select")
    responsible = relationship("User", foreign_keys=[responsible_id], lazy="select")

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, company_id={self.company_id}, status={self.status})>"
