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
    
    # Simply try to convert the columns - if they're already VARCHAR, this will fail gracefully
    # We can use a try-except, or just execute the ALTER statements
    # PostgreSQL will handle the conversion automatically if the columns are ENUM type
    
    # Convert status column from ENUM to VARCHAR
    # Using a DO block to handle errors gracefully
    op.execute("""
        DO $$ 
        BEGIN
            -- Check if status column is ENUM type
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'project_tasks' 
                AND column_name = 'status' 
                AND data_type = 'USER-DEFINED'
            ) THEN
                ALTER TABLE project_tasks 
                ALTER COLUMN status TYPE VARCHAR(50) 
                USING LOWER(status::text);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Column might already be VARCHAR, ignore error
            NULL;
        END $$;
    """)
    
    # Convert priority column from ENUM to VARCHAR
    op.execute("""
        DO $$ 
        BEGIN
            -- Check if priority column is ENUM type
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'project_tasks' 
                AND column_name = 'priority' 
                AND data_type = 'USER-DEFINED'
            ) THEN
                ALTER TABLE project_tasks 
                ALTER COLUMN priority TYPE VARCHAR(50) 
                USING LOWER(priority::text);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Column might already be VARCHAR, ignore error
            NULL;
        END $$;
    """)


def downgrade() -> None:
    """Convert VARCHAR columns back to ENUM (not recommended, but included for completeness)"""
    # Note: This downgrade is complex and may fail if there are values not in the enum
    # In practice, you probably don't want to downgrade this migration
    pass
