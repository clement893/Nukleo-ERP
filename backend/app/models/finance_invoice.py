"""
Finance Invoice Model
SQLAlchemy model for finance invoices (facturations)
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Numeric, Text, func, Index, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
import enum
import json

from app.core.database import Base


class FinanceInvoiceStatus(str, enum.Enum):
    """Finance invoice status"""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    PARTIAL = "partial"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class FinanceInvoice(Base):
    """Finance Invoice model for facturations module"""
    __tablename__ = "finance_invoices"
    __table_args__ = (
        Index("idx_finance_invoices_user_id", "user_id"),
        Index("idx_finance_invoices_project_id", "project_id"),
        Index("idx_finance_invoices_status", "status"),
        Index("idx_finance_invoices_invoice_number", "invoice_number"),
        Index("idx_finance_invoices_due_date", "due_date"),
        Index("idx_finance_invoices_issue_date", "issue_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Invoice details
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    
    # Client information (stored as JSON for flexibility)
    client_data = Column(JSON, nullable=False)  # {name, email, phone?, address?}
    
    # Line items (stored as JSON array)
    line_items = Column(JSON, nullable=False)  # [{id, description, quantity, unitPrice, total}]
    
    # Amounts
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0)  # Percentage
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total = Column(Numeric(10, 2), nullable=False, default=0)
    amount_paid = Column(Numeric(10, 2), default=0, nullable=False)
    amount_due = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Status
    status = Column(SQLEnum(FinanceInvoiceStatus), default=FinanceInvoiceStatus.DRAFT, nullable=False, index=True)
    
    # Dates
    issue_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    last_reminder_date = Column(DateTime(timezone=True), nullable=True)
    
    # Additional information
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)  # Payment terms
    
    # PDF and links
    pdf_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])

    def __repr__(self) -> str:
        return f"<FinanceInvoice(id={self.id}, invoice_number={self.invoice_number}, status={self.status})>"


class FinanceInvoicePayment(Base):
    """Finance Invoice Payment model"""
    __tablename__ = "finance_invoice_payments"
    __table_args__ = (
        Index("idx_finance_invoice_payments_invoice_id", "invoice_id"),
        Index("idx_finance_invoice_payments_date", "payment_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("finance_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    payment_method = Column(String(50), nullable=False)  # credit_card, bank_transfer, check, cash
    reference = Column(String(255), nullable=True)  # Payment reference number
    
    # Notes
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    invoice = relationship("FinanceInvoice", foreign_keys=[invoice_id])

    def __repr__(self) -> str:
        return f"<FinanceInvoicePayment(id={self.id}, invoice_id={self.invoice_id}, amount={self.amount})>"
