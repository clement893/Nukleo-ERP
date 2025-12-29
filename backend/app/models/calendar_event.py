"""
Calendar Event Model
SQLAlchemy model for calendar events
"""

from datetime import datetime, date
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, func, Index, Date, Time, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class CalendarEvent(Base):
    """Calendar Event model for agenda module"""
    __tablename__ = "calendar_events"
    __table_args__ = (
        Index("idx_calendar_events_user_id", "user_id"),
        Index("idx_calendar_events_date", "date"),
        Index("idx_calendar_events_type", "type"),
        Index("idx_calendar_events_created_at", "created_at"),
        Index("idx_calendar_events_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Date and time
    date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True)  # For multi-day events
    time = Column(Time, nullable=True)  # Time of day (HH:MM)
    
    # Event type
    type = Column(String(50), nullable=False, default='other', index=True)  # meeting, appointment, reminder, deadline, vacation, holiday, other
    
    # Location and attendees
    location = Column(String(500), nullable=True)
    attendees = Column(JSON, nullable=True)  # Array of attendee names/emails
    
    # Visual
    color = Column(String(7), nullable=True, default='#3B82F6')  # Hex color code
    
    # Ownership
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", backref="calendar_events", lazy="select")

    def __repr__(self) -> str:
        return f"<CalendarEvent(id={self.id}, title={self.title}, date={self.date}, type={self.type})>"
