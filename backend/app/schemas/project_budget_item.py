"""
Project Budget Item Schemas
Pydantic v2 models for project budget items
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict, field_validator, computed_field


class BudgetCategory(str, Enum):
    """Budget category enum"""
    MAIN_DOEUVRE = "main_doeuvre"  # Main-d'œuvre
    MATERIEL = "materiel"  # Matériel
    SERVICES = "services"  # Services
    FRAIS_GENERAUX = "frais_generaux"  # Frais généraux
    AUTRES = "autres"  # Autres


class ProjectBudgetItemBase(BaseModel):
    """Base project budget item schema"""
    category: BudgetCategory = Field(..., description="Budget category")
    description: Optional[str] = Field(None, max_length=5000, description="Item description")
    amount: Decimal = Field(..., ge=0, description="Total amount for this line")
    quantity: Optional[Decimal] = Field(None, ge=0, description="Optional quantity")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Optional unit price")
    notes: Optional[str] = Field(None, max_length=5000, description="Additional notes")
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate description"""
        if v is not None:
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Description cannot exceed 5000 characters')
            return cleaned
        return v
    
    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        """Validate notes"""
        if v is not None:
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Notes cannot exceed 5000 characters')
            return cleaned
        return v


class ProjectBudgetItemCreate(ProjectBudgetItemBase):
    """Project budget item creation schema"""
    pass


class ProjectBudgetItemUpdate(BaseModel):
    """Project budget item update schema"""
    category: Optional[BudgetCategory] = Field(None, description="Budget category")
    description: Optional[str] = Field(None, max_length=5000, description="Item description")
    amount: Optional[Decimal] = Field(None, ge=0, description="Total amount for this line")
    quantity: Optional[Decimal] = Field(None, ge=0, description="Optional quantity")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Optional unit price")
    notes: Optional[str] = Field(None, max_length=5000, description="Additional notes")
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate description"""
        if v is not None:
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Description cannot exceed 5000 characters')
            return cleaned
        return v
    
    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        """Validate notes"""
        if v is not None:
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Notes cannot exceed 5000 characters')
            return cleaned
        return v


class ProjectBudgetItem(ProjectBudgetItemBase):
    """Project budget item response schema"""
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectBudgetItemInDB(ProjectBudgetItem):
    """Project budget item in database schema"""
    pass


class ProjectBudgetSummary(BaseModel):
    """Project budget summary schema"""
    total_budget: Decimal = Field(..., description="Total budget (sum of all items)")
    items_count: int = Field(..., description="Number of budget items")
    by_category: dict[str, Decimal] = Field(..., description="Budget by category")
    
    model_config = ConfigDict(from_attributes=True)
