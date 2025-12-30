"""
Calendar Event Schemas
Pydantic v2 models for calendar events
"""

from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator, model_serializer

# Import time type directly to avoid conflicts
from datetime import time as _TimeType


class CalendarEventBase(BaseModel):
    """Base calendar event schema"""
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=()
    )
    
    title: str = Field(..., min_length=1, max_length=200, description="Event title", strip_whitespace=True)
    description: Optional[str] = Field(None, description="Event description")
    date: date = Field(..., description="Event date")
    end_date: Optional[date] = Field(None, description="End date for multi-day events")
    event_time: Optional[_TimeType] = Field(None, alias='time', description="Event time")
    # Use event_type internally, but accept 'type' from API via alias
    # This avoids conflict with Python's 'type' keyword while maintaining API compatibility
    event_type: str = Field(
        default='other',
        alias='type',  # Accept 'type' from API input
        description="Event type: meeting, appointment, reminder, deadline, vacation, holiday, other"
    )
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    attendees: Optional[List[str]] = Field(None, description="List of attendee names/emails")
    color: Optional[str] = Field(default='#3B82F6', description="Hex color code for the event")
    
    @model_validator(mode='before')
    @classmethod
    def convert_sqlalchemy_type_to_event_type(cls, data: Any) -> Any:
        """Convert 'type' attribute from SQLAlchemy model to 'event_type' for Pydantic"""
        # Handle SQLAlchemy model instance (when from_attributes=True is used)
        if hasattr(data, 'type') and not isinstance(data, dict):
            # Convert SQLAlchemy model to dict
            result = {}
            for key in ['id', 'user_id', 'title', 'description', 'date', 'end_date', 
                       'time', 'location', 'attendees', 'color', 'created_at', 'updated_at']:
                if hasattr(data, key):
                    result[key] = getattr(data, key)
            # Map 'type' to 'type' (which will be read via alias as 'event_type')
            if hasattr(data, 'type'):
                result['type'] = getattr(data, 'type')
            # Map 'time' to 'time' (which will be read via alias as 'event_time')
            if hasattr(data, 'time'):
                result['time'] = getattr(data, 'time')
            return result
        return data
    
    @field_validator('event_type', mode='before')
    @classmethod
    def validate_event_type(cls, v: Any) -> str:
        """Validate event type"""
        if v is None:
            return 'other'
        valid_types = ['meeting', 'appointment', 'reminder', 'deadline', 'vacation', 'holiday', 'other']
        if v not in valid_types:
            raise ValueError(f'Event type must be one of: {", ".join(valid_types)}')
        return v
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate hex color code"""
        if v and not v.startswith('#'):
            return f'#{v}'
        return v


class CalendarEventCreate(CalendarEventBase):
    """Calendar event creation schema"""
    pass


class CalendarEventUpdate(BaseModel):
    """Calendar event update schema"""
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=()
    )
    
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Event title")
    description: Optional[str] = Field(None, description="Event description")
    date: Optional[date] = Field(None, description="Event date")
    end_date: Optional[date] = Field(None, description="End date for multi-day events")
    event_time: Optional[_TimeType] = Field(None, alias='time', description="Event time")
    # Use event_type internally, but accept 'type' from API via alias
    event_type: Optional[str] = Field(
        None,
        alias='type',  # Accept 'type' from API input
        description="Event type"
    )
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    attendees: Optional[List[str]] = Field(None, description="List of attendee names/emails")
    color: Optional[str] = Field(None, description="Hex color code for the event")
    
    @field_validator('event_type', mode='before')
    @classmethod
    def validate_event_type(cls, v: Any) -> Optional[str]:
        """Validate event type"""
        if v is None:
            return v
        valid_types = ['meeting', 'appointment', 'reminder', 'deadline', 'vacation', 'holiday', 'other']
        if v not in valid_types:
            raise ValueError(f'Event type must be one of: {", ".join(valid_types)}')
        return v
    
    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate hex color code"""
        if v and not v.startswith('#'):
            return f'#{v}'
        return v


class CalendarEvent(CalendarEventBase):
    """Calendar event response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        serialize_by_alias=True  # Serialize 'event_type' as 'type' in JSON responses
    )
    
    @model_validator(mode='before')
    @classmethod
    def handle_sqlalchemy_type_field(cls, data: Any) -> Any:
        """Convert 'type' attribute from SQLAlchemy model to dict with 'type' key for alias mapping"""
        # Handle SQLAlchemy model instance (when from_attributes=True is used)
        if hasattr(data, 'type') and not isinstance(data, dict):
            # Convert SQLAlchemy model to dict
            result = {}
            for key in ['id', 'user_id', 'title', 'description', 'date', 'end_date', 
                       'time', 'location', 'attendees', 'color', 'created_at', 'updated_at']:
                if hasattr(data, key):
                    result[key] = getattr(data, key)
            # Map 'type' attribute to 'type' key (which will be read via alias as 'event_type')
            if hasattr(data, 'type'):
                result['type'] = getattr(data, 'type')
            # Map 'time' to 'time' (which will be read via alias as 'event_time')
            if hasattr(data, 'time'):
                result['time'] = getattr(data, 'time')
            return result
        return data


class CalendarEventInDB(CalendarEvent):
    """Calendar event in database schema"""
    pass
