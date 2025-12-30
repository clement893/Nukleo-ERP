"""add city index to companies

Revision ID: 041_city_index_companies
Revises: 040_logo_filename
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '041_city_index_companies'
down_revision = '040_logo_filename'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add index on city column to companies table"""
    # Check if index already exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes('companies')]
    
    if 'idx_companies_city' not in indexes:
        op.create_index('idx_companies_city', 'companies', ['city'])


def downgrade() -> None:
    """Remove index on city column from companies table"""
    # Check if index exists before dropping
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes('companies')]
    
    if 'idx_companies_city' in indexes:
        op.drop_index('idx_companies_city', table_name='companies')
