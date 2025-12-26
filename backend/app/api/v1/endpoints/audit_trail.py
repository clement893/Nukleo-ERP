"""
Audit Trail API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from datetime import datetime

from app.models.user import User
from app.core.security_audit import SecurityAuditLog
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class AuditLogResponse(BaseModel):
    id: int
    timestamp: str
    event_type: str
    severity: str
    user_id: Optional[int]
    user_email: Optional[str]
    api_key_id: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    request_method: Optional[str]
    request_path: Optional[str]
    description: str
    event_metadata: Optional[dict]
    success: str

    class Config:
        from_attributes = True


@router.get("/audit-trail", response_model=List[AuditLogResponse], tags=["audit-trail"])
async def get_audit_trail(
    user_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit trail logs"""
    # TODO: Check if user is admin or has permission to view audit logs
    
    query = select(SecurityAuditLog)
    
    # Filter by user (if not admin, only show own logs)
    # TODO: Implement admin check
    if user_id:
        query = query.where(SecurityAuditLog.user_id == user_id)
    else:
        # For now, users can only see their own logs
        query = query.where(SecurityAuditLog.user_id == current_user.id)
    
    if event_type:
        query = query.where(SecurityAuditLog.event_type == event_type)
    
    if severity:
        query = query.where(SecurityAuditLog.severity == severity)
    
    if start_date:
        query = query.where(SecurityAuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.where(SecurityAuditLog.timestamp <= end_date)
    
    result = await db.execute(
        query.order_by(desc(SecurityAuditLog.timestamp))
        .limit(limit)
        .offset(offset)
    )
    
    logs = result.scalars().all()
    return [AuditLogResponse.model_validate(log) for log in logs]


@router.get("/audit-trail/stats", tags=["audit-trail"])
async def get_audit_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit trail statistics"""
    from sqlalchemy import func
    
    query = select(SecurityAuditLog).where(SecurityAuditLog.user_id == current_user.id)
    
    if start_date:
        query = query.where(SecurityAuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.where(SecurityAuditLog.timestamp <= end_date)
    
    # Count by event type
    event_type_result = await db.execute(
        select(
            SecurityAuditLog.event_type,
            func.count(SecurityAuditLog.id).label('count')
        ).where(
            SecurityAuditLog.user_id == current_user.id
        ).group_by(SecurityAuditLog.event_type)
    )
    event_type_counts = {row[0]: row[1] for row in event_type_result.all()}
    
    # Count by severity
    severity_result = await db.execute(
        select(
            SecurityAuditLog.severity,
            func.count(SecurityAuditLog.id).label('count')
        ).where(
            SecurityAuditLog.user_id == current_user.id
        ).group_by(SecurityAuditLog.severity)
    )
    severity_counts = {row[0]: row[1] for row in severity_result.all()}
    
    return {
        'event_type_counts': event_type_counts,
        'severity_counts': severity_counts,
    }



