"""
Vacation Request Schemas
Pydantic schemas for vacation request validation
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class VacationRequestBase(BaseModel):
    """Base schema for vacation request"""
    start_date: date = Field(..., description="Start date of vacation")
    end_date: date = Field(..., description="End date of vacation")
    reason: Optional[str] = Field(None, description="Reason for vacation request")

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v: date, info) -> date:
        """Validate that end_date is after start_date"""
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('End date must be after or equal to start date')
        return v


class VacationRequestCreate(VacationRequestBase):
    """Schema for creating a vacation request"""
    employee_id: int = Field(..., description="ID of the employee requesting vacation")


class VacationRequestUpdate(BaseModel):
    """Schema for updating a vacation request"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(pending|approved|rejected|cancelled)$')
    rejection_reason: Optional[str] = None


class VacationRequestApprove(BaseModel):
    """Schema for approving a vacation request"""
    pass  # No additional fields needed


class VacationRequestReject(BaseModel):
    """Schema for rejecting a vacation request"""
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection")


class VacationRequest(VacationRequestBase):
    """Schema for vacation request response"""
    id: int
    employee_id: int
    status: str
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VacationRequestWithEmployee(VacationRequest):
    """Schema for vacation request with employee details"""
    employee_first_name: Optional[str] = None
    employee_last_name: Optional[str] = None
    employee_email: Optional[str] = None
    approved_by_name: Optional[str] = None
