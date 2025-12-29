"""
Leo Documentation Schemas
Pydantic schemas for Leo AI assistant documentation
"""

from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class DocumentationCategory(str, Enum):
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


class DocumentationPriority(str, Enum):
    """Priority for documentation inclusion order"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LeoDocumentationBase(BaseModel):
    """Base documentation schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Documentation title")
    content: str = Field(..., min_length=1, description="Documentation content (Markdown)")
    category: DocumentationCategory = Field(
        default=DocumentationCategory.GENERAL,
        description="Documentation category"
    )
    priority: DocumentationPriority = Field(
        default=DocumentationPriority.MEDIUM,
        description="Documentation priority"
    )
    is_active: bool = Field(default=True, description="Whether documentation is active")
    order: int = Field(default=0, ge=0, description="Order for manual sorting")


class LeoDocumentationCreate(LeoDocumentationBase):
    """Schema for creating documentation"""
    pass


class LeoDocumentationUpdate(BaseModel):
    """Schema for updating documentation"""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Documentation title")
    content: Optional[str] = Field(None, min_length=1, description="Documentation content (Markdown)")
    category: Optional[DocumentationCategory] = Field(None, description="Documentation category")
    priority: Optional[DocumentationPriority] = Field(None, description="Documentation priority")
    is_active: Optional[bool] = Field(None, description="Whether documentation is active")
    order: Optional[int] = Field(None, ge=0, description="Order for manual sorting")


class LeoDocumentation(LeoDocumentationBase):
    """Full documentation schema with metadata"""
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class LeoDocumentationListResponse(BaseModel):
    """Response schema for listing documentation"""
    items: list[LeoDocumentation]
    total: int
    skip: int
    limit: int
