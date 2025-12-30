"""
Quote Schemas
Pydantic v2 models for commercial quotes
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, field_validator


class QuoteLineItemBase(BaseModel):
    """Base quote line item schema"""
    description: str = Field(..., min_length=1, description="Line item description")
    quantity: Optional[Decimal] = Field(None, ge=0, description="Quantity (hours for hourly rate)")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price (rate per hour for hourly rate)")
    total_price: Optional[Decimal] = Field(None, ge=0, description="Total price (quantity * unit_price)")
    line_order: int = Field(default=0, ge=0, description="Order of the line in the quote")


class QuoteLineItemCreate(QuoteLineItemBase):
    """Quote line item creation schema"""
    pass


class QuoteLineItem(QuoteLineItemBase):
    """Quote line item response schema"""
    id: int
    quote_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuoteBase(BaseModel):
    """Base quote schema"""
    quote_number: str = Field(..., min_length=1, max_length=50, description="Quote number")
    company_id: Optional[int] = Field(None, description="Company ID")
    title: str = Field(..., min_length=1, max_length=255, description="Quote title")
    description: Optional[str] = Field(None, description="Quote description")
    amount: Optional[Decimal] = Field(None, ge=0, description="Total amount")
    currency: str = Field(default="EUR", max_length=3, description="Currency code")
    pricing_type: str = Field(default="fixed", max_length=20, description="Pricing type: fixed or hourly")
    status: str = Field(default="draft", max_length=50, description="Quote status")
    valid_until: Optional[datetime] = Field(None, description="Expiration date")
    notes: Optional[str] = Field(None, description="Additional notes")
    line_items: Optional[List[QuoteLineItemCreate]] = Field(None, description="Quote line items")


class QuoteCreate(QuoteBase):
    """Quote creation schema"""
    pass


class QuoteUpdate(BaseModel):
    """Quote update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    company_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    pricing_type: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=50)
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    line_items: Optional[List[QuoteLineItemCreate]] = None


class Quote(QuoteBase):
    """Quote response schema"""
    id: int
    company_name: Optional[str] = None
    user_name: Optional[str] = None
    line_items: Optional[List[QuoteLineItem]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuoteInDB(Quote):
    """Quote in database schema"""
    pass
