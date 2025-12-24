"""Add theme_preference to users table

Revision ID: 010
Revises: 009
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add theme_preference column to users table if it doesn't exist
    # Check if column exists first to avoid errors if migration is run multiple times
    from sqlalchemy import inspect
    from sqlalchemy.engine import reflection
    
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'theme_preference' not in columns:
        op.add_column(
            'users',
            sa.Column('theme_preference', sa.String(20), nullable=False, server_default='system')
        )


def downgrade() -> None:
    # Remove theme_preference column
    op.drop_column('users', 'theme_preference')

