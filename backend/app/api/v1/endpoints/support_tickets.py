"""
Support Tickets API Endpoints
Customer support tickets management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.support_ticket import SupportTicket, TicketMessage, TicketStatus, TicketPriority
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger

router = APIRouter()


class TicketMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)


class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    message: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    is_staff: bool
    created_at: str

    class Config:
        from_attributes = True


class SupportTicketCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., pattern='^(technical|billing|feature|general|bug)$')
    priority: str = Field(default='medium', pattern='^(low|medium|high|urgent)$')
    message: str = Field(..., min_length=1)


class SupportTicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, pattern='^(technical|billing|feature|general|bug)$')
    status: Optional[str] = Field(None, pattern='^(open|in_progress|resolved|closed)$')
    priority: Optional[str] = Field(None, pattern='^(low|medium|high|urgent)$')


class SupportTicketResponse(BaseModel):
    id: int
    subject: str
    category: str
    status: str
    priority: str
    user_id: int
    created_at: str
    updated_at: str
    last_reply_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/support/tickets", response_model=List[SupportTicketResponse], tags=["support"])
async def list_tickets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List support tickets"""
    query = select(SupportTicket).where(SupportTicket.user_id == current_user.id)
    
    if status:
        query = query.where(SupportTicket.status == status)
    if category:
        query = query.where(SupportTicket.category == category)
    
    result = await db.execute(query.order_by(SupportTicket.created_at.desc()))
    tickets = result.scalars().all()
    return [SupportTicketResponse.model_validate(ticket) for ticket in tickets]


@router.get("/support/tickets/{ticket_id}", response_model=SupportTicketResponse, tags=["support"])
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a ticket by ID"""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    return SupportTicketResponse.model_validate(ticket)


@router.get("/support/tickets/{ticket_id}/messages", response_model=List[TicketMessageResponse], tags=["support"])
async def get_ticket_messages(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a ticket"""
    # Verify ticket exists and user has access
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    if ticket.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    result = await db.execute(
        select(TicketMessage)
        .where(TicketMessage.ticket_id == ticket_id)
        .order_by(TicketMessage.created_at.asc())
    )
    messages = result.scalars().all()
    
    responses = []
    for msg in messages:
        response = TicketMessageResponse.model_validate(msg)
        if msg.user:
            response.user_name = msg.user.full_name or msg.user.email
            response.user_email = msg.user.email
        responses.append(response)
    
    return responses


@router.post("/support/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED, tags=["support"])
async def create_ticket(
    ticket_data: SupportTicketCreate,
    request: Optional[object] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new support ticket"""
    ticket = SupportTicket(
        subject=ticket_data.subject,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status=TicketStatus.OPEN.value,
        user_id=current_user.id,
    )
    
    db.add(ticket)
    await db.flush()  # Get ticket ID
    
    # Create initial message
    message = TicketMessage(
        ticket_id=ticket.id,
        message=ticket_data.message,
        user_id=current_user.id,
        is_staff=False,
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(ticket)
    
    SecurityAuditLogger.log_event(
        user_id=current_user.id,
        event_type="support_ticket_created",
        severity="info",
        message=f"Support ticket '{ticket.subject}' created",
    )
    
    return SupportTicketResponse.model_validate(ticket)


@router.post("/support/tickets/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=status.HTTP_201_CREATED, tags=["support"])
async def add_ticket_message(
    ticket_id: int,
    message_data: TicketMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a message to a ticket"""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add messages to this ticket"
        )
    
    message = TicketMessage(
        ticket_id=ticket_id,
        message=message_data.message,
        user_id=current_user.id,
        is_staff=current_user.is_superadmin or current_user.is_admin,
    )
    
    # Update ticket last_reply_at
    from datetime import datetime
    ticket.last_reply_at = datetime.utcnow()
    if ticket.status == TicketStatus.RESOLVED.value:
        ticket.status = TicketStatus.IN_PROGRESS.value
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    response = TicketMessageResponse.model_validate(message)
    if message.user:
        response.user_name = message.user.full_name or message.user.email
        response.user_email = message.user.email
    
    return response


@router.put("/support/tickets/{ticket_id}", response_model=SupportTicketResponse, tags=["support"])
async def update_ticket(
    ticket_id: int,
    ticket_data: SupportTicketUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a ticket"""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this ticket"
        )
    
    if ticket_data.subject is not None:
        ticket.subject = ticket_data.subject
    if ticket_data.category is not None:
        ticket.category = ticket_data.category
    if ticket_data.status is not None:
        ticket.status = ticket_data.status
    if ticket_data.priority is not None:
        ticket.priority = ticket_data.priority
    
    await db.commit()
    await db.refresh(ticket)
    
    return SupportTicketResponse.model_validate(ticket)

