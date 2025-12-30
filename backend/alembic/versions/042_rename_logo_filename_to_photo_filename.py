"""rename logo_filename to photo_filename in contacts

Revision ID: 042_rename_logo_filename_to_photo_filename
Revises: 041_city_index_companies
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '042_rename_logo_filename_to_photo_filename'
down_revision = '041_city_index_companies'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Rename logo_filename column to photo_filename in contacts table"""
    # Check if column exists and rename it
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('contacts')]
    
    if 'logo_filename' in columns and 'photo_filename' not in columns:
        op.alter_column('contacts', 'logo_filename', new_column_name='photo_filename')
    elif 'logo_filename' not in columns and 'photo_filename' not in columns:
        # If neither exists, create photo_filename
        op.add_column('contacts', sa.Column('photo_filename', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Rename photo_filename column back to logo_filename in contacts table"""
    # Check if column exists and rename it back
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('contacts')]
    
    if 'photo_filename' in columns and 'logo_filename' not in columns:
        op.alter_column('contacts', 'photo_filename', new_column_name='logo_filename')
