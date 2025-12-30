"""
Opportunity Schemas
Pydantic v2 models for commercial opportunities
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator


class OpportunityBase(BaseModel):
    """Base opportunity schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Opportunity name", strip_whitespace=True)
    description: Optional[str] = Field(None, description="Opportunity description")
    amount: Optional[float] = Field(None, ge=0, description="Opportunity amount")
    probability: Optional[int] = Field(None, ge=0, le=100, description="Probability percentage (0-100)")
    expected_close_date: Optional[datetime] = Field(None, description="Expected close date")
    status: Optional[str] = Field(None, max_length=50, description="Opportunity status")
    segment: Optional[str] = Field(None, max_length=100, description="Market segment")
    region: Optional[str] = Field(None, max_length=100, description="Region")
    service_offer_link: Optional[str] = Field(None, max_length=1000, description="Service offer link")
    notes: Optional[str] = Field(None, description="Additional notes")
    pipeline_id: UUID = Field(..., description="Pipeline ID")
    stage_id: Optional[UUID] = Field(None, description="Pipeline stage ID")
    company_id: Optional[int] = Field(None, description="Company ID")
    assigned_to_id: Optional[int] = Field(None, description="Assigned user ID")
    opened_at: Optional[datetime] = Field(None, description="Opening date")
    closed_at: Optional[datetime] = Field(None, description="Closing date")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name field"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('service_offer_link')
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL"""
        if v and not v.startswith(('http://', 'https://')):
            return f'https://{v}'
        return v


class OpportunityCreate(OpportunityBase):
    """Opportunity creation schema"""
    contact_ids: Optional[List[int]] = Field(default_factory=list, description="List of contact IDs")


class OpportunityUpdate(BaseModel):
    """Opportunity update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Opportunity name")
    description: Optional[str] = Field(None, description="Opportunity description")
    amount: Optional[float] = Field(None, ge=0, description="Opportunity amount")
    probability: Optional[int] = Field(None, ge=0, le=100, description="Probability percentage")
    expected_close_date: Optional[datetime] = Field(None, description="Expected close date")
    status: Optional[str] = Field(None, max_length=50, description="Opportunity status")
    segment: Optional[str] = Field(None, max_length=100, description="Market segment")
    region: Optional[str] = Field(None, max_length=100, description="Region")
    service_offer_link: Optional[str] = Field(None, max_length=1000, description="Service offer link")
    notes: Optional[str] = Field(None, description="Additional notes")
    pipeline_id: Optional[UUID] = Field(None, description="Pipeline ID")
    stage_id: Optional[UUID] = Field(None, description="Pipeline stage ID")
    company_id: Optional[int] = Field(None, description="Company ID")
    assigned_to_id: Optional[int] = Field(None, description="Assigned user ID")
    opened_at: Optional[datetime] = Field(None, description="Opening date")
    closed_at: Optional[datetime] = Field(None, description="Closing date")
    contact_ids: Optional[List[int]] = Field(None, description="List of contact IDs")


class Opportunity(OpportunityBase):
    """Opportunity response schema"""
    id: UUID
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    pipeline_name: Optional[str] = None
    stage_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_by_name: Optional[str] = None
    contact_names: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OpportunityInDB(Opportunity):
    """Opportunity in database schema"""
    pass
