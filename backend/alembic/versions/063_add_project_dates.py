"""add project dates (start_date, end_date, deadline)

Revision ID: 063_add_project_dates
Revises: 062_emp_portal_perms
Create Date: 2025-01-30 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '063_add_project_dates'
down_revision = '062_emp_portal_perms'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name']: col for col in inspector.get_columns('projects')}
    
    # Add start_date if it doesn't exist
    if 'start_date' not in existing_columns:
        op.add_column('projects', sa.Column('start_date', sa.Date(), nullable=True))
        op.create_index('idx_projects_start_date', 'projects', ['start_date'])
    
    # Add end_date if it doesn't exist
    if 'end_date' not in existing_columns:
        op.add_column('projects', sa.Column('end_date', sa.Date(), nullable=True))
        op.create_index('idx_projects_end_date', 'projects', ['end_date'])
    
    # Add deadline if it doesn't exist
    if 'deadline' not in existing_columns:
        op.add_column('projects', sa.Column('deadline', sa.Date(), nullable=True))
        op.create_index('idx_projects_deadline', 'projects', ['deadline'])


def downgrade() -> None:
    op.drop_index('idx_projects_deadline', table_name='projects')
    op.drop_index('idx_projects_end_date', table_name='projects')
    op.drop_index('idx_projects_start_date', table_name='projects')
    op.drop_column('projects', 'deadline')
    op.drop_column('projects', 'end_date')
    op.drop_column('projects', 'start_date')
