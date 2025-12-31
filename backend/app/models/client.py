"""
Client Model
SQLAlchemy model for client module
Simplified model for companies only
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Integer, String, func, Enum, Index, ForeignKey

from app.core.database import Base


class ClientStatus(PyEnum):
    """Client status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class ClientType(PyEnum):
    """Client type enum"""
    PERSON = "person"
    COMPANY = "company"


class Client(Base):
    """Client model - Simplified for companies"""
    __tablename__ = "clients"
    __table_args__ = (
        Index("idx_clients_company_name", "company_name"),
        Index("idx_clients_status", "status"),
        Index("idx_clients_type", "type"),
        Index("idx_clients_user_id", "user_id"),
        Index("idx_clients_created_at", "created_at"),
        Index("idx_clients_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Company info
    company_name = Column(String(255), nullable=False, index=True)
    type = Column(String(20), default='company', nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Portal
    portal_url = Column(String(500), nullable=True)
    
    # Status
    status = Column(Enum(ClientStatus), default=ClientStatus.ACTIVE, nullable=False, index=True)
    
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
        return f"<Client(id={self.id}, company_name={self.company_name}, status={self.status})>"
