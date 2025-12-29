"""
Company Schemas
Pydantic v2 models for commercial companies
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CompanyBase(BaseModel):
    """Base company schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Company name", strip_whitespace=True)
    parent_company_id: Optional[int] = Field(None, description="Parent company ID")
    description: Optional[str] = Field(None, max_length=1000, description="Company description")
    website: Optional[str] = Field(None, max_length=500, description="Website URL")
    logo_url: Optional[str] = Field(None, max_length=1000, description="Logo URL (S3)")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    address: Optional[str] = Field(None, max_length=500, description="Address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    is_client: bool = Field(default=False, description="Is client (Y/N)")
    facebook: Optional[str] = Field(None, max_length=500, description="Facebook URL")
    instagram: Optional[str] = Field(None, max_length=500, description="Instagram URL")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name field"""
        if not v or not v.strip():
            raise ValueError('Company name cannot be empty')
        return v.strip()
    
    @field_validator('website', 'facebook', 'instagram', 'linkedin')
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL fields"""
        if v and not v.startswith(('http://', 'https://')):
            return f'https://{v}'
        return v


class CompanyCreate(CompanyBase):
    """Company creation schema"""
    pass


class CompanyUpdate(BaseModel):
    """Company update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Company name")
    parent_company_id: Optional[int] = Field(None, description="Parent company ID")
    description: Optional[str] = Field(None, max_length=1000, description="Company description")
    website: Optional[str] = Field(None, max_length=500, description="Website URL")
    logo_url: Optional[str] = Field(None, max_length=1000, description="Logo URL (S3)")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    address: Optional[str] = Field(None, max_length=500, description="Address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    is_client: Optional[bool] = Field(None, description="Is client (Y/N)")
    facebook: Optional[str] = Field(None, max_length=500, description="Facebook URL")
    instagram: Optional[str] = Field(None, max_length=500, description="Instagram URL")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")


class Company(CompanyBase):
    """Company response schema"""
    id: int
    parent_company_name: Optional[str] = None
    contacts_count: Optional[int] = None
    projects_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyInDB(Company):
    """Company in database schema"""
    pass


class CompanyListResponse(BaseModel):
    """Company list response with pagination"""
    items: List[Company]
    total: int
    skip: int
    limit: int
