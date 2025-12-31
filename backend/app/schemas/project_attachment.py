"""
Project Attachment Schemas
Pydantic v2 models for project/task attachments
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ProjectAttachmentBase(BaseModel):
    """Base project attachment schema"""
    project_id: Optional[int] = Field(None, description="Project ID (if attached to project)")
    task_id: Optional[int] = Field(None, description="Task ID (if attached to task)")
    file_id: Optional[UUID] = Field(None, description="File ID from files table")
    file_url: str = Field(..., description="Direct URL to file")
    filename: str = Field(..., max_length=255, description="Stored filename")
    original_filename: str = Field(..., max_length=255, description="Original filename")
    content_type: str = Field(..., max_length=100, description="File content type")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    description: Optional[str] = Field(None, description="Attachment description")


class ProjectAttachmentCreate(ProjectAttachmentBase):
    """Project attachment creation schema"""
    pass


class ProjectAttachmentUpdate(BaseModel):
    """Project attachment update schema"""
    description: Optional[str] = Field(None, description="Attachment description")


class ProjectAttachmentResponse(ProjectAttachmentBase):
    """Project attachment response schema"""
    id: int
    uploaded_by_id: Optional[int] = None
    uploaded_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
