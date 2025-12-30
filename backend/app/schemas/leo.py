"""
Leo Conversation Schemas
Pydantic schemas for Leo AI assistant conversations and messages
"""

from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, ConfigDict


class LeoConversationBase(BaseModel):
    """Base conversation schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Conversation title")


class LeoConversationCreate(BaseModel):
    """Schema for creating a conversation"""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Conversation title (auto-generated if not provided)")


class LeoConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Conversation title")


class LeoConversation(LeoConversationBase):
    """Full conversation schema with metadata"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class LeoMessageBase(BaseModel):
    """Base message schema"""
    role: str = Field(..., pattern="^(user|assistant)$", description="Message role")
    content: str = Field(..., min_length=1, description="Message content")


class LeoMessageCreate(BaseModel):
    """Schema for creating a message"""
    role: str = Field(..., pattern="^(user|assistant)$", description="Message role")
    content: str = Field(..., min_length=1, description="Message content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata (provider, tokens, etc.)")


class LeoMessage(LeoMessageBase):
    """Full message schema with metadata"""
    id: int
    conversation_id: int
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class LeoConversationListResponse(BaseModel):
    """Response schema for listing conversations"""
    items: List[LeoConversation]
    total: int
    skip: int
    limit: int


class LeoMessageListResponse(BaseModel):
    """Response schema for listing messages"""
    items: List[LeoMessage]
    total: int
    conversation_id: int


class LeoQueryRequest(BaseModel):
    """Request schema for Leo query"""
    message: str = Field(..., min_length=1, description="User message")
    conversation_id: Optional[int] = Field(None, description="Conversation ID (if continuing existing conversation)")
    provider: str = Field(default="auto", description="AI provider to use (auto, openai, anthropic)")


class LeoQueryResponse(BaseModel):
    """Response schema for Leo query"""
    content: str = Field(..., description="AI response content")
    conversation_id: int = Field(..., description="Conversation ID")
    message_id: int = Field(..., description="Message ID")
    provider: str = Field(..., description="AI provider used")
    model: Optional[str] = Field(None, description="Model used")
    usage: Optional[Dict[str, int]] = Field(None, description="Token usage information")
