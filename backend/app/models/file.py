"""File model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Integer, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class File(Base):
    """File model."""

    __tablename__ = "files"
    __table_args__ = (
        Index("idx_files_user_id", "user_id"),
        Index("idx_files_created_at", "created_at"),
        Index("idx_files_file_key", "file_key", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    file_key = Column(String(500), unique=True, nullable=False, index=True)  # S3 key
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)  # File size in bytes
    url = Column(String(1000), nullable=False)  # Presigned URL or public URL
    folder = Column(String(100), nullable=True)  # Folder path in S3
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    user = relationship("User", backref="files")

    def __repr__(self) -> str:
        return f"<File(id={self.id}, filename={self.filename}, user_id={self.user_id})>"

