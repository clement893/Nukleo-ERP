"""
Employee Model
SQLAlchemy model for employees module
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Date
from sqlalchemy.orm import relationship

from app.core.database import Base


class Employee(Base):
    """Employee model for employees module"""
    __tablename__ = "employees"
    __table_args__ = (
        Index("idx_employees_email", "email"),
        Index("idx_employees_created_at", "created_at"),
        Index("idx_employees_updated_at", "updated_at"),
        Index("idx_employees_hire_date", "hire_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    linkedin = Column(String(500), nullable=True)
    photo_url = Column(String(1000), nullable=True)  # S3 URL
    photo_filename = Column(String(500), nullable=True)  # Filename for photo matching during import
    hire_date = Column(Date, nullable=True, index=True)  # Date d'embauche
    birthday = Column(Date, nullable=True)  # Anniversaire
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True, index=True)  # Link to User account
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="employee", lazy="select")

    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, name={self.first_name} {self.last_name})>"
