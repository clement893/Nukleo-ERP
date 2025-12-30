"""
Client Schemas
Pydantic v2 models for project clients
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.client import ClientStatus
from app.models.invoice import InvoiceStatus
from app.models.support_ticket import TicketStatus, TicketPriority
from app.schemas.project import ProjectStatus


class ClientBase(BaseModel):
    """Base client schema"""
    company_id: int = Field(..., description="Company ID (must be unique)")
    status: ClientStatus = Field(default=ClientStatus.ACTIVE, description="Client status")
    responsible_id: Optional[int] = Field(None, description="Responsible employee/user ID")
    notes: Optional[str] = Field(None, description="Client notes")
    comments: Optional[str] = Field(None, description="Client comments")
    portal_url: Optional[str] = Field(None, max_length=500, description="Client portal URL")


class ClientCreate(ClientBase):
    """Client creation schema"""
    # When creating a client, we can optionally create a company
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (if creating new company)")
    company_email: Optional[str] = Field(None, max_length=255, description="Company email")
    company_phone: Optional[str] = Field(None, max_length=50, description="Company phone")
    company_address: Optional[str] = Field(None, max_length=500, description="Company address")
    company_city: Optional[str] = Field(None, max_length=100, description="Company city")
    company_country: Optional[str] = Field(None, max_length=100, description="Company country")
    company_website: Optional[str] = Field(None, max_length=500, description="Company website")
    company_description: Optional[str] = Field(None, max_length=1000, description="Company description")


class ClientUpdate(BaseModel):
    """Client update schema"""
    status: Optional[ClientStatus] = None
    responsible_id: Optional[int] = None
    notes: Optional[str] = None
    comments: Optional[str] = None
    portal_url: Optional[str] = Field(None, max_length=500)


class ClientResponse(ClientBase):
    """Client response schema"""
    id: int
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    responsible_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientListResponse(BaseModel):
    """Client list response schema"""
    items: List[ClientResponse]
    total: int
    skip: int
    limit: int


class ClientInvoiceResponse(BaseModel):
    """Client invoice response schema"""
    id: int
    invoice_number: Optional[str] = None
    amount_due: Decimal
    amount_paid: Decimal = Field(default=Decimal("0.00"))
    currency: str = "usd"
    status: InvoiceStatus
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    invoice_pdf_url: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClientInvoiceListResponse(BaseModel):
    """Client invoice list response schema"""
    items: List[ClientInvoiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientProjectResponse(BaseModel):
    """Client project response schema"""
    id: int
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ClientProjectListResponse(BaseModel):
    """Client project list response schema"""
    items: List[ClientProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientTicketCreate(BaseModel):
    """Client ticket creation schema"""
    subject: str = Field(..., min_length=1, max_length=200, description="Ticket subject")
    description: str = Field(..., min_length=1, description="Ticket description/message")
    priority: TicketPriority = Field(default=TicketPriority.MEDIUM, description="Ticket priority")
    category: str = Field(..., description="Ticket category (technical, billing, feature, general, bug)")


class ClientTicketResponse(BaseModel):
    """Client ticket response schema"""
    id: int
    subject: str
    category: str
    status: TicketStatus
    priority: TicketPriority
    user_id: int
    description: Optional[str] = None  # First message content
    created_at: datetime
    updated_at: datetime
    last_reply_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ClientTicketListResponse(BaseModel):
    """Client ticket list response schema"""
    items: List[ClientTicketResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
