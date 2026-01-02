"""
Finance Invoice Schemas
Pydantic schemas for finance invoices (facturations)
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class InvoiceLineItemBase(BaseModel):
    """Invoice line item base schema"""
    description: str
    quantity: Decimal = Field(default=1, ge=0)
    unit_price: Decimal = Field(ge=0)
    total: Decimal = Field(ge=0)


class InvoiceLineItemCreate(InvoiceLineItemBase):
    """Invoice line item create schema"""
    pass


class InvoiceLineItemResponse(InvoiceLineItemBase):
    """Invoice line item response schema"""
    id: str

    model_config = ConfigDict(from_attributes=True)


class ClientDataBase(BaseModel):
    """Client data base schema"""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class PaymentBase(BaseModel):
    """Payment base schema"""
    amount: Decimal = Field(ge=0)
    payment_date: datetime
    payment_method: str  # credit_card, bank_transfer, check, cash
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Payment create schema"""
    pass


class PaymentResponse(PaymentBase):
    """Payment response schema"""
    id: int
    invoice_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinanceInvoiceBase(BaseModel):
    """Finance invoice base schema"""
    invoice_number: str
    project_id: Optional[int] = None
    client_data: Dict[str, Any]  # {name, email, phone?, address?}
    line_items: List[Dict[str, Any]]  # List of line items
    subtotal: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(default=0, ge=0, le=100)
    tax_amount: Decimal = Field(ge=0)
    total: Decimal = Field(ge=0)
    issue_date: datetime
    due_date: datetime
    notes: Optional[str] = None
    terms: Optional[str] = None


class FinanceInvoiceCreate(FinanceInvoiceBase):
    """Finance invoice create schema"""
    status: str = "draft"  # draft, sent, paid, partial, overdue, cancelled


class FinanceInvoiceUpdate(BaseModel):
    """Finance invoice update schema"""
    invoice_number: Optional[str] = None
    project_id: Optional[int] = None
    client_data: Optional[Dict[str, Any]] = None
    line_items: Optional[List[Dict[str, Any]]] = None
    subtotal: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total: Optional[Decimal] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    last_reminder_date: Optional[datetime] = None


class FinanceInvoiceResponse(FinanceInvoiceBase):
    """Finance invoice response schema"""
    id: int
    user_id: int
    status: str
    amount_paid: Decimal
    amount_due: Decimal
    paid_date: Optional[datetime] = None
    last_reminder_date: Optional[datetime] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    payments: List[PaymentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class FinanceInvoiceListResponse(BaseModel):
    """Finance invoice list response schema"""
    items: List[FinanceInvoiceResponse]
    total: int
    skip: int
    limit: int
