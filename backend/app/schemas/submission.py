"""
Submission Schemas
Pydantic v2 models for commercial submissions
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class SubmissionBase(BaseModel):
    """Base submission schema"""
    submission_number: str = Field(..., min_length=1, max_length=50, description="Submission number")
    company_id: Optional[int] = Field(None, description="Company ID")
    title: str = Field(..., min_length=1, max_length=255, description="Submission title")
    type: Optional[str] = Field(None, max_length=50, description="Submission type")
    description: Optional[str] = Field(None, description="Submission description")
    content: Optional[Dict[str, Any]] = Field(None, description="Complex structured content")
    status: str = Field(default="draft", max_length=50, description="Submission status")
    deadline: Optional[datetime] = Field(None, description="Submission deadline")
    submitted_at: Optional[datetime] = Field(None, description="When submitted")
    notes: Optional[str] = Field(None, description="Additional notes")
    attachments: Optional[List[Dict[str, Any]]] = Field(None, description="File attachments")


class SubmissionCreate(SubmissionBase):
    """Submission creation schema"""
    pass


class SubmissionUpdate(BaseModel):
    """Submission update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    company_id: Optional[int] = None
    type: Optional[str] = Field(None, max_length=50)
    content: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, max_length=50)
    deadline: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    notes: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class Submission(SubmissionBase):
    """Submission response schema"""
    id: int
    company_name: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubmissionInDB(Submission):
    """Submission in database schema"""
    pass
