"""
Leo Documentation API Endpoints
Endpoints for managing Leo AI assistant documentation
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.modules.leo.models.leo_documentation import LeoDocumentation, DocumentationCategory, DocumentationPriority
from app.models.user import User
from app.modules.leo.schemas.leo_documentation import (
    LeoDocumentationCreate,
    LeoDocumentationUpdate,
    LeoDocumentation as LeoDocumentationSchema,
    LeoDocumentationListResponse,
)
from app.dependencies import get_current_user, require_superadmin, get_db
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.logging import logger

router = APIRouter()


@router.get("/leo-documentation", response_model=LeoDocumentationListResponse, tags=["leo-documentation"])
async def list_leo_documentation(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    category: Optional[DocumentationCategory] = Query(None, description="Filter by category"),
    priority: Optional[DocumentationPriority] = Query(None, description="Filter by priority"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all Leo documentation entries"""
    # Only superadmins can list documentation
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can access Leo documentation"
        )
    
    query = select(LeoDocumentation).options(selectinload(LeoDocumentation.created_by))
    
    # Apply filters
    filters = []
    if category:
        filters.append(LeoDocumentation.category == category)
    if priority:
        filters.append(LeoDocumentation.priority == priority)
    if is_active is not None:
        filters.append(LeoDocumentation.is_active == is_active)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    count_query = select(func.count()).select_from(LeoDocumentation)
    if filters:
        count_query = count_query.where(and_(*filters))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply ordering: priority (critical first), then order, then created_at
    query = query.order_by(
        LeoDocumentation.priority.desc(),
        LeoDocumentation.order.asc(),
        LeoDocumentation.created_at.desc()
    )
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return LeoDocumentationListResponse(
        items=[LeoDocumentationSchema.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/leo-documentation/{doc_id}", response_model=LeoDocumentationSchema, tags=["leo-documentation"])
async def get_leo_documentation(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific Leo documentation entry"""
    # Only superadmins can view documentation
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can access Leo documentation"
        )
    
    query = select(LeoDocumentation).options(selectinload(LeoDocumentation.created_by)).where(LeoDocumentation.id == doc_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documentation entry {doc_id} not found"
        )
    
    return LeoDocumentationSchema.model_validate(doc)


@router.post("/leo-documentation", response_model=LeoDocumentationSchema, status_code=status.HTTP_201_CREATED, tags=["leo-documentation"])
async def create_leo_documentation(
    doc_data: LeoDocumentationCreate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new Leo documentation entry"""
    try:
        doc = LeoDocumentation(
            title=doc_data.title,
            content=doc_data.content,
            category=doc_data.category,
            priority=doc_data.priority,
            is_active=doc_data.is_active,
            order=doc_data.order,
            created_by_id=current_user.id,
        )
        
        db.add(doc)
        await db.commit()
        await db.refresh(doc, ["created_by"])
        
        # Log security event
        SecurityAuditLogger.log_event(
            user_id=current_user.id,
            event_type=SecurityEventType.ADMIN_ACTION,
            details=f"Created Leo documentation: {doc.title}",
            ip_address=None,
        )
        
        logger.info(f"Leo documentation created: {doc.id} by user {current_user.id}")
        
        return LeoDocumentationSchema.model_validate(doc)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating Leo documentation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create documentation: {str(e)}"
        )


@router.put("/leo-documentation/{doc_id}", response_model=LeoDocumentationSchema, tags=["leo-documentation"])
async def update_leo_documentation(
    doc_id: int,
    doc_data: LeoDocumentationUpdate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Update a Leo documentation entry"""
    query = select(LeoDocumentation).where(LeoDocumentation.id == doc_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documentation entry {doc_id} not found"
        )
    
    try:
        # Update fields
        update_data = doc_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(doc, field, value)
        
        await db.commit()
        await db.refresh(doc, ["created_by"])
        
        # Log security event
        SecurityAuditLogger.log_event(
            user_id=current_user.id,
            event_type=SecurityEventType.ADMIN_ACTION,
            details=f"Updated Leo documentation: {doc.title}",
            ip_address=None,
        )
        
        logger.info(f"Leo documentation updated: {doc.id} by user {current_user.id}")
        
        return LeoDocumentationSchema.model_validate(doc)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating Leo documentation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update documentation: {str(e)}"
        )


@router.delete("/leo-documentation/{doc_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["leo-documentation"])
async def delete_leo_documentation(
    doc_id: int,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a Leo documentation entry"""
    query = select(LeoDocumentation).where(LeoDocumentation.id == doc_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documentation entry {doc_id} not found"
        )
    
    try:
        title = doc.title
        await db.delete(doc)
        await db.commit()
        
        # Log security event
        SecurityAuditLogger.log_event(
            user_id=current_user.id,
            event_type=SecurityEventType.ADMIN_ACTION,
            details=f"Deleted Leo documentation: {title}",
            ip_address=None,
        )
        
        logger.info(f"Leo documentation deleted: {doc_id} by user {current_user.id}")
        
        return None
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting Leo documentation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete documentation: {str(e)}"
        )


@router.get("/leo-documentation/active/context", tags=["leo-documentation"])
async def get_active_documentation_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all active documentation formatted for Leo's context (public endpoint for Leo)"""
    query = select(LeoDocumentation).where(LeoDocumentation.is_active == True)
    query = query.order_by(
        LeoDocumentation.priority.desc(),
        LeoDocumentation.order.asc(),
        LeoDocumentation.created_at.desc()
    )
    
    result = await db.execute(query)
    docs = result.scalars().all()
    
    # Format documentation for context
    context_parts = []
    for doc in docs:
        context_parts.append(f"=== {doc.title} ({doc.category.value}) ===\n{doc.content}\n")
    
    return {
        "context": "\n\n".join(context_parts),
        "total_docs": len(docs),
        "categories": list(set([doc.category.value for doc in docs])),
    }
