"""
Expense Account Schemas
Pydantic schemas for expense account API
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field


class ExpenseAccountBase(BaseModel):
    """Base schema for expense account"""
    title: str = Field(..., max_length=255, description="Titre du compte de dépenses")
    description: Optional[str] = Field(None, description="Description")
    expense_period_start: Optional[datetime] = Field(None, description="Date de début de la période")
    expense_period_end: Optional[datetime] = Field(None, description="Date de fin de la période")
    total_amount: Decimal = Field(0, ge=0, description="Montant total")
    currency: str = Field("EUR", max_length=3, description="Devise")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Métadonnées supplémentaires", alias="account_metadata")


class ExpenseAccountCreate(ExpenseAccountBase):
    """Schema for creating an expense account"""
    employee_id: int = Field(..., description="ID de l'employé")


class ExpenseAccountUpdate(BaseModel):
    """Schema for updating an expense account"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    expense_period_start: Optional[datetime] = None
    expense_period_end: Optional[datetime] = None
    total_amount: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    metadata: Optional[Dict[str, Any]] = Field(None, alias="account_metadata")


class ExpenseAccountAction(BaseModel):
    """Schema for expense account actions (approve, reject, request clarification)"""
    notes: Optional[str] = Field(None, description="Notes de révision")
    clarification_request: Optional[str] = Field(None, description="Demande de précisions")
    rejection_reason: Optional[str] = Field(None, description="Raison du rejet")


class ExpenseAccountResponse(ExpenseAccountBase):
    """Schema for expense account response"""
    id: int
    account_number: str
    employee_id: int
    employee_name: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    clarification_request: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True  # Allow both 'metadata' and 'account_metadata' in API