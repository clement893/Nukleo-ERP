"""
Activity Feed API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from app.core.security_audit import SecurityAuditLog
from app.core.logging import logger

router = APIRouter()


class ActivityResponse(BaseModel):
    """Activity response model"""
    id: int
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    user_id: int
    timestamp: str
    event_metadata: Optional[dict] = None

    class Config:
        from_attributes = True


@router.get("/activities", response_model=List[ActivityResponse], tags=["activities"])
async def get_activities(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get activity feed with optional filters
    """
    try:
        query = select(SecurityAuditLog).order_by(desc(SecurityAuditLog.timestamp))
        
        # Apply filters
        filters = []
        if entity_type:
            # Filter by event_type, description, or event_metadata.entity_type
            from sqlalchemy import func, cast, String
            filters.append(
                (SecurityAuditLog.event_type.ilike(f'%{entity_type}%')) |
                (SecurityAuditLog.description.ilike(f'%{entity_type}%')) |
                (cast(SecurityAuditLog.event_metadata, String).ilike(f'%"entity_type"%{entity_type}%'))
            )
        if entity_id:
            # Also filter by entity_id in event_metadata
            from sqlalchemy import func, cast, String
            entity_id_str = str(entity_id)
            filters.append(
                (cast(SecurityAuditLog.event_metadata, String).ilike(f'%"entity_id"%{entity_id_str}%'))
            )
        if user_id:
            filters.append(SecurityAuditLog.user_id == user_id)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        result = await db.execute(query)
        activities = result.scalars().all()
        
        # Filter activities by entity_type and entity_id from event_metadata if provided
        filtered_activities = []
        for activity in activities:
            # Extract entity_type and entity_id from event_metadata if available
            metadata = activity.event_metadata or {}
            activity_entity_type = metadata.get('entity_type') if isinstance(metadata, dict) else None
            activity_entity_id = metadata.get('entity_id') if isinstance(metadata, dict) else None
            
            # If entity_type filter is provided, check if it matches
            if entity_type:
                # Check event_metadata.entity_type first, then fallback to description/event_type
                if activity_entity_type and activity_entity_type.lower() != entity_type.lower():
                    continue
                elif not activity_entity_type:
                    # Fallback: check if description or event_type contains entity_type
                    desc_match = activity.description and entity_type.lower() in activity.description.lower()
                    event_match = activity.event_type and entity_type.lower() in activity.event_type.lower()
                    if not (desc_match or event_match):
                        continue
            
            # If entity_id filter is provided, check if it matches
            if entity_id:
                # Check event_metadata.entity_id first
                if activity_entity_id and str(activity_entity_id) != str(entity_id):
                    continue
                elif not activity_entity_id:
                    # If no entity_id in metadata, skip if entity_id filter is provided
                    continue
            
            filtered_activities.append(activity)
        
        return [
            ActivityResponse(
                id=activity.id,
                action=activity.event_type or activity.description or 'unknown',
                entity_type=(
                    (activity.event_metadata or {}).get('entity_type') if isinstance(activity.event_metadata, dict)
                    else entity_type or 'system'
                ),
                entity_id=(
                    str((activity.event_metadata or {}).get('entity_id')) if isinstance(activity.event_metadata, dict) and (activity.event_metadata or {}).get('entity_id')
                    else (str(entity_id) if entity_id else None)
                ),
                user_id=activity.user_id or 0,
                timestamp=activity.timestamp.isoformat() if activity.timestamp else '',
                event_metadata=activity.event_metadata
            )
            for activity in filtered_activities
        ]
    except Exception as e:
        logger.error(f"Failed to fetch activities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch activities: {str(e)}"
        )


@router.get("/activities/timeline", response_model=List[ActivityResponse], tags=["activities"])
async def get_activity_timeline(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get activity timeline (more results for timeline view)
    """
    return await get_activities(
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=0,
        current_user=current_user,
        db=db
    )

