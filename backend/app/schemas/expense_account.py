"""
Expense Account Schemas
Pydantic schemas for expense account API
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class ExpenseAccountBase(BaseModel):
    """Base schema for expense account"""
    title: str = Field(..., max_length=255, description="Titre du compte de dépenses")
    description: Optional[str] = Field(None, description="Description")
    expense_period_start: Optional[datetime] = Field(None, description="Date de début de la période")
    expense_period_end: Optional[datetime] = Field(None, description="Date de fin de la période")
    total_amount: Decimal = Field(0, ge=0, le=Decimal('999999999999999999.99'), description="Montant total (max: 999,999,999,999,999,999.99)")
    currency: str = Field("EUR", max_length=3, description="Devise")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Métadonnées supplémentaires", alias="account_metadata")
    
    @field_validator('total_amount', mode='before')
    @classmethod
    def validate_total_amount(cls, v) -> Decimal:
        """Validate and convert total_amount to Decimal"""
        if v is None:
            return Decimal(0)
        if isinstance(v, str):
            try:
                v = Decimal(v)
            except (ValueError, TypeError) as e:
                raise ValueError(f'Invalid total_amount format: {v}. Must be a number.')
        elif isinstance(v, (int, float)):
            v = Decimal(str(v))
        elif not isinstance(v, Decimal):
            raise ValueError(f'Invalid total_amount type: {type(v)}. Must be a number.')
        
        if v < 0:
            raise ValueError('Total amount cannot be negative')
        # Maximum value for NUMERIC(18, 2): 999,999,999,999,999,999.99
        max_value = Decimal('999999999999999999.99')
        if v > max_value:
            raise ValueError(f'Total amount cannot exceed {max_value:,.2f}')
        return v
    
    @field_validator('expense_period_start', 'expense_period_end', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Validate and convert datetime fields from ISO strings"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                # Try ISO format first (most common)
                if 'T' in v or len(v) > 10:
                    # Full datetime ISO format
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                else:
                    # Date only format (YYYY-MM-DD)
                    return datetime.fromisoformat(v + 'T00:00:00')
            except (ValueError, TypeError) as e:
                # Fallback to dateutil if available
                try:
                    from dateutil.parser import parse as parse_date
                    return parse_date(v)
                except ImportError:
                    raise ValueError(f'Invalid date format: {v}. Must be ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS).')
        return v


class ExpenseAccountCreate(ExpenseAccountBase):
    """Schema for creating an expense account"""
    employee_id: int = Field(..., description="ID de l'employé")


class ExpenseAccountUpdate(BaseModel):
    """Schema for updating an expense account"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    expense_period_start: Optional[datetime] = None
    expense_period_end: Optional[datetime] = None
    total_amount: Optional[Decimal] = Field(None, ge=0, le=Decimal('999999999999999999.99'))
    currency: Optional[str] = Field(None, max_length=3)
    metadata: Optional[Dict[str, Any]] = Field(None, alias="account_metadata")
    status: Optional[str] = Field(None, description="Statut du compte de dépenses (admin only)")
    
    @field_validator('total_amount', mode='before')
    @classmethod
    def validate_total_amount(cls, v) -> Optional[Decimal]:
        """Validate and convert total_amount to Decimal"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                v = Decimal(v)
            except (ValueError, TypeError) as e:
                raise ValueError(f'Invalid total_amount format: {v}. Must be a number.')
        elif isinstance(v, (int, float)):
            v = Decimal(str(v))
        elif not isinstance(v, Decimal):
            raise ValueError(f'Invalid total_amount type: {type(v)}. Must be a number.')
        
        if v < 0:
            raise ValueError('Total amount cannot be negative')
        # Maximum value for NUMERIC(18, 2): 999,999,999,999,999,999.99
        max_value = Decimal('999999999999999999.99')
        if v > max_value:
            raise ValueError(f'Total amount cannot exceed {max_value:,.2f}')
        return v
    
    @field_validator('expense_period_start', 'expense_period_end', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Validate and convert datetime fields from ISO strings"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                # Try ISO format first (most common)
                if 'T' in v or len(v) > 10:
                    # Full datetime ISO format
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                else:
                    # Date only format (YYYY-MM-DD)
                    return datetime.fromisoformat(v + 'T00:00:00')
            except (ValueError, TypeError) as e:
                # Fallback to dateutil if available
                try:
                    from dateutil.parser import parse as parse_date
                    return parse_date(v)
                except ImportError:
                    raise ValueError(f'Invalid date format: {v}. Must be ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS).')
        return v


class ExpenseAccountAction(BaseModel):
    """Schema for expense account actions (approve, reject, request clarification)"""
    notes: Optional[str] = Field(None, description="Notes de révision")
    clarification_request: Optional[str] = Field(None, description="Demande de précisions")
    rejection_reason: Optional[str] = Field(None, description="Raison du rejet")


class ExpenseAccountClarificationResponse(BaseModel):
    """Schema for employee response to clarification request"""
    response: str = Field(..., min_length=1, description="Réponse de l'employé à la demande de précisions")


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