"""
User Model
SQLAlchemy model for users
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email"),  # Already unique, but explicit index
        Index("idx_users_is_active", "is_active"),  # For filtering active users
        Index("idx_users_created_at", "created_at"),  # For sorting by creation date
        Index("idx_users_updated_at", "updated_at"),  # For sorting by update date
    )

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(100), nullable=True, index=True)  # For search
    last_name = Column(String(100), nullable=True, index=True)  # For search
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    # Note: theme_preference column exists in DB but is deprecated - theme is now global
    theme_preference = Column(String(20), default='system', nullable=False)  # Deprecated: kept for DB compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    owned_teams = relationship("Team", foreign_keys="Team.owner_id", back_populates="owner")
    sent_invitations = relationship("Invitation", foreign_keys="Invitation.invited_by_id", back_populates="invited_by")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
