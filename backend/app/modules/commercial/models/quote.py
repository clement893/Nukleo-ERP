"""
Quote Model
SQLAlchemy model for commercial quotes (devis)
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Numeric, Text, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Quote(Base):
    """Quote model for commercial module - Simple quotes attached to clients"""
    __tablename__ = "quotes"
    __table_args__ = (
        Index("idx_quotes_company_id", "company_id"),
        Index("idx_quotes_user_id", "user_id"),
        Index("idx_quotes_status", "status"),
        Index("idx_quotes_created_at", "created_at"),
        Index("idx_quotes_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(50), nullable=False, unique=True, index=True)  # e.g., DEV-2025-001
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(10, 2), nullable=True)  # Total amount
    currency = Column(String(3), default="EUR", nullable=False)  # EUR, USD, etc.
    pricing_type = Column(String(20), default="fixed", nullable=False)  # fixed or hourly
    status = Column(String(50), default="draft", nullable=False, index=True)  # draft, sent, accepted, rejected, expired
    valid_until = Column(DateTime(timezone=True), nullable=True)  # Expiration date
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)  # Creator
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    company = relationship("Company", backref="quotes", lazy="select")
    user = relationship("User", foreign_keys=[user_id], backref="created_quotes", lazy="select")

    def __repr__(self) -> str:
        return f"<Quote(id={self.id}, quote_number={self.quote_number}, company_id={self.company_id})>"
