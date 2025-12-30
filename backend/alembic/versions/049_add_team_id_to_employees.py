"""add team_id to employees table

Revision ID: 049_add_team_id_to_employees
Revises: 048_add_testimonials
Create Date: 2025-01-28 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '049_add_team_id_to_employees'
down_revision = '048_add_testimonials'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - add team_id column to employees table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if employees table exists
    if 'employees' not in inspector.get_table_names():
        return
    
    # Check if column already exists
    columns = [col['name'] for col in inspector.get_columns('employees')]
    
    # Add team_id column if it doesn't exist
    if 'team_id' not in columns:
        op.add_column('employees', sa.Column('team_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_employees_team_id',
            'employees', 'teams',
            ['team_id'], ['id'],
            ondelete='SET NULL'
        )
        op.create_index('idx_employees_team_id', 'employees', ['team_id'])


def downgrade() -> None:
    """Downgrade database schema"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'employees' not in inspector.get_table_names():
        return
    
    columns = [col['name'] for col in inspector.get_columns('employees')]
    
    # Remove team_id column if it exists
    if 'team_id' in columns:
        op.drop_index('idx_employees_team_id', table_name='employees')
        op.drop_constraint('fk_employees_team_id', 'employees', type_='foreignkey')
        op.drop_column('employees', 'team_id')
