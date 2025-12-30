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
    
    # Create clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('status', postgresql.ENUM('active', 'inactive', 'maintenance', name='clientstatus', create_type=False), nullable=False, server_default='active'),
        sa.Column('responsible_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('portal_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['responsible_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id')
    )
    
    # Create indexes
    op.create_index('idx_clients_company_id', 'clients', ['company_id'])
    op.create_index('idx_clients_responsible_id', 'clients', ['responsible_id'])
    op.create_index('idx_clients_status', 'clients', ['status'])
    op.create_index('idx_clients_created_at', 'clients', ['created_at'])


def downgrade() -> None:
    """Drop clients table"""
    op.drop_index('idx_clients_created_at', table_name='clients')
    op.drop_index('idx_clients_status', table_name='clients')
    op.drop_index('idx_clients_responsible_id', table_name='clients')
    op.drop_index('idx_clients_company_id', table_name='clients')
    op.drop_table('clients')
    
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS clientstatus")
