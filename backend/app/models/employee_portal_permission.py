"""
Employee Portal Permission Model
SQLAlchemy model for employee portal access permissions
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Boolean, ForeignKey, Text, func, Index, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class EmployeePortalPermission(Base):
    """Employee Portal Permission model for controlling access to portal pages/modules"""
    __tablename__ = "employee_portal_permissions"
    __table_args__ = (
        Index("idx_employee_portal_permissions_user", "user_id"),
        Index("idx_employee_portal_permissions_employee", "employee_id"),
        Index("idx_employee_portal_permissions_type", "permission_type"),
        Index("idx_employee_portal_permissions_unique", "user_id", "permission_type", "resource_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # User or Employee reference (at least one must be set)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Permission type: 'page', 'module', 'project', 'client'
    permission_type = Column(String(50), nullable=False, index=True)
    
    # Resource identifier (page path, module name, project_id, client_id, etc.)
    resource_id = Column(String(255), nullable=False, default="*")  # "*" means all resources of this type
    
    # Additional metadata (JSON) for complex permissions
    permission_metadata = Column("metadata", JSON, nullable=True)  # e.g., {"projects": [1, 2, 3], "clients": [5, 6]}
    
    # Access control
    can_view = Column(Boolean, default=True, nullable=False)
    can_edit = Column(Boolean, default=False, nullable=False)
    can_delete = Column(Boolean, default=False, nullable=False)
    
    # Description/notes
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="portal_permissions")
    employee = relationship("Employee", foreign_keys=[employee_id], backref="portal_permissions")

    def __repr__(self) -> str:
        return f"<EmployeePortalPermission(id={self.id}, user_id={self.user_id}, type={self.permission_type}, resource={self.resource_id})>"
