"""
Pipeline Model
Modèle pour les pipelines commerciaux
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4
import enum

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Numeric, Date, Index, func, Table
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class OpportunityStatus(str, enum.Enum):
    """Statuts possibles d'une opportunité"""
    OPEN = "open"  # Ouverte
    QUALIFIED = "qualified"  # Qualifiée
    PROPOSAL = "proposal"  # Proposition
    NEGOTIATION = "negotiation"  # Négociation
    WON = "won"  # Gagnée
    LOST = "lost"  # Perdue
    CANCELLED = "cancelled"  # Annulée


class Pipeline(Base):
    """Modèle Pipeline pour la gestion des pipelines commerciaux"""
    __tablename__ = "pipelines"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    is_default: bool = Column(Boolean, default=False, nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    
    # Relations
    created_by_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True)
    
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


# Table de liaison pour les contacts liés à une opportunité (many-to-many)
opportunity_contacts = Table(
    'opportunity_contacts',
    Base.metadata,
    Column('opportunity_id', PG_UUID(as_uuid=True), ForeignKey('opportunites.id', ondelete='CASCADE'), primary_key=True),
    Column('contact_id', Integer, ForeignKey('contacts.id', ondelete='CASCADE'), primary_key=True),
    Index('idx_opportunity_contacts_opportunity', 'opportunity_id'),
    Index('idx_opportunity_contacts_contact', 'contact_id'),
)


class Opportunite(Base):
    """Modèle Opportunite pour les opportunités commerciales"""
    __tablename__ = "opportunites"
    __table_args__ = (
        Index("idx_opportunites_pipeline_id", "pipeline_id"),
        Index("idx_opportunites_stage_id", "stage_id"),
        Index("idx_opportunites_company_id", "company_id"),
        Index("idx_opportunites_status", "status"),
        Index("idx_opportunites_assigned_to_id", "assigned_to_id"),
        Index("idx_opportunites_created_at", "created_at"),
        Index("idx_opportunites_closed_at", "closed_at"),
    )

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: str = Column(String(255), nullable=False, index=True)
    description: Optional[str] = Column(Text, nullable=True)
    amount: Optional[float] = Column(Numeric(15, 2), nullable=True)
    probability: Optional[int] = Column(Integer, nullable=True)  # Percentage 0-100
    expected_close_date: Optional[datetime] = Column(DateTime, nullable=True)
    status: Optional[str] = Column(String(50), nullable=True, index=True)  # OpportunityStatus enum value
    
    # Informations supplémentaires
    segment: Optional[str] = Column(String(100), nullable=True)  # Segment de marché
    region: Optional[str] = Column(String(100), nullable=True)  # Région
    service_offer_link: Optional[str] = Column(String(1000), nullable=True)  # Lien vers l'offre de service
    notes: Optional[str] = Column(Text, nullable=True)  # Notes additionnelles
    
    # Relations
    pipeline_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id: Optional[Integer] = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to_id: Optional[int] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id: Optional[int] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Dates
    opened_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True)  # Date d'ouverture
    closed_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True, index=True)  # Date de fermeture
    
    # Timestamps
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at: datetime = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    pipeline = relationship("Pipeline", back_populates="opportunities")
    stage = relationship("PipelineStage", back_populates="opportunities")
    company = relationship("Company", backref="opportunities", lazy="select")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_opportunities", lazy="select")
    created_by = relationship("User", foreign_keys=[created_by_id], backref="created_opportunities", lazy="select")
    
    # Many-to-many relationship with contacts
    contacts = relationship(
        "Contact",
        secondary=opportunity_contacts,
        backref="opportunities",
        lazy="select"
    )

    def __repr__(self):
        return f"<Opportunite {self.name}>"
