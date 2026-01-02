"""
Transaction Model
SQLAlchemy model for financial transactions
"""

from datetime import datetime
from decimal import Decimal
import enum
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, Boolean, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class TransactionStatus(str, enum.Enum):
    """Transaction status"""
    CONFIRMED = "confirmed"  # Confirmé (réel)
    PENDING = "pending"  # En attente
    PROJECTED = "projected"  # Projeté
    CANCELLED = "cancelled"  # Annulé


class Transaction(Base):
    """Transaction model for treasury management"""
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_transactions_bank_account_id", "bank_account_id"),
        Index("idx_transactions_category_id", "category_id"),
        Index("idx_transactions_date", "date"),
        Index("idx_transactions_status", "status"),
        Index("idx_transactions_user_id", "user_id"),
        Index("idx_transactions_invoice_id", "invoice_id"),
        Index("idx_transactions_expense_account_id", "expense_account_id"),
        Index("idx_transactions_project_id", "project_id"),
        Index("idx_transactions_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Transaction details
    type = Column(String(20), nullable=False)  # "entry" ou "exit"
    amount = Column(Numeric(18, 2), nullable=False)  # Montant
    date = Column(DateTime(timezone=True), nullable=False, index=True)  # Date de la transaction
    description = Column(String(500), nullable=False)  # Description
    notes = Column(Text, nullable=True)  # Notes supplémentaires
    
    # Category
    category_id = Column(Integer, ForeignKey("transaction_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Status
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.CONFIRMED, nullable=False, index=True)
    
    # References (optional links to other entities)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)  # Lien vers facture (pour revenus)
    expense_account_id = Column(Integer, ForeignKey("expense_accounts.id", ondelete="SET NULL"), nullable=True, index=True)  # Lien vers compte de dépenses
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)  # Lien vers projet
    
    # Payment method
    payment_method = Column(String(50), nullable=True)  # Méthode de paiement (chèque, virement, carte, espèces)
    reference_number = Column(String(100), nullable=True)  # Numéro de référence (numéro de chèque, virement, etc.)
    
    # Metadata
    is_recurring = Column(Boolean, default=False, nullable=False)  # Transaction récurrente
    recurring_parent_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)  # ID de la transaction récurrente parente
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="transactions")
    bank_account = relationship("BankAccount", back_populates="transactions")
    category = relationship("TransactionCategory", back_populates="transactions")
    invoice = relationship("Invoice", backref="transactions")
    expense_account = relationship("ExpenseAccount", backref="transactions")
    project = relationship("Project", backref="transactions")
    recurring_parent = relationship("Transaction", remote_side=[id], backref="recurring_children")

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, type={self.type}, amount={self.amount}, date={self.date})>"
