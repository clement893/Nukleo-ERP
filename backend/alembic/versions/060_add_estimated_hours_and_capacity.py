"""add estimated_hours to project_tasks and capacity_hours_per_week to employees

Revision ID: 060_add_estimated_hours_capacity
Revises: 059_create_time_entries
Create Date: 2025-01-27 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '060_add_estimated_hours_capacity'
down_revision = '059_create_time_entries'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add estimated_hours to project_tasks and capacity_hours_per_week to employees"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Add estimated_hours to project_tasks
    if 'project_tasks' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('project_tasks')]
        if 'estimated_hours' not in columns:
            op.add_column(
                'project_tasks',
                sa.Column('estimated_hours', sa.Numeric(10, 2), nullable=True)
            )
            print("Added estimated_hours column to project_tasks")
    
    # Add capacity_hours_per_week to employees
    if 'employees' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('employees')]
        if 'capacity_hours_per_week' not in columns:
            op.add_column(
                'employees',
                sa.Column('capacity_hours_per_week', sa.Numeric(5, 2), nullable=True, server_default='35.00')
            )
            # Update existing employees to have default capacity
            op.execute("UPDATE employees SET capacity_hours_per_week = 35.00 WHERE capacity_hours_per_week IS NULL")
            print("Added capacity_hours_per_week column to employees")


def downgrade() -> None:
    """Remove estimated_hours and capacity_hours_per_week columns"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'project_tasks' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('project_tasks')]
        if 'estimated_hours' in columns:
            op.drop_column('project_tasks', 'estimated_hours')
    
    if 'employees' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('employees')]
        if 'capacity_hours_per_week' in columns:
            op.drop_column('employees', 'capacity_hours_per_week')
