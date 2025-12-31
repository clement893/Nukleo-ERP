"""
Public Holiday Model
SQLAlchemy model for public holidays
"""

from datetime import date
from sqlalchemy import Column, Integer, String, Date, Boolean, func, Index
from app.core.database import Base


class PublicHoliday(Base):
    """Public Holiday model"""
    __tablename__ = "public_holidays"
    __table_args__ = (
        Index("idx_public_holidays_date", "date"),
        Index("idx_public_holidays_year", "year"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False, index=True)
    year = Column(Integer, nullable=True)  # NULL means recurring every year
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(func.now(), nullable=False)
    updated_at = Column(func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<PublicHoliday(id={self.id}, name={self.name}, date={self.date})>"
