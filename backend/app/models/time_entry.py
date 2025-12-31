"""
Time Entry Model
SQLAlchemy model for time tracking entries
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Numeric, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class TimeEntry(Base):
    """Time Entry model for tracking time spent on tasks"""
    __tablename__ = "time_entries"
    __table_args__ = (
        Index("idx_time_entries_user", "user_id"),
        Index("idx_time_entries_task", "task_id"),
        Index("idx_time_entries_project", "project_id"),
        Index("idx_time_entries_client", "client_id"),
        Index("idx_time_entries_date", "date"),
        Index("idx_time_entries_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=True)
    
    # Duration in seconds
    duration = Column(Integer, nullable=False, default=0)
    
    # Date of the time entry
    date = Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())
    
    # Relations
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="time_entries")
    task = relationship("ProjectTask", backref="time_entries")
    project = relationship("Project", backref="time_entries")
    client = relationship("Client", backref="time_entries")

    def __repr__(self) -> str:
        return f"<TimeEntry(id={self.id}, user_id={self.user_id}, duration={self.duration}s)>"
