"""extend opportunities table

Revision ID: 033_extend_opportunities
Revises: 032_add_calendar_events_table
Create Date: 2025-12-30 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '033_extend_opportunities'
down_revision = '032_add_calendar_events'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - extend opportunites table with new fields"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Check if opportunites table exists
    if 'opportunites' in existing_tables:
        columns = {col['name']: col for col in inspector.get_columns('opportunites')}
        
        # Add status column if it doesn't exist
        if 'status' not in columns:
            op.add_column('opportunites', sa.Column('status', sa.String(length=50), nullable=True))
            op.create_index('idx_opportunites_status', 'opportunites', ['status'])
        
        # Add segment column if it doesn't exist
        if 'segment' not in columns:
            op.add_column('opportunites', sa.Column('segment', sa.String(length=100), nullable=True))
        
        # Add region column if it doesn't exist
        if 'region' not in columns:
            op.add_column('opportunites', sa.Column('region', sa.String(length=100), nullable=True))
        
        # Add service_offer_link column if it doesn't exist
        if 'service_offer_link' not in columns:
            op.add_column('opportunites', sa.Column('service_offer_link', sa.String(length=1000), nullable=True))
        
        # Add notes column if it doesn't exist
        if 'notes' not in columns:
            op.add_column('opportunites', sa.Column('notes', sa.Text(), nullable=True))
        
        # Add opened_at column if it doesn't exist
        if 'opened_at' not in columns:
            op.add_column('opportunites', sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True))
        
        # Add closed_at column if it doesn't exist
        if 'closed_at' not in columns:
            op.add_column('opportunites', sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True))
            op.create_index('idx_opportunites_closed_at', 'opportunites', ['closed_at'])
        
        # Fix company_id type if it's UUID (should be Integer)
        if 'company_id' in columns:
            company_id_col = columns['company_id']
            if isinstance(company_id_col['type'], postgresql.UUID):
                # Drop foreign key constraint if exists
                try:
                    op.drop_constraint('opportunites_company_id_fkey', 'opportunites', type_='foreignkey')
                except:
                    pass
                # Alter column type
                op.execute('ALTER TABLE opportunites ALTER COLUMN company_id TYPE integer USING NULL')
                # Recreate foreign key
                op.create_foreign_key(
                    'opportunites_company_id_fkey',
                    'opportunites', 'companies',
                    ['company_id'], ['id'],
                    ondelete='SET NULL'
                )
                op.create_index('idx_opportunites_company_id', 'opportunites', ['company_id'])
    
    # Create opportunity_contacts junction table if it doesn't exist
    if 'opportunity_contacts' not in existing_tables:
        op.create_table(
            'opportunity_contacts',
            sa.Column('opportunity_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('contact_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['opportunity_id'], ['opportunites.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('opportunity_id', 'contact_id')
        )
        op.create_index('idx_opportunity_contacts_opportunity', 'opportunity_contacts', ['opportunity_id'])
        op.create_index('idx_opportunity_contacts_contact', 'opportunity_contacts', ['contact_id'])


def downgrade() -> None:
    """Downgrade database schema"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Drop opportunity_contacts table if it exists
    if 'opportunity_contacts' in existing_tables:
        op.drop_index('idx_opportunity_contacts_contact', table_name='opportunity_contacts')
        op.drop_index('idx_opportunity_contacts_opportunity', table_name='opportunity_contacts')
        op.drop_table('opportunity_contacts')
    
    # Remove added columns from opportunites table
    if 'opportunites' in existing_tables:
        columns = {col['name']: col for col in inspector.get_columns('opportunites')}
        
        if 'closed_at' in columns:
            op.drop_index('idx_opportunites_closed_at', table_name='opportunites')
            op.drop_column('opportunites', 'closed_at')
        
        if 'opened_at' in columns:
            op.drop_column('opportunites', 'opened_at')
        
        if 'notes' in columns:
            op.drop_column('opportunites', 'notes')
        
        if 'service_offer_link' in columns:
            op.drop_column('opportunites', 'service_offer_link')
        
        if 'region' in columns:
            op.drop_column('opportunites', 'region')
        
        if 'segment' in columns:
            op.drop_column('opportunites', 'segment')
        
        if 'status' in columns:
            op.drop_index('idx_opportunites_status', table_name='opportunites')
            op.drop_column('opportunites', 'status')
