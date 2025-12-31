"""
Project Task Model
SQLAlchemy model for project tasks
"""

from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Enum as SQLEnum, Numeric, func, Index, TypeDecorator
from sqlalchemy.orm import relationship

from app.core.database import Base


class EnumValueType(TypeDecorator):
    """Custom type that stores enum values (not names) as strings"""
    impl = String
    cache_ok = True
    
    def __init__(self, enum_class, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = enum_class
        self.length = kwargs.get('length', 50)
        self.impl = String(self.length)
    
    def process_bind_param(self, value, dialect):
        """Convert enum to its value when inserting"""
        if value is None:
            return None
        if isinstance(value, enum.Enum):
            return value.value
        return value
    
    def process_result_value(self, value, dialect):
        """Convert value back to enum when reading"""
        if value is None:
            return None
        try:
            return self.enum_class(value)
        except ValueError:
            return value


class TaskStatus(str, enum.Enum):
    """Task status enum"""
    TODO = "todo"  # The Shelf - tâches à commencer
    IN_PROGRESS = "in_progress"  # En cours
    BLOCKED = "blocked"  # The Storage - tâches bloquées
    TO_TRANSFER = "to_transfer"  # The Checkout - tâches à transférer
    COMPLETED = "completed"  # Terminées


class TaskPriority(str, enum.Enum):
    """Task priority enum"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ProjectTask(Base):
    """Project Task model"""
    __tablename__ = "project_tasks"
    __table_args__ = (
        Index("idx_project_tasks_team", "team_id"),
        Index("idx_project_tasks_project", "project_id"),
        Index("idx_project_tasks_assignee", "assignee_id"),
        Index("idx_project_tasks_status", "status"),
        Index("idx_project_tasks_priority", "priority"),
        Index("idx_project_tasks_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(EnumValueType(TaskStatus, length=20), default=TaskStatus.TODO, nullable=False, index=True)
    priority = Column(EnumValueType(TaskPriority, length=20), default=TaskPriority.MEDIUM, nullable=False, index=True)
    
    # Relations
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Estimated hours (in hours, can be decimal)
    estimated_hours = Column(Numeric(10, 2), nullable=True)
    
    # Order for drag & drop
    order = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    team = relationship("Team", backref="tasks")
    project = relationship("Project", backref="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")
    created_by = relationship("User", foreign_keys=[created_by_id], backref="created_tasks")

    def __repr__(self) -> str:
        return f"<ProjectTask(id={self.id}, title={self.title}, status={self.status})>"
