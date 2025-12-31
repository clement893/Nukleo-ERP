"""
People Schemas
Pydantic v2 models for people
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from app.models.people import PeopleStatus


class PeopleBase(BaseModel):
    """Base people schema"""
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
    status: PeopleStatus = Field(default=PeopleStatus.ACTIVE, description="People status")


class PeopleCreate(PeopleBase):
    """People creation schema"""
    pass


class PeopleUpdate(BaseModel):
    """People update schema"""
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
    status: Optional[PeopleStatus] = Field(None, description="People status")


class People(PeopleBase):
    """People response schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PeopleResponse(People):
    """People response schema (alias for compatibility)"""
    pass


class PeopleInDB(People):
    """People in database schema"""
    pass
