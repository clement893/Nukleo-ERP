"""
Client Schemas
Pydantic v2 models for operations clients and client portal
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.client import ClientStatus


class ClientBase(BaseModel):
    """Base client schema"""
    company_id: Optional[int] = Field(None, description="Company ID")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (will be matched to existing company if company_id not provided)")
    status: ClientStatus = Field(default=ClientStatus.ACTIVE, description="Client status")
    responsable_id: Optional[int] = Field(None, description="Responsible employee ID")
    notes: Optional[str] = Field(None, description="Notes")
    comments: Optional[str] = Field(None, description="Comments")
    portal_url: Optional[str] = Field(None, max_length=500, description="Client portal URL")


class ClientCreate(ClientBase):
    """Client creation schema"""
    company_id: Optional[int] = Field(None, description="Company ID (if company exists)")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (will create company if not exists)")


class ClientUpdate(BaseModel):
    """Client update schema"""
    company_id: Optional[int] = Field(None, description="Company ID")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (will be matched to existing company if company_id not provided)")
    status: Optional[ClientStatus] = Field(None, description="Client status")
    responsable_id: Optional[int] = Field(None, description="Responsible employee ID")
    notes: Optional[str] = Field(None, description="Notes")
    comments: Optional[str] = Field(None, description="Comments")
    portal_url: Optional[str] = Field(None, max_length=500, description="Client portal URL")


class Client(ClientBase):
    """Client response schema"""
    id: int
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    responsable_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientResponse(Client):
    """Client response schema (alias for compatibility)"""
    pass


class ClientInDB(Client):
    """Client in database schema"""
    pass


# Client Portal Schemas (for invoices, projects, tickets)
class ClientInvoiceResponse(BaseModel):
    """Client portal invoice response schema"""
    id: int
    user_id: int
    subscription_id: Optional[int] = None
    stripe_invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    amount_due: Decimal
    amount_paid: Decimal
    currency: str
    status: str
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    invoice_pdf_url: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientInvoiceListResponse(BaseModel):
    """Client portal invoice list response schema"""
    items: List[ClientInvoiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientProjectResponse(BaseModel):
    """Client portal project response schema"""
    id: int
    name: str
    description: Optional[str] = None
    status: str
    user_id: int
    client_id: Optional[int] = None
    responsable_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientProjectListResponse(BaseModel):
    """Client portal project list response schema"""
    items: List[ClientProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientTicketResponse(BaseModel):
    """Client portal ticket response schema"""
    id: int
    subject: str
    category: str
    status: str
    priority: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientTicketCreate(BaseModel):
    """Client portal ticket creation schema"""
    subject: str = Field(..., max_length=200, description="Ticket subject")
    category: str = Field(..., description="Ticket category")
    priority: Optional[str] = Field("medium", description="Ticket priority")
    description: Optional[str] = Field(None, description="Ticket description")


class ClientTicketListResponse(BaseModel):
    """Client portal ticket list response schema"""
    items: List[ClientTicketResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientDashboardStats(BaseModel):
    """Client portal dashboard statistics schema"""
    total_orders: int = 0
    total_order_amount: Decimal = Decimal("0.00")
    pending_orders: int = 0
    total_invoices: int = 0
    total_invoice_amount: Decimal = Decimal("0.00")
    unpaid_invoices: int = 0
    unpaid_invoice_amount: Decimal = Decimal("0.00")
    total_projects: int = 0
    active_projects: int = 0
    total_tickets: int = 0
    open_tickets: int = 0
