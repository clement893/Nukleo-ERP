"""add project_id to project_tasks

Revision ID: 058_add_project_id_to_tasks
Revises: 057_fix_exp_emp_fk_force
Create Date: 2025-01-27 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '058_add_project_id_to_tasks'
down_revision = '057_fix_exp_emp_fk_force'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add project_id column to project_tasks table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if project_tasks table exists
    if 'project_tasks' not in inspector.get_table_names():
        print("Warning: project_tasks table does not exist. Skipping migration.")
        return
    
    # Check if projects table exists
    if 'projects' not in inspector.get_table_names():
        print("Warning: projects table does not exist. Cannot add project_id foreign key.")
        return
    
    # Check if project_id column already exists
    columns = [col['name'] for col in inspector.get_columns('project_tasks')]
    if 'project_id' in columns:
        print("project_id column already exists in project_tasks table. Skipping migration.")
        return
    
    # Add project_id column (nullable initially to allow existing tasks)
    op.add_column(
        'project_tasks',
        sa.Column('project_id', sa.Integer(), nullable=True)
    )
    
    # Create index for project_id
    op.create_index('idx_project_tasks_project', 'project_tasks', ['project_id'])
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_project_tasks_project_id',
        'project_tasks',
        'projects',
        ['project_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """Remove project_id column from project_tasks table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'project_tasks' not in inspector.get_table_names():
        return
    
    # Check if project_id column exists
    columns = [col['name'] for col in inspector.get_columns('project_tasks')]
    if 'project_id' not in columns:
        return
    
    # Drop foreign key constraint
    op.drop_constraint('fk_project_tasks_project_id', 'project_tasks', type_='foreignkey')
    
    # Drop index
    op.drop_index('idx_project_tasks_project', table_name='project_tasks')
    
    # Drop column
    op.drop_column('project_tasks', 'project_id')
