"""
Transaction Schemas
Pydantic schemas for transaction API
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

from app.models.transaction import TransactionType, TransactionStatus


class TransactionBase(BaseModel):
    """Base transaction schema"""
    description: str = Field(..., min_length=1, max_length=500)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="CAD", max_length=3)
    category: Optional[str] = Field(None, max_length=100)
    transaction_date: datetime
    payment_date: Optional[datetime] = None
    status: TransactionStatus = TransactionStatus.PENDING
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = Field(None, max_length=200)
    invoice_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    is_recurring: str = Field(default="false")
    recurring_id: Optional[int] = None
    transaction_metadata: Optional[str] = None


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    type: TransactionType


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    category: Optional[str] = Field(None, max_length=100)
    transaction_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    status: Optional[TransactionStatus] = None
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = Field(None, max_length=200)
    invoice_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    is_recurring: Optional[str] = None
    recurring_id: Optional[int] = None
    transaction_metadata: Optional[str] = None


class TransactionResponse(TransactionBase):
    """Schema for transaction response"""
    id: int
    user_id: int
    type: TransactionType
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
