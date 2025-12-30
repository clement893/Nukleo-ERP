"""create employees table

Revision ID: 045_create_employees_table
Revises: 044_create_main_pipeline
Create Date: 2025-12-30 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '045_create_employees_table'
down_revision = '044_create_main_pipeline'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create employees table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create employees table if it doesn't exist
    if 'employees' not in existing_tables:
        op.create_table(
            'employees',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('first_name', sa.String(length=100), nullable=False),
            sa.Column('last_name', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('linkedin', sa.String(length=500), nullable=True),
            sa.Column('photo_url', sa.String(length=1000), nullable=True),
            sa.Column('photo_filename', sa.String(length=500), nullable=True),
            sa.Column('hire_date', sa.Date(), nullable=True),
            sa.Column('birthday', sa.Date(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_employees_email', 'employees', ['email'])
        op.create_index('idx_employees_first_name', 'employees', ['first_name'])
        op.create_index('idx_employees_last_name', 'employees', ['last_name'])
        op.create_index('idx_employees_hire_date', 'employees', ['hire_date'])
        op.create_index('idx_employees_created_at', 'employees', ['created_at'])
        op.create_index('idx_employees_updated_at', 'employees', ['updated_at'])


def downgrade() -> None:
    """Downgrade database schema"""
    op.drop_index('idx_employees_updated_at', table_name='employees')
    op.drop_index('idx_employees_created_at', table_name='employees')
    op.drop_index('idx_employees_hire_date', table_name='employees')
    op.drop_index('idx_employees_last_name', table_name='employees')
    op.drop_index('idx_employees_first_name', table_name='employees')
    op.drop_index('idx_employees_email', table_name='employees')
    op.drop_table('employees')
