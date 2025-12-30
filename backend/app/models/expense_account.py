"""
Expense Account Model
SQLAlchemy model for expense accounts (comptes de dépenses)
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean, Index, func, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExpenseAccountStatus(str, enum.Enum):
    """Status of an expense account"""
    DRAFT = "draft"  # Brouillon
    SUBMITTED = "submitted"  # Soumis
    UNDER_REVIEW = "under_review"  # En révision
    APPROVED = "approved"  # Approuvé
    REJECTED = "rejected"  # Rejeté
    NEEDS_CLARIFICATION = "needs_clarification"  # Demande de précisions


class ExpenseAccount(Base):
    """Expense Account model for managing employee expense reports"""
    __tablename__ = "expense_accounts"
    __table_args__ = (
        Index("idx_expense_accounts_employee_id", "employee_id"),
        Index("idx_expense_accounts_status", "status"),
        Index("idx_expense_accounts_created_at", "created_at"),
        Index("idx_expense_accounts_submitted_at", "submitted_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Employee relationship
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Account details
    account_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g., "EXP-2024-001"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status and workflow
    status = Column(String(50), default=ExpenseAccountStatus.DRAFT.value, nullable=False, index=True)
    
    # Dates
    expense_period_start = Column(DateTime(timezone=True), nullable=True)  # Période de dépenses (début)
    expense_period_end = Column(DateTime(timezone=True), nullable=True)  # Période de dépenses (fin)
    submitted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Financial information
    total_amount = Column(Numeric(10, 2), default=0, nullable=False)  # Montant total
    currency = Column(String(3), default="EUR", nullable=False)  # Devise
    
    # Review information
    review_notes = Column(Text, nullable=True)  # Notes de révision
    clarification_request = Column(Text, nullable=True)  # Demande de précisions
    rejection_reason = Column(Text, nullable=True)  # Raison du rejet
    
    # Metadata (renamed from 'metadata' to avoid SQLAlchemy reserved name conflict)
    account_metadata = Column("metadata", JSON, nullable=True)  # Données supplémentaires (lignes de dépenses, etc.)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], backref="expense_accounts", lazy="select")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id], lazy="select")

    def __repr__(self):
        return f"<ExpenseAccount(id={self.id}, account_number={self.account_number}, status={self.status})>"
