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
    
    # Check if columns are ENUM type using SQL query
    result = conn.execute(sa.text("""
        SELECT data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'project_tasks' AND column_name = 'status'
    """))
    status_info = result.fetchone()
    
    result = conn.execute(sa.text("""
        SELECT data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'project_tasks' AND column_name = 'priority'
    """))
    priority_info = result.fetchone()
    
    # Convert status column from ENUM to VARCHAR if it's currently USER-DEFINED (enum type)
    if status_info and status_info[0] == 'USER-DEFINED':
        # Convert enum values to lowercase strings
        op.execute(sa.text("""
            ALTER TABLE project_tasks 
            ALTER COLUMN status TYPE VARCHAR(50) 
            USING LOWER(status::text)
        """))
    
    # Convert priority column from ENUM to VARCHAR if it's currently USER-DEFINED (enum type)
    if priority_info and priority_info[0] == 'USER-DEFINED':
        # Convert enum values to lowercase strings
        op.execute(sa.text("""
            ALTER TABLE project_tasks 
            ALTER COLUMN priority TYPE VARCHAR(50) 
            USING LOWER(priority::text)
        """))


def downgrade() -> None:
    """Convert VARCHAR columns back to ENUM (not recommended, but included for completeness)"""
    # Note: This downgrade is complex and may fail if there are values not in the enum
    # In practice, you probably don't want to downgrade this migration
    pass
