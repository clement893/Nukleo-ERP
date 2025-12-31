"""
Employee Schemas
Pydantic v2 models for employees
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr


class EmployeeBase(BaseModel):
    """Base employee schema"""
    first_name: str = Field(..., min_length=1, max_length=100, description="First name", strip_whitespace=True)
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name", strip_whitespace=True)
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    photo_url: Optional[str] = Field(None, max_length=1000, description="Photo URL (S3)")
    photo_filename: Optional[str] = Field(None, max_length=500, description="Filename for photo matching during import")
    hire_date: Optional[date] = Field(None, description="Hire date")
    birthday: Optional[date] = Field(None, description="Birthday")
    capacity_hours_per_week: Optional[float] = Field(35.0, ge=0, le=168, description="Capacity in hours per week (default: 35)")
    team_id: Optional[int] = Field(None, description="Team ID")
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name fields"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('linkedin')
    @classmethod
    def validate_linkedin(cls, v: Optional[str]) -> Optional[str]:
        """Validate LinkedIn URL"""
        if v and not v.startswith(('http://', 'https://')):
            return f'https://{v}'
        return v


class EmployeeCreate(EmployeeBase):
    """Employee creation schema"""
    pass


class EmployeeUpdate(BaseModel):
    """Employee update schema"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Last name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    linkedin: Optional[str] = Field(None, max_length=500, description="LinkedIn URL")
    photo_url: Optional[str] = Field(None, max_length=1000, description="Photo URL (S3)")
    photo_filename: Optional[str] = Field(None, max_length=500, description="Filename for photo matching during import")
    hire_date: Optional[date] = Field(None, description="Hire date")
    birthday: Optional[date] = Field(None, description="Birthday")
    capacity_hours_per_week: Optional[float] = Field(None, ge=0, le=168, description="Capacity in hours per week")
    team_id: Optional[int] = Field(None, description="Team ID")


class Employee(EmployeeBase):
    """Employee response schema"""
    id: int
    user_id: Optional[int] = Field(None, description="Linked user ID")
    team_id: Optional[int] = Field(None, description="Team ID")
    capacity_hours_per_week: Optional[float] = Field(35.0, description="Capacity in hours per week")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmployeeInDB(Employee):
    """Employee in database schema"""
    pass
