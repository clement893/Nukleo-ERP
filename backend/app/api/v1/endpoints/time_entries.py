"""
Time Entries Endpoints
API endpoints for time tracking
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, ProjectTask, Project, Client, TimeEntry
from app.schemas.time_entry import (
    TimeEntryCreate,
    TimeEntryUpdate,
    TimeEntryResponse,
    TimeEntryWithRelations,
    TimerStartRequest,
    TimerStopRequest,
)

router = APIRouter(prefix="/time-entries", tags=["time-entries"])

# Store active timers in memory (in production, use Redis or database)
_active_timers: dict[int, dict] = {}  # {user_id: {task_id, start_time, description, paused, accumulated_seconds}}


@router.get("", response_model=List[TimeEntryWithRelations])
async def list_time_entries(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List time entries"""
    query = select(TimeEntry)
    
    # Non-admin users can only see their own entries
    if not getattr(current_user, 'is_superuser', False):
        query = query.where(TimeEntry.user_id == current_user.id)
    elif user_id:
        query = query.where(TimeEntry.user_id == user_id)
    
    if task_id:
        query = query.where(TimeEntry.task_id == task_id)
    if project_id:
        query = query.where(TimeEntry.project_id == project_id)
    if client_id:
        query = query.where(TimeEntry.client_id == client_id)
    if start_date:
        query = query.where(TimeEntry.date >= start_date)
    if end_date:
        query = query.where(TimeEntry.date <= end_date)
    
    query = query.offset(skip).limit(limit).order_by(TimeEntry.date.desc(), TimeEntry.created_at.desc())
    
    result = await db.execute(query.options(
        selectinload(TimeEntry.user),
        selectinload(TimeEntry.task),
        selectinload(TimeEntry.project),
        selectinload(TimeEntry.client),
    ))
    entries = result.scalars().all()
    
    # Convert to response format
    entry_responses = []
    for entry in entries:
        entry_dict = {
            "id": entry.id,
            "description": entry.description,
            "duration": entry.duration,
            "date": entry.date,
            "user_id": entry.user_id,
            "task_id": entry.task_id,
            "project_id": entry.project_id,
            "client_id": entry.client_id,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at,
            "task_title": None,
            "project_name": None,
            "client_name": None,
            "user_name": None,
            "user_email": None,
        }
        
        if entry.task:
            entry_dict["task_title"] = entry.task.title
        if entry.project:
            entry_dict["project_name"] = entry.project.name
        if entry.client:
            entry_dict["client_name"] = entry.client.company_name
        if entry.user:
            entry_dict["user_name"] = f"{entry.user.first_name or ''} {entry.user.last_name or ''}".strip() or entry.user.email
            entry_dict["user_email"] = entry.user.email
        
        entry_responses.append(TimeEntryWithRelations(**entry_dict))
    
    return entry_responses


@router.get("/{entry_id}", response_model=TimeEntryWithRelations)
async def get_time_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a time entry by ID"""
    result = await db.execute(
        select(TimeEntry)
        .where(TimeEntry.id == entry_id)
        .options(
            selectinload(TimeEntry.user),
            selectinload(TimeEntry.task),
            selectinload(TimeEntry.project),
            selectinload(TimeEntry.client),
        )
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found"
        )
    
    # Non-admin users can only see their own entries
    if not getattr(current_user, 'is_superuser', False) and entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this time entry"
        )
    
    entry_dict = {
        "id": entry.id,
        "description": entry.description,
        "duration": entry.duration,
        "date": entry.date,
        "user_id": entry.user_id,
        "task_id": entry.task_id,
        "project_id": entry.project_id,
        "client_id": entry.client_id,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
        "task_title": None,
        "project_name": None,
        "client_name": None,
        "user_name": None,
        "user_email": None,
    }
    
    if entry.task:
        entry_dict["task_title"] = entry.task.title
    if entry.project:
        entry_dict["project_name"] = entry.project.name
    if entry.client:
        entry_dict["client_name"] = entry.client.company_name
    if entry.user:
        entry_dict["user_name"] = f"{entry.user.first_name or ''} {entry.user.last_name or ''}".strip() or entry.user.email
        entry_dict["user_email"] = entry.user.email
    
    return TimeEntryWithRelations(**entry_dict)


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_time_entry(
    entry_data: TimeEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new time entry"""
    # Verify task exists if provided
    if entry_data.task_id:
        result = await db.execute(
            select(ProjectTask)
            .where(ProjectTask.id == entry_data.task_id)
            .options(selectinload(ProjectTask.project))
        )
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        # Auto-fill project_id and client_id from task
        if task.project_id and not entry_data.project_id:
            entry_data.project_id = task.project_id
        if task.project and hasattr(task.project, 'client_id') and task.project.client_id and not entry_data.client_id:
            entry_data.client_id = task.project.client_id
    
    # Verify project exists if provided
    if entry_data.project_id:
        result = await db.execute(select(Project).where(Project.id == entry_data.project_id))
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        # Auto-fill client_id from project
        if project.client_id and not entry_data.client_id:
            entry_data.client_id = project.client_id
    
    # Verify client exists if provided
    if entry_data.client_id:
        result = await db.execute(select(Client).where(Client.id == entry_data.client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )
    
    # Parse date if it's a string
    entry_date = entry_data.date
    if isinstance(entry_date, str):
        try:
            entry_date = datetime.fromisoformat(entry_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            try:
                entry_date = datetime.strptime(entry_date, '%Y-%m-%d')
            except ValueError:
                entry_date = datetime.now(timezone.utc)
    elif not isinstance(entry_date, datetime):
        entry_date = datetime.now(timezone.utc)
    
    # Ensure timezone awareness
    if entry_date.tzinfo is None:
        entry_date = entry_date.replace(tzinfo=timezone.utc)
    
    # Create entry
    try:
        entry = TimeEntry(
            description=entry_data.description,
            duration=entry_data.duration,
            date=entry_date,
            user_id=current_user.id,
            task_id=entry_data.task_id,
            project_id=entry_data.project_id,
            client_id=entry_data.client_id,
        )
        
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        
        return entry
    except Exception as e:
        await db.rollback()
        from app.core.logging import logger
        logger.error(f"Error creating time entry: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"A database error occurred: {str(e)}"
        )


@router.patch("/{entry_id}", response_model=TimeEntryResponse)
async def update_time_entry(
    entry_id: int,
    entry_data: TimeEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a time entry"""
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found"
        )
    
    # Non-admin users can only update their own entries
    if not getattr(current_user, 'is_superuser', False) and entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this time entry"
        )
    
    # Update fields
    update_data = entry_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    await db.commit()
    await db.refresh(entry)
    
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a time entry"""
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found"
        )
    
    # Non-admin users can only delete their own entries
    if not getattr(current_user, 'is_superuser', False) and entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this time entry"
        )
    
    await db.delete(entry)
    await db.commit()
    
    return None


@router.post("/timer/start", response_model=dict)
async def start_timer(
    timer_data: TimerStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a timer for a task"""
    # Verify task exists
    result = await db.execute(
        select(ProjectTask)
        .where(ProjectTask.id == timer_data.task_id)
        .options(
            selectinload(ProjectTask.project),
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user already has an active timer
    if current_user.id in _active_timers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active timer. Stop it first."
        )
    
    # Start timer
    _active_timers[current_user.id] = {
        "task_id": timer_data.task_id,
        "start_time": datetime.now(timezone.utc),
        "description": timer_data.description,
        "paused": False,
        "paused_at": None,
        "accumulated_seconds": 0,
    }
    
    return {
        "message": "Timer started",
        "task_id": timer_data.task_id,
        "start_time": _active_timers[current_user.id]["start_time"].isoformat(),
    }


@router.post("/timer/stop", response_model=TimeEntryResponse)
async def stop_timer(
    timer_data: TimerStopRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stop the active timer and create a time entry"""
    # Check if user has an active timer
    if current_user.id not in _active_timers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active timer found"
        )
    
    timer_info = _active_timers[current_user.id]
    
    # Calculate duration (include accumulated time if paused)
    accumulated = timer_info.get("accumulated_seconds", 0)
    
    if timer_info.get("paused", False):
        duration = accumulated
    else:
        start_time = timer_info["start_time"]
        end_time = datetime.now(timezone.utc)
        duration = accumulated + int((end_time - start_time).total_seconds())
    
    if duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timer duration"
        )
    
    # Get task to auto-fill project and client
    result = await db.execute(
        select(ProjectTask)
        .where(ProjectTask.id == timer_info["task_id"])
        .options(
            selectinload(ProjectTask.project),
        )
    )
    task = result.scalar_one_or_none()
    
    project_id = None
    client_id = None
    
    if task:
        project_id = task.project_id
        if task.project and task.project.client_id:
            client_id = task.project.client_id
    
    # Create time entry
    entry = TimeEntry(
        description=timer_data.description or timer_info.get("description"),
        duration=duration,
        date=start_time,
        user_id=current_user.id,
        task_id=timer_info["task_id"],
        project_id=project_id,
        client_id=client_id,
    )
    
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    
    # Remove active timer
    del _active_timers[current_user.id]
    
    return entry


@router.post("/timer/pause", response_model=dict)
async def pause_timer(
    current_user: User = Depends(get_current_user),
):
    """Pause the active timer"""
    if current_user.id not in _active_timers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active timer found"
        )
    
    timer_info = _active_timers[current_user.id]
    
    if timer_info.get("paused", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timer is already paused"
        )
    
    # Calculate elapsed time and add to accumulated
    start_time = timer_info["start_time"]
    now = datetime.now(timezone.utc)
    elapsed = int((now - start_time).total_seconds())
    timer_info["accumulated_seconds"] = timer_info.get("accumulated_seconds", 0) + elapsed
    timer_info["paused"] = True
    timer_info["paused_at"] = now
    
    return {
        "message": "Timer paused",
        "accumulated_seconds": timer_info["accumulated_seconds"],
    }


@router.post("/timer/resume", response_model=dict)
async def resume_timer(
    current_user: User = Depends(get_current_user),
):
    """Resume a paused timer"""
    if current_user.id not in _active_timers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active timer found"
        )
    
    timer_info = _active_timers[current_user.id]
    
    if not timer_info.get("paused", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timer is not paused"
        )
    
    # Reset start time to now
    timer_info["start_time"] = datetime.now(timezone.utc)
    timer_info["paused"] = False
    timer_info["paused_at"] = None
    
    return {
        "message": "Timer resumed",
        "start_time": timer_info["start_time"].isoformat(),
    }


@router.post("/timer/adjust", response_model=dict)
async def adjust_timer(
    adjustment: dict,
    current_user: User = Depends(get_current_user),
):
    """Adjust the accumulated time of the active timer"""
    if current_user.id not in _active_timers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active timer found"
        )
    
    timer_info = _active_timers[current_user.id]
    new_accumulated = adjustment.get("accumulated_seconds", timer_info.get("accumulated_seconds", 0))
    
    if new_accumulated < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accumulated time cannot be negative"
        )
    
    timer_info["accumulated_seconds"] = new_accumulated
    
    return {
        "message": "Timer adjusted",
        "accumulated_seconds": timer_info["accumulated_seconds"],
    }


@router.get("/timer/status", response_model=dict)
async def get_timer_status(
    current_user: User = Depends(get_current_user),
):
    """Get the status of the active timer"""
    if current_user.id not in _active_timers:
        return {
            "active": False,
        }
    
    timer_info = _active_timers[current_user.id]
    accumulated = timer_info.get("accumulated_seconds", 0)
    
    if timer_info.get("paused", False):
        elapsed = accumulated
    else:
        start_time = timer_info["start_time"]
        elapsed = accumulated + int((datetime.now(timezone.utc) - start_time).total_seconds())
    
    return {
        "active": True,
        "task_id": timer_info["task_id"],
        "start_time": timer_info["start_time"].isoformat(),
        "elapsed_seconds": elapsed,
        "description": timer_info.get("description"),
        "paused": timer_info.get("paused", False),
        "accumulated_seconds": accumulated,
    }
