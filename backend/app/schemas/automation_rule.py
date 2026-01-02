"""
Automation Rule Schemas
Pydantic schemas for automation rules
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AutomationRuleBase(BaseModel):
    """Base schema for AutomationRule"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    enabled: bool = Field(default=True)
    trigger_event: str = Field(..., min_length=1, max_length=100)
    trigger_conditions: Optional[Dict[str, Any]] = None
    actions: List[Dict[str, Any]] = Field(..., min_items=1)


class AutomationRuleCreate(AutomationRuleBase):
    """Schema for creating an automation rule"""
    pass


class AutomationRuleUpdate(BaseModel):
    """Schema for updating an automation rule"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    enabled: Optional[bool] = None
    trigger_event: Optional[str] = Field(None, min_length=1, max_length=100)
    trigger_conditions: Optional[Dict[str, Any]] = None
    actions: Optional[List[Dict[str, Any]]] = Field(None, min_items=1)


class AutomationRuleResponse(AutomationRuleBase):
    """Schema for automation rule response"""
    id: int
    trigger_count: int
    last_triggered_at: Optional[datetime] = None
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AutomationRuleExecutionLogResponse(BaseModel):
    """Schema for automation rule execution log response"""
    id: int
    rule_id: int
    executed_at: datetime
    success: bool
    error_message: Optional[str] = None
    execution_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
