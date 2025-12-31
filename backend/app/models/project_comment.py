"""
Project Comment Model
SQLAlchemy model for project and task comments/discussions
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, func, Index, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectComment(Base):
    """Project/Task Comment model"""
    __tablename__ = "project_comments"
    __table_args__ = (
        Index("idx_project_comments_project", "project_id"),
        Index("idx_project_comments_task", "task_id"),
        Index("idx_project_comments_user", "user_id"),
        Index("idx_project_comments_created_at", "created_at"),
        Index("idx_project_comments_parent", "parent_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Polymorphic relationship: can be comment on project or task
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    task_id = Column(Integer, ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Comment content
    content = Column(Text, nullable=False)
    
    # Threading support (for replies)
    parent_id = Column(Integer, ForeignKey("project_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Author
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False, index=True)
    
    # Metadata
    is_edited = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project = relationship("Project", backref="comments", foreign_keys=[project_id])
    task = relationship("ProjectTask", backref="comments", foreign_keys=[task_id])
    user = relationship("User", backref="project_comments")
    parent = relationship("ProjectComment", remote_side=[id], backref="replies")

    def __repr__(self) -> str:
        return f"<ProjectComment(id={self.id}, project_id={self.project_id}, task_id={self.task_id}, user_id={self.user_id})>"
