"""
Client Schemas
Pydantic v2 models for clients
Simplified for companies only
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.client import ClientStatus


class ClientBase(BaseModel):
    """Base client schema"""
    company_name: str = Field(..., min_length=1, max_length=255, description="Company name")
    type: str = Field(default="company", max_length=20, description="Client type")
    portal_url: Optional[str] = Field(None, max_length=500, description="Portal URL")
    status: ClientStatus = Field(default=ClientStatus.ACTIVE, description="Client status")
    
    @field_validator('company_name')
    @classmethod
    def validate_company_name(cls, v: str) -> str:
        """Validate company name"""
        if not v or not v.strip():
            raise ValueError('Company name cannot be empty')
        return v.strip()


class ClientCreate(ClientBase):
    """Client creation schema"""
    pass


class ClientUpdate(BaseModel):
    """Client update schema"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Company name")
    type: Optional[str] = Field(None, max_length=20, description="Client type")
    portal_url: Optional[str] = Field(None, max_length=500, description="Portal URL")
    status: Optional[ClientStatus] = Field(None, description="Client status")


class Client(ClientBase):
    """Client response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    # Computed field for number of projects
    project_count: Optional[int] = Field(None, description="Number of active projects")

    model_config = ConfigDict(from_attributes=True)


class ClientResponse(Client):
    """Client response schema (alias for compatibility)"""
    pass


class ClientInDB(Client):
    """Client in database schema"""
    pass
