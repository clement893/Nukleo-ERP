"""
Transaction Category Model
SQLAlchemy model for transaction categories
"""

from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """Transaction type"""
    ENTRY = "entry"  # Entrée (revenu)
    EXIT = "exit"  # Sortie (dépense)


class TransactionCategory(Base):
    """Transaction Category model for organizing transactions"""
    __tablename__ = "transaction_categories"
    __table_args__ = (
        Index("idx_transaction_categories_user_id", "user_id"),
        Index("idx_transaction_categories_type", "type"),
        Index("idx_transaction_categories_parent_id", "parent_id"),
        Index("idx_transaction_categories_is_active", "is_active"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Category details
    name = Column(String(255), nullable=False)  # Nom de la catégorie
    type = Column(SQLEnum(TransactionType), nullable=False, index=True)  # Type: entrée ou sortie
    parent_id = Column(Integer, ForeignKey("transaction_categories.id", ondelete="SET NULL"), nullable=True, index=True)  # Catégorie parente (hiérarchie)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Metadata
    description = Column(String(1000), nullable=True)  # Description de la catégorie
    color = Column(String(7), nullable=True)  # Couleur hexadécimale pour l'affichage (ex: "#FF5733")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="transaction_categories")
    parent = relationship("TransactionCategory", remote_side=[id], backref="children")
    transactions = relationship("Transaction", back_populates="category")

    def __repr__(self) -> str:
        return f"<TransactionCategory(id={self.id}, name={self.name}, type={self.type})>"
