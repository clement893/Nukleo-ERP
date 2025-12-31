"""
Employee Portal Permission Schemas
Pydantic v2 models for employee portal permissions
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


class EmployeePortalPermissionBase(BaseModel):
    """Base schema for employee portal permissions"""
    user_id: Optional[int] = Field(None, description="User ID (if permission is for a user)")
    employee_id: Optional[int] = Field(None, description="Employee ID (if permission is for an employee)")
    permission_type: str = Field(..., description="Type: 'page', 'module', 'project', 'client'")
    resource_id: str = Field(default="*", description="Resource identifier (* for all)")
    permission_metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata", description="Additional metadata")
    can_view: bool = Field(default=True, description="Can view this resource")
    can_edit: bool = Field(default=False, description="Can edit this resource")
    can_delete: bool = Field(default=False, description="Can delete this resource")
    description: Optional[str] = Field(None, description="Description/notes")

    @field_validator('permission_type')
    @classmethod
    def validate_permission_type(cls, v: str) -> str:
        allowed_types = ['page', 'module', 'project', 'client']
        if v not in allowed_types:
            raise ValueError(f"permission_type must be one of {allowed_types}")
        return v

    @field_validator('permission_metadata', mode='before')
    @classmethod
    def validate_metadata(cls, v: Any) -> Optional[Dict[str, Any]]:
        """Convert metadata to dict if it's not already"""
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        # If it's a SQLAlchemy MetaData object or other non-dict, return None
        # We don't want to serialize SQLAlchemy internals
        if hasattr(v, '__class__') and 'MetaData' in str(type(v)):
            return None
        # Try to convert to dict if possible
        if hasattr(v, '__dict__'):
            return v.__dict__
        return None

    @field_validator('user_id', 'employee_id', mode='before')
    @classmethod
    def validate_at_least_one(cls, v: Optional[int], info) -> Optional[int]:
        return v

    @model_validator(mode='after')
    def validate_at_least_one_set(self):
        if not self.user_id and not self.employee_id:
            raise ValueError("Either user_id or employee_id must be set")
        return self


class EmployeePortalPermissionCreate(EmployeePortalPermissionBase):
    """Schema for creating an employee portal permission"""
    pass


class EmployeePortalPermissionUpdate(BaseModel):
    """Schema for updating an employee portal permission"""
    permission_type: Optional[str] = None
    resource_id: Optional[str] = None
    permission_metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    can_view: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_delete: Optional[bool] = None
    description: Optional[str] = None

    @field_validator('permission_type')
    @classmethod
    def validate_permission_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed_types = ['page', 'module', 'project', 'client']
            if v not in allowed_types:
                raise ValueError(f"permission_type must be one of {allowed_types}")
        return v


class EmployeePortalPermissionResponse(EmployeePortalPermissionBase):
    """Schema for employee portal permission response"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BulkEmployeePortalPermissionCreate(BaseModel):
    """Schema for bulk creating employee portal permissions"""
    user_id: Optional[int] = None
    employee_id: Optional[int] = None
    permissions: List[EmployeePortalPermissionCreate] = Field(..., description="List of permissions to create")


class EmployeePortalPermissionSummary(BaseModel):
    """Summary of permissions for a user/employee"""
    user_id: Optional[int] = None
    employee_id: Optional[int] = None
    pages: List[str] = Field(default_factory=list, description="Allowed page paths")
    modules: List[str] = Field(default_factory=list, description="Allowed module names")
    projects: List[int] = Field(default_factory=list, description="Allowed project IDs")
    clients: List[int] = Field(default_factory=list, description="Allowed client IDs")
    all_projects: bool = Field(default=False, description="Has access to all projects")
    all_clients: bool = Field(default=False, description="Has access to all clients")
