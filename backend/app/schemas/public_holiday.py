"""
Public Holiday Schemas
Pydantic schemas for public holidays
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class PublicHolidayBase(BaseModel):
    """Base public holiday schema"""
    name: str = Field(..., min_length=1, max_length=200)
    date: date
    year: Optional[int] = Field(None, description="Year (NULL means recurring every year)")
    is_active: bool = Field(True)


class PublicHolidayCreate(PublicHolidayBase):
    """Schema for creating a public holiday"""
    pass


class PublicHolidayUpdate(BaseModel):
    """Schema for updating a public holiday"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[date] = None
    year: Optional[int] = None
    is_active: Optional[bool] = None


class PublicHolidayResponse(PublicHolidayBase):
    """Schema for public holiday response"""
    id: int

    class Config:
        from_attributes = True
