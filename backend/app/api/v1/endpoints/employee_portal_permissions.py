"""
Employee Portal Permissions API Endpoints
API endpoints for managing employee portal access permissions
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.employee_portal_permission import EmployeePortalPermission
from app.schemas.employee_portal_permission import (
    EmployeePortalPermissionCreate,
    EmployeePortalPermissionUpdate,
    EmployeePortalPermissionResponse,
    BulkEmployeePortalPermissionCreate,
    EmployeePortalPermissionSummary,
)
from app.dependencies.rbac import require_permission

router = APIRouter()


@router.get("/employee-portal-permissions", response_model=List[EmployeePortalPermissionResponse])
async def list_employee_portal_permissions(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    permission_type: Optional[str] = Query(None, description="Filter by permission type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List employee portal permissions"""
    await require_permission("admin:*", current_user, db)
    
    query = select(EmployeePortalPermission)
    conditions = []
    
    if user_id:
        conditions.append(EmployeePortalPermission.user_id == user_id)
    if employee_id:
        conditions.append(EmployeePortalPermission.employee_id == employee_id)
    if permission_type:
        conditions.append(EmployeePortalPermission.permission_type == permission_type)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    result = await db.execute(query)
    permissions = result.scalars().all()
    
    return [EmployeePortalPermissionResponse.model_validate(p) for p in permissions]


@router.get("/employee-portal-permissions/{permission_id}", response_model=EmployeePortalPermissionResponse)
async def get_employee_portal_permission(
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific employee portal permission"""
    await require_permission("admin:*", current_user, db)
    
    result = await db.execute(
        select(EmployeePortalPermission).where(EmployeePortalPermission.id == permission_id)
    )
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    
    return EmployeePortalPermissionResponse.model_validate(permission)


@router.get("/users/{user_id}/employee-portal-permissions/summary", response_model=EmployeePortalPermissionSummary)
async def get_user_portal_permissions_summary(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get summary of portal permissions for a user"""
    await require_permission("admin:*", current_user, db)
    
    # Get all permissions for this user
    result = await db.execute(
        select(EmployeePortalPermission).where(
            or_(
                EmployeePortalPermission.user_id == user_id,
                EmployeePortalPermission.employee_id.in_(
                    select(EmployeePortalPermission.employee_id).where(
                        EmployeePortalPermission.user_id == user_id
                    )
                )
            )
        )
    )
    permissions = result.scalars().all()
    
    # Also check if user has an employee record
    from app.models.employee import Employee
    employee_result = await db.execute(
        select(Employee).where(Employee.user_id == user_id)
    )
    employee = employee_result.scalar_one_or_none()
    
    if employee:
        employee_permissions_result = await db.execute(
            select(EmployeePortalPermission).where(EmployeePortalPermission.employee_id == employee.id)
        )
        employee_permissions = employee_permissions_result.scalars().all()
        permissions = list(set(permissions + employee_permissions))
    
    # Build summary
    summary = EmployeePortalPermissionSummary(
        user_id=user_id,
        employee_id=employee.id if employee else None,
        pages=[],
        modules=[],
        projects=[],
        clients=[],
        all_projects=False,
        all_clients=False,
    )
    
    for perm in permissions:
        if perm.permission_type == 'page':
            if perm.resource_id == '*':
                summary.pages.append('*')
            else:
                summary.pages.append(perm.resource_id)
        elif perm.permission_type == 'module':
            if perm.resource_id == '*':
                summary.modules.append('*')
            else:
                summary.modules.append(perm.resource_id)
        elif perm.permission_type == 'project':
            if perm.resource_id == '*':
                summary.all_projects = True
            else:
                try:
                    project_id = int(perm.resource_id)
                    summary.projects.append(project_id)
                except ValueError:
                    pass
        elif perm.permission_type == 'client':
            if perm.resource_id == '*':
                summary.all_clients = True
            else:
                try:
                    client_id = int(perm.resource_id)
                    summary.clients.append(client_id)
                except ValueError:
                    pass
    
    return summary


@router.post("/employee-portal-permissions", response_model=EmployeePortalPermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_employee_portal_permission(
    permission_data: EmployeePortalPermissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new employee portal permission"""
    await require_permission("admin:*", current_user, db)
    
    # Validate that at least user_id or employee_id is set
    if not permission_data.user_id and not permission_data.employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or employee_id must be set"
        )
    
    # Check for duplicate
    existing = await db.execute(
        select(EmployeePortalPermission).where(
            and_(
                or_(
                    EmployeePortalPermission.user_id == permission_data.user_id,
                    EmployeePortalPermission.employee_id == permission_data.employee_id
                ),
                EmployeePortalPermission.permission_type == permission_data.permission_type,
                EmployeePortalPermission.resource_id == permission_data.resource_id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists"
        )
    
    permission = EmployeePortalPermission(**permission_data.model_dump())
    db.add(permission)
    await db.commit()
    await db.refresh(permission)
    
    return EmployeePortalPermissionResponse.model_validate(permission)


@router.post("/employee-portal-permissions/bulk", response_model=List[EmployeePortalPermissionResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_employee_portal_permissions(
    bulk_data: BulkEmployeePortalPermissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk create employee portal permissions"""
    await require_permission("admin:*", current_user, db)
    
    created_permissions = []
    
    for perm_data in bulk_data.permissions:
        # Set user_id or employee_id from bulk data if not set in individual permission
        if not perm_data.user_id and not perm_data.employee_id:
            if bulk_data.user_id:
                perm_data.user_id = bulk_data.user_id
            elif bulk_data.employee_id:
                perm_data.employee_id = bulk_data.employee_id
        
        # Check for duplicate
        existing = await db.execute(
            select(EmployeePortalPermission).where(
                and_(
                    or_(
                        EmployeePortalPermission.user_id == perm_data.user_id,
                        EmployeePortalPermission.employee_id == perm_data.employee_id
                    ),
                    EmployeePortalPermission.permission_type == perm_data.permission_type,
                    EmployeePortalPermission.resource_id == perm_data.resource_id
                )
            )
        )
        if existing.scalar_one_or_none():
            continue  # Skip duplicates
        
        permission = EmployeePortalPermission(**perm_data.model_dump())
        db.add(permission)
        created_permissions.append(permission)
    
    await db.commit()
    
    for perm in created_permissions:
        await db.refresh(perm)
    
    return [EmployeePortalPermissionResponse.model_validate(p) for p in created_permissions]


@router.put("/employee-portal-permissions/{permission_id}", response_model=EmployeePortalPermissionResponse)
async def update_employee_portal_permission(
    permission_id: int,
    permission_data: EmployeePortalPermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an employee portal permission"""
    await require_permission("admin:*", current_user, db)
    
    result = await db.execute(
        select(EmployeePortalPermission).where(EmployeePortalPermission.id == permission_id)
    )
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    
    update_data = permission_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(permission, field, value)
    
    await db.commit()
    await db.refresh(permission)
    
    return EmployeePortalPermissionResponse.model_validate(permission)


@router.delete("/employee-portal-permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee_portal_permission(
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an employee portal permission"""
    await require_permission("admin:*", current_user, db)
    
    result = await db.execute(
        select(EmployeePortalPermission).where(EmployeePortalPermission.id == permission_id)
    )
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    
    await db.delete(permission)
    await db.commit()
    
    return None


@router.get("/employees/{employee_id}/employee-portal-permissions/summary", response_model=EmployeePortalPermissionSummary)
async def get_employee_portal_permissions_summary(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get summary of portal permissions for an employee"""
    await require_permission("admin:*", current_user, db)
    
    # Get all permissions for this employee
    result = await db.execute(
        select(EmployeePortalPermission).where(
            EmployeePortalPermission.employee_id == employee_id
        )
    )
    permissions = result.scalars().all()
    
    # Build summary
    summary = EmployeePortalPermissionSummary(
        user_id=None,
        employee_id=employee_id,
        pages=[],
        modules=[],
        projects=[],
        clients=[],
        all_projects=False,
        all_clients=False,
    )
    
    for perm in permissions:
        if perm.permission_type == 'page':
            if perm.resource_id == '*':
                summary.pages.append('*')
            else:
                summary.pages.append(perm.resource_id)
        elif perm.permission_type == 'module':
            if perm.resource_id == '*':
                summary.modules.append('*')
            else:
                summary.modules.append(perm.resource_id)
        elif perm.permission_type == 'project':
            if perm.resource_id == '*':
                summary.all_projects = True
            else:
                try:
                    project_id = int(perm.resource_id)
                    summary.projects.append(project_id)
                except ValueError:
                    pass
        elif perm.permission_type == 'client':
            if perm.resource_id == '*':
                summary.all_clients = True
            else:
                try:
                    client_id = int(perm.resource_id)
                    summary.clients.append(client_id)
                except ValueError:
                    pass
    
    return summary


@router.delete("/users/{user_id}/employee-portal-permissions", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_user_portal_permissions(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all portal permissions for a user"""
    await require_permission("admin:*", current_user, db)
    
    # Get employee_id if exists
    from app.models.employee import Employee
    employee_result = await db.execute(
        select(Employee).where(Employee.user_id == user_id)
    )
    employee = employee_result.scalar_one_or_none()
    
    # Delete permissions for user_id and employee_id
    conditions = [EmployeePortalPermission.user_id == user_id]
    if employee:
        conditions.append(EmployeePortalPermission.employee_id == employee.id)
    
    result = await db.execute(
        select(EmployeePortalPermission).where(or_(*conditions))
    )
    permissions = result.scalars().all()
    
    for perm in permissions:
        await db.delete(perm)
    
    await db.commit()
    
    return None


@router.delete("/employees/{employee_id}/employee-portal-permissions", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_employee_portal_permissions(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all portal permissions for an employee"""
    await require_permission("admin:*", current_user, db)
    
    result = await db.execute(
        select(EmployeePortalPermission).where(
            EmployeePortalPermission.employee_id == employee_id
        )
    )
    permissions = result.scalars().all()
    
    for perm in permissions:
        await db.delete(perm)
    
    await db.commit()
    
    return None
