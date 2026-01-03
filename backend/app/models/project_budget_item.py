"""
Project Budget Item Model
SQLAlchemy model for project budget items (lignes de budget)
"""

from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Enum as SQLEnum, Numeric, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class BudgetCategory(str, enum.Enum):
    """Budget category enum"""
    MAIN_DOEUVRE = "main_doeuvre"  # Main-d'œuvre
    MATERIEL = "materiel"  # Matériel
    SERVICES = "services"  # Services
    FRAIS_GENERAUX = "frais_generaux"  # Frais généraux
    AUTRES = "autres"  # Autres


class ProjectBudgetItem(Base):
    """Project Budget Item model"""
    __tablename__ = "project_budget_items"
    __table_args__ = (
        Index("idx_project_budget_items_project_id", "project_id"),
        Index("idx_project_budget_items_category", "category"),
        Index("idx_project_budget_items_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(SQLEnum(BudgetCategory, native_enum=False), nullable=False, index=True)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)  # Total amount for this line
    quantity = Column(Numeric(10, 2), nullable=True)  # Optional quantity
    unit_price = Column(Numeric(10, 2), nullable=True)  # Optional unit price (if quantity is used)
    notes = Column(Text, nullable=True)  # Additional notes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project = relationship("Project", backref="budget_items")

    def __repr__(self) -> str:
        return f"<ProjectBudgetItem(id={self.id}, project_id={self.project_id}, category={self.category}, amount={self.amount})>"
