"""
Client Schemas
Pydantic v2 models for clients
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from app.models.client import ClientStatus


class ClientBase(BaseModel):
    """Base client schema"""
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    photo_url: Optional[str] = Field(None, max_length=1000, description="Photo URL")
    photo_filename: Optional[str] = Field(None, max_length=500, description="Photo filename")
    birthday: Optional[date] = Field(None, description="Birthday")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    notes: Optional[str] = Field(None, description="Notes")
    comments: Optional[str] = Field(None, description="Comments")
    portal_url: Optional[str] = Field(None, max_length=500, description="Portal URL")
    status: ClientStatus = Field(default=ClientStatus.ACTIVE, description="Client status")


class ClientCreate(ClientBase):
    """Client creation schema"""
    pass


class ClientUpdate(BaseModel):
    """Client update schema"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Last name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    photo_url: Optional[str] = Field(None, max_length=1000, description="Photo URL")
    photo_filename: Optional[str] = Field(None, max_length=500, description="Photo filename")
    birthday: Optional[date] = Field(None, description="Birthday")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    notes: Optional[str] = Field(None, description="Notes")
    comments: Optional[str] = Field(None, description="Comments")
    portal_url: Optional[str] = Field(None, max_length=500, description="Portal URL")
    status: Optional[ClientStatus] = Field(None, description="Client status")


class Client(ClientBase):
    """Client response schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientResponse(Client):
    """Client response schema (alias for compatibility)"""
    pass


class ClientInDB(Client):
    """Client in database schema"""
    pass
