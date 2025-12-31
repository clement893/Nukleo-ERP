"""
Vacation Request Model
SQLAlchemy model for employee vacation requests
"""

from datetime import datetime, date
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Date, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class VacationRequest(Base):
    """Vacation Request model for management module"""
    __tablename__ = "vacation_requests"
    __table_args__ = (
        Index("idx_vacation_requests_employee_id", "employee_id"),
        Index("idx_vacation_requests_status", "status"),
        Index("idx_vacation_requests_start_date", "start_date"),
        Index("idx_vacation_requests_end_date", "end_date"),
        Index("idx_vacation_requests_created_at", "created_at"),
        Index("idx_vacation_requests_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Vacation dates
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    
    # Request details
    reason = Column(Text, nullable=True)  # Reason for vacation
    status = Column(String(50), nullable=False, default='pending', index=True)  # pending, approved, rejected, cancelled
    
    # Approval info
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)  # Reason if rejected
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], backref="vacation_requests", lazy="select")
    approved_by = relationship("User", foreign_keys=[approved_by_id], lazy="select")

    def __repr__(self) -> str:
        return f"<VacationRequest(id={self.id}, employee_id={self.employee_id}, status={self.status})>"
