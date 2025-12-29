"""
Pipeline Model
Modèle pour les pipelines commerciaux
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Pipeline(Base):
    """Modèle Pipeline pour la gestion des pipelines commerciaux"""
    __tablename__ = "pipelines"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    is_default: bool = Column(Boolean, default=False, nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    
    # Relations
    created_by_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    stages = relationship("PipelineStage", back_populates="pipeline", cascade="all, delete-orphan", order_by="PipelineStage.order")
    opportunities = relationship("Opportunite", back_populates="pipeline")

    def __repr__(self):
        return f"<Pipeline {self.name}>"


class PipelineStage(Base):
    """Modèle PipelineStage pour les étapes d'un pipeline"""
    __tablename__ = "pipeline_stages"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    color: Optional[str] = Column(String(7), nullable=True)  # Hex color code
    order: int = Column(Integer, nullable=False, default=0)
    
    # Relations
    pipeline_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    pipeline = relationship("Pipeline", back_populates="stages")
    opportunities = relationship("Opportunite", back_populates="stage")

    def __repr__(self):
        return f"<PipelineStage {self.name} (Pipeline: {self.pipeline_id})>"


class Opportunite(Base):
    """Modèle Opportunite pour les opportunités commerciales"""
    __tablename__ = "opportunites"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    amount: Optional[float] = Column(Numeric(15, 2), nullable=True)
    probability: Optional[int] = Column(Integer, nullable=True)  # Percentage 0-100
    expected_close_date: Optional[datetime] = Column(DateTime, nullable=True)
    
    # Relations
    pipeline_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    stage_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True)
    contact_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    company_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    assigned_to_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    pipeline = relationship("Pipeline", back_populates="opportunities")
    stage = relationship("PipelineStage", back_populates="opportunities")

    def __repr__(self):
        return f"<Opportunite {self.name}>"
