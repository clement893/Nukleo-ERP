"""
Leo Conversation Models
SQLAlchemy models for Leo AI assistant conversations and messages
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LeoConversation(Base):
    """Leo AI assistant conversation model"""
    __tablename__ = "leo_conversations"
    __table_args__ = (
        Index("idx_leo_conv_user_id", "user_id"),
        Index("idx_leo_conv_created_at", "created_at"),
        Index("idx_leo_conv_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    messages = relationship("LeoMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="LeoMessage.created_at")

    def __repr__(self):
        return f"<LeoConversation(id={self.id}, user_id={self.user_id}, title='{self.title}')>"


class LeoMessage(Base):
    """Leo AI assistant message model"""
    __tablename__ = "leo_messages"
    __table_args__ = (
        Index("idx_leo_msg_conv_id", "conversation_id"),
        Index("idx_leo_msg_created_at", "created_at"),
        Index("idx_leo_msg_role", "role"),
    )

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("leo_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False, index=True)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    message_metadata = Column("metadata", JSON, nullable=True)  # Additional data (provider, tokens, usage, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    conversation = relationship("LeoConversation", back_populates="messages")

    def __repr__(self):
        return f"<LeoMessage(id={self.id}, conversation_id={self.conversation_id}, role='{self.role}')>"
