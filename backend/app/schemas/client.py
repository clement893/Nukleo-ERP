"""
Client Schemas
Pydantic v2 models for operations clients
"""

from datetime import datetime
from typing import Optional
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
