"""
Company Model
SQLAlchemy model for commercial companies
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Company(Base):
    """Company model for commercial module"""
    __tablename__ = "companies"
    __table_args__ = (
        Index("idx_companies_name", "name"),
        Index("idx_companies_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    website = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name={self.name})>"
