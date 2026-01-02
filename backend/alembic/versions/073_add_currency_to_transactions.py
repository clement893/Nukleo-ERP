"""add currency column to transactions and rename date to transaction_date if needed

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
    """Add currency column to transactions table and rename date to transaction_date if needed"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Check if transactions table exists
    if 'transactions' not in inspector.get_table_names():
        return
    
    # Get existing columns
    columns = [col['name'] for col in inspector.get_columns('transactions')]
    
    # Rename 'date' column to 'transaction_date' if it exists and 'transaction_date' doesn't exist
    # This handles the case where migration 066 created the table with 'date' column
    if 'date' in columns and 'transaction_date' not in columns:
        # Get the index name for the date column
        indexes = [idx['name'] for idx in inspector.get_indexes('transactions')]
        if 'idx_transactions_date' in indexes:
            op.drop_index('idx_transactions_date', table_name='transactions')
        
        # Rename the column
        op.alter_column('transactions', 'date', new_column_name='transaction_date')
        
        # Recreate the index with the new name
        op.create_index('idx_transactions_date', 'transactions', ['transaction_date'])
    
    # Add currency column if it doesn't exist
    if 'currency' not in columns:
        op.add_column(
            'transactions',
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD')
        )


def downgrade() -> None:
    """Remove currency column and rename transaction_date back to date"""
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
    
    # Rename transaction_date back to date if transaction_date exists and date doesn't
    if 'transaction_date' in columns and 'date' not in columns:
        # Get the index name for the transaction_date column
        indexes = [idx['name'] for idx in inspector.get_indexes('transactions')]
        if 'idx_transactions_date' in indexes:
            op.drop_index('idx_transactions_date', table_name='transactions')
        
        # Rename the column back
        op.alter_column('transactions', 'transaction_date', new_column_name='date')
        
        # Recreate the index with the old name
        op.create_index('idx_transactions_date', 'transactions', ['date'])