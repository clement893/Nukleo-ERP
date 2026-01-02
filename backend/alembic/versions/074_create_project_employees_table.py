"""create project_employees table for many-to-many relationship

Revision ID: 074
Revises: 073
Create Date: 2026-01-02 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '074'
down_revision: Union[str, None] = '073'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create project_employees table for many-to-many relationship"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if table already exists
    if 'project_employees' in inspector.get_table_names():
        return
    
    # Create project_employees table
    op.create_table(
        'project_employees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=True),  # Optional role (e.g., 'lead', 'member', 'viewer')
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('assigned_by_id', sa.Integer(), nullable=True),  # User who assigned the employee
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('project_id', 'employee_id', name='uq_project_employee')
    )
    
    # Create indexes
    op.create_index('idx_project_employees_project', 'project_employees', ['project_id'])
    op.create_index('idx_project_employees_employee', 'project_employees', ['employee_id'])
    op.create_index('idx_project_employees_assigned_at', 'project_employees', ['assigned_at'])


def downgrade() -> None:
    """Drop project_employees table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if table exists
    if 'project_employees' not in inspector.get_table_names():
        return
    
    # Drop indexes
    indexes = [idx['name'] for idx in inspector.get_indexes('project_employees')]
    if 'idx_project_employees_assigned_at' in indexes:
        op.drop_index('idx_project_employees_assigned_at', table_name='project_employees')
    if 'idx_project_employees_employee' in indexes:
        op.drop_index('idx_project_employees_employee', table_name='project_employees')
    if 'idx_project_employees_project' in indexes:
        op.drop_index('idx_project_employees_project', table_name='project_employees')
    
    # Drop table
    op.drop_table('project_employees')
