"""create clients table

Revision ID: 043_create_clients_table
Revises: 042_rename_logo_to_photo_fn
Create Date: 2025-12-30 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '043_create_clients_table'
down_revision = '042_rename_logo_to_photo_fn'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create clients table"""
    # Create enum type for client status (if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE clientstatus AS ENUM ('active', 'inactive', 'maintenance');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create clients table (if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL NOT NULL,
                company_id INTEGER NOT NULL,
                status clientstatus DEFAULT 'active' NOT NULL,
                responsible_id INTEGER,
                notes TEXT,
                comments TEXT,
                portal_url VARCHAR(500),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE,
                FOREIGN KEY(responsible_id) REFERENCES users (id) ON DELETE SET NULL,
                UNIQUE (company_id)
            );
        EXCEPTION
            WHEN duplicate_table THEN null;
        END $$;
    """)
    
    # Create indexes (if they don't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients (company_id);
            CREATE INDEX IF NOT EXISTS idx_clients_responsible_id ON clients (responsible_id);
            CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
            CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at);
        EXCEPTION
            WHEN duplicate_table THEN null;
        END $$;
    """)


def downgrade() -> None:
    """Drop clients table"""
    op.drop_index('idx_clients_created_at', table_name='clients')
    op.drop_index('idx_clients_status', table_name='clients')
    op.drop_index('idx_clients_responsible_id', table_name='clients')
    op.drop_index('idx_clients_company_id', table_name='clients')
    op.drop_table('clients')
    
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS clientstatus")
