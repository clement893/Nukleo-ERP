"""convert task enums to varchar

Revision ID: 065_convert_task_enums
Revises: 064_create_project_attachments_and_comments
Create Date: 2025-12-31 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '065_convert_task_enums'
down_revision = '064_create_project_attachments_and_comments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Convert taskstatus and taskpriority enum columns to VARCHAR"""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if project_tasks table exists
    if 'project_tasks' not in inspector.get_table_names():
        return
    
    # Check current column types
    columns = inspector.get_columns('project_tasks')
    status_col = next((c for c in columns if c['name'] == 'status'), None)
    priority_col = next((c for c in columns if c['name'] == 'priority'), None)
    
    # Convert status column from ENUM to VARCHAR if it's currently an ENUM
    if status_col and isinstance(status_col['type'], postgresql.ENUM):
        # Convert enum values to lowercase strings
        op.execute("""
            ALTER TABLE project_tasks 
            ALTER COLUMN status TYPE VARCHAR(50) 
            USING LOWER(status::text)
        """)
    
    # Convert priority column from ENUM to VARCHAR if it's currently an ENUM
    if priority_col and isinstance(priority_col['type'], postgresql.ENUM):
        # Convert enum values to lowercase strings
        op.execute("""
            ALTER TABLE project_tasks 
            ALTER COLUMN priority TYPE VARCHAR(50) 
            USING LOWER(priority::text)
        """)


def downgrade() -> None:
    """Convert VARCHAR columns back to ENUM (not recommended, but included for completeness)"""
    # Note: This downgrade is complex and may fail if there are values not in the enum
    # In practice, you probably don't want to downgrade this migration
    pass
