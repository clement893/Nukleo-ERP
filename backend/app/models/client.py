"""
Client Model
SQLAlchemy model for operations clients
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Text, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ClientStatus(str, enum.Enum):
    """Client status enum"""
    ACTIVE = "actif"
    INACTIVE = "inactif"
    MAINTENANCE = "maintenance"


class Client(Base):
    """Client model for operations module"""
    __tablename__ = "clients"
    __table_args__ = (
        Index("idx_clients_company_id", "company_id"),
        Index("idx_clients_responsable_id", "responsable_id"),
        Index("idx_clients_status", "status"),
        Index("idx_clients_created_at", "created_at"),
        Index("idx_clients_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(ClientStatus), default=ClientStatus.ACTIVE, nullable=False, index=True)
    responsable_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    portal_url = Column(String(500), nullable=True)  # Lien vers le portail client
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    company = relationship("Company", backref="client_records", lazy="select")
    responsable = relationship("User", foreign_keys=[responsable_id], backref="managed_clients", lazy="select")

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, company_id={self.company_id}, status={self.status})>"
