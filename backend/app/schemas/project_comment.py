"""
Project Comment Schemas
Pydantic v2 models for project/task comments/discussions
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


class ProjectCommentBase(BaseModel):
    """Base project comment schema"""
    project_id: Optional[int] = Field(None, description="Project ID (if comment on project)")
    task_id: Optional[int] = Field(None, description="Task ID (if comment on task)")
    content: str = Field(..., min_length=1, description="Comment content")
    parent_id: Optional[int] = Field(None, description="Parent comment ID (for replies)")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate comment content"""
        if not v or not v.strip():
            raise ValueError('Comment content cannot be empty')
        return v.strip()
    
    @model_validator(mode='after')
    def validate_at_least_one(self):
        """Ensure at least project_id or task_id is set"""
        if not self.project_id and not self.task_id:
            raise ValueError('Either project_id or task_id must be set')
        return self


class ProjectCommentCreate(ProjectCommentBase):
    """Project comment creation schema"""
    pass


class ProjectCommentUpdate(BaseModel):
    """Project comment update schema"""
    content: str = Field(..., min_length=1, description="Comment content")
    is_pinned: Optional[bool] = Field(None, description="Pin comment")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate comment content"""
        if not v or not v.strip():
            raise ValueError('Comment content cannot be empty')
        return v.strip()


class ProjectCommentResponse(ProjectCommentBase):
    """Project comment response schema"""
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_avatar: Optional[str] = None
    is_edited: bool = False
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime
    replies: List['ProjectCommentResponse'] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


# Update forward reference
ProjectCommentResponse.model_rebuild()
