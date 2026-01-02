"""add currency column to transactions, rename date to transaction_date, and add missing columns

This migration:
- Adds currency column if missing
- Renames 'date' column to 'transaction_date' if needed
- Adds invoice_number column (required by Transaction model)
- Adds expected_payment_date column
- Adds client_id and client_name columns
- Adds tax_amount column
- Adds category_id column

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
    """Add currency column, rename date to transaction_date, and add missing columns to transactions table"""
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
    
    # Add invoice_number column if it doesn't exist
    # This column is required by the Transaction model but may be missing from older schema versions
    if 'invoice_number' not in columns:
        op.add_column(
            'transactions',
            sa.Column('invoice_number', sa.String(length=100), nullable=True)
        )
    
    # Add expected_payment_date column if it doesn't exist
    if 'expected_payment_date' not in columns:
        op.add_column(
            'transactions',
            sa.Column('expected_payment_date', sa.DateTime(timezone=True), nullable=True)
        )
    
    # Add client_id column if it doesn't exist
    if 'client_id' not in columns:
        op.add_column(
            'transactions',
            sa.Column('client_id', sa.Integer(), nullable=True)
        )
    
    # Add client_name column if it doesn't exist
    if 'client_name' not in columns:
        op.add_column(
            'transactions',
            sa.Column('client_name', sa.String(length=200), nullable=True)
        )
    
    # Add tax_amount column if it doesn't exist (may be missing from older versions)
    if 'tax_amount' not in columns:
        op.add_column(
            'transactions',
            sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0')
        )
    
    # Add category_id column if it doesn't exist (replaces old 'category' string column)
    if 'category_id' not in columns:
        op.add_column(
            'transactions',
            sa.Column('category_id', sa.Integer(), nullable=True)
        )


def downgrade() -> None:
    """Remove columns added by this migration and rename transaction_date back to date"""
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
    
    # Drop columns added by this migration if they exist
    if 'invoice_number' in columns:
        op.drop_column('transactions', 'invoice_number')
    if 'expected_payment_date' in columns:
        op.drop_column('transactions', 'expected_payment_date')
    if 'client_id' in columns:
        op.drop_column('transactions', 'client_id')
    if 'client_name' in columns:
        op.drop_column('transactions', 'client_name')
    if 'tax_amount' in columns:
        op.drop_column('transactions', 'tax_amount')
    if 'category_id' in columns:
        op.drop_column('transactions', 'category_id')
    
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