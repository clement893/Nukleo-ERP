"""
Employés Module - Employee Schemas
Schemas Pydantic pour les employés
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, EmailStr

from templates.modules.employes.models.employe import EmployeeStatus, EmployeeType


class EmployeeBase(BaseModel):
    """Schema de base pour Employee"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    photo_url: Optional[str] = Field(None, max_length=500)
    birth_date: Optional[date] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    employee_number: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    employee_type: EmployeeType = EmployeeType.FULL_TIME
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    hire_date: Optional[date] = None
    termination_date: Optional[date] = None
    salary: Optional[float] = None
    hourly_rate: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    """Schema pour création de Employee"""
    manager_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class EmployeeUpdate(BaseModel):
    """Schema pour mise à jour de Employee"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    photo_url: Optional[str] = Field(None, max_length=500)
    birth_date: Optional[date] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    employee_number: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    employee_type: Optional[EmployeeType] = None
    status: Optional[EmployeeStatus] = None
    hire_date: Optional[date] = None
    termination_date: Optional[date] = None
    salary: Optional[float] = None
    hourly_rate: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    manager_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class EmployeeResponse(EmployeeBase):
    """Schema pour réponse Employee"""
    id: UUID
    manager_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
