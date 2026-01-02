"""add employee_number to employees table

Revision ID: 072
Revises: 071
Create Date: 2026-01-02 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '072'
down_revision: Union[str, None] = '071'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema - add employee_number column to employees table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if employees table exists
    if 'employees' not in inspector.get_table_names():
        return
    
    # Check if column already exists
    columns = [col['name'] for col in inspector.get_columns('employees')]
    
    # Add employee_number column if it doesn't exist
    if 'employee_number' not in columns:
        op.add_column('employees', sa.Column('employee_number', sa.String(length=50), nullable=True))
        # Create unique index for employee_number
        op.create_index('idx_employees_employee_number', 'employees', ['employee_number'], unique=True)


def downgrade() -> None:
    """Downgrade database schema"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'employees' not in inspector.get_table_names():
        return
    
    columns = [col['name'] for col in inspector.get_columns('employees')]
    
    # Remove employee_number column if it exists
    if 'employee_number' in columns:
        op.drop_index('idx_employees_employee_number', table_name='employees')
        op.drop_column('employees', 'employee_number')
