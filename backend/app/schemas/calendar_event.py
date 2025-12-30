"""
Calendar Event Schemas
Pydantic v2 models for calendar events
"""

from __future__ import annotations

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
    event_date: 'date' = Field(..., alias='date', description="Event date")
    end_date: Optional['date'] = Field(None, description="End date for multi-day events")
    event_time: Optional[str] = Field(None, description="Event time (HH:MM format)")
    # Use event_category internally - accept 'type' from API via model_validator
    # This avoids conflict with Python's 'type' keyword
    event_category: str = Field(
        default='other',
        description="Event category: meeting, appointment, reminder, deadline, vacation, holiday, other"
    )
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    attendees: Optional[List[str]] = Field(None, description="List of attendee names/emails")
    color: Optional[str] = Field(default='#3B82F6', description="Hex color code for the event")
    
    @model_validator(mode='before')
    @classmethod
    def convert_sqlalchemy_type_to_event_type(cls, data: Any) -> Any:
        """Convert 'type' attribute from SQLAlchemy model or API input to 'event_type' for Pydantic"""
        # Handle SQLAlchemy model instance (when from_attributes=True is used)
        if hasattr(data, 'type') and not isinstance(data, dict):
            # Convert SQLAlchemy model to dict
            result = {}
            for key in ['id', 'user_id', 'title', 'description', 'date', 'end_date', 
                       'time', 'location', 'attendees', 'color', 'created_at', 'updated_at']:
                if hasattr(data, key):
                    result[key] = getattr(data, key)
            # Map 'type' to 'event_category'
            if hasattr(data, 'type'):
                result['event_category'] = getattr(data, 'type')
            # Map 'time' to 'event_time'
            if hasattr(data, 'time'):
                result['event_time'] = getattr(data, 'time')
            # Map 'date' to 'event_date'
            if hasattr(data, 'date'):
                result['event_date'] = getattr(data, 'date')
            return result
        # Handle dict input (from API)
        if isinstance(data, dict):
            # Convert 'type' key to 'event_category'
            if 'type' in data and 'event_category' not in data:
                data['event_category'] = data.pop('type')
            # Convert 'time' key to 'event_time'
            if 'time' in data and 'event_time' not in data:
                data['event_time'] = data.pop('time')
            # Convert 'date' key to 'event_date'
            if 'date' in data and 'event_date' not in data:
                data['event_date'] = data.pop('date')
        return data
    
    @field_validator('event_category', mode='before')
    @classmethod
    def validate_event_category_field(cls, v: Any) -> str:
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
    event_date: Optional['date'] = Field(None, alias='date', description="Event date")
    end_date: Optional['date'] = Field(None, description="End date for multi-day events")
    event_time: Optional[str] = Field(None, description="Event time (HH:MM format)")
    # Use event_type internally - accept 'type' from API via model_validator
    event_category: Optional[str] = Field(
        None,
        description="Event category"
    )
    
    @model_validator(mode='before')
    @classmethod
    def convert_api_input(cls, data: Any) -> Any:
        """Convert 'type' and 'time' keys from API input to 'event_type' and 'event_time'"""
        if isinstance(data, dict):
            # Convert 'type' key to 'event_category'
            if 'type' in data and 'event_category' not in data:
                data['event_category'] = data.pop('type')
            # Convert 'time' key to 'event_time'
            if 'time' in data and 'event_time' not in data:
                data['event_time'] = data.pop('time')
        return data
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    attendees: Optional[List[str]] = Field(None, description="List of attendee names/emails")
    color: Optional[str] = Field(None, description="Hex color code for the event")
    
    @field_validator('event_category', mode='before')
    @classmethod
    def validate_event_category_field(cls, v: Any) -> Optional[str]:
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
    created_at: 'datetime'
    updated_at: 'datetime'

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
    
    @model_serializer
    def serialize_model(self):
        """Serialize model with 'type' and 'time' keys for API compatibility"""
        data = self.model_dump()
        # Convert 'event_category' to 'type' for API response
        if 'event_category' in data:
            data['type'] = data.pop('event_category')
        # Convert 'event_time' to 'time' for API response
        if 'event_time' in data:
            data['time'] = data.pop('event_time')
        # Convert 'event_date' to 'date' for API response
        if 'event_date' in data:
            data['date'] = data.pop('event_date')
        return data
    
    @model_validator(mode='before')
    @classmethod
    def handle_sqlalchemy_type_field(cls, data: Any) -> Any:
        """Convert 'type' and 'time' attributes from SQLAlchemy model to 'event_type' and 'event_time'"""
        # Handle SQLAlchemy model instance (when from_attributes=True is used)
        if hasattr(data, 'type') and not isinstance(data, dict):
            # Convert SQLAlchemy model to dict
            result = {}
            for key in ['id', 'user_id', 'title', 'description', 'date', 'end_date', 
                       'time', 'location', 'attendees', 'color', 'created_at', 'updated_at']:
                if hasattr(data, key):
                    result[key] = getattr(data, key)
            # Map 'type' to 'event_category'
            if hasattr(data, 'type'):
                result['event_category'] = getattr(data, 'type')
            # Map 'time' to 'event_time'
            if hasattr(data, 'time'):
                result['event_time'] = getattr(data, 'time')
            # Map 'date' to 'event_date'
            if hasattr(data, 'date'):
                result['event_date'] = getattr(data, 'date')
            return result
        # Handle dict input (from API)
        if isinstance(data, dict):
            # Convert 'type' key to 'event_category'
            if 'type' in data and 'event_category' not in data:
                data['event_category'] = data.pop('type')
            # Convert 'time' key to 'event_time'
            if 'time' in data and 'event_time' not in data:
                data['event_time'] = data.pop('time')
            # Convert 'date' key to 'event_date'
            if 'date' in data and 'event_date' not in data:
                data['event_date'] = data.pop('date')
        return data


class CalendarEventInDB(CalendarEvent):
    """Calendar event in database schema"""
    pass
