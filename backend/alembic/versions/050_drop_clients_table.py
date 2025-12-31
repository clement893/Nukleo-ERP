"""drop clients table and remove client_id from projects

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
    """Drop clients table and remove client_id from projects"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # First, remove client_id from projects table if it exists
    if 'projects' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('projects')]
        
        # Remove client_id column if it exists
        if 'client_id' in columns:
            # Drop foreign key constraint first
            op.drop_index('idx_projects_client_id', table_name='projects', if_exists=True)
            op.drop_constraint('fk_projects_client_id', 'projects', type_='foreignkey', if_exists=True)
            op.drop_column('projects', 'client_id')
    
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
    """Recreate clients table (reverse of upgrade)"""
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
    
    # Re-add client_id to projects if projects table exists
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'projects' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('projects')]
        
        if 'client_id' not in columns:
            op.add_column('projects', sa.Column('client_id', sa.Integer(), nullable=True))
            op.create_foreign_key(
                'fk_projects_client_id',
                'projects', 'clients',
                ['client_id'], ['id'],
                ondelete='SET NULL'
            )
            op.create_index('idx_projects_client_id', 'projects', ['client_id'])
