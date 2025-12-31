"""
Time Entry Schemas
Pydantic schemas for time entries
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TimeEntryBase(BaseModel):
    """Base time entry schema"""
    description: Optional[str] = None
    duration: int = Field(..., ge=0, description="Duration in seconds")
    date: datetime
    task_id: Optional[int] = None
    project_id: Optional[int] = None
    client_id: Optional[int] = None


class TimeEntryCreate(TimeEntryBase):
    """Schema for creating a time entry"""
    pass


class TimeEntryUpdate(BaseModel):
    """Schema for updating a time entry"""
    description: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)
    date: Optional[datetime] = None
    task_id: Optional[int] = None
    project_id: Optional[int] = None
    client_id: Optional[int] = None


class TimeEntryResponse(TimeEntryBase):
    """Schema for time entry response"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TimeEntryWithRelations(TimeEntryResponse):
    """Time entry with related data"""
    task_title: Optional[str] = None
    project_name: Optional[str] = None
    client_name: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None


class TimerStartRequest(BaseModel):
    """Schema for starting a timer"""
    task_id: int
    description: Optional[str] = None


class TimerStopRequest(BaseModel):
    """Schema for stopping a timer"""
    description: Optional[str] = None
