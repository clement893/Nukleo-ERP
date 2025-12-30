"""add logo_filename to contacts

Revision ID: 040_logo_filename
Revises: 039_create_api_keys_table
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '040_logo_filename'
down_revision = '039_create_api_keys_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add logo_filename column to contacts table"""
    # Check if column already exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('contacts')]
    
    if 'logo_filename' not in columns:
        op.add_column('contacts', sa.Column('logo_filename', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Remove logo_filename column from contacts table"""
    # Check if column exists before dropping
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('contacts')]
    
    if 'logo_filename' in columns:
        op.drop_column('contacts', 'logo_filename')
