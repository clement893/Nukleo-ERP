"""make task assignee and project required

Revision ID: 066_task_required_fields
Revises: 065_convert_task_enums
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '066_task_required_fields'
down_revision = '065_convert_task_enums'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make assignee_id and project_id required fields for project_tasks"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if project_tasks table exists
    if 'project_tasks' not in inspector.get_table_names():
        return
    
    # First, delete or update tasks that don't have assignee_id or project_id
    # Option 1: Delete tasks without required fields (safer for data integrity)
    op.execute(text("""
        DELETE FROM project_tasks 
        WHERE assignee_id IS NULL OR project_id IS NULL
    """))
    
    # Now make the columns NOT NULL
    # First, change assignee_id to NOT NULL
    op.execute(text("""
        ALTER TABLE project_tasks 
        ALTER COLUMN assignee_id SET NOT NULL
    """))
    
    # Then, change project_id to NOT NULL
    op.execute(text("""
        ALTER TABLE project_tasks 
        ALTER COLUMN project_id SET NOT NULL
    """))


def downgrade() -> None:
    """Revert assignee_id and project_id to nullable"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if project_tasks table exists
    if 'project_tasks' not in inspector.get_table_names():
        return
    
    # Make assignee_id nullable again
    op.execute(text("""
        ALTER TABLE project_tasks 
        ALTER COLUMN assignee_id DROP NOT NULL
    """))
    
    # Make project_id nullable again
    op.execute(text("""
        ALTER TABLE project_tasks 
        ALTER COLUMN project_id DROP NOT NULL
    """))
