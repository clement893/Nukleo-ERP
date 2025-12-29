"""extend companies table with new fields

Revision ID: 034_extend_companies
Revises: 033_extend_opportunities
Create Date: 2025-12-30 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '034_extend_companies'
down_revision = '033_extend_opportunities'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - extend companies table with new fields"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Check if companies table exists
    if 'companies' in existing_tables:
        columns = {col['name']: col for col in inspector.get_columns('companies')}
        
        # Add parent_company_id column if it doesn't exist
        if 'parent_company_id' not in columns:
            op.add_column('companies', sa.Column('parent_company_id', sa.Integer(), nullable=True))
            op.create_foreign_key(
                'companies_parent_company_id_fkey',
                'companies', 'companies',
                ['parent_company_id'], ['id'],
                ondelete='SET NULL'
            )
            op.create_index('idx_companies_parent_company_id', 'companies', ['parent_company_id'])
        
        # Add logo_url column if it doesn't exist
        if 'logo_url' not in columns:
            op.add_column('companies', sa.Column('logo_url', sa.String(length=1000), nullable=True))
        
        # Add is_client column if it doesn't exist
        if 'is_client' not in columns:
            op.add_column('companies', sa.Column('is_client', sa.Boolean(), nullable=False, server_default='false'))
            op.create_index('idx_companies_is_client', 'companies', ['is_client'])
        
        # Add facebook column if it doesn't exist
        if 'facebook' not in columns:
            op.add_column('companies', sa.Column('facebook', sa.String(length=500), nullable=True))
        
        # Add instagram column if it doesn't exist
        if 'instagram' not in columns:
            op.add_column('companies', sa.Column('instagram', sa.String(length=500), nullable=True))
        
        # Add linkedin column if it doesn't exist
        if 'linkedin' not in columns:
            op.add_column('companies', sa.Column('linkedin', sa.String(length=500), nullable=True))
        
        # Add index on country if it doesn't exist
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('companies')]
        if 'idx_companies_country' not in existing_indexes:
            op.create_index('idx_companies_country', 'companies', ['country'])


def downgrade() -> None:
    """Downgrade database schema"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Remove added columns from companies table
    if 'companies' in existing_tables:
        columns = {col['name']: col for col in inspector.get_columns('companies')}
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('companies')]
        
        if 'idx_companies_country' in existing_indexes:
            op.drop_index('idx_companies_country', table_name='companies')
        
        if 'linkedin' in columns:
            op.drop_column('companies', 'linkedin')
        
        if 'instagram' in columns:
            op.drop_column('companies', 'instagram')
        
        if 'facebook' in columns:
            op.drop_column('companies', 'facebook')
        
        if 'is_client' in columns:
            op.drop_index('idx_companies_is_client', table_name='companies')
            op.drop_column('companies', 'is_client')
        
        if 'logo_url' in columns:
            op.drop_column('companies', 'logo_url')
        
        if 'parent_company_id' in columns:
            op.drop_index('idx_companies_parent_company_id', table_name='companies')
            op.drop_constraint('companies_parent_company_id_fkey', 'companies', type_='foreignkey')
            op.drop_column('companies', 'parent_company_id')
