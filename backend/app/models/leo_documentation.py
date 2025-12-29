"""
Leo Documentation Model
SQLAlchemy model for Leo AI assistant documentation
"""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class DocumentationCategory(PyEnum):
    """Categories for organizing Leo documentation"""
    GENERAL = "general"
    ERP_FEATURES = "erp_features"
    PROJECTS = "projects"
    COMMERCIAL = "commercial"
    TEAMS = "teams"
    CLIENTS = "clients"
    PROCEDURES = "procedures"
    POLICIES = "policies"
    CUSTOM = "custom"


class DocumentationPriority(PyEnum):
    """Priority for documentation inclusion order"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LeoDocumentation(Base):
    """Leo AI assistant documentation model"""
    __tablename__ = "leo_documentation"
    __table_args__ = (
        Index("idx_leo_doc_category", "category"),
        Index("idx_leo_doc_priority", "priority"),
        Index("idx_leo_doc_is_active", "is_active"),
        Index("idx_leo_doc_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)  # Markdown content
    category = Column(
        Enum(DocumentationCategory, native_enum=False),
        default=DocumentationCategory.GENERAL,
        nullable=False,
        index=True
    )
    priority = Column(
        Enum(DocumentationPriority, native_enum=False),
        default=DocumentationPriority.MEDIUM,
        nullable=False,
        index=True
    )
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    order = Column(Integer, default=0, nullable=False)  # For manual ordering within category
    
    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self):
        return f"<LeoDocumentation(id={self.id}, title='{self.title}', category={self.category.value})>"
