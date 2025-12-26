"""
Dependencies module - Legacy file.

NOTE: This file is kept for backward compatibility but is DEPRECATED.
All dependencies have been moved to app.dependencies (the parent file).

For new code, import from app.dependencies directly:
    from app.dependencies import get_current_user, get_db, etc.

This file will be removed in a future version.
"""

# Re-export everything from parent dependencies.py for backward compatibility
from app.dependencies import (
    get_current_user,
    get_db,
    is_superadmin,
    is_admin,
    is_admin_or_superadmin,
    require_superadmin,
    require_admin_or_superadmin,
    get_subscription_service,
    get_stripe_service,
    get_tenant_scope,
    require_tenant,
)

__all__ = [
    "get_current_user",
    "get_db",
    "is_superadmin",
    "is_admin",
    "is_admin_or_superadmin",
    "require_superadmin",
    "require_admin_or_superadmin",
    "get_subscription_service",
    "get_stripe_service",
    "get_tenant_scope",
    "require_tenant",
]
