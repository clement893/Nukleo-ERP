"""
Treasury Schemas
Pydantic v2 models for treasury management
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.bank_account import BankAccountType
from app.models.transaction import TransactionStatus


# ==================== Bank Account Schemas ====================

class BankAccountBase(BaseModel):
    """Base bank account schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Account name", strip_whitespace=True)
    account_type: BankAccountType = Field(default=BankAccountType.CHECKING, description="Account type")
    bank_name: Optional[str] = Field(None, max_length=255, description="Bank name")
    account_number: Optional[str] = Field(None, max_length=100, description="Account number (masked)")
    initial_balance: Decimal = Field(default=0, description="Initial balance")
    currency: str = Field(default="CAD", max_length=3, description="Currency code")
    is_active: bool = Field(default=True, description="Account active status")
    notes: Optional[str] = Field(None, max_length=1000, description="Notes")


class BankAccountCreate(BankAccountBase):
    """Bank account creation schema"""
    pass


class BankAccountUpdate(BaseModel):
    """Bank account update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Account name")
    account_type: Optional[BankAccountType] = Field(None, description="Account type")
    bank_name: Optional[str] = Field(None, max_length=255, description="Bank name")
    account_number: Optional[str] = Field(None, max_length=100, description="Account number")
    initial_balance: Optional[Decimal] = Field(None, description="Initial balance")
    currency: Optional[str] = Field(None, max_length=3, description="Currency code")
    is_active: Optional[bool] = Field(None, description="Account active status")
    notes: Optional[str] = Field(None, max_length=1000, description="Notes")


class BankAccountResponse(BankAccountBase):
    """Bank account response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    current_balance: Optional[Decimal] = Field(None, description="Current calculated balance")

    model_config = ConfigDict(from_attributes=True)


# ==================== Transaction Category Schemas ====================

class TransactionCategoryBase(BaseModel):
    """Base transaction category schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Category name", strip_whitespace=True)
    type: str = Field(..., description="Transaction type: 'entry' or 'exit'")
    parent_id: Optional[int] = Field(None, description="Parent category ID")
    is_active: bool = Field(default=True, description="Category active status")
    description: Optional[str] = Field(None, max_length=1000, description="Description")
    color: Optional[str] = Field(None, max_length=7, description="Color hex code")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validate transaction type"""
        if v not in ['entry', 'exit']:
            raise ValueError("Type must be 'entry' or 'exit'")
        return v


class TransactionCategoryCreate(TransactionCategoryBase):
    """Transaction category creation schema"""
    pass


class TransactionCategoryUpdate(BaseModel):
    """Transaction category update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Category name")
    type: Optional[str] = Field(None, description="Transaction type")
    parent_id: Optional[int] = Field(None, description="Parent category ID")
    is_active: Optional[bool] = Field(None, description="Category active status")
    description: Optional[str] = Field(None, max_length=1000, description="Description")
    color: Optional[str] = Field(None, max_length=7, description="Color hex code")


class TransactionCategoryResponse(TransactionCategoryBase):
    """Transaction category response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Transaction Schemas ====================

class TransactionBase(BaseModel):
    """Base transaction schema"""
    bank_account_id: int = Field(..., description="Bank account ID")
    type: str = Field(..., description="Transaction type: 'entry' or 'exit'")
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    date: datetime = Field(..., description="Transaction date")
    description: str = Field(..., min_length=1, max_length=500, description="Description", strip_whitespace=True)
    notes: Optional[str] = Field(None, description="Additional notes")
    category_id: Optional[int] = Field(None, description="Category ID")
    status: TransactionStatus = Field(default=TransactionStatus.CONFIRMED, description="Transaction status")
    invoice_id: Optional[int] = Field(None, description="Related invoice ID")
    expense_account_id: Optional[int] = Field(None, description="Related expense account ID")
    project_id: Optional[int] = Field(None, description="Related project ID")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method")
    reference_number: Optional[str] = Field(None, max_length=100, description="Reference number")
    is_recurring: bool = Field(default=False, description="Is recurring transaction")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validate transaction type"""
        if v not in ['entry', 'exit']:
            raise ValueError("Type must be 'entry' or 'exit'")
        return v


class TransactionCreate(TransactionBase):
    """Transaction creation schema"""
    pass


class TransactionUpdate(BaseModel):
    """Transaction update schema"""
    bank_account_id: Optional[int] = Field(None, description="Bank account ID")
    type: Optional[str] = Field(None, description="Transaction type")
    amount: Optional[Decimal] = Field(None, gt=0, description="Transaction amount")
    date: Optional[datetime] = Field(None, description="Transaction date")
    description: Optional[str] = Field(None, min_length=1, max_length=500, description="Description")
    notes: Optional[str] = Field(None, description="Additional notes")
    category_id: Optional[int] = Field(None, description="Category ID")
    status: Optional[TransactionStatus] = Field(None, description="Transaction status")
    invoice_id: Optional[int] = Field(None, description="Related invoice ID")
    expense_account_id: Optional[int] = Field(None, description="Related expense account ID")
    project_id: Optional[int] = Field(None, description="Related project ID")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method")
    reference_number: Optional[str] = Field(None, max_length=100, description="Reference number")
    is_recurring: Optional[bool] = Field(None, description="Is recurring transaction")


class TransactionResponse(TransactionBase):
    """Transaction response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Cashflow Schemas ====================

class CashflowWeek(BaseModel):
    """Cashflow for a week"""
    week_start: datetime = Field(..., description="Week start date")
    week_end: datetime = Field(..., description="Week end date")
    entries: Decimal = Field(default=0, description="Total entries for the week")
    exits: Decimal = Field(default=0, description="Total exits for the week")
    balance: Decimal = Field(..., description="Balance at end of week")
    is_projected: bool = Field(default=False, description="Is projected data")


class CashflowResponse(BaseModel):
    """Cashflow response schema"""
    weeks: List[CashflowWeek] = Field(..., description="Cashflow by week")
    total_entries: Decimal = Field(default=0, description="Total entries")
    total_exits: Decimal = Field(default=0, description="Total exits")
    current_balance: Decimal = Field(..., description="Current balance")
    projected_balance: Optional[Decimal] = Field(None, description="Projected balance")


# ==================== Statistics Schemas ====================

class TreasuryStats(BaseModel):
    """Treasury statistics"""
    total_entries: Decimal = Field(default=0, description="Total entries")
    total_exits: Decimal = Field(default=0, description="Total exits")
    current_balance: Decimal = Field(..., description="Current balance")
    projected_balance_30d: Optional[Decimal] = Field(None, description="Projected balance in 30 days")
    variation_percent: Optional[Decimal] = Field(None, description="Variation percentage vs previous period")
