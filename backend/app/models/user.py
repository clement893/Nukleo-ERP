"""User model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class User(Base):
    """User model."""

    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email", unique=True),
        Index("idx_users_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"
