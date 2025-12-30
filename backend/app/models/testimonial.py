"""
Testimonial Model
SQLAlchemy model for client testimonials
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Text, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Testimonial(Base):
    """Testimonial model for network module"""
    __tablename__ = "testimonials"
    __table_args__ = (
        Index("idx_testimonials_company_id", "company_id"),
        Index("idx_testimonials_contact_id", "contact_id"),
        Index("idx_testimonials_created_at", "created_at"),
        Index("idx_testimonials_updated_at", "updated_at"),
        Index("idx_testimonials_language", "language"),
    )

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=True)  # Titre du témoignage
    testimonial_fr = Column(Text, nullable=True)  # Témoignage en français
    testimonial_en = Column(Text, nullable=True)  # Témoignage en anglais
    logo_url = Column(String(1000), nullable=True)  # S3 URL du logo de l'entreprise
    logo_filename = Column(String(500), nullable=True)  # Filename for logo matching during import
    language = Column(String(10), nullable=True, index=True)  # fr, en, etc.
    is_published = Column(String(20), default="draft", nullable=False)  # draft, published
    rating = Column(Integer, nullable=True)  # Note sur 5 (optionnel)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    contact = relationship("Contact", backref="testimonials", lazy="select")
    company = relationship("Company", backref="testimonials", lazy="select")

    def __repr__(self) -> str:
        return f"<Testimonial(id={self.id}, contact_id={self.contact_id}, company_id={self.company_id})>"
