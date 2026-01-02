"""
Transaction Model
Financial transactions (revenues and expenses)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """Transaction type"""
    REVENUE = "revenue"
    EXPENSE = "expense"


class TransactionStatus(str, enum.Enum):
    """Transaction status"""
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class Transaction(Base):
    """Transaction model for revenues and expenses"""
    
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_transactions_user_id", "user_id"),
        Index("idx_transactions_type", "type"),
        Index("idx_transactions_status", "status"),
        Index("idx_transactions_date", "transaction_date"),
        Index("idx_transactions_category", "category"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction details
    type = Column(SQLEnum(TransactionType), nullable=False, index=True)  # revenue or expense
    description = Column(String(500), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="CAD", nullable=False)
    
    # Categorization
    category = Column(String(100), nullable=True, index=True)  # e.g., "Sales", "Marketing", "Office Supplies"
    
    # Dates
    transaction_date = Column(DateTime(timezone=True), nullable=False, index=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)  # When actually paid/received
    
    # Status
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False, index=True)
    
    # Additional info
    supplier_id = Column(Integer, nullable=True)  # For expenses, link to supplier
    supplier_name = Column(String(200), nullable=True)  # Denormalized for quick access
    invoice_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Recurring
    is_recurring = Column(String(10), default="false", nullable=False)  # "true" or "false" as string
    recurring_id = Column(Integer, nullable=True)  # Link to recurring transaction template
    
    # Metadata
    transaction_metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="transactions")
    
    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, type={self.type}, amount={self.amount}, date={self.transaction_date})>"
