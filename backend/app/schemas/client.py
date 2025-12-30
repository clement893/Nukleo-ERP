"""
Client Schemas
Pydantic v2 models for project clients
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.client import ClientStatus


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
