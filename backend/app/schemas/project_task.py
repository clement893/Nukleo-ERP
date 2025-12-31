"""
Project Task Schemas
Pydantic schemas for project tasks
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models.project_task import TaskStatus, TaskPriority


class ProjectTaskBase(BaseModel):
    """Base project task schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(None, ge=0, description="Estimated hours to complete the task")
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        """Normalize status value to lowercase enum"""
        if isinstance(v, str):
            v = v.lower()
            # Map common variations to correct enum values
            status_map = {
                'blocked': TaskStatus.BLOCKED,
                'todo': TaskStatus.TODO,
                'in_progress': TaskStatus.IN_PROGRESS,
                'inprogress': TaskStatus.IN_PROGRESS,
                'to_transfer': TaskStatus.TO_TRANSFER,
                'totransfer': TaskStatus.TO_TRANSFER,
                'completed': TaskStatus.COMPLETED,
            }
            return status_map.get(v, v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        """Normalize priority value to lowercase enum"""
        if isinstance(v, str):
            v = v.lower()
            # Map common variations to correct enum values
            priority_map = {
                'low': TaskPriority.LOW,
                'medium': TaskPriority.MEDIUM,
                'high': TaskPriority.HIGH,
                'urgent': TaskPriority.URGENT,
            }
            return priority_map.get(v, v)
        return v


class ProjectTaskCreate(ProjectTaskBase):
    """Schema for creating a project task"""
    team_id: int
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    estimated_hours: Optional[float] = Field(None, ge=0, description="Estimated hours to complete the task")
    order: int = 0


class ProjectTaskUpdate(BaseModel):
    """Schema for updating a project task"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    team_id: Optional[int] = None
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = Field(None, ge=0, description="Estimated hours to complete the task")
    order: Optional[int] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        """Normalize status value to lowercase enum"""
        if v is None:
            return v
        if isinstance(v, str):
            v = v.lower()
            # Map common variations to correct enum values
            status_map = {
                'blocked': TaskStatus.BLOCKED,
                'todo': TaskStatus.TODO,
                'in_progress': TaskStatus.IN_PROGRESS,
                'inprogress': TaskStatus.IN_PROGRESS,
                'to_transfer': TaskStatus.TO_TRANSFER,
                'totransfer': TaskStatus.TO_TRANSFER,
                'completed': TaskStatus.COMPLETED,
            }
            return status_map.get(v, v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        """Normalize priority value to lowercase enum"""
        if v is None:
            return v
        if isinstance(v, str):
            v = v.lower()
            # Map common variations to correct enum values
            priority_map = {
                'low': TaskPriority.LOW,
                'medium': TaskPriority.MEDIUM,
                'high': TaskPriority.HIGH,
                'urgent': TaskPriority.URGENT,
            }
            return priority_map.get(v, v)
        return v


class ProjectTaskResponse(ProjectTaskBase):
    """Schema for project task response"""
    id: int
    team_id: int
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    created_by_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectTaskWithAssignee(ProjectTaskResponse):
    """Project task with assignee information"""
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
