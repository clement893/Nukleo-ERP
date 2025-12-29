"""
Calendar Event Schemas
Pydantic v2 models for calendar events
"""

from datetime import datetime, date, time
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator, model_serializer


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
    time: Optional[time] = Field(None, description="Event time")
    # Use event_type internally to avoid conflict with Python's 'type' keyword
    # We'll serialize it as 'type' for API compatibility using alias
    event_type: str = Field(
        default='other',
        alias='type',  # Accept 'type' from API
        serialization_alias='type',  # Serialize as 'type' for API
        description="Event type: meeting, appointment, reminder, deadline, vacation, holiday, other"
    )
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    attendees: Optional[List[str]] = Field(None, description="List of attendee names/emails")
    color: Optional[str] = Field(default='#3B82F6', description="Hex color code for the event")
    
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
        # Allow 'type' field to work despite being a Python built-in
        protected_namespaces=()
    )
    
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Event title")
    description: Optional[str] = Field(None, description="Event description")
    date: Optional[date] = Field(None, description="Event date")
    end_date: Optional[date] = Field(None, description="End date for multi-day events")
    time: Optional[time] = Field(None, description="Event time")
    # Use event_type internally to avoid conflict with Python's 'type' keyword
    # We'll serialize it as 'type' for API compatibility
    event_type: Optional[str] = Field(None, description="Event type")
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
    
    @model_validator(mode='before')
    @classmethod
    def handle_type_field(cls, data: Any) -> Any:
        """Convert 'type' field from API to 'event_type' internally"""
        if isinstance(data, dict):
            if 'type' in data and 'event_type' not in data:
                data['event_type'] = data.pop('type')
        return data
    
    @model_serializer(mode='wrap')
    def serialize_model(self, serializer, info):
        """Serialize model with 'type' instead of 'event_type'"""
        data = serializer(self)
        if isinstance(data, dict) and 'event_type' in data:
            data['type'] = data.pop('event_type')
        return data
    
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
        populate_by_name=True
    )
    
    @model_validator(mode='before')
    @classmethod
    def handle_type_field(cls, data: Any) -> Any:
        """Convert 'type' field from database model to 'event_type'"""
        # Handle SQLAlchemy model instance - from_attributes will handle it, but we need to map 'type' to 'event_type'
        if hasattr(data, '__dict__') and hasattr(data, 'type'):
            if not isinstance(data, dict):
                # Create a dict from the model attributes
                result = {}
                for key in ['id', 'user_id', 'title', 'description', 'date', 'end_date', 
                           'time', 'location', 'attendees', 'color', 'created_at', 'updated_at']:
                    if hasattr(data, key):
                        result[key] = getattr(data, key)
                # Convert 'type' to 'type' (which will be mapped to 'event_type' via alias)
                if hasattr(data, 'type'):
                    result['type'] = getattr(data, 'type')
                return result
        # Handle dict input - map 'type' key if present
        elif isinstance(data, dict):
            # Keep 'type' as is, it will be mapped to 'event_type' via alias
            pass
        return data


class CalendarEventInDB(CalendarEvent):
    """Calendar event in database schema"""
    pass
