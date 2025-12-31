"""drop clients table (keep client_id in projects as it references companies.id)

Revision ID: 050_drop_clients_table
Revises: 049_add_team_id_to_employees
Create Date: 2025-01-27 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '050_drop_clients_table'
down_revision = '049_add_team_id_to_employees'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Drop clients table only.
    
    Note: client_id in projects table is KEPT because it now references companies.id
    (not clients.id). The migration 046_add_client_resp_proj already set up client_id
    to reference companies.id, so we only need to drop the unused clients table.
    """
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if there's an old foreign key constraint pointing to clients table
    # and update it to point to companies if needed
    if 'projects' in inspector.get_table_names():
        # Get all foreign key constraints on projects table
        fk_constraints = inspector.get_foreign_keys('projects')
        
        for fk in fk_constraints:
            # If there's a constraint named fk_projects_client_id pointing to clients table
            if fk['name'] == 'fk_projects_client_id' and fk['referred_table'] == 'clients':
                # Drop the old constraint
                op.drop_constraint('fk_projects_client_id', 'projects', type_='foreignkey', if_exists=True)
                # Recreate it pointing to companies table
                op.create_foreign_key(
                    'fk_projects_client_id',
                    'projects', 'companies',
                    ['client_id'], ['id'],
                    ondelete='SET NULL'
                )
                break
    
    # Drop clients table if it exists
    if 'clients' in inspector.get_table_names():
        # Drop indexes first
        op.drop_index('idx_clients_created_at', table_name='clients', if_exists=True)
        op.drop_index('idx_clients_status', table_name='clients', if_exists=True)
        op.drop_index('idx_clients_responsable_id', table_name='clients', if_exists=True)
        op.drop_index('idx_clients_company_id', table_name='clients', if_exists=True)
        
        # Drop the table
        op.drop_table('clients')
    
    # Drop enum type if it exists
    op.execute("""
        DO $$ BEGIN
            DROP TYPE IF EXISTS clientstatus;
        EXCEPTION
            WHEN undefined_object THEN null;
        END $$;
    """)


def downgrade() -> None:
    """
    Recreate clients table (reverse of upgrade).
    
    Note: client_id in projects is kept and continues to reference companies.id.
    The clients table is recreated but projects.client_id does not reference it.
    """
    # Recreate enum type
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE clientstatus AS ENUM ('actif', 'inactif', 'maintenance');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Recreate clients table
    op.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id SERIAL NOT NULL,
            company_id INTEGER NOT NULL,
            status clientstatus DEFAULT 'actif' NOT NULL,
            responsable_id INTEGER,
            notes TEXT,
            comments TEXT,
            portal_url VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE CASCADE,
            FOREIGN KEY(responsable_id) REFERENCES users (id) ON DELETE SET NULL,
            UNIQUE (company_id)
        );
    """)
    
    # Recreate indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients (company_id);
        CREATE INDEX IF NOT EXISTS idx_clients_responsable_id ON clients (responsable_id);
        CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
        CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at);
    """)
    
    # Note: client_id in projects is NOT changed - it continues to reference companies.id
    # This is intentional as the migration 046_add_client_resp_proj set it up that way
