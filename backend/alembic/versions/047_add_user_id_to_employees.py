"""add user_id to employees table

Revision ID: 047_add_user_id_to_employees
Revises: 046_add_client_resp_proj
Create Date: 2025-01-27 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '047_add_user_id_to_employees'
down_revision = '046_add_client_resp_proj'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - add user_id column to employees table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if employees table exists
    if 'employees' not in inspector.get_table_names():
        return
    
    # Check if column already exists
    columns = [col['name'] for col in inspector.get_columns('employees')]
    
    # Add user_id column if it doesn't exist
    if 'user_id' not in columns:
        op.add_column('employees', sa.Column('user_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_employees_user_id',
            'employees', 'users',
            ['user_id'], ['id'],
            ondelete='SET NULL'
        )
        op.create_index('idx_employees_user_id', 'employees', ['user_id'], unique=True)


def downgrade() -> None:
    """Downgrade database schema"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'employees' not in inspector.get_table_names():
        return
    
    columns = [col['name'] for col in inspector.get_columns('employees')]
    
    # Remove user_id column if it exists
    if 'user_id' in columns:
        op.drop_index('idx_employees_user_id', table_name='employees')
        op.drop_constraint('fk_employees_user_id', 'employees', type_='foreignkey')
        op.drop_column('employees', 'user_id')
