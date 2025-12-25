# 📄 Complete List of Pages and Permissions

**Template**: MODELE-NEXTJS-FULLSTACK  
**Framework**: Next.js 16 (App Router)  
**Date**: January 2025

---

## 🔐 Permission System Overview

The application uses a **Role-Based Access Control (RBAC)** system with the following structure:

### User Roles
1. **SuperAdmin** (has `superadmin` role)
   - Has all permissions (`admin:*`)
   - Can access all pages and perform all actions
   - Determined by having the `superadmin` role (slug: `'superadmin'`)

2. **Admin** (`is_admin: true`)
   - Has admin permissions
   - Can access admin pages and manage users/teams/resources

3. **Manager** (Role-based)
   - Can manage team members
   - Can update/delete teams

4. **Member** (Role-based)
   - Can read teams and projects
   - Basic user permissions

5. **User** (Default)
   - Basic authenticated user
   - Can access dashboard and own resources

### Permission Types

#### Backend Permissions (from `backend/app/core/permissions.py`)

**User Permissions:**
- `read:user` - Read user information
- `update:user` - Update user information
- `delete:user` - Delete users
- `list:users` - List all users

**Project Permissions:**
- `create:project` - Create new projects
- `read:project` - Read project information
- `update:project` - Update projects
- `delete:project` - Delete projects
- `list:projects` - List all projects

**Team Permissions:**
- `create:team` - Create new teams
- `read:team` - Read team information
- `update:team` - Update teams
- `delete:team` - Delete teams
- `list:teams` - List all teams
- `manage:team:members` - Manage team members

**Billing Permissions:**
- `read:billing` - Read billing information
- `update:billing` - Update billing information
- `manage:subscription` - Manage subscriptions

**Admin Permissions:**
- `admin:*` - All admin permissions (SuperAdmin only)

---

## 📋 Complete Page List with Permissions

### 🌍 Public Pages (No Authentication Required)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/` | `apps/web/src/app/page.tsx` | Root page (redirects) | Public |
| `/[locale]/` | `apps/web/src/app/[locale]/page.tsx` | Internationalized home page | Public |
| `/pricing` | `apps/web/src/app/pricing/page.tsx` | Pricing page | Public |
| `/docs` | `apps/web/src/app/docs/page.tsx` | Documentation | Public |
| `/sitemap` | `apps/web/src/app/sitemap/page.tsx` | Sitemap | Public |

### 🔐 Authentication Pages (No Authentication Required)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/auth/login` | `apps/web/src/app/auth/login/page.tsx` | Login page | Public |
| `/auth/register` | `apps/web/src/app/auth/register/page.tsx` | Registration page | Public |
| `/auth/signin` | `apps/web/src/app/auth/signin/page.tsx` | Alternative sign-in | Public |
| `/auth/callback` | `apps/web/src/app/auth/callback/page.tsx` | OAuth callback | Public |

### 📊 Dashboard Pages (Authentication Required)

All dashboard pages are wrapped in `<ProtectedRoute>` and require authentication.

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/dashboard` | `apps/web/src/app/dashboard/page.tsx` | Main dashboard | **Authenticated** |
| `/dashboard/projects` | `apps/web/src/app/dashboard/projects/page.tsx` | User projects | **Authenticated** |
| `/dashboard/become-superadmin` | `apps/web/src/app/dashboard/become-superadmin/page.tsx` | Become SuperAdmin | **Authenticated** |

**Note:** The following dashboard pages were moved to `/admin`:
- ~~`/dashboard/users`~~ → `/admin/users`
- ~~`/dashboard/settings`~~ → `/admin/settings`
- ~~`/dashboard/theme`~~ → `/admin/theme`

### 👥 Admin Pages (Admin/SuperAdmin Required)

All admin pages are wrapped in `<ProtectedSuperAdminRoute>` or check `is_admin` flag.

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/admin` | `apps/web/src/app/admin/page.tsx` | Admin dashboard | **Admin/SuperAdmin** |
| `/admin/users` | `apps/web/src/app/admin/users/page.tsx` | User management | **Admin/SuperAdmin** |
| `/admin/settings` | `apps/web/src/app/admin/settings/page.tsx` | Admin settings | **Admin/SuperAdmin** |
| `/admin/theme` | `apps/web/src/app/admin/theme/page.tsx` | Theme management | **Admin/SuperAdmin** |
| `/admin/themes` | `apps/web/src/app/admin/themes/page.tsx` | System themes | **Admin/SuperAdmin** |
| `/admin/teams` | `apps/web/src/app/admin/teams/page.tsx` | Team management | **Admin/SuperAdmin** |
| `/admin/rbac` | `apps/web/src/app/admin/rbac/page.tsx` | RBAC management | **Admin/SuperAdmin** |
| `/admin/invitations` | `apps/web/src/app/admin/invitations/page.tsx` | User invitations | **Admin/SuperAdmin** |

### 💳 Subscription Pages (Authentication Required)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/subscriptions` | `apps/web/src/app/subscriptions/page.tsx` | Subscription management | **Authenticated** |
| `/subscriptions/success` | `apps/web/src/app/subscriptions/success/page.tsx` | Subscription success | **Authenticated** |

### 🎨 Component Showcase Pages (Public)

These are showcase/demo pages for UI components. All are public.

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/components` | `apps/web/src/app/components/page.tsx` | Components index | Public |
| `/components/activity` | `apps/web/src/app/components/activity/page.tsx` | Activity components | Public |
| `/components/admin` | `apps/web/src/app/components/admin/page.tsx` | Admin components | Public |
| `/components/advanced` | `apps/web/src/app/components/advanced/page.tsx` | Advanced components | Public |
| `/components/analytics` | `apps/web/src/app/components/analytics/page.tsx` | Analytics components | Public |
| `/components/auth` | `apps/web/src/app/components/auth/page.tsx` | Auth components | Public |
| `/components/billing` | `apps/web/src/app/components/billing/page.tsx` | Billing components | Public |
| `/components/charts` | `apps/web/src/app/components/charts/page.tsx` | Chart components | Public |
| `/components/collaboration` | `apps/web/src/app/components/collaboration/page.tsx` | Collaboration components | Public |
| `/components/data` | `apps/web/src/app/components/data/page.tsx` | Data components | Public |
| `/components/errors` | `apps/web/src/app/components/errors/page.tsx` | Error components | Public |
| `/components/feedback` | `apps/web/src/app/components/feedback/page.tsx` | Feedback components | Public |
| `/components/forms` | `apps/web/src/app/components/forms/page.tsx` | Form components | Public |
| `/components/i18n` | `apps/web/src/app/components/i18n/page.tsx` | i18n components | Public |
| `/components/integrations` | `apps/web/src/app/components/integrations/page.tsx` | Integration components | Public |
| `/components/layout` | `apps/web/src/app/components/layout/page.tsx` | Layout components | Public |
| `/components/media` | `apps/web/src/app/components/media/page.tsx` | Media components | Public |
| `/components/monitoring` | `apps/web/src/app/components/monitoring/page.tsx` | Monitoring components | Public |
| `/components/navigation` | `apps/web/src/app/components/navigation/page.tsx` | Navigation components | Public |
| `/components/notifications` | `apps/web/src/app/components/notifications/page.tsx` | Notification components | Public |
| `/components/performance` | `apps/web/src/app/components/performance/page.tsx` | Performance components | Public |
| `/components/settings` | `apps/web/src/app/components/settings/page.tsx` | Settings components | Public |
| `/components/theme` | `apps/web/src/app/components/theme/page.tsx` | Theme components | Public |
| `/components/utils` | `apps/web/src/app/components/utils/page.tsx` | Utility components | Public |
| `/components/workflow` | `apps/web/src/app/components/workflow/page.tsx` | Workflow components | Public |

### 📊 Monitoring Pages (Authentication Required)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/monitoring` | `apps/web/src/app/monitoring/page.tsx` | System monitoring | **Authenticated** |
| `/monitoring/errors` | `apps/web/src/app/monitoring/errors/page.tsx` | Error tracking | **Authenticated** |
| `/monitoring/performance` | `apps/web/src/app/monitoring/performance/page.tsx` | Performance metrics | **Authenticated** |

### 💡 Example Pages (Public)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/examples` | `apps/web/src/app/examples/page.tsx` | Examples index | Public |
| `/examples/dashboard` | `apps/web/src/app/examples/dashboard/page.tsx` | Dashboard example | Public |
| `/examples/onboarding` | `apps/web/src/app/examples/onboarding/page.tsx` | Onboarding example | Public |
| `/examples/settings` | `apps/web/src/app/examples/settings/page.tsx` | Settings example | Public |

### 🧪 Test Pages (Authentication Required)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/test-sentry` | `apps/web/src/app/test-sentry/page.tsx` | Sentry test | **Authenticated** |
| `/email/test` | `apps/web/src/app/email/test/page.tsx` | Email test | **Authenticated** |
| `/ai/test` | `apps/web/src/app/ai/test/page.tsx` | AI test | **Authenticated** |

### 📤 Upload Page (Authentication Required)

| Route | File | Description | Permission |
|-------|------|-------------|------------|
| `/upload` | `apps/web/src/app/upload/page.tsx` | File upload | **Authenticated** |

---

## 🔒 Permission Summary by Category

### Public Access (No Authentication)
- All `/auth/*` pages
- All `/components/*` pages (showcase)
- All `/examples/*` pages
- `/`, `/pricing`, `/docs`, `/sitemap`

**Total: 35 pages**

### Authenticated Users Only
- All `/dashboard/*` pages
- `/subscriptions/*` pages
- `/monitoring/*` pages
- `/test-sentry`, `/email/test`, `/ai/test`
- `/upload`

**Total: 10 pages**

### Admin/SuperAdmin Only
- All `/admin/*` pages

**Total: 8 pages**

---

## 🛡️ Frontend Protection Mechanisms

### 1. ProtectedRoute Component
- **Location**: `apps/web/src/components/auth/ProtectedRoute.tsx`
- **Usage**: Wraps pages requiring authentication
- **Behavior**: 
  - Checks if user is authenticated
  - Redirects to `/auth/login` if not authenticated
  - Supports `requireAdmin` prop for admin-only pages

### 2. ProtectedSuperAdminRoute Component
- **Location**: `apps/web/src/components/auth/ProtectedSuperAdminRoute.tsx`
- **Usage**: Wraps admin pages
- **Behavior**: 
  - Checks if user has `superadmin` role (via API check)
  - Returns `is_superadmin: true` if user has the role
  - Redirects if not authorized

### 3. Layout-Level Protection
- **Dashboard Layout**: `apps/web/src/app/dashboard/layout.tsx`
  - Wraps all dashboard pages with `<ProtectedRoute>`
  - Shows admin links only if `user?.is_admin === true`

### 4. Conditional Rendering
- Sidebar navigation shows admin links only for admins
- Components check `user?.is_admin` before rendering admin features

---

## 🔐 Backend Permission Checks

### Permission Decorators

1. **`@require_permission(permission: str)`**
   - Checks if user has specific permission
   - Raises 403 if permission denied

2. **`@require_resource_permission(permission: str, resource_id_param: str)`**
   - Checks permission for specific resource
   - Supports resource ownership checks

### Permission Dependency

```python
from app.core.permissions import check_permission_dependency, Permission

@router.get("/admin/users")
async def list_users(
    has_permission: bool = Depends(
        check_permission_dependency(Permission.LIST_USERS)
    )
):
    # Only users with LIST_USERS permission can access
    pass
```

---

## 📊 Statistics

| Category | Count |
|----------|-------|
| **Total Pages** | **57** |
| **Public Pages** | 35 |
| **Authenticated Pages** | 10 |
| **Admin Pages** | 8 |
| **Component Showcase** | 25 |
| **Example Pages** | 4 |
| **Test Pages** | 3 |

---

## 🌐 Internationalization

All pages support internationalization via `/[locale]/` prefix:
- **French**: `/fr/[route]`
- **English**: `/en/[route]`

Example:
- `/fr/dashboard` - Dashboard in French
- `/en/dashboard` - Dashboard in English

---

## 📝 Notes

1. **Component Showcase Pages**: Pages in `/components` are public demo/showcase pages and don't require authentication.

2. **Admin Access**: Admin pages require `is_admin: true` or the `superadmin` role on the user object.

3. **SuperAdmin**: SuperAdmins have the `superadmin` role and `admin:*` permission, allowing access to everything.

4. **Role-Based Permissions**: Backend uses granular permissions (e.g., `read:project`, `create:team`) while frontend primarily checks `is_admin` flag.

5. **Protected Routes**: Frontend protection is handled by React components, but backend API endpoints also enforce permissions.

6. **Test Pages**: Test pages (`/test-sentry`, `/email/test`, `/ai/test`) are for development/testing and require authentication.

---

**Last Updated**: January 2025  
**Total Pages**: 57  
**Total Permissions**: 20+ granular permissions

