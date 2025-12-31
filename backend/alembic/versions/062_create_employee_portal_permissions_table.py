"""create employee portal permissions table

Revision ID: 062_create_employee_portal_permissions
Revises: 061_create_public_holidays_table
Create Date: 2025-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '062_create_employee_portal_permissions'
down_revision = '061_create_public_holidays'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'employee_portal_permissions' not in existing_tables:
        op.create_table(
            'employee_portal_permissions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('employee_id', sa.Integer(), nullable=True),
            sa.Column('permission_type', sa.String(length=50), nullable=False),
            sa.Column('resource_id', sa.String(length=255), nullable=False, server_default='*'),
            sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('can_view', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('can_edit', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('can_delete', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes
        op.create_index('idx_employee_portal_permissions_user', 'employee_portal_permissions', ['user_id'])
        op.create_index('idx_employee_portal_permissions_employee', 'employee_portal_permissions', ['employee_id'])
        op.create_index('idx_employee_portal_permissions_type', 'employee_portal_permissions', ['permission_type'])
        op.create_index(
            'idx_employee_portal_permissions_unique',
            'employee_portal_permissions',
            ['user_id', 'permission_type', 'resource_id'],
            unique=True
        )


def downgrade() -> None:
    op.drop_index('idx_employee_portal_permissions_unique', table_name='employee_portal_permissions')
    op.drop_index('idx_employee_portal_permissions_type', table_name='employee_portal_permissions')
    op.drop_index('idx_employee_portal_permissions_employee', table_name='employee_portal_permissions')
    op.drop_index('idx_employee_portal_permissions_user', table_name='employee_portal_permissions')
    op.drop_table('employee_portal_permissions')
