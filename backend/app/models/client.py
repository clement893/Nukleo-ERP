"""
Client Model
SQLAlchemy model for client module
Modèle indépendant pour les clients (non lié à Employee)
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Integer, String, Text, func, Enum, Index, Date, ForeignKey

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
    """Client model - Modèle indépendant pour les clients"""
    __tablename__ = "clients"
    __table_args__ = (
        Index("idx_clients_first_name", "first_name"),
        Index("idx_clients_last_name", "last_name"),
        Index("idx_clients_email", "email"),
        Index("idx_clients_status", "status"),
        Index("idx_clients_created_at", "created_at"),
        Index("idx_clients_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Type and company info
    type = Column(String(20), default='person', nullable=False, index=True)
    company_name = Column(String(255), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=True, index=True)  # Nullable for companies
    last_name = Column(String(100), nullable=True, index=True)  # Nullable for companies
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
        return f"<Client(id={self.id}, name={self.first_name} {self.last_name}, status={self.status})>"
