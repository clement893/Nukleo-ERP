"""
Project Task Schemas
Pydantic schemas for project tasks
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.project_task import TaskStatus, TaskPriority


class ProjectTaskBase(BaseModel):
    """Base project task schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None


class ProjectTaskCreate(ProjectTaskBase):
    """Schema for creating a project task"""
    team_id: int
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
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
    order: Optional[int] = None


class ProjectTaskResponse(ProjectTaskBase):
    """Schema for project task response"""
    id: int
    team_id: int
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    created_by_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectTaskWithAssignee(ProjectTaskResponse):
    """Project task with assignee information"""
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
