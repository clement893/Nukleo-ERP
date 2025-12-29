"""
Agenda Events Endpoints
API endpoints for managing calendar events
"""

from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEvent as CalendarEventSchema
from app.core.logging import logger

router = APIRouter(prefix="/agenda/events", tags=["agenda-events"])


@router.get("/", response_model=List[CalendarEventSchema])
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    Get list of calendar events
    
    Args:
        start_date: Optional start date filter
        end_date: Optional end date filter
        event_type: Optional event type filter
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of calendar events
    """
    query = select(CalendarEvent).where(CalendarEvent.user_id == current_user.id)
    
    # Apply filters
    if start_date:
        # Event overlaps with the start date (event starts before or during, or ends after start_date)
        query = query.where(
            or_(
                CalendarEvent.date >= start_date,
                and_(
                    CalendarEvent.end_date.isnot(None),
                    CalendarEvent.end_date >= start_date
                )
            )
        )
    
    if end_date:
        # Event overlaps with the end date (event ends after or during, or starts before end_date)
        query = query.where(
            or_(
                CalendarEvent.date <= end_date,
                and_(
                    CalendarEvent.end_date.isnot(None),
                    CalendarEvent.end_date <= end_date
                )
            )
        )
    
    if event_type:
        query = query.where(CalendarEvent.type == event_type)
    
    query = query.options(
        selectinload(CalendarEvent.user)
    ).order_by(CalendarEvent.date.asc(), CalendarEvent.time.asc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return [CalendarEventSchema.model_validate(event) for event in events]


@router.get("/{event_id}", response_model=CalendarEventSchema)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a calendar event by ID
    
    Args:
        event_id: Event ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Calendar event
    """
    query = select(CalendarEvent).where(
        and_(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == current_user.id
        )
    )
    query = query.options(selectinload(CalendarEvent.user))
    
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    return CalendarEventSchema.model_validate(event)


@router.post("/", response_model=CalendarEventSchema, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new calendar event
    
    Args:
        event_data: Event data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created calendar event
    """
    # Validate end_date is after date
    if event_data.end_date and event_data.end_date < event_data.date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after or equal to start date"
        )
    
    event = CalendarEvent(
        title=event_data.title,
        description=event_data.description,
        date=event_data.date,
        end_date=event_data.end_date,
        time=event_data.time,
        type=event_data.type,
        location=event_data.location,
        attendees=event_data.attendees,
        color=event_data.color,
        user_id=current_user.id,
    )
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    logger.info(f"User {current_user.id} created calendar event {event.id}")
    
    return CalendarEventSchema.model_validate(event)


@router.put("/{event_id}", response_model=CalendarEventSchema)
async def update_event(
    event_id: int,
    event_data: CalendarEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a calendar event
    
    Args:
        event_id: Event ID
        event_data: Updated event data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated calendar event
    """
    query = select(CalendarEvent).where(
        and_(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Update fields
    update_data = event_data.model_dump(exclude_unset=True)
    
    # Validate end_date if provided
    if 'end_date' in update_data and 'date' in update_data:
        if update_data['end_date'] < update_data['date']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after or equal to start date"
            )
    elif 'end_date' in update_data and event.date:
        if update_data['end_date'] < event.date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after or equal to start date"
            )
    elif 'date' in update_data and event.end_date:
        if event.end_date < update_data['date']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after or equal to start date"
            )
    
    for field, value in update_data.items():
        setattr(event, field, value)
    
    await db.commit()
    await db.refresh(event)
    
    logger.info(f"User {current_user.id} updated calendar event {event_id}")
    
    return CalendarEventSchema.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a calendar event
    
    Args:
        event_id: Event ID
        current_user: Current authenticated user
        db: Database session
    """
    query = select(CalendarEvent).where(
        and_(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    db.delete(event)
    await db.commit()
    
    logger.info(f"User {current_user.id} deleted calendar event {event_id}")
