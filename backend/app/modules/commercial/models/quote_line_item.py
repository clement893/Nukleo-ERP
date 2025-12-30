"""
Quote Line Item Model
SQLAlchemy model for quote line items (lignes budgétaires)
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Numeric, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class QuoteLineItem(Base):
    """Quote line item model for budget lines in quotes"""
    __tablename__ = "quote_line_items"
    __table_args__ = (
        Index("idx_quote_line_items_quote_id", "quote_id"),
        Index("idx_quote_line_items_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)  # Description of the line item
    quantity = Column(Numeric(10, 2), nullable=True)  # Quantity (for hourly rate: hours)
    unit_price = Column(Numeric(10, 2), nullable=True)  # Unit price (for hourly rate: rate per hour)
    total_price = Column(Numeric(10, 2), nullable=True)  # Total price (quantity * unit_price)
    line_order = Column(Integer, default=0, nullable=False)  # Order of the line in the quote
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    quote = relationship("Quote", backref="line_items", lazy="select")

    def __repr__(self) -> str:
        return f"<QuoteLineItem(id={self.id}, quote_id={self.quote_id}, description={self.description[:30]}...)>"
