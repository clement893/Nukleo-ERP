"""
Project Attachment Model
SQLAlchemy model for project and task attachments
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
import uuid

from app.core.database import Base


class ProjectAttachment(Base):
    """Project/Task Attachment model"""
    __tablename__ = "project_attachments"
    __table_args__ = (
        Index("idx_project_attachments_project", "project_id"),
        Index("idx_project_attachments_task", "task_id"),
        Index("idx_project_attachments_user", "uploaded_by_id"),
        Index("idx_project_attachments_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Polymorphic relationship: can be attached to project or task
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    task_id = Column(Integer, ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # File reference (can use existing File model or store directly)
    file_id = Column(PostgresUUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=True)
    file_url = Column(String(1000), nullable=False)  # Direct URL to file
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    # Metadata
    description = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project = relationship("Project", backref="attachments")
    task = relationship("ProjectTask", backref="attachments")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id], backref="uploaded_attachments")
    file = relationship("File", foreign_keys=[file_id])

    def __repr__(self) -> str:
        return f"<ProjectAttachment(id={self.id}, filename={self.filename}, project_id={self.project_id}, task_id={self.task_id})>"
