"""
RBAC Service
Service for Role-Based Access Control operations
"""

from typing import List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models import User, Role, Permission, RolePermission, UserRole, TeamMember


class RBACService:
    """Service for managing roles and permissions"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_roles(self, user_id: int) -> List[Role]:
        """Get all roles for a user"""
        result = await self.db.execute(
            select(Role)
            .join(UserRole)
            .where(UserRole.user_id == user_id)
            .where(Role.is_active == True)
        )
        return list(result.scalars().all())

    async def get_user_permissions(self, user_id: int) -> Set[str]:
        """Get all permissions for a user (from all their roles)"""
        result = await self.db.execute(
            select(Permission.name)
            .join(RolePermission)
            .join(Role)
            .join(UserRole)
            .where(UserRole.user_id == user_id)
            .where(Role.is_active == True)
        )
        return set(result.scalars().all())

    async def has_permission(self, user_id: int, permission_name: str) -> bool:
        """Check if user has a specific permission"""
        permissions = await self.get_user_permissions(user_id)
        return permission_name in permissions

    async def has_any_permission(self, user_id: int, permission_names: List[str]) -> bool:
        """Check if user has any of the specified permissions"""
        permissions = await self.get_user_permissions(user_id)
        return bool(permissions.intersection(set(permission_names)))

    async def has_all_permissions(self, user_id: int, permission_names: List[str]) -> bool:
        """Check if user has all of the specified permissions"""
        permissions = await self.get_user_permissions(user_id)
        return set(permission_names).issubset(permissions)

    async def has_role(self, user_id: int, role_slug: str) -> bool:
        """Check if user has a specific role"""
        result = await self.db.execute(
            select(UserRole)
            .join(Role)
            .where(UserRole.user_id == user_id)
            .where(Role.slug == role_slug)
            .where(Role.is_active == True)
        )
        return result.scalar_one_or_none() is not None

    async def has_any_role(self, user_id: int, role_slugs: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        result = await self.db.execute(
            select(UserRole)
            .join(Role)
            .where(UserRole.user_id == user_id)
            .where(Role.slug.in_(role_slugs))
            .where(Role.is_active == True)
        )
        return result.scalar_one_or_none() is not None

    async def assign_role(self, user_id: int, role_id: int) -> UserRole:
        """Assign a role to a user"""
        # Check if already assigned
        existing = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .where(UserRole.role_id == role_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Role already assigned to user")

        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        await self.db.commit()
        await self.db.refresh(user_role)
        return user_role

    async def remove_role(self, user_id: int, role_id: int) -> bool:
        """Remove a role from a user"""
        result = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .where(UserRole.role_id == role_id)
        )
        user_role = result.scalar_one_or_none()
        if not user_role:
            return False

        self.db.delete(user_role)
        await self.db.commit()
        return True

    async def create_role(
        self,
        name: str,
        slug: str,
        description: Optional[str] = None,
        is_system: bool = False,
    ) -> Role:
        """Create a new role"""
        role = Role(
            name=name,
            slug=slug,
            description=description,
            is_system=is_system,
        )
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def create_permission(
        self,
        resource: str,
        action: str,
        description: Optional[str] = None,
    ) -> Permission:
        """Create a new permission"""
        name = f"{resource}:{action}"
        permission = Permission(
            resource=resource,
            action=action,
            name=name,
            description=description,
        )
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def assign_permission_to_role(self, role_id: int, permission_id: int) -> RolePermission:
        """Assign a permission to a role"""
        # Check if already assigned
        existing = await self.db.execute(
            select(RolePermission)
            .where(RolePermission.role_id == role_id)
            .where(RolePermission.permission_id == permission_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Permission already assigned to role")

        role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
        self.db.add(role_permission)
        await self.db.commit()
        await self.db.refresh(role_permission)
        return role_permission

    async def remove_permission_from_role(self, role_id: int, permission_id: int) -> bool:
        """Remove a permission from a role"""
        result = await self.db.execute(
            select(RolePermission)
            .where(RolePermission.role_id == role_id)
            .where(RolePermission.permission_id == permission_id)
        )
        role_permission = result.scalar_one_or_none()
        if not role_permission:
            return False

        self.db.delete(role_permission)
        await self.db.commit()
        return True

    async def get_role_permissions(self, role_id: int) -> List[Permission]:
        """Get all permissions for a role"""
        result = await self.db.execute(
            select(Permission)
            .join(RolePermission)
            .where(RolePermission.role_id == role_id)
        )
        return list(result.scalars().all())

    async def get_team_user_role(self, user_id: int, team_id: int) -> Optional[Role]:
        """Get user's role in a specific team"""
        result = await self.db.execute(
            select(Role)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_team_user_permissions(self, user_id: int, team_id: int) -> Set[str]:
        """Get user's permissions in a specific team"""
        result = await self.db.execute(
            select(Permission.name)
            .join(RolePermission)
            .join(Role)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.is_active == True)
            .where(Role.is_active == True)
        )
        return set(result.scalars().all())

    async def has_team_permission(self, user_id: int, team_id: int, permission_name: str) -> bool:
        """Check if user has a specific permission in a team"""
        permissions = await self.get_team_user_permissions(user_id, team_id)
        return permission_name in permissions

