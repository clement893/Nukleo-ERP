"""
Pipeline Schemas
Schemas Pydantic pour les pipelines et opportunités
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel, Field


class PipelineStageBase(BaseModel):
    """Schema de base pour PipelineStage"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7, pattern="^#[0-9A-Fa-f]{6}$")
    order: int = Field(default=0, ge=0)


class PipelineStageCreate(PipelineStageBase):
    """Schema pour création de PipelineStage"""
    pass


class PipelineStageUpdate(BaseModel):
    """Schema pour mise à jour de PipelineStage"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7, pattern="^#[0-9A-Fa-f]{6}$")
    order: Optional[int] = Field(None, ge=0)


class PipelineStageResponse(PipelineStageBase):
    """Schema pour réponse PipelineStage"""
    id: UUID
    pipeline_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PipelineBase(BaseModel):
    """Schema de base pour Pipeline"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_default: bool = False
    is_active: bool = True


class PipelineCreate(PipelineBase):
    """Schema pour création de Pipeline"""
    stages: Optional[List[PipelineStageCreate]] = []


class PipelineUpdate(BaseModel):
    """Schema pour mise à jour de Pipeline"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class PipelineResponse(PipelineBase):
    """Schema pour réponse Pipeline"""
    id: UUID
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    stages: List[PipelineStageResponse] = []
    opportunity_count: Optional[int] = Field(None, description="Number of opportunities in this pipeline")

    class Config:
        from_attributes = True


class OpportuniteBase(BaseModel):
    """Schema de base pour Opportunite"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[datetime] = None


class OpportuniteCreate(OpportuniteBase):
    """Schema pour création de Opportunite"""
    pipeline_id: UUID
    stage_id: Optional[UUID] = None
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class OpportuniteUpdate(BaseModel):
    """Schema pour mise à jour de Opportunite"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    pipeline_id: Optional[UUID] = None
    stage_id: Optional[UUID] = None
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class OpportuniteResponse(OpportuniteBase):
    """Schema pour réponse Opportunite"""
    id: UUID
    pipeline_id: UUID
    stage_id: Optional[UUID] = None
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
