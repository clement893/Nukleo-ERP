"""
Project Schemas
Pydantic v2 models for project management
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class ProjectStatus(str, Enum):
    """Project status enum"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Project name", strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=5000, description="Project description")
    status: ProjectStatus = Field(default=ProjectStatus.ACTIVE, description="Project status")
    client_id: Optional[int] = Field(None, description="Client (company) ID")
    client_name: Optional[str] = Field(None, max_length=255, description="Client name (will be matched to existing company if client_id not provided)")
    responsable_id: Optional[int] = Field(None, description="Responsable (employee) ID")
    
    # Extended fields
    equipe: Optional[str] = Field(None, max_length=50, description="Team number")
    etape: Optional[str] = Field(None, max_length=100, description="Project stage")
    annee_realisation: Optional[str] = Field(None, max_length=50, description="Year of realization")
    contact: Optional[str] = Field(None, max_length=255, description="Contact name")
    budget: Optional[Decimal] = Field(None, description="Project budget")
    proposal_url: Optional[str] = Field(None, max_length=500, description="Proposal link")
    drive_url: Optional[str] = Field(None, max_length=500, description="Drive link")
    slack_url: Optional[str] = Field(None, max_length=500, description="Slack link")
    echeancier_url: Optional[str] = Field(None, max_length=500, description="Schedule link")
    temoignage_status: Optional[str] = Field(None, max_length=50, description="Testimonial status")
    portfolio_status: Optional[str] = Field(None, max_length=50, description="Portfolio status")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate project name"""
        if not v or not v.strip():
            raise ValueError('Project name cannot be empty')
        # Remove extra whitespace
        return v.strip()
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate project description"""
        if v is not None:
            # Remove extra whitespace
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Project description cannot exceed 5000 characters')
            return cleaned
        return v


class ProjectCreate(ProjectBase):
    """Project creation schema"""
    pass


class ProjectUpdate(BaseModel):
    """Project update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Project name", strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=5000, description="Project description")
    status: Optional[ProjectStatus] = Field(None, description="Project status")
    client_id: Optional[int] = Field(None, description="Client (company) ID")
    client_name: Optional[str] = Field(None, max_length=255, description="Client name (will be matched to existing company if client_id not provided)")
    responsable_id: Optional[int] = Field(None, description="Responsable (employee) ID")
    
    # Extended fields
    equipe: Optional[str] = Field(None, max_length=50, description="Team number")
    etape: Optional[str] = Field(None, max_length=100, description="Project stage")
    annee_realisation: Optional[str] = Field(None, max_length=50, description="Year of realization")
    contact: Optional[str] = Field(None, max_length=255, description="Contact name")
    budget: Optional[Decimal] = Field(None, description="Project budget")
    proposal_url: Optional[str] = Field(None, max_length=500, description="Proposal link")
    drive_url: Optional[str] = Field(None, max_length=500, description="Drive link")
    slack_url: Optional[str] = Field(None, max_length=500, description="Slack link")
    echeancier_url: Optional[str] = Field(None, max_length=500, description="Schedule link")
    temoignage_status: Optional[str] = Field(None, max_length=50, description="Testimonial status")
    portfolio_status: Optional[str] = Field(None, max_length=50, description="Portfolio status")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate project name"""
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError('Project name cannot be empty')
            return cleaned
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate project description"""
        if v is not None:
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Project description cannot exceed 5000 characters')
            return cleaned
        return v


class Project(ProjectBase):
    """Project response schema"""
    id: int
    user_id: int
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    responsable_id: Optional[int] = None
    responsable_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectInDB(Project):
    """Project in database schema"""
    pass

