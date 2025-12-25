"""
Granular Permission System

Provides resource-level permissions and fine-grained access control.
Supports:
- Resource-based permissions (e.g., "read:project:123")
- Action-based permissions (e.g., "create:project", "update:project")
- Role-based permissions (e.g., "admin", "user")
- Custom permission checks

@example
```python
from app.core.permissions import require_permission, Permission

@router.get("/projects/{project_id}")
@require_permission("read:project")
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    # Check if user can read this specific project
    if not has_resource_permission(current_user, "read:project", project_id):
        raise HTTPException(403, "Access denied")
    return project
```
"""

from typing import List, Optional, Callable, Any
from functools import wraps
from fastapi import HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.role import Role, UserRole
from app.core.database import get_db
from app.core.auth import get_current_user


class Permission:
    """Permission constants for common actions"""
    
    # User permissions
    READ_USER = "read:user"
    UPDATE_USER = "update:user"
    DELETE_USER = "delete:user"
    LIST_USERS = "list:users"
    
    # Project permissions
    CREATE_PROJECT = "create:project"
    READ_PROJECT = "read:project"
    UPDATE_PROJECT = "update:project"
    DELETE_PROJECT = "delete:project"
    LIST_PROJECTS = "list:projects"
    
    # Team permissions
    CREATE_TEAM = "create:team"
    READ_TEAM = "read:team"
    UPDATE_TEAM = "update:team"
    DELETE_TEAM = "delete:team"
    LIST_TEAMS = "list:teams"
    MANAGE_TEAM_MEMBERS = "manage:team:members"
    
    # Billing permissions
    READ_BILLING = "read:billing"
    UPDATE_BILLING = "update:billing"
    MANAGE_SUBSCRIPTION = "manage:subscription"
    
    # Admin permissions
    ADMIN_ALL = "admin:*"


def get_user_permissions(user: User, db: AsyncSession) -> List[str]:
    """
    Get all permissions for a user.
    
    Combines role-based permissions with user-specific permissions.
    
    @param user - User object
    @param db - Database session
    @returns List of permission strings
    
    @example
    ```python
    permissions = await get_user_permissions(user, db)
    # ["read:project", "update:project", "create:project"]
    ```
    """
    permissions = []
    
    # Check if user has SuperAdmin role (has all permissions)
    # SuperAdmin role grants admin:* permission
    # 
    # IMPORTANT: Roles must be loaded via relationship (e.g., selectinload(User.roles))
    # when querying users to ensure proper permission checking.
    if hasattr(user, 'roles') and user.roles:
        for user_role in user.roles:
            # UserRole has a 'role' relationship to Role
            if hasattr(user_role, 'role') and user_role.role:
                role = user_role.role
                if hasattr(role, 'slug') and role.slug == "superadmin":
                    if hasattr(role, 'is_active') and role.is_active:
                        permissions.append(Permission.ADMIN_ALL)
                        return permissions
    
    # Get role-based permissions from user's roles
    if hasattr(user, 'roles') and user.roles:
        for user_role in user.roles:
            if hasattr(user_role, 'role') and user_role.role:
                role = user_role.role
                # Check by slug first (more reliable), then by name
                if hasattr(role, 'slug'):
                    permissions.extend(get_role_permissions(role.slug))
                elif hasattr(role, 'name'):
                    permissions.extend(get_role_permissions(role.name))
    
    # Default user permissions
    permissions.extend([
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.CREATE_PROJECT,
        Permission.READ_PROJECT,
        Permission.UPDATE_PROJECT,
        Permission.DELETE_PROJECT,
        Permission.LIST_PROJECTS,
        Permission.CREATE_TEAM,
        Permission.READ_TEAM,
        Permission.UPDATE_TEAM,
        Permission.READ_BILLING,
        Permission.UPDATE_BILLING,
    ])
    
    return list(set(permissions))  # Remove duplicates


def get_role_permissions(role_name: str) -> List[str]:
    """
    Get permissions for a role.
    
    @param role_name - Name of the role (or slug)
    @returns List of permission strings
    
    @example
    ```python
    permissions = get_role_permissions("admin")
    # ["admin:*", "read:user", "update:user", ...]
    ```
    """
    role_permissions = {
        "superadmin": [
            Permission.ADMIN_ALL,  # SuperAdmin has all permissions
        ],
        "admin": [
            Permission.ADMIN_ALL,
            Permission.LIST_USERS,
            Permission.UPDATE_USER,
            Permission.DELETE_USER,
        ],
        "manager": [
            Permission.MANAGE_TEAM_MEMBERS,
            Permission.UPDATE_TEAM,
            Permission.DELETE_TEAM,
        ],
        "member": [
            Permission.READ_TEAM,
            Permission.READ_PROJECT,
        ],
    }
    
    return role_permissions.get(role_name.lower(), [])


def has_permission(user: User, permission: str, db: AsyncSession) -> bool:
    """
    Check if user has a specific permission.
    
    @param user - User object
    @param permission - Permission string (e.g., "read:project")
    @param db - Database session
    @returns True if user has permission
    
    @example
    ```python
    if await has_permission(user, Permission.READ_PROJECT, db):
        # User can read projects
        pass
    ```
    """
    user_permissions = get_user_permissions(user, db)
    
    # Check exact permission
    if permission in user_permissions:
        return True
    
    # Check wildcard permissions
    if Permission.ADMIN_ALL in user_permissions:
        return True
    
    # Check resource-level permissions (e.g., "read:project:*")
    resource_base = permission.split(":")[0]  # "read"
    if f"{resource_base}:*" in user_permissions:
        return True
    
    return False


def has_resource_permission(
    user: User,
    permission: str,
    resource_id: str,
    db: AsyncSession,
    resource_owner_check: Optional[Callable] = None
) -> bool:
    """
    Check if user has permission for a specific resource.
    
    Supports:
    - Global permissions (e.g., "read:project")
    - Resource ownership checks
    - Custom resource-level checks
    
    @param user - User object
    @param permission - Permission string
    @param resource_id - Resource identifier
    @param db - Database session
    @param resource_owner_check - Optional function to check resource ownership
    @returns True if user has permission
    
    @example
    ```python
    def check_project_owner(project_id: str, user_id: str) -> bool:
        project = get_project(project_id)
        return project.owner_id == user_id
    
    has_access = await has_resource_permission(
        user,
        Permission.UPDATE_PROJECT,
        project_id,
        db,
        resource_owner_check=check_project_owner
    )
    ```
    """
    # Check global permission first
    if has_permission(user, permission, db):
        return True
    
    # Check resource ownership if provided
    if resource_owner_check:
        try:
            return resource_owner_check(resource_id, str(user.id))
        except Exception:
            return False
    
    # Check if user is the resource owner (default check)
    # This can be overridden with custom logic
    return False


def require_permission(permission: str):
    """
    Decorator to require a specific permission.
    
    @param permission - Permission string required
    @returns Decorator function
    
    @example
    ```python
    @router.get("/projects")
    @require_permission(Permission.LIST_PROJECTS)
    async def list_projects(current_user: User = Depends(get_current_user)):
        # Only users with LIST_PROJECTS permission can access
        pass
    ```
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs or dependencies
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not db:
                # Try to get db from dependencies
                db = kwargs.get('db_session') or Depends(get_db)
            
            if not has_permission(current_user, permission, db):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_resource_permission(
    permission: str,
    resource_id_param: str = "resource_id",
    resource_owner_check: Optional[Callable] = None
):
    """
    Decorator to require permission for a specific resource.
    
    @param permission - Permission string required
    @param resource_id_param - Name of the parameter containing resource ID
    @param resource_owner_check - Optional function to check resource ownership
    @returns Decorator function
    
    @example
    ```python
    @router.get("/projects/{project_id}")
    @require_resource_permission(Permission.READ_PROJECT, "project_id")
    async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
        # Only users with READ_PROJECT permission for this project can access
        pass
    ```
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            resource_id = kwargs.get(resource_id_param)
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not resource_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Resource ID parameter '{resource_id_param}' not found"
                )
            
            if not has_resource_permission(
                current_user,
                permission,
                resource_id,
                db,
                resource_owner_check
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission} for resource {resource_id}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def check_permission_dependency(
    permission: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> bool:
    """
    FastAPI dependency to check permissions.
    
    @param permission - Permission string to check
    @param current_user - Current authenticated user (dependency)
    @param db - Database session (dependency)
    @returns True if user has permission, raises 403 otherwise
    
    @example
    ```python
    @router.get("/admin/users")
    async def list_users(
        has_permission: bool = Depends(check_permission_dependency(Permission.LIST_USERS))
    ):
        # Only users with LIST_USERS permission can access
        pass
    ```
    """
    if not has_permission(current_user, permission, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission}"
        )
    return True

