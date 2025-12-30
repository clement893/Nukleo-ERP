"""
Testimonial Schemas
Pydantic v2 models for testimonials
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class TestimonialBase(BaseModel):
    """Base testimonial schema"""
    contact_id: Optional[int] = Field(None, description="Contact ID")
    company_id: Optional[int] = Field(None, description="Company ID")
    title: Optional[str] = Field(None, max_length=255, description="Testimonial title")
    testimonial_fr: Optional[str] = Field(None, description="Testimonial in French")
    testimonial_en: Optional[str] = Field(None, description="Testimonial in English")
    logo_url: Optional[str] = Field(None, max_length=1000, description="Company logo URL (S3)")
    logo_filename: Optional[str] = Field(None, max_length=500, description="Filename for logo matching during import")
    language: Optional[str] = Field(None, max_length=10, description="Language code")
    is_published: Optional[str] = Field(default="draft", max_length=20, description="Publication status")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1 to 5")


class TestimonialCreate(TestimonialBase):
    """Testimonial creation schema"""
    contact_name: Optional[str] = Field(None, max_length=255, description="Contact name (will be matched to existing contact if contact_id not provided)")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name (will be matched to existing company if company_id not provided)")


class TestimonialUpdate(BaseModel):
    """Testimonial update schema"""
    contact_id: Optional[int] = Field(None, description="Contact ID")
    company_id: Optional[int] = Field(None, description="Company ID")
    title: Optional[str] = Field(None, max_length=255, description="Testimonial title")
    testimonial_fr: Optional[str] = Field(None, description="Testimonial in French")
    testimonial_en: Optional[str] = Field(None, description="Testimonial in English")
    logo_url: Optional[str] = Field(None, max_length=1000, description="Company logo URL (S3)")
    logo_filename: Optional[str] = Field(None, max_length=500, description="Filename for logo matching during import")
    language: Optional[str] = Field(None, max_length=10, description="Language code")
    is_published: Optional[str] = Field(None, max_length=20, description="Publication status")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1 to 5")
    contact_name: Optional[str] = Field(None, max_length=255, description="Contact name")
    company_name: Optional[str] = Field(None, max_length=255, description="Company name")


class Testimonial(TestimonialBase):
    """Testimonial response schema"""
    id: int
    contact_name: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TestimonialInDB(Testimonial):
    """Testimonial in database schema"""
    pass
