"""Add database indexes for query optimization

Revision ID: 007_add_indexes
Revises: 003
Create Date: 2025-12-21

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007_add_indexes'
down_revision = '005_create_files_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes to users table
    op.create_index('idx_users_is_active', 'users', ['is_active'], unique=False)
    op.create_index('idx_users_created_at', 'users', ['created_at'], unique=False)
    op.create_index('idx_users_updated_at', 'users', ['updated_at'], unique=False)
    op.create_index('idx_users_first_name', 'users', ['first_name'], unique=False)
    op.create_index('idx_users_last_name', 'users', ['last_name'], unique=False)
    
    # Add composite index for common queries (active users sorted by creation date)
    op.create_index('idx_users_active_created', 'users', ['is_active', 'created_at'], unique=False)
    
    # Add indexes to organizations table if it exists
    try:
        op.create_index('idx_organizations_name', 'organizations', ['name'], unique=False)
        op.create_index('idx_organizations_is_active', 'organizations', ['is_active'], unique=False)
        op.create_index('idx_organizations_created_at', 'organizations', ['created_at'], unique=False)
    except Exception:
        pass  # Table might not exist yet
    
    # Add indexes to organization_members table if it exists
    try:
        op.create_index('idx_org_members_user_id', 'organization_members', ['user_id'], unique=False)
        op.create_index('idx_org_members_org_id', 'organization_members', ['organization_id'], unique=False)
        op.create_index('idx_org_members_role', 'organization_members', ['role'], unique=False)
        # Composite index for common query: get user's organizations
        op.create_index('idx_org_members_user_active', 'organization_members', ['user_id', 'is_active'], unique=False)
    except Exception:
        pass  # Table might not exist yet
    
    # Add indexes to donateurs table if it exists
    try:
        op.create_index('idx_donateurs_email', 'donateurs', ['email'], unique=False)
        op.create_index('idx_donateurs_org_id', 'donateurs', ['organization_id'], unique=False)
        op.create_index('idx_donateurs_is_active', 'donateurs', ['is_active'], unique=False)
        op.create_index('idx_donateurs_created_at', 'donateurs', ['created_at'], unique=False)
        op.create_index('idx_donateurs_segment', 'donateurs', ['segment'], unique=False)
        # Composite index for common query: active donateurs by organization
        op.create_index('idx_donateurs_org_active', 'donateurs', ['organization_id', 'is_active'], unique=False)
    except Exception:
        pass  # Table might not exist yet
    
    # Add indexes to donations table if it exists
    try:
        op.create_index('idx_donations_donateur_id', 'donations', ['donateur_id'], unique=False)
        op.create_index('idx_donations_org_id', 'donations', ['organization_id'], unique=False)
        op.create_index('idx_donations_status', 'donations', ['payment_status'], unique=False)
        op.create_index('idx_donations_date', 'donations', ['donation_date'], unique=False)
        # Composite index for common query: completed donations by date
        op.create_index('idx_donations_status_date', 'donations', ['payment_status', 'donation_date'], unique=False)
    except Exception:
        pass  # Table might not exist yet


def downgrade() -> None:
    # Remove indexes
    try:
        op.drop_index('idx_users_active_created', table_name='users')
        op.drop_index('idx_users_last_name', table_name='users')
        op.drop_index('idx_users_first_name', table_name='users')
        op.drop_index('idx_users_updated_at', table_name='users')
        op.drop_index('idx_users_created_at', table_name='users')
        op.drop_index('idx_users_is_active', table_name='users')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_organizations_created_at', table_name='organizations')
        op.drop_index('idx_organizations_is_active', table_name='organizations')
        op.drop_index('idx_organizations_name', table_name='organizations')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_org_members_user_active', table_name='organization_members')
        op.drop_index('idx_org_members_role', table_name='organization_members')
        op.drop_index('idx_org_members_org_id', table_name='organization_members')
        op.drop_index('idx_org_members_user_id', table_name='organization_members')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_donateurs_org_active', table_name='donateurs')
        op.drop_index('idx_donateurs_segment', table_name='donateurs')
        op.drop_index('idx_donateurs_created_at', table_name='donateurs')
        op.drop_index('idx_donateurs_is_active', table_name='donateurs')
        op.drop_index('idx_donateurs_org_id', table_name='donateurs')
        op.drop_index('idx_donateurs_email', table_name='donateurs')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_donations_status_date', table_name='donations')
        op.drop_index('idx_donations_date', table_name='donations')
        op.drop_index('idx_donations_status', table_name='donations')
        op.drop_index('idx_donations_org_id', table_name='donations')
        op.drop_index('idx_donations_donateur_id', table_name='donations')
    except Exception:
        pass

