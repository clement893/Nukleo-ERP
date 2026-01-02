"""
Bank Account Model
SQLAlchemy model for bank accounts
"""

from datetime import datetime
from decimal import Decimal
import enum
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class BankAccountType(str, enum.Enum):
    """Bank account type"""
    CHECKING = "checking"  # Compte chèque
    SAVINGS = "savings"  # Compte épargne
    CREDIT = "credit"  # Compte crédit
    INVESTMENT = "investment"  # Compte investissement
    OTHER = "other"  # Autre


class BankAccount(Base):
    """Bank Account model for treasury management"""
    __tablename__ = "bank_accounts"
    __table_args__ = (
        Index("idx_bank_accounts_user_id", "user_id"),
        Index("idx_bank_accounts_is_active", "is_active"),
        Index("idx_bank_accounts_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Account details
    name = Column(String(255), nullable=False)  # Nom du compte (ex: "Compte Principal")
    account_type = Column(SQLEnum(BankAccountType), default=BankAccountType.CHECKING, nullable=False)
    bank_name = Column(String(255), nullable=True)  # Nom de la banque
    account_number = Column(String(100), nullable=True)  # Numéro de compte (masqué)
    
    # Financial information
    initial_balance = Column(Numeric(18, 2), default=0, nullable=False)  # Solde initial
    currency = Column(String(3), default="CAD", nullable=False)  # Devise
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Metadata
    notes = Column(String(1000), nullable=True)  # Notes sur le compte
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="bank_accounts")
    transactions = relationship("Transaction", back_populates="bank_account", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<BankAccount(id={self.id}, name={self.name}, user_id={self.user_id})>"
