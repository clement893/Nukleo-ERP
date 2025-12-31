"""
Project Tasks Endpoints
API endpoints for project task management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import ProgrammingError

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, Team, Project, ProjectTask, TaskStatus, TaskPriority
from app.schemas.project_task import (
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskResponse,
    ProjectTaskWithAssignee,
)
from app.core.logging import logger

router = APIRouter(prefix="/project-tasks", tags=["project-tasks"])


@router.get("", response_model=List[ProjectTaskWithAssignee])
async def list_tasks(
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    assignee_id: Optional[int] = Query(None, description="Filter by assignee ID"),
    task_status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List project tasks"""
    try:
        query = select(ProjectTask)
        
        if team_id:
            query = query.where(ProjectTask.team_id == team_id)
        # Note: project_id filter may fail if column doesn't exist in database
        # This will be caught by the exception handler below
        if project_id:
            query = query.where(ProjectTask.project_id == project_id)
        if assignee_id:
            query = query.where(ProjectTask.assignee_id == assignee_id)
        if task_status:
            query = query.where(ProjectTask.status == task_status)
        
        # Try to order by order field, fallback to created_at if order doesn't exist
        try:
            query = query.offset(skip).limit(limit).order_by(ProjectTask.order, ProjectTask.created_at.desc())
        except (AttributeError, ProgrammingError):
            # If order column doesn't exist, just order by created_at
            query = query.offset(skip).limit(limit).order_by(ProjectTask.created_at.desc())
        
        # Try to load relationships, but handle errors gracefully
        # Don't load project relationship as project_id column may not exist
        try:
            result = await db.execute(query.options(
                selectinload(ProjectTask.assignee),
                selectinload(ProjectTask.team),
            ))
        except (ProgrammingError, AttributeError, Exception) as e:
            # If relationship loading fails (e.g., missing columns), try without relationships
            error_str = str(e).lower()
            logger.warning(f"Failed to load relationships for project tasks: {e}")
            # Rollback the failed transaction first
            try:
                await db.rollback()
            except Exception as rollback_error:
                logger.warning(f"Rollback failed: {rollback_error}")
            
            # If error is due to project_id column not existing, raise informative error
            # SQLAlchemy will always try to select all model columns, so we can't work around this
            if 'project_id' in error_str and ('does not exist' in error_str or 'undefinedcolumn' in error_str):
                logger.error("project_id column doesn't exist in database - database migration may be needed")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database schema mismatch: project_id column is missing. Please run database migrations."
                )
            
            # Retry without relationship loading for other errors
            result = await db.execute(query)
        
        tasks = result.scalars().all()
        
        # Convert to response format
        task_responses = []
        for task in tasks:
            try:
                # Safely access all fields with getattr and defaults
                task_dict = {
                    "id": task.id,
                    "title": task.title or "Untitled Task",
                    "description": getattr(task, 'description', None),
                    "status": task.status,
                    "priority": task.priority,
                    "team_id": getattr(task, 'team_id', None),
                    "project_id": getattr(task, 'project_id', None),
                    "assignee_id": getattr(task, 'assignee_id', None),
                    "created_by_id": getattr(task, 'created_by_id', None),
                    "due_date": getattr(task, 'due_date', None),
                    "started_at": getattr(task, 'started_at', None),
                    "completed_at": getattr(task, 'completed_at', None),
                    "order": getattr(task, 'order', 0),
                    "created_at": task.created_at,
                    "updated_at": task.updated_at,
                    "assignee_name": None,
                    "assignee_email": None,
                }
                
                # Try to get assignee information if available
                try:
                    if hasattr(task, 'assignee') and task.assignee:
                        assignee = task.assignee
                        first_name = getattr(assignee, 'first_name', '') or ''
                        last_name = getattr(assignee, 'last_name', '') or ''
                        task_dict["assignee_name"] = f"{first_name} {last_name}".strip() or None
                        task_dict["assignee_email"] = getattr(assignee, 'email', None)
                except (AttributeError, ProgrammingError) as e:
                    logger.debug(f"Could not load assignee info for task {task.id}: {e}")
                    # Keep assignee_name and assignee_email as None
                
                # Ensure title is not empty (required by schema)
                if not task_dict["title"] or not task_dict["title"].strip():
                    task_dict["title"] = "Untitled Task"
                
                task_responses.append(ProjectTaskWithAssignee(**task_dict))
            except Exception as e:
                logger.warning(
                    f"Error processing task {getattr(task, 'id', 'unknown')}: {e}",
                    exc_info=True,
                    context={"task_id": getattr(task, 'id', None)}
                )
                # Skip this task and continue with others
                continue
        
        return task_responses
    except Exception as e:
        logger.error(
            f"Unexpected error in list_tasks: {type(e).__name__}: {str(e)}",
            exc_info=True,
            context={
                "user_id": getattr(current_user, 'id', None),
                "team_id": team_id,
                "project_id": project_id,
            }
        )
        # Rollback any failed transaction
        try:
            await db.rollback()
        except Exception:
            pass  # Ignore rollback errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )


@router.get("/{task_id}", response_model=ProjectTaskWithAssignee)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a project task by ID"""
    try:
        # Try to load with relationships first
        try:
            result = await db.execute(
                select(ProjectTask)
                .where(ProjectTask.id == task_id)
                .options(
                    selectinload(ProjectTask.assignee),
                    selectinload(ProjectTask.team),
                    selectinload(ProjectTask.project),
                )
            )
        except (ProgrammingError, AttributeError) as e:
            # If relationship loading fails, try without relationships
            logger.warning(f"Failed to load relationships for task {task_id}: {e}")
            result = await db.execute(
                select(ProjectTask).where(ProjectTask.id == task_id)
            )
        
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Safely access all fields with getattr and defaults
        task_dict = {
            "id": task.id,
            "title": task.title or "Untitled Task",
            "description": getattr(task, 'description', None),
            "status": task.status,
            "priority": task.priority,
            "team_id": getattr(task, 'team_id', None),
            "project_id": getattr(task, 'project_id', None),
            "assignee_id": getattr(task, 'assignee_id', None),
            "created_by_id": getattr(task, 'created_by_id', None),
            "due_date": getattr(task, 'due_date', None),
            "started_at": getattr(task, 'started_at', None),
            "completed_at": getattr(task, 'completed_at', None),
            "order": getattr(task, 'order', 0),
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "assignee_name": None,
            "assignee_email": None,
        }
        
        # Try to get assignee information if available
        try:
            if hasattr(task, 'assignee') and task.assignee:
                assignee = task.assignee
                first_name = getattr(assignee, 'first_name', '') or ''
                last_name = getattr(assignee, 'last_name', '') or ''
                task_dict["assignee_name"] = f"{first_name} {last_name}".strip() or None
                task_dict["assignee_email"] = getattr(assignee, 'email', None)
        except (AttributeError, ProgrammingError):
            # Keep assignee_name and assignee_email as None
            pass
        
        # Ensure title is not empty (required by schema)
        if not task_dict["title"] or not task_dict["title"].strip():
            task_dict["title"] = "Untitled Task"
        
        return ProjectTaskWithAssignee(**task_dict)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in get_task: {type(e).__name__}: {str(e)}",
            exc_info=True,
            context={"task_id": task_id, "user_id": getattr(current_user, 'id', None)}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )


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
    
    # Verify project exists if provided
    if task_data.project_id:
        result = await db.execute(select(Project).where(Project.id == task_data.project_id))
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
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
        project_id=task_data.project_id,
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
    
    # Verify project exists if provided
    if 'project_id' in update_data and update_data['project_id']:
        result = await db.execute(select(Project).where(Project.id == update_data['project_id']))
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
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
