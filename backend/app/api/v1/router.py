"""
API v1 router registration.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import themes, theme_fonts, projects, websocket, admin, auth, two_factor, api_keys, users, health, db_health, newsletter, exports, imports, search, tags, activities, comments, favorites, templates, versions, shares, feature_flags, user_preferences, announcements, feedback, onboarding, documentation, scheduled_tasks, backups, email_templates, audit_trail, integrations, api_settings, organization_settings, general_settings, pages, forms, menus, support_tickets, seo, teams, invitations, rbac, notifications, api_connection_check, reports, media, insights, analytics, posts, subscriptions, project_tasks, leo_documentation, employees
from app.modules.leo.api import router as leo_router
from app.api.v1.endpoints.commercial import contacts as commercial_contacts
from app.api.v1.endpoints.commercial import companies as commercial_companies, opportunities as commercial_opportunities
from app.api.v1.endpoints.commercial import quotes as commercial_quotes, submissions as commercial_submissions
from app.modules.commercial.api import router as commercial_module_router
from app.api.v1.endpoints.agenda import events as agenda_events
from app.api.v1.endpoints.reseau import contacts as reseau_contacts
from app.api.v1.endpoints.finances import facturations_router, rapport_router, compte_depenses_router
from app.modules.finances.api import router as finances_module_router
from app.modules.projects.api import router as projects_module_router
from app.modules.management.api import router as management_module_router
from app.modules.content.api import router as content_module_router
from app.api.v1.endpoints.client import invoices_router, projects_router, tickets_router, dashboard_router
from app.modules.client_portal.api import router as client_portal_module_router
from app.modules.agenda.api import router as agenda_module_router
from app.api.v1.endpoints.erp import invoices_router as erp_invoices_router, clients_router, orders_router, inventory_router, reports_router, dashboard_router as erp_dashboard_router
from app.api import ai as ai_router

api_router = APIRouter()

# Register auth endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

# Register 2FA endpoints
api_router.include_router(
    two_factor.router,
    prefix="/auth/2fa",
    tags=["2fa"]
)

# Register API key endpoints
api_router.include_router(
    api_keys.router,
    prefix="/api-keys",
    tags=["api-keys"]
)

# Register user preferences endpoints (MUST be before /users/{user_id} route)
api_router.include_router(
    user_preferences.router,
    prefix="/users",
    tags=["user-preferences"]
)

# Register user endpoints (with pagination and optimization)
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# Register teams endpoints
api_router.include_router(
    teams.router,
    tags=["teams"]
)

# Register project tasks endpoints
api_router.include_router(
    project_tasks.router,
    tags=["project-tasks"]
)

# Register invitations endpoints
api_router.include_router(
    invitations.router,
    tags=["invitations"]
)

# Register theme endpoints
api_router.include_router(
    themes.router,
    prefix="/themes",
    tags=["themes"]
)

# Register theme font endpoints
api_router.include_router(
    theme_fonts.router,
    prefix="/theme-fonts",
    tags=["theme-fonts"]
)

# Register project endpoints
api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["projects"]
)

# Register WebSocket endpoints
api_router.include_router(
    websocket.router,
    tags=["websocket"]
)

# Register admin endpoints
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# Register RBAC endpoints
api_router.include_router(
    rbac.router,
    tags=["rbac"]
)

# Register health check endpoints
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

# Register database health check endpoints
api_router.include_router(
    db_health.router,
    prefix="/db-health",
    tags=["database-health"]
)

# Register AI endpoints
api_router.include_router(
    ai_router.router,
    tags=["ai"]
)

# Register Leo module router (isolated module - includes documentation)
api_router.include_router(leo_router)

# Note: Leo documentation endpoints are now included in leo_router
# The old leo_documentation.router can be removed once migration is validated

# Register newsletter endpoints
api_router.include_router(
    newsletter.router,
    prefix="/newsletter",
    tags=["newsletter"]
)

# Register subscription endpoints
api_router.include_router(
    subscriptions.router,
    tags=["subscriptions"]
)

# Register export endpoints
api_router.include_router(
    exports.router,
    prefix="/exports",
    tags=["exports"]
)

# Register import endpoints
api_router.include_router(
    imports.router,
    prefix="/imports",
    tags=["imports"]
)

# Register search endpoints
api_router.include_router(
    search.router,
    prefix="/search",
    tags=["search"]
)

# Register tags and categories endpoints
api_router.include_router(
    tags.router,
    prefix="/tags",
    tags=["tags", "categories"]
)

# Register activity endpoints
api_router.include_router(
    activities.router,
    prefix="/activities",
    tags=["activities"]
)

# Register comments endpoints
api_router.include_router(
    comments.router,
    prefix="/comments",
    tags=["comments"]
)

# Register favorites endpoints
api_router.include_router(
    favorites.router,
    prefix="/favorites",
    tags=["favorites"]
)

# Register templates endpoints
api_router.include_router(
    templates.router,
    prefix="/templates",
    tags=["templates"]
)

# Note: Templates are also included in content_module_router above

# Register versions endpoints
api_router.include_router(
    versions.router,
    prefix="/versions",
    tags=["versions"]
)

# Register shares endpoints
api_router.include_router(
    shares.router,
    prefix="/shares",
    tags=["shares"]
)

# Register feature flags endpoints
api_router.include_router(
    feature_flags.router,
    prefix="/feature-flags",
    tags=["feature-flags"]
)

# Register announcements endpoints
api_router.include_router(
    announcements.router,
    prefix="/announcements",
    tags=["announcements"]
)

# Register notifications endpoints
api_router.include_router(
    notifications.router,
    tags=["notifications"]
)

# Register feedback endpoints
api_router.include_router(
    feedback.router,
    prefix="/feedback",
    tags=["feedback"]
)

# Register onboarding endpoints
api_router.include_router(
    onboarding.router,
    prefix="/onboarding",
    tags=["onboarding"]
)

# Register documentation endpoints
api_router.include_router(
    documentation.router,
    prefix="/documentation",
    tags=["documentation"]
)

# Register scheduled tasks endpoints
api_router.include_router(
    scheduled_tasks.router,
    prefix="/scheduled-tasks",
    tags=["scheduled-tasks"]
)

# Register backups endpoints
api_router.include_router(
    backups.router,
    prefix="/backups",
    tags=["backups"]
)

# Register email templates endpoints
api_router.include_router(
    email_templates.router,
    prefix="/email-templates",
    tags=["email-templates"]
)

# Register audit trail endpoints
api_router.include_router(
    audit_trail.router,
    prefix="/audit-trail",
    tags=["audit-trail"]
)

# Register integrations endpoints
api_router.include_router(
    integrations.router,
    prefix="/integrations",
    tags=["integrations"]
)

# Register API settings endpoints
api_router.include_router(
    api_settings.router,
    prefix="/api-settings",
    tags=["api-settings"]
)

# Register organization settings endpoints
api_router.include_router(
    organization_settings.router,
    prefix="/settings/organization",
    tags=["organization-settings"]
)

# Register general settings endpoints
api_router.include_router(
    general_settings.router,
    prefix="/settings/general",
    tags=["general-settings"]
)

# Register pages endpoints
api_router.include_router(
    pages.router,
    tags=["pages"]
)

# Register forms endpoints
api_router.include_router(
    forms.router,
    tags=["forms"]
)

# Register menus endpoints
api_router.include_router(
    menus.router,
    tags=["menus"]
)

# Register content module unified router (alternative to individual routers above)
# Uncomment to use unified router instead:
# api_router.include_router(content_module_router)

# Register support tickets endpoints
api_router.include_router(
    support_tickets.router,
    tags=["support"]
)

# Register SEO endpoints
api_router.include_router(
    seo.router,
    tags=["seo"]
)

# Register reports endpoints
api_router.include_router(
    reports.router,
    tags=["reports"]
)

# Register media endpoints
api_router.include_router(
    media.router,
    tags=["media"]
)

# Register insights endpoints
api_router.include_router(
    insights.router,
    tags=["insights"]
)

# Register analytics endpoints
api_router.include_router(
    analytics.router,
    tags=["analytics"]
)

# Register posts endpoints
api_router.include_router(
    posts.router,
    tags=["posts"]
)

# Register client portal endpoints
api_router.include_router(
    invoices_router,
    tags=["client-portal"]
)

api_router.include_router(
    projects_router,
    tags=["client-portal"]
)

api_router.include_router(
    tickets_router,
    tags=["client-portal"]
)

api_router.include_router(
    dashboard_router,
    tags=["client-portal"]
)

# Register ERP/Employee portal endpoints
api_router.include_router(
    erp_invoices_router,
    tags=["erp-portal"]
)

api_router.include_router(
    clients_router,
    tags=["erp-portal"]
)

api_router.include_router(
    orders_router,
    tags=["erp-portal"]
)

api_router.include_router(
    inventory_router,
    tags=["erp-portal"]
)

api_router.include_router(
    reports_router,
    tags=["erp-portal"]
)

api_router.include_router(
    erp_dashboard_router,
    tags=["erp-portal"]
)

# Register ERP module unified router (alternative to individual routers above)
# Uncomment to use unified router instead:
# api_router.include_router(erp_module_router)

# Register commercial module endpoints
# Register agenda events endpoints
api_router.include_router(
    agenda_events.router,
    tags=["agenda-events"]
)

# Register agenda module unified router (alternative to individual router above)
# Uncomment to use unified router instead:
# api_router.include_router(agenda_module_router)

api_router.include_router(
    commercial_contacts.router,
    tags=["commercial"]
)

api_router.include_router(
    commercial_companies.router,
    tags=["commercial"]
)

api_router.include_router(
    commercial_opportunities.router,
    tags=["commercial"]
)

api_router.include_router(
    commercial_quotes.router,
    tags=["commercial"]
)

api_router.include_router(
    commercial_submissions.router,
    tags=["commercial"]
)

# Register commercial module unified router (alternative to individual routers above)
# Uncomment to use unified router instead:
# api_router.include_router(commercial_module_router)

# Register réseau module endpoints
api_router.include_router(
    reseau_contacts.router,
    tags=["reseau"]
)

# Register finances module endpoints
api_router.include_router(
    facturations_router,
    tags=["finances"]
)

api_router.include_router(
    rapport_router,
    tags=["finances"]
)

api_router.include_router(
    compte_depenses_router,
    tags=["finances"]
)

# Register finances module unified router (alternative to individual routers above)
# Uncomment to use unified router instead:
# api_router.include_router(finances_module_router)

# Register projects module unified router (alternative to individual router above)
# Uncomment to use unified router instead:
# api_router.include_router(projects_module_router)

# Register management module unified router (alternative to individual routers above)
# Uncomment to use unified router instead:
# api_router.include_router(management_module_router)

# Register API connection check endpoints
api_router.include_router(
    api_connection_check.router,
    tags=["api-connection-check"]
)

# Register employees endpoints
api_router.include_router(
    employees.router,
    prefix="/employees",
    tags=["employees"]
)
