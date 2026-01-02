"""
Project Employee Model
SQLAlchemy model for project-employee many-to-many relationship
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectEmployee(Base):
    """Project-Employee relationship model"""
    __tablename__ = "project_employees"
    __table_args__ = (
        Index("idx_project_employees_project", "project_id"),
        Index("idx_project_employees_employee", "employee_id"),
        Index("idx_project_employees_assigned_at", "assigned_at"),
        UniqueConstraint('project_id', 'employee_id', name='uq_project_employee'),
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=True)  # Optional role (e.g., 'lead', 'member', 'viewer')
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project = relationship("Project", backref="project_employees")
    employee = relationship("Employee", backref="project_employees")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

    def __repr__(self) -> str:
        return f"<ProjectEmployee(project_id={self.project_id}, employee_id={self.employee_id})>"
