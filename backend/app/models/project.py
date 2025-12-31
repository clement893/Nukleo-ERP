"""
Project Model
SQLAlchemy model for projects
"""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, func, Index, Enum, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectStatus(PyEnum):
    """Project status enum"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class Project(Base):
    """Project model"""
    __tablename__ = "projects"
    __table_args__ = (
        Index("idx_projects_user_id", "user_id"),  # For filtering by user
        Index("idx_projects_status", "status"),  # For filtering by status
        Index("idx_projects_client_id", "client_id"),  # For filtering by client
        Index("idx_projects_responsable_id", "responsable_id"),  # For filtering by responsable
        Index("idx_projects_created_at", "created_at"),  # For sorting by creation date
        Index("idx_projects_updated_at", "updated_at"),  # For sorting by update date
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)  # Client connected to the project
    responsable_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)  # Employee linked to the project
    
    # Extended fields for project management
    equipe = Column(String(50), nullable=True)  # Team number
    etape = Column(String(100), nullable=True, index=True)  # Project stage
    annee_realisation = Column(String(50), nullable=True, index=True)  # Year of realization
    contact = Column(String(255), nullable=True)  # Contact name
    proposal_url = Column(String(500), nullable=True)  # Proposal link
    drive_url = Column(String(500), nullable=True)  # Drive link
    slack_url = Column(String(500), nullable=True)  # Slack link
    echeancier_url = Column(String(500), nullable=True)  # Schedule link
    temoignage_status = Column(String(50), nullable=True)  # Testimonial status
    portfolio_status = Column(String(50), nullable=True)  # Portfolio status
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", backref="projects")
    client = relationship("Client", foreign_keys=[client_id], backref="projects")  # Client connected to the project
    responsable = relationship("Employee", foreign_keys=[responsable_id], backref="projects")  # Employee linked to the project

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name}, status={self.status})>"


