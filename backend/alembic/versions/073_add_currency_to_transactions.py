"""add currency column to transactions if missing

Revision ID: 073
Revises: 072
Create Date: 2026-01-02 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '073'
down_revision: Union[str, None] = '072'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add currency column to transactions table if it doesn't exist"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table exists
    if 'transactions' not in inspector.get_table_names():
        return
    
    # Get existing columns
    columns = [col['name'] for col in inspector.get_columns('transactions')]
    
    # Add currency column if it doesn't exist
    if 'currency' not in columns:
        op.add_column(
            'transactions',
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD')
        )


def downgrade() -> None:
    """Remove currency column from transactions table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table exists
    if 'transactions' not in inspector.get_table_names():
        return
    
    # Get existing columns
    columns = [col['name'] for col in inspector.get_columns('transactions')]
    
    # Drop currency column if it exists
    if 'currency' in columns:
        op.drop_column('transactions', 'currency')
