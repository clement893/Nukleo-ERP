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
from datetime import time as dt_time

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEvent as CalendarEventSchema
from app.core.logging import logger

router = APIRouter(prefix="/agenda/events", tags=["agenda-events"])


def event_to_dict(event: CalendarEvent) -> dict:
    """Convert SQLAlchemy CalendarEvent model to dict for Pydantic validation"""
    # Ensure title is not empty (required by schema with min_length=1)
    title = event.title or 'Untitled Event'
    if not title.strip():
        title = 'Untitled Event'
    
    # Ensure date is present (required field) - use today as fallback if missing
    event_date = event.date
    if not event_date:
        logger.warning(f"Event {event.id} has no date, using today as fallback")
        from datetime import date
        event_date = date.today()
    
    # Convert time to string if present
    time_str = None
    if event.time is not None:
        if isinstance(event.time, str):
            time_str = event.time
        else:
            try:
                time_str = event.time.strftime('%H:%M:%S')
            except (AttributeError, ValueError):
                time_str = None
    
    # Ensure type is valid (default to 'other' if None or invalid)
    event_type = event.type if event.type else 'other'
    valid_types = ['meeting', 'appointment', 'reminder', 'deadline', 'vacation', 'holiday', 'other']
    if event_type not in valid_types:
        event_type = 'other'
    
    # Ensure attendees is a list or None
    attendees = None
    if event.attendees is not None:
        if isinstance(event.attendees, list):
            attendees = event.attendees
        elif isinstance(event.attendees, str):
            # Try to parse JSON string
            try:
                import json
                attendees = json.loads(event.attendees)
                if not isinstance(attendees, list):
                    attendees = None
            except (json.JSONDecodeError, TypeError):
                attendees = None
    
    return {
        'id': event.id,
        'user_id': event.user_id,
        'title': title,
        'description': event.description,
        'event_date': event_date,  # Use event_date instead of date
        'end_date': event.end_date,
        'event_time': time_str,  # Use event_time instead of time
        'event_category': event_type,  # Use event_category instead of type
        'location': event.location,
        'attendees': attendees,
        'color': event.color if event.color else '#3B82F6',
        'created_at': event.created_at,
        'updated_at': event.updated_at,
    }


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
    
    query = query.order_by(CalendarEvent.date.asc(), CalendarEvent.time.asc()).offset(skip).limit(limit)
    
    try:
        try:
            result = await db.execute(query)
            events = result.scalars().all()
        except Exception as db_error:
            logger.error(f"Database error fetching events: {db_error}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_error)}"
            )
        
        # Convert events to schema format
        event_list = []
        for event in events:
            try:
                # Try using from_attributes first (simpler and more direct)
                try:
                    event_schema = CalendarEventSchema.model_validate(event, from_attributes=True)
                    event_list.append(event_schema)
                except Exception as from_attr_error:
                    # Fallback to manual conversion if from_attributes fails
                    logger.debug(f"from_attributes failed for event {event.id}, using manual conversion: {from_attr_error}")
                    event_dict = event_to_dict(event)
                    event_schema = CalendarEventSchema.model_validate(event_dict, strict=False)
                    event_list.append(event_schema)
            except ValueError as e:
                # Validation errors - log and skip
                logger.warning(f"Validation error for event {event.id}: {e}")
                logger.debug(f"Event data: id={event.id}, title={getattr(event, 'title', None)}, date={getattr(event, 'date', None)}, type={getattr(event, 'type', None)}")
                continue
            except Exception as e:
                logger.error(f"Error validating event {event.id}: {e}", exc_info=True)
                logger.error(f"Event data: id={event.id}, title={getattr(event, 'title', None)}, date={getattr(event, 'date', None)}, type={getattr(event, 'type', None)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                # Skip invalid events instead of failing the entire request
                # This allows the API to return valid events even if some are corrupted
                continue
        
        return event_list
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching calendar events: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred. Please contact support."
        )


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
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Try using from_attributes first (simpler and more direct)
    try:
        return CalendarEventSchema.model_validate(event, from_attributes=True)
    except Exception:
        # Fallback to manual conversion if from_attributes fails
        event_dict = event_to_dict(event)
        return CalendarEventSchema.model_validate(event_dict, strict=False)


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
    if event_data.end_date and event_data.end_date < event_data.event_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after or equal to start date"
        )
    
    # Convert time string to Time object if provided
    time_obj = None
    if event_data.event_time:
        try:
            # Parse time string (HH:MM or HH:MM:SS format)
            time_parts = event_data.event_time.split(':')
            if len(time_parts) >= 2:
                hour = int(time_parts[0])
                minute = int(time_parts[1])
                second = int(time_parts[2]) if len(time_parts) > 2 else 0
                time_obj = dt_time(hour, minute, second)
        except (ValueError, IndexError) as e:
            logger.warning(f"Invalid time format '{event_data.event_time}': {e}")
            # If time format is invalid, set to None instead of failing
            time_obj = None
    
    event = CalendarEvent(
        title=event_data.title,
        description=event_data.description,
        date=event_data.event_date,
        end_date=event_data.end_date,
        time=time_obj,
        type=event_data.event_category,  # Use event_category from schema (mapped from 'type' via model_validator)
        location=event_data.location,
        attendees=event_data.attendees,
        color=event_data.color,
        user_id=current_user.id,
    )
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    logger.info(f"User {current_user.id} created calendar event {event.id}")
    
    # Try using from_attributes first (simpler and more direct)
    try:
        return CalendarEventSchema.model_validate(event, from_attributes=True)
    except Exception:
        # Fallback to manual conversion if from_attributes fails
        event_dict = event_to_dict(event)
        return CalendarEventSchema.model_validate(event_dict, strict=False)


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
    update_data = event_data.model_dump(exclude_unset=True, by_alias=False)
    
    # Map event_category back to type for database model
    if 'event_category' in update_data:
        update_data['type'] = update_data.pop('event_category')
    # Map event_time back to time for database model and convert string to Time object
    if 'event_time' in update_data:
        time_value = update_data.pop('event_time')
        if time_value:
            try:
                # Parse time string (HH:MM or HH:MM:SS format)
                time_parts = time_value.split(':')
                if len(time_parts) >= 2:
                    hour = int(time_parts[0])
                    minute = int(time_parts[1])
                    second = int(time_parts[2]) if len(time_parts) > 2 else 0
                    update_data['time'] = dt_time(hour, minute, second)
                else:
                    update_data['time'] = None
            except (ValueError, IndexError) as e:
                logger.warning(f"Invalid time format '{time_value}': {e}")
                update_data['time'] = None
        else:
            update_data['time'] = None
    # Map event_date back to date for database model
    if 'event_date' in update_data:
        update_data['date'] = update_data.pop('event_date')
    
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
    
    # Try using from_attributes first (simpler and more direct)
    try:
        return CalendarEventSchema.model_validate(event, from_attributes=True)
    except Exception:
        # Fallback to manual conversion if from_attributes fails
        event_dict = event_to_dict(event)
        return CalendarEventSchema.model_validate(event_dict, strict=False)


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
