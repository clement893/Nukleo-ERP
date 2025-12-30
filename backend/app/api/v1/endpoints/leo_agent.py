"""
Leo Agent API Endpoints
Endpoints for managing Leo AI assistant conversations and messages
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.leo import (
    LeoConversation,
    LeoConversationListResponse,
    LeoMessage,
    LeoMessageListResponse,
)
from app.dependencies import get_current_user, get_db
from app.services.leo_agent_service import LeoAgentService

router = APIRouter(prefix="/ai/leo", tags=["leo-agent"])


@router.get("/conversations", response_model=LeoConversationListResponse)
async def get_conversations(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get conversations for the current user
    
    Returns a paginated list of conversations ordered by most recently updated.
    """
    leo_service = LeoAgentService(db)
    conversations, total = await leo_service.get_user_conversations(
        user_id=current_user.id,
        limit=limit,
        skip=skip
    )
    
    return LeoConversationListResponse(
        items=[LeoConversation.model_validate(conv) for conv in conversations],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/conversations/{conversation_id}", response_model=LeoConversation)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific conversation
    
    Only returns the conversation if it belongs to the current user.
    """
    leo_service = LeoAgentService(db)
    conversation = await leo_service.get_conversation(conversation_id, current_user.id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return LeoConversation.model_validate(conversation)


@router.get("/conversations/{conversation_id}/messages", response_model=LeoMessageListResponse)
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all messages for a conversation
    
    Only returns messages if the conversation belongs to the current user.
    """
    leo_service = LeoAgentService(db)
    
    # Verify conversation belongs to user
    conversation = await leo_service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    messages = await leo_service.get_conversation_messages(conversation_id)
    
    return LeoMessageListResponse(
        items=[LeoMessage.model_validate(msg) for msg in messages],
        total=len(messages),
        conversation_id=conversation_id
    )
