"""
Submission Model
SQLAlchemy model for commercial submissions (soumissions complexes)
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Text, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Submission(Base):
    """Submission model for commercial module - Complex submission documents"""
    __tablename__ = "submissions"
    __table_args__ = (
        Index("idx_submissions_company_id", "company_id"),
        Index("idx_submissions_user_id", "user_id"),
        Index("idx_submissions_status", "status"),
        Index("idx_submissions_type", "type"),
        Index("idx_submissions_created_at", "created_at"),
        Index("idx_submissions_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    submission_number = Column(String(50), nullable=False, unique=True, index=True)  # e.g., SOU-2025-001
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=True, index=True)  # rfp, tender, proposal, etc.
    description = Column(Text, nullable=True)
    content = Column(JSON, nullable=True)  # Complex structured content
    status = Column(String(50), default="draft", nullable=False, index=True)  # draft, submitted, under_review, accepted, rejected
    deadline = Column(DateTime(timezone=True), nullable=True)  # Submission deadline
    submitted_at = Column(DateTime(timezone=True), nullable=True)  # When actually submitted
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # List of file references
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)  # Creator
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    company = relationship("Company", backref="submissions", lazy="select")
    user = relationship("User", foreign_keys=[user_id], backref="created_submissions", lazy="select")

    def __repr__(self) -> str:
        return f"<Submission(id={self.id}, submission_number={self.submission_number}, company_id={self.company_id})>"
