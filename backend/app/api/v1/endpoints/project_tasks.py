"""
Project Tasks Endpoints
API endpoints for project task management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, Team, ProjectTask, TaskStatus, TaskPriority
from app.schemas.project_task import (
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskResponse,
    ProjectTaskWithAssignee,
)

router = APIRouter(prefix="/project-tasks", tags=["project-tasks"])


@router.get("", response_model=List[ProjectTaskWithAssignee])
async def list_tasks(
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    assignee_id: Optional[int] = Query(None, description="Filter by assignee ID"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List project tasks"""
    query = select(ProjectTask)
    
    if team_id:
        query = query.where(ProjectTask.team_id == team_id)
    if assignee_id:
        query = query.where(ProjectTask.assignee_id == assignee_id)
    if status:
        query = query.where(ProjectTask.status == status)
    
    query = query.offset(skip).limit(limit).order_by(ProjectTask.order, ProjectTask.created_at.desc())
    
    result = await db.execute(query.options(
        selectinload(ProjectTask.assignee),
        selectinload(ProjectTask.team),
    ))
    tasks = result.scalars().all()
    
    # Convert to response format
    task_responses = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "team_id": task.team_id,
            "assignee_id": task.assignee_id,
            "created_by_id": task.created_by_id,
            "due_date": task.due_date,
            "started_at": task.started_at,
            "completed_at": task.completed_at,
            "order": task.order,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "assignee_name": None,
            "assignee_email": None,
        }
        if task.assignee:
            task_dict["assignee_name"] = f"{task.assignee.first_name or ''} {task.assignee.last_name or ''}".strip()
            task_dict["assignee_email"] = task.assignee.email
        
        task_responses.append(ProjectTaskWithAssignee(**task_dict))
    
    return task_responses


@router.get("/{task_id}", response_model=ProjectTaskWithAssignee)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a project task by ID"""
    result = await db.execute(
        select(ProjectTask)
        .where(ProjectTask.id == task_id)
        .options(
            selectinload(ProjectTask.assignee),
            selectinload(ProjectTask.team),
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "team_id": task.team_id,
        "assignee_id": task.assignee_id,
        "created_by_id": task.created_by_id,
        "due_date": task.due_date,
        "started_at": task.started_at,
        "completed_at": task.completed_at,
        "order": task.order,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "assignee_name": None,
        "assignee_email": None,
    }
    if task.assignee:
        task_dict["assignee_name"] = f"{task.assignee.first_name or ''} {task.assignee.last_name or ''}".strip()
        task_dict["assignee_email"] = task.assignee.email
    
    return ProjectTaskWithAssignee(**task_dict)


@router.post("", response_model=ProjectTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: ProjectTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project task"""
    # Verify team exists
    result = await db.execute(select(Team).where(Team.id == task_data.team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify assignee exists if provided
    if task_data.assignee_id:
        result = await db.execute(select(User).where(User.id == task_data.assignee_id))
        assignee = result.scalar_one_or_none()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee not found"
            )
    
    # Create task
    task = ProjectTask(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        team_id=task_data.team_id,
        assignee_id=task_data.assignee_id,
        created_by_id=current_user.id,
        due_date=task_data.due_date,
        order=task_data.order,
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return task


@router.patch("/{task_id}", response_model=ProjectTaskResponse)
async def update_task(
    task_id: int,
    task_data: ProjectTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project task"""
    result = await db.execute(select(ProjectTask).where(ProjectTask.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update fields
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Handle status changes
    if 'status' in update_data:
        from datetime import datetime, timezone
        new_status = update_data['status']
        if new_status == TaskStatus.IN_PROGRESS and not task.started_at:
            task.started_at = datetime.now(timezone.utc)
        elif new_status == TaskStatus.COMPLETED and not task.completed_at:
            task.completed_at = datetime.now(timezone.utc)
    
    # Verify team exists if provided
    if 'team_id' in update_data:
        result = await db.execute(select(Team).where(Team.id == update_data['team_id']))
        team = result.scalar_one_or_none()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
    
    # Verify assignee exists if provided
    if 'assignee_id' in update_data and update_data['assignee_id']:
        result = await db.execute(select(User).where(User.id == update_data['assignee_id']))
        assignee = result.scalar_one_or_none()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee not found"
            )
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    await db.commit()
    await db.refresh(task)
    
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project task"""
    result = await db.execute(select(ProjectTask).where(ProjectTask.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    await db.delete(task)
    await db.commit()
    
    return None
